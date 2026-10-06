"""Admin › Overview › Health: is everything the business depends on working, in plain words.

GET /api/admin/health — each check is "ok", "watch" or "down" with one sentence. Read-only; nothing is changed.
"""
import asyncio
import os
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException

from audit_log import record_admin_action
from auth import require_admin
from database import db

router = APIRouter(prefix="/admin/health", tags=["Admin Health"])
STUCK_PENDING_MINUTES = 45      # an order unconfirmed for this long needs a look


def _check(name: str, state: str, note: str, fix: str = "") -> dict:
    return {"name": name, "state": state, "note": note, "fix": fix}


def _ago(iso) -> str:
    if not iso:
        return "never"
    try:
        then = datetime.fromisoformat(str(iso).replace("Z", ""))
    except ValueError:
        return str(iso)
    mins = int((datetime.utcnow() - then).total_seconds() // 60)
    return "just now" if mins < 1 else f"{mins} min ago" if mins < 60 else f"{mins // 60} h ago" if mins < 48 * 60 else f"{mins // 1440} days ago"


@router.get("")
async def health(_: dict = Depends(require_admin)):
    now = datetime.utcnow()
    checks = []

    # the database
    try:
        started = datetime.utcnow()
        await asyncio.wait_for(db.command("ping"), timeout=5)
        ms = int((datetime.utcnow() - started).total_seconds() * 1000)
        checks.append(_check("Database", "ok" if ms < 500 else "watch", f"answering in {ms} ms"))
    except Exception:
        checks.append(_check("Database", "down", "not answering — orders cannot be saved", "Check MongoDB Atlas; the hosting status page"))

    # taking money
    if not os.getenv("STRIPE_SECRET_KEY"):
        checks.append(_check("Card payments", "down", "no Stripe key on the server — customers cannot pay", "Add STRIPE_SECRET_KEY on Render and the publishable key on Vercel"))
    else:
        last = await db.payments.find_one({}, {"_id": 0, "received_at": 1}, sort=[("received_at", -1)])
        unmatched = await db.payments.count_documents({"reconciled": False, "alerted": True})
        state = "watch" if unmatched else "ok"
        note = f"last payment {_ago(last['received_at']) if last else 'never'}" + (f"; {unmatched} payment{'s' if unmatched != 1 else ''} taken with no order — see your email" if unmatched else "")
        checks.append(_check("Card payments", state, note, "Open the payment in Stripe, then place the order by hand or refund" if unmatched else ""))

    # messages out
    day_ago = now - timedelta(hours=24)
    for channel, label, configured, fix in (
        ("email", "Email", bool(os.getenv("RESEND_API_KEY")), "Add RESEND_API_KEY on Render"),
        ("sms", "Text messages", bool(os.getenv("TWILIO_ACCOUNT_SID") and os.getenv("TWILIO_AUTH_TOKEN") and os.getenv("TWILIO_FROM_NUMBER")), "Add the three TWILIO_* values on Render"),
    ):
        if not configured:
            checks.append(_check(label, "down", "not set up — nothing is sent on this channel", fix))
            continue
        sent = await db.message_log.count_documents({"channel": channel, "at": {"$gte": day_ago}, "status": {"$regex": "^sent"}})
        failed = await db.message_log.count_documents({"channel": channel, "at": {"$gte": day_ago}, "status": {"$regex": "^failed"}})
        last = await db.message_log.find_one({"channel": channel, "status": {"$regex": "^sent"}}, {"_id": 0, "at": 1}, sort=[("at", -1)])
        state = "down" if failed and not sent else "watch" if failed else "ok"
        note = f"{sent} sent, {failed} failed in the last 24 hours; last sent {_ago(last['at'].isoformat()) if last else 'never'}"
        checks.append(_check(label, state, note, "Check the provider's status page and Admin › Messages" if failed else ""))

    wa_on = bool(os.getenv("TWILIO_WHATSAPP_FROM"))
    wa_failed = await db.wa_messages.count_documents({"at": {"$gte": day_ago}, "status": {"$in": ["failed", "undelivered"]}})
    if not wa_on:
        checks.append(_check("WhatsApp", "watch", "not set up — texts are sent instead", "Add TWILIO_WHATSAPP_FROM on Render once the templates are approved"))
    else:
        checks.append(_check("WhatsApp", "down" if wa_failed else "ok", f"{wa_failed} failed in the last 24 hours", "Check Twilio" if wa_failed else ""))

    # notifications to the installed app
    vapid = await db.settings.find_one({"_id": "web_push"}, {"_id": 1})
    devices = await db.push_subs.count_documents({})
    checks.append(_check("App notifications", "ok" if vapid else "watch", f"{devices} device{'s' if devices != 1 else ''} subscribed" if vapid else "keys not ready", ""))

    # the kitchen and orders
    slots = await db.settings.find_one({"_id": "pickup_slots"}, {"_id": 0, "paused": 1, "paused_at": 1, "delivery_enabled": 1}) or {}
    if slots.get("paused"):
        checks.append(_check("Taking orders", "watch", f"paused since {_ago(slots.get('paused_at'))} — customers cannot check out", "Reopen from the Kitchen switch when ready"))
    else:
        checks.append(_check("Taking orders", "ok", "open" + (" · delivery on" if slots.get("delivery_enabled") else " · collection only")))
    stuck = await db.orders.count_documents({"status": "pending", "created_at": {"$lt": now - timedelta(minutes=STUCK_PENDING_MINUTES)}})
    pending = await db.orders.count_documents({"status": "pending"})
    checks.append(_check("Orders waiting", "watch" if stuck else "ok",
                         f"{pending} not yet confirmed" + (f"; {stuck} waiting over {STUCK_PENDING_MINUTES} minutes" if stuck else ""),
                         "Confirm or cancel them in Orders" if stuck else ""))

    # the system's own routines
    brain = await db.settings.find_one({"_id": "intelligence"}, {"_id": 0, "last_run_at": 1}) or {}
    last_run = brain.get("last_run_at")
    late = not last_run or datetime.fromisoformat(str(last_run)) < now - timedelta(hours=30)
    checks.append(_check("Nightly review", "watch" if late else "ok", f"last ran {_ago(last_run)}",
                         "Press “Run the review now” in System log; if it fails, the server log has the reason" if late else ""))
    last_event = await db.events.find_one({}, {"_id": 0, "at": 1}, sort=[("at", -1)])
    checks.append(_check("Visit record", "ok" if last_event and last_event["at"] > now - timedelta(hours=36) else "watch",
                         f"last visit recorded {_ago(last_event['at'].isoformat()) if last_event else 'never'}",
                         "" if last_event and last_event["at"] > now - timedelta(hours=36) else "Open the site in a private window and check Admin › Analytics after a minute"))

    # errors on the server
    errors_day = await db.error_log.count_documents({"at": {"$gte": day_ago}})
    errors_hour = await db.error_log.count_documents({"at": {"$gte": now - timedelta(hours=1)}})
    checks.append(_check("Server errors", "down" if errors_hour >= 3 else "watch" if errors_day else "ok",
                         f"{errors_day} in the last 24 hours" + (f", {errors_hour} in the last hour" if errors_hour else ""),
                         "See System log › Site errors; if checkout is affected, pause ordering" if errors_day else ""))

    worst = "down" if any(c["state"] == "down" for c in checks) else "watch" if any(c["state"] == "watch" for c in checks) else "ok"
    return {"checked_at": now.isoformat(), "overall": worst, "checks": checks, "waiting": await waiting_list()}


# ── Before launch: what still needs a person ──────────────────────────────────
# Some can be seen from here (a key is set or not); the rest the owner ticks off when done.

MANUAL = [
    ("stripe_vercel", "Stripe publishable key on Vercel (then redeploy)", "Vercel › Project › Settings › Environment Variables › NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
    ("test_order", "One real test order placed, received by email and text, and refunded by hand in Stripe", "Order on the live site with your own card once the keys are in"),
    ("hosting", "Backend off the free tier (no cold starts) — Render Starter", "Render › svadista-backend › Settings › Instance type"),
    ("backups", "Nightly database backup running", "Create the private ssp-backups repository and its three secrets — README in C:/Users/prash/ssp-backups"),
    ("privacy", "Privacy policy published to match what the site does", "Approve the wording in docs/ops/phase-13/PRIVACY_POLICY_DRAFT.md (P-02)"),
    ("gbp", "Google Business Profile opened; tagged links in the bio, status and leaflets", "Business Profile › Opening date; links with ?utm_source=…"),
    ("hygiene", "Food hygiene inspection passed (booked 15 Oct 2026)", "Display the rating on the site when it arrives"),
]
AUTO = [
    ("stripe_render", "Stripe secret key on Render", lambda: bool(os.getenv("STRIPE_SECRET_KEY")), "Render › Environment › STRIPE_SECRET_KEY"),
    ("email", "Email sending set up (Resend)", lambda: bool(os.getenv("RESEND_API_KEY")), "Render › Environment › RESEND_API_KEY"),
    ("texts", "Text messages set up (Twilio)", lambda: bool(os.getenv("TWILIO_ACCOUNT_SID") and os.getenv("TWILIO_AUTH_TOKEN") and os.getenv("TWILIO_FROM_NUMBER")), "Render › Environment › the three TWILIO_* values"),
    ("email_reports", "Email delivery reports connected (Resend webhook)", lambda: bool(os.getenv("RESEND_WEBHOOK_SECRET")), "Resend › Webhooks → Render › RESEND_WEBHOOK_SECRET"),
    ("production_flag", "Server marked as production (hides the API documentation pages)", lambda: os.getenv("ENVIRONMENT") == "production", "Render › Environment › ENVIRONMENT=production"),
]


async def waiting_list() -> list:
    ticked = (await db.settings.find_one({"_id": "launch_checklist"}, {"_id": 0}) or {}).get("done", {})
    out = [{"id": i, "label": label, "how": how, "done": fn(), "auto": True} for i, label, fn, how in AUTO]
    out += [{"id": i, "label": label, "how": how, "done": bool(ticked.get(i)), "auto": False} for i, label, how in MANUAL]
    return out


@router.put("/waiting/{item_id}")
async def tick(item_id: str, payload: dict, admin: dict = Depends(require_admin)):
    """The owner marks a manual item done (or not). Items seen from here cannot be ticked by hand."""
    if item_id not in {i for i, *_ in MANUAL}:
        raise HTTPException(status_code=404, detail="No such item.")
    done = bool(payload.get("done"))
    await db.settings.update_one({"_id": "launch_checklist"}, {"$set": {f"done.{item_id}": done}}, upsert=True)
    await record_admin_action(admin, "ticked a launch item" if done else "unticked a launch item", dict((i, label) for i, label, _ in MANUAL)[item_id])
    return {"id": item_id, "done": done}
