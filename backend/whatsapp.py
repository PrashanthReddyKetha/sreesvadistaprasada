"""
WhatsApp customer updates (Twilio WhatsApp API) with SMS fallback.

Env vars on Render (uses the existing TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN):
    TWILIO_WHATSAPP_FROM   — approved WhatsApp sender, E.164 (e.g. +447000000000)
    WA_TPL_<EVENT>         — Twilio Content SID (HX…) of the approved template per event,
                             e.g. WA_TPL_ORDER_RECEIVED. See TEMPLATES below for the bodies.
    PUBLIC_API_URL         — public backend URL for Twilio callbacks
                             (default https://svadista-backend.onrender.com)

Until the sender and a template are configured, every event falls back to the
plain SMS it replaced — nothing regresses.

Anti-spam rules, enforced here so no route can get them wrong:
  • One message per event per order / delivery day — dedupe_key is unique in Mongo.
  • Only moments the customer must act on or would ask about are WhatsApp events;
    "confirmed" / "preparing" are covered by the tracking link in the first message.
  • Never WhatsApp + SMS for the same event: SMS is only the fallback when
    WhatsApp is unavailable, undeliverable, or the customer replied STOP.
  • Reply STOP to opt out, START to opt back in (routes/whatsapp.py).
"""
from __future__ import annotations
from security import mask
import json
import logging
import os
import re
from datetime import datetime
from typing import Optional

import httpx
from pymongo.errors import DuplicateKeyError

from database import db
from notifications import (
    TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, SITE_URL, send_sms, _fire,
)

logger = logging.getLogger(__name__)

TWILIO_WHATSAPP_FROM = os.environ.get("TWILIO_WHATSAPP_FROM")
PUBLIC_API_URL = os.environ.get("PUBLIC_API_URL", "https://svadista-backend.onrender.com").rstrip("/")

# Template bodies to submit in Twilio Content Template Builder (category: Utility).
# The numbered variables must match the order each event passes them in.
TEMPLATES = {
    "order_received": (
        "Hi {{1}}, we've received your order #{{2}} — total £{{3}}. {{4}}\n\n"
        "Track your order live: {{5}}\n\nSree Svadista Prasada"
    ),
    "order_ready": (
        "Hi {{1}}, order #{{2}} is ready for collection at our Greenleys kitchen. "
        "Just give your order number at the door.\n\n"
        "Order details: {{3}}\n\nSree Svadista Prasada"
    ),
    "order_on_the_way": (
        "Hi {{1}}, order #{{2}} is on its way and should be with you in about 10–15 minutes. "
        "Please keep your phone handy.\n\n"
        "Track it here: {{3}}\n\nSree Svadista Prasada"
    ),
    "order_delivered": (
        "Hi {{1}}, order #{{2}} has been delivered — enjoy your meal!\n\n"
        "Rate it in your account: {{3}}\n\nSree Svadista Prasada"
    ),
    "order_cancelled": (
        "Hi {{1}}, order #{{2}} has been cancelled. If this wasn't expected, "
        "please call us on +44 7307 119962.\n\n"
        "Your orders: {{3}}\n\nSree Svadista Prasada"
    ),
    "sub_confirmed": (
        "Hi {{1}}, your {{2}} Dabba Wala is confirmed! Your first meal arrives on {{3}}, "
        "between 12 and 2pm. Total paid: £{{4}}.\n\n"
        "See your menu, skip a day or manage your plan: {{5}}\n\nSree Svadista Prasada"
    ),
    "sub_on_the_way": (
        "Hi {{1}}, today's Dabba Wala is on its way. On the menu: {{2}}.\n\n"
        "Your plan and deliveries: {{3}}\n\nSree Svadista Prasada"
    ),
    "sub_delivered": (
        "Hi {{1}}, today's Dabba Wala has been delivered — {{2}}. Enjoy!\n\n"
        "Rate today's meal: {{3}}\n\nSree Svadista Prasada"
    ),
    "sub_issue": (
        "Hi {{1}}, a quick update about your Dabba Wala delivery on {{2}}: {{3}}. "
        "We're on it and sorry for the trouble.\n\n"
        "Your plan and deliveries: {{4}}\n\nSree Svadista Prasada"
    ),
    "sub_renewal": (
        "Hi {{1}}, your Dabba Wala plan ends on {{2}}. Renew by Sunday 5pm to keep "
        "your meals coming without a break.\n\n"
        "Renew here: {{3}}\n\nSree Svadista Prasada"
    ),
}


def tracking_link(tab: str, order_id: Optional[str] = None) -> str:
    """Deep link into the customer's account — the dashboard opens on the right tab."""
    url = f"{SITE_URL}/dashboard?tab={tab}"
    return f"{url}&order={order_id}" if order_id else url


# Messages that invite rather than inform. Someone who said STOP on WhatsApp does not
# then get these by text message instead; order and delivery updates still arrive.
MARKETING_EVENTS = {"sub_renewal"}


def first_name(name: Optional[str]) -> str:
    parts = (name or "").split()
    return parts[0] if parts else "there"


def template_sid(event: str) -> Optional[str]:
    return os.environ.get(f"WA_TPL_{event.upper()}")


def whatsapp_enabled(event: Optional[str] = None) -> bool:
    if not (TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_WHATSAPP_FROM):
        return False
    return bool(template_sid(event)) if event else True


def to_e164(phone: str) -> Optional[str]:
    """UK-first normalisation: 07xxx → +447xxx, 0044… → +44…, 447… → +447…"""
    raw = (phone or "").strip()
    digits = re.sub(r"\D", "", raw)
    if not digits:
        return None
    if raw.startswith("+"):
        pass
    elif digits.startswith("00"):
        digits = digits[2:]
    elif digits.startswith("0"):
        digits = "44" + digits[1:]
    elif not digits.startswith("44"):
        return None
    return f"+{digits}" if 10 <= len(digits) <= 15 else None


def _clean_var(value) -> str:
    """WhatsApp rejects empty variables, newlines, tabs and runs of 4+ spaces."""
    text = re.sub(r"\s+", " ", str(value if value is not None else "")).strip()
    return text[:300] or "-"


async def is_opted_out(phone_e164: str) -> bool:
    return bool(await db.wa_optouts.find_one({"phone": phone_e164}, {"_id": 1}))


async def _notify_customer_now(
    event: str, phone: str, variables: list, dedupe_key: str, sms_fallback: Optional[str],
) -> None:
    to = to_e164(phone)
    if not to:
        logger.warning("WhatsApp %s: unusable phone %s — skipping", event, mask(phone))
        return

    record = {
        "dedupe_key": dedupe_key,
        "event": event,
        "to": to,
        "sms_fallback": sms_fallback,
        "sms_sent": False,
        "status": "queued",
        "sid": None,
        "created_at": datetime.utcnow().isoformat(),
        "at": datetime.utcnow(),           # a real date, so the record can be deleted automatically after MESSAGE_LOG_DAYS
    }
    try:
        await db.wa_messages.insert_one(record)
    except DuplicateKeyError:
        logger.info("WhatsApp %s already sent for %s — skipping duplicate", event, dedupe_key)
        return
    except Exception as e:
        # The dedupe store being down must never cost the customer a "your order is ready"
        logger.error("wa_messages insert failed (%s) — sending without dedupe", e)

    async def finish(status: str, **extra):
        try:
            await db.wa_messages.update_one(
                {"dedupe_key": dedupe_key}, {"$set": {"status": status, **extra}}
            )
        except Exception as e:
            logger.error("wa_messages update failed: %s", e)

    async def fall_back(reason: str):
        if sms_fallback:
            # a marketing event stays marketing on the text fallback: STOP honoured, "Reply STOP" added (A-0004 MKT-001)
            send_sms(to, sms_fallback, kind="marketing" if event in MARKETING_EVENTS else "service")
            await finish(f"sms:{reason}", sms_sent=True)
        else:
            await finish(f"skipped:{reason}")

    sid = template_sid(event)
    if not whatsapp_enabled() or not sid:
        return await fall_back("not_configured")
    if await is_opted_out(to):
        if event in MARKETING_EVENTS:
            return await finish("skipped:opted_out")
        return await fall_back("opted_out")

    try:
        async with httpx.AsyncClient(timeout=15, auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)) as client:
            r = await client.post(
                f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json",
                data={
                    "From": f"whatsapp:{TWILIO_WHATSAPP_FROM}",
                    "To": f"whatsapp:{to}",
                    "ContentSid": sid,
                    "ContentVariables": json.dumps(
                        {str(i + 1): _clean_var(v) for i, v in enumerate(variables)}
                    ),
                    "StatusCallback": f"{PUBLIC_API_URL}/api/whatsapp/status",
                },
            )
        if r.status_code >= 300:
            logger.error("Twilio WhatsApp error %s → %s: %s", r.status_code, mask(to), r.text[:400])
            return await fall_back("send_error")
        await finish("sent", sid=r.json().get("sid"))
        logger.info("WhatsApp %s sent to=%s", event, mask(to))
    except Exception as e:
        logger.exception("WhatsApp send failed to=%s: %s", to, e)
        await fall_back("send_error")


def notify_customer(
    event: str, phone: Optional[str], variables: list, dedupe_key: str,
    sms_fallback: Optional[str] = None,
) -> None:
    """Fire-and-forget WhatsApp update; falls back to `sms_fallback` when WhatsApp can't deliver."""
    if not phone:
        return
    _fire(_notify_customer_now(event, phone, variables, dedupe_key, sms_fallback))


async def handle_status_callback(sid: str, status: str) -> None:
    """Twilio delivery receipt. A WhatsApp that never lands is re-sent once as SMS."""
    if not sid:
        return
    update = {"status": status, "status_at": datetime.utcnow().isoformat()}
    if status not in ("failed", "undelivered"):
        await db.wa_messages.update_one({"sid": sid}, {"$set": update})
        return
    # Claim the fallback atomically — Twilio can deliver the same receipt twice
    doc = await db.wa_messages.find_one_and_update(
        {"sid": sid, "sms_sent": False}, {"$set": {**update, "sms_sent": True}}
    )
    if doc and doc.get("sms_fallback"):
        send_sms(doc["to"], doc["sms_fallback"], kind="marketing" if doc.get("event") in MARKETING_EVENTS else "service")


# ── Renewal reminders ─────────────────────────────────────────────────────────

async def send_renewal_reminder(sub: dict) -> None:
    """One reminder per subscription, ever — the dedupe key covers manual + automatic sends. It asks for a new purchase,
    so it is marketing: only to people who asked for offers, never while messages are paused (privacy policy 5b)."""
    from automations import all_paused, marketing_consented
    if await all_paused() or not await marketing_consented(sub.get("customer_email") or ""):
        return
    notify_customer(
        "sub_renewal", sub.get("customer_phone"),
        [first_name(sub.get("customer_name")), sub.get("end_date", "soon"), f"{SITE_URL}/subscriptions"],
        dedupe_key=f"sub_renewal:{sub['id']}",
        sms_fallback=(
            f"Sree Svadista Prasada: your Dabba Wala ends {sub.get('end_date', 'soon')}. "
            f"Renew at {SITE_URL}/subscriptions"
        ),
    )


async def renewal_reminder_loop():
    """
    Every 15 min, during London daytime only, remind active subscribers whose
    plan ends within 2 days. Each subscription is reminded once (email + WhatsApp).
    """
    import asyncio
    from datetime import timedelta
    from zoneinfo import ZoneInfo
    from notifications import send_email, email_renewal_reminder

    london = ZoneInfo("Europe/London")
    while True:
        try:
            now = datetime.now(london)
            from heartbeat import beat
            await beat("renewal reminders")
            if 10 <= now.hour < 18:
                today = now.strftime("%Y-%m-%d")
                horizon = (now + timedelta(days=2)).strftime("%Y-%m-%d")
                due = db.subscriptions.find(
                    {
                        "status": "active",
                        "end_date": {"$gte": today, "$lte": horizon},
                        "renewal_reminded_at": {"$exists": False},
                    },
                    {"_id": 0},
                )
                async for sub in due:
                    claimed = await db.subscriptions.update_one(
                        {"id": sub["id"], "renewal_reminded_at": {"$exists": False}},
                        {"$set": {"renewal_reminded_at": datetime.utcnow().isoformat()}},
                    )
                    if not claimed.modified_count:
                        continue
                    if sub.get("customer_email"):
                        subj, html = email_renewal_reminder(sub.get("customer_name") or "there", sub)
                        from automations import all_paused, marketing_consented
                        if not await all_paused() and await marketing_consented(sub["customer_email"]):
                            send_email(sub["customer_email"], subj, html, kind="marketing")
                    await send_renewal_reminder(sub)
        except asyncio.CancelledError:
            raise
        except Exception as e:
            logger.error("Renewal reminder tick failed: %s", e)
        await asyncio.sleep(900)
