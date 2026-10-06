from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import logging

from database import client
from seed import seed_menu, create_indexes, create_admin_user, seed_daily_specials, seed_content
from routes import auth, menu, orders, subscriptions, enquiries, delivery, admin_dabba_wala, payments, reviews, daily_specials, loyalty, admin_loyalty, pickup_slots, push
from routes import content as content_routes
from routes import whatsapp as whatsapp_routes
from routes import coupons as coupon_routes
from routes import customers as customer_routes
from routes import events as event_routes
from routes import comms as comms_routes
from routes import automations as automation_routes
from routes import intelligence as intelligence_routes
from routes.menu import migrate_slugs
from routes.pickup_slots import seed_slot_settings
from menu_additions import apply_menu_additions
from web_push import ensure_vapid_keys, scheduler_loop
import asyncio

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up...")
    await create_indexes()
    await seed_menu()
    await seed_daily_specials()
    await seed_content()
    await create_admin_user()
    await migrate_slugs()
    await seed_slot_settings()
    await apply_menu_additions()
    from allergen_fill import apply_allergen_fill
    await apply_allergen_fill()
    from menu_text_fix import apply_menu_text_fix
    await apply_menu_text_fix()
    await ensure_vapid_keys()
    from database import db
    await db.push_subs.create_index("endpoint", unique=True)
    await db.push_campaigns.create_index("id", unique=True)
    await db.wa_messages.create_index("dedupe_key", unique=True)
    await db.wa_messages.create_index("sid", sparse=True)
    await db.wa_optouts.create_index("phone", unique=True)
    await db.subscriptions.create_index("email_key", sparse=True)
    await db.payments.create_index("pi_id", unique=True)
    # Our own visit record: fast date queries, and automatic deletion after the retention period
    await db.events.create_index("at", expireAfterSeconds=event_routes.RETENTION_DAYS * 86400)
    await db.events.create_index("visit_id")
    await db.events.create_index([("day_code", 1), ("at", -1)], sparse=True)
    await db.events.create_index([("visitor_id", 1), ("at", -1)], sparse=True)
    # The send log: who was sent what. Deleted automatically after the retention period.
    from notifications import MESSAGE_LOG_DAYS
    await db.message_log.create_index("at", expireAfterSeconds=MESSAGE_LOG_DAYS * 86400)
    # WhatsApp records keep the same period. Older records only carry a text date: clear those by hand once.
    await db.wa_messages.create_index("at", expireAfterSeconds=MESSAGE_LOG_DAYS * 86400, sparse=True)
    from datetime import datetime, timedelta
    await db.wa_messages.delete_many({"at": {"$exists": False},
                                      "created_at": {"$lt": (datetime.utcnow() - timedelta(days=MESSAGE_LOG_DAYS)).isoformat()}})
    await db.email_optouts.create_index("email", unique=True)
    # An automation message goes to a customer once per reason; the unique key is what guarantees it
    await db.automation_sends.create_index([("automation", 1), ("email", 1), ("reason", 1)], unique=True)
    await db.automation_sends.create_index("at")
    await db.admin_audit.create_index("at")
    await db.decision_log.create_index("at")
    await db.daily_metrics.create_index("day", unique=True)
    # Lookups that run on every dashboard, kitchen and item page
    for coll, keys in (
        ("orders", "user_id"), ("orders", "status"), ("orders", "items.menu_item_id"),
        ("subscriptions", "id"), ("subscriptions", "user_id"), ("subscriptions", [("status", 1), ("end_date", 1)]),
        ("delivery_tracking", "delivery_id"), ("delivery_tracking", "sub_id"),
        ("delivery_reviews", [("user_id", 1), ("type", 1), ("ref_id", 1)]),
        ("notifications", [("user_id", 1), ("read", 1)]),
        ("enquiry_messages", "enquiry_id"),
        ("contact_messages", "user_id"), ("catering_enquiries", "user_id"),
        ("menu_items", "slug"), ("reviews", "menu_item_id"), ("menu_likes", "menu_item_id"),
        ("users", "phone"), ("users", "google_id"),
    ):
        try:
            await getattr(db, coll).create_index(keys)
        except Exception as e:
            logger.warning("Index on %s %s not created: %s", coll, keys, e)
    await db.coupons.create_index("code", unique=True)
    await db.coupons.create_index("id", unique=True)
    await db.coupon_redemptions.create_index([("coupon_id", 1), ("user_id", 1)])
    await db.coupon_redemptions.create_index([("coupon_id", 1), ("email_key", 1)])
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
    yield
    logger.info("Shutting down...")
    push_scheduler.cancel()
    renewal_scheduler.cancel()
    orphan_watchdog.cancel()
    sub_maintenance.cancel()
    automation_runner.cancel()
    nightly_review.cancel()
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
