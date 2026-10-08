from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import logging

from database import client
from seed import seed_menu, create_indexes, create_admin_user, seed_daily_specials, seed_content, normalise_order_dates
from routes import auth, menu, orders, subscriptions, enquiries, delivery, admin_dabba_wala, payments, reviews, daily_specials, loyalty, admin_loyalty, pickup_slots, push
from routes import content as content_routes
from routes import whatsapp as whatsapp_routes
from routes import coupons as coupon_routes
from routes import customers as customer_routes
from routes import events as event_routes
from routes import comms as comms_routes
from routes import automations as automation_routes
from routes import intelligence as intelligence_routes
from routes import health as health_routes
from routes.menu import migrate_slugs
from routes.pickup_slots import seed_slot_settings
from menu_additions import apply_menu_additions
from web_push import ensure_vapid_keys, scheduler_loop
import asyncio
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


INDEX_VERSION = 2   # bump when an index is added below or in seed.create_indexes()
INDEX_FAILURES: list = []


async def ensure_index(collection, keys, **opts):
    """Create an index without ever stopping the server from starting. If an index on the same key already exists
    with different options (e.g. adding a TTL to an existing index — real MongoDB refuses that, the test database
    does not), the old one is dropped and recreated. Anything else is logged and retried on the next start."""
    from pymongo.errors import OperationFailure
    try:
        return await collection.create_index(keys, **opts)
    except OperationFailure as e:
        if getattr(e, "code", None) in (85, 86):          # IndexOptionsConflict / IndexKeySpecsConflict
            try:
                spec = [(keys, 1)] if isinstance(keys, str) else list(keys)
                for name, info in (await collection.index_information()).items():
                    if name != "_id_" and list(info.get("key", [])) == spec:
                        await collection.drop_index(name)
                return await collection.create_index(keys, **opts)
            except Exception as e2:  # noqa: BLE001
                INDEX_FAILURES.append(f"{collection.name} {keys}: {e2}")
                logger.warning("Index %s on %s not recreated: %s", keys, collection.name, e2)
                return None
        INDEX_FAILURES.append(f"{collection.name} {keys}: {e}")
        logger.warning("Index %s on %s not created: %s", keys, collection.name, e)
    except Exception as e:  # noqa: BLE001
        INDEX_FAILURES.append(f"{collection.name} {keys}: {e}")
        logger.warning("Index %s on %s not created: %s", keys, collection.name, e)
    return None


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up...")
    await seed_menu()
    await seed_daily_specials()
    await seed_content()
    await create_admin_user()
    await migrate_slugs()
    await seed_slot_settings()
    await apply_menu_additions()
    await normalise_order_dates()
    from allergen_fill import apply_allergen_fill
    await apply_allergen_fill()
    from menu_text_fix import apply_menu_text_fix
    await apply_menu_text_fix()
    await ensure_vapid_keys()
    from database import db
    from notifications import MESSAGE_LOG_DAYS
    from error_log import ERROR_LOG_DAYS
    # Indexes are created once per INDEX_VERSION, not on every boot (several a day on the free tier) — A-0003, BE-005
    marker = await db.settings.find_one({"_id": "indexes"}, {"_id": 0, "version": 1})
    if not marker or marker.get("version") != INDEX_VERSION:
        try:
            await create_indexes()
        except Exception as e:  # noqa: BLE001 — an index must never stop the shop opening
            INDEX_FAILURES.append(f"seed.create_indexes: {e}")
            logger.warning("seed indexes incomplete: %s", e)
        await ensure_index(db.push_subs, "endpoint", unique=True)
        await ensure_index(db.push_campaigns, "id", unique=True)
        await ensure_index(db.wa_messages, "dedupe_key", unique=True)
        await ensure_index(db.wa_messages, "sid", sparse=True)
        await ensure_index(db.wa_optouts, "phone", unique=True)
        await ensure_index(db.subscriptions, "email_key", sparse=True)
        await ensure_index(db.payments, "pi_id", unique=True)
        # Our own visit record: fast date queries, and automatic deletion after the retention period
        await ensure_index(db.events, "at", expireAfterSeconds=event_routes.RETENTION_DAYS * 86400)
        await ensure_index(db.events, "visit_id")
        await ensure_index(db.events, [("day_code", 1), ("at", -1)], sparse=True)
        await ensure_index(db.events, [("visitor_id", 1), ("at", -1)], sparse=True)
        await ensure_index(db.events, [("day", 1)])
        # The send log: who was sent what. Deleted automatically after the retention period.
        await ensure_index(db.message_log, "at", expireAfterSeconds=MESSAGE_LOG_DAYS * 86400)
        await ensure_index(db.message_log, [("channel", 1), ("at", -1)])
        await ensure_index(db.wa_messages, "at", expireAfterSeconds=MESSAGE_LOG_DAYS * 86400, sparse=True)
        await ensure_index(db.email_optouts, "email", unique=True)
        # An automation message goes to a customer once per reason; the unique key is what guarantees it
        await ensure_index(db.automation_sends, [("automation", 1), ("email", 1), ("reason", 1)], unique=True)
        await ensure_index(db.automation_sends, "at")
        await ensure_index(db.admin_audit, "at", expireAfterSeconds=400 * 24 * 3600)   # kept 400 days, like the message log
        await ensure_index(db.error_log, "at", expireAfterSeconds=ERROR_LOG_DAYS * 86400)
        await ensure_index(db.decision_log, "at")
        await ensure_index(db.message_retries, "noted_at")
        try:
            await ensure_index(db.daily_metrics, "day", unique=True)
        except Exception as e:
            logger.warning("daily_metrics day index not created (duplicate days?): %s", e)
        # Lookups that run on every dashboard, kitchen and item page
        for coll, keys in (
            ("orders", "user_id"), ("orders", "status"), ("orders", "items.menu_item_id"),
            ("orders", [("created_at", -1)]), ("orders", [("user_id", 1), ("created_at", -1)]), ("orders", [("status", 1), ("created_at", -1)]),
            ("subscriptions", "id"), ("subscriptions", "user_id"), ("subscriptions", [("status", 1), ("end_date", 1)]),
            ("subscriptions", [("user_id", 1), ("status", 1)]), ("subscriptions", [("customer_email", 1), ("status", 1)]),
            ("delivery_tracking", "delivery_id"), ("delivery_tracking", "sub_id"),
            ("delivery_reviews", [("user_id", 1), ("type", 1), ("ref_id", 1)]),
            ("notifications", [("user_id", 1), ("read", 1)]),
            ("enquiry_messages", "enquiry_id"),
            ("contact_messages", "user_id"), ("catering_enquiries", "user_id"),
            ("menu_items", "slug"), ("reviews", "menu_item_id"), ("menu_likes", "menu_item_id"),
            ("users", "phone"), ("users", "google_id"),
        ):
            try:
                await ensure_index(getattr(db, coll), keys)
            except Exception as e:
                logger.warning("Index on %s %s not created: %s", coll, keys, e)
        await ensure_index(db.coupons, "code", unique=True)
        await ensure_index(db.coupons, "id", unique=True)
        await ensure_index(db.coupon_redemptions, [("coupon_id", 1), ("user_id", 1)])
        await ensure_index(db.coupon_redemptions, [("coupon_id", 1), ("email_key", 1)])
        if not INDEX_FAILURES:      # only a clean run is marked done; otherwise the next boot tries again
            await db.settings.update_one({"_id": "indexes"}, {"$set": {"version": INDEX_VERSION, "applied_at": datetime.utcnow().isoformat()}}, upsert=True)
        else:
            logger.error("Indexes not all created (%d failed) — will retry on next start: %s", len(INDEX_FAILURES), INDEX_FAILURES[:5])
    # WhatsApp records keep the same period. Older records only carry a text date: clear those by hand once.
    from datetime import timedelta
    await db.wa_messages.delete_many({"at": {"$exists": False},
                                      "created_at": {"$lt": (datetime.utcnow() - timedelta(days=MESSAGE_LOG_DAYS)).isoformat()}})
    from subscription_pricing import backfill_email_keys
    await backfill_email_keys()
    from whatsapp import renewal_reminder_loop
    push_scheduler = asyncio.create_task(scheduler_loop())
    renewal_scheduler = asyncio.create_task(renewal_reminder_loop())
    from routes.payments import orphan_payment_loop
    orphan_watchdog = asyncio.create_task(orphan_payment_loop())
    from routes.subscriptions import subscription_maintenance_loop
    sub_maintenance = asyncio.create_task(subscription_maintenance_loop())
    from automations import automation_loop
    automation_runner = asyncio.create_task(automation_loop())
    from intelligence import intelligence_loop
    nightly_review = asyncio.create_task(intelligence_loop())
    from notifications import retry_loop
    retry_drain = asyncio.create_task(retry_loop())      # stranded message retries after a restart (A-0003, MKT-004)
    yield
    logger.info("Shutting down...")
    push_scheduler.cancel()
    renewal_scheduler.cancel()
    orphan_watchdog.cancel()
    sub_maintenance.cancel()
    automation_runner.cancel()
    nightly_review.cancel()
    retry_drain.cancel()
    client.close()


_PUBLIC_DOCS = os.environ.get("ENVIRONMENT") != "production"
app = FastAPI(
    title="Sree Svadista Prasada API", version="1.0.0", lifespan=lifespan,
    docs_url="/docs" if _PUBLIC_DOCS else None,
    redoc_url="/redoc" if _PUBLIC_DOCS else None,
    openapi_url="/openapi.json" if _PUBLIC_DOCS else None,
)

ALLOWED_ORIGINS = [
    "https://sreesvadistaprasada.vercel.app",
    "https://sreesvadistaprasada-git-main-prasanthreddykethas-projects.vercel.app",
    "https://sreesvadistaprasada.com",
    "https://www.sreesvadistaprasada.com",
    "https://ssp-nextjs.vercel.app",
    "https://ssp-nextjs-git-main-prashanthketha-9745s-projects.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
]

from error_log import CatchErrors
app.add_middleware(CatchErrors)   # inside CORS: browsers get the apology, with CORS headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
from audit_log import AdminActionLog  # noqa: E402
app.add_middleware(AdminActionLog)     # every admin change recorded, shown in Admin › System log
from error_log import unhandled  # noqa: E402
app.add_exception_handler(Exception, unhandled)   # errors recorded and the owner told when they pile up

app.include_router(auth.router, prefix="/api")
app.include_router(menu.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(subscriptions.router, prefix="/api")
app.include_router(enquiries.router, prefix="/api")
app.include_router(delivery.router, prefix="/api")
app.include_router(admin_dabba_wala.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(daily_specials.router, prefix="/api")
app.include_router(loyalty.router, prefix="/api")
app.include_router(admin_loyalty.router, prefix="/api")
app.include_router(content_routes.router, prefix="/api")
app.include_router(pickup_slots.router, prefix="/api")
app.include_router(push.router, prefix="/api")
app.include_router(whatsapp_routes.router, prefix="/api")
app.include_router(coupon_routes.router, prefix="/api")
app.include_router(customer_routes.router, prefix="/api")
app.include_router(event_routes.router, prefix="/api")
app.include_router(comms_routes.router, prefix="/api")
app.include_router(automation_routes.router, prefix="/api")
app.include_router(intelligence_routes.router, prefix="/api")
app.include_router(health_routes.router, prefix="/api")


@app.get("/api")
async def root():
    return {"message": "Sree Svadista Prasada API", "version": "1.0.0"}


@app.get("/api/health")
async def health():
    from fastapi.responses import JSONResponse
    from database import db
    try:
        await asyncio.wait_for(db.command("ping"), timeout=5)
    except Exception:
        return JSONResponse(status_code=503, content={"status": "degraded", "database": "unreachable"})
    return {"status": "ok", "database": "ok"}
