"""
Unified email (Resend) + SMS (Twilio) dispatch.

All senders are fire-and-forget: requests never block on a third-party call,
and a missing / failing provider is logged but does not surface to the user.
Set env vars on Render:
    RESEND_API_KEY                — Resend API key
    RESEND_FROM  (optional)       — default "Sree Svadista Prasada <info@sreesvadistaprasada.com>"
    ADMIN_ALERT_EMAIL (optional)  — admin recipient for internal alerts (falls back to ADMIN_EMAIL_2, then ADMIN_EMAIL)
    TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER
    SITE_URL (optional)           — used in email links, default https://sreesvadistaprasada.com
"""
from __future__ import annotations
from security import mask
import os
import hmac
import hashlib
from urllib.parse import quote
from html import escape as html_escape
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

# Lazy import to avoid circular imports
_db = None
def _get_db():
    global _db
    if _db is None:
        from database import db as _database
        _db = _database
    return _db


async def create_notification(
    user_id: str,
    title: str,
    body: str,
    notif_type: str = "info",
    action_url: str = "/dashboard",
) -> None:
    """Write an in-app notification to the notifications collection."""
    import uuid
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": title,
        "body": body,
        "type": notif_type,
        "action_url": action_url,
        "read": False,
        "created_at": datetime.utcnow().isoformat(),
        # Legacy fields kept for compatibility with existing notification queries
        "enquiry_id": None,
        "enquiry_type": None,
    }
    try:
        await _get_db().notifications.insert_one(doc)
    except Exception as e:
        logger.error("Failed to create notification for user %s: %s", user_id, e)


RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
RESEND_FROM = os.environ.get(
    "RESEND_FROM", "Sree Svadista Prasada <info@sreesvadistaprasada.com>"
)
ADMIN_ALERT_EMAIL = (
    os.environ.get("ADMIN_ALERT_EMAIL")
    or os.environ.get("ADMIN_EMAIL_2")
    or os.environ.get("ADMIN_EMAIL")
    or "info@sreesvadistaprasada.com"
)
SITE_URL = os.environ.get("SITE_URL", "https://sreesvadistaprasada.com").rstrip("/")
# Set GOOGLE_REVIEW_URL once the Google Business Profile exists, to the exact
# "https://search.google.com/local/writereview?placeid=..." link from the GBP
# dashboard — that's the format Google actually recognises for review requests.
# The maps search fallback below still gets a happy customer to the listing.
GOOGLE_REVIEW_URL = os.environ.get(
    "GOOGLE_REVIEW_URL",
    "https://www.google.com/maps/search/?api=1&query=Sree+Svadista+Prasada+Milton+Keynes",
)

TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")
TWILIO_FROM_NUMBER = os.environ.get("TWILIO_FROM_NUMBER")


# ── Shared HTML shell ────────────────────────────────────────────────────────

def _wrap(title: str, body_html: str, cta_text: str = "", cta_url: str = "") -> str:
    cta = ""
    if cta_text and cta_url:
        cta = (
            f'<p style="text-align:center;margin:28px 0"><a href="{cta_url}" '
            'style="background:#800020;color:#fff;text-decoration:none;'
            'padding:12px 26px;border-radius:999px;font-weight:600;font-family:Georgia,serif">'
            f'{cta_text}</a></p>'
        )
    return f"""<!doctype html>
<html><body style="margin:0;padding:0;background:#FDFBF7;font-family:Georgia,serif;color:#3b2a24">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="text-align:center;padding:10px 0 6px">
      <span style="font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#800020;font-weight:700">Sree Svadista Prasada</span>
    </div>
    <div style="background:#fff;border:1px solid rgba(244,196,48,0.35);border-radius:14px;padding:28px">
      <h2 style="margin:0 0 14px;color:#800020;font-family:'Playfair Display',Georgia,serif">{title}</h2>
      <div style="font-size:15px;line-height:1.55;color:#3b2a24">{body_html}</div>
      {cta}
    </div>
    <p style="text-align:center;font-size:12px;color:#9C7B6B;margin:16px 0 0">
      Milton Keynes, UK — <a href="{SITE_URL}" style="color:#9C7B6B">sreesvadistaprasada.com</a>
    </p>
  </div>
</body></html>"""


# ── Unsubscribe, opt-outs and the send log ───────────────────────────────────
# "service" messages are about something the customer bought or asked for (order
# updates, plan confirmations, password reset) and are always sent.
# "marketing" messages invite the customer to do something (review, renew, come
# back). They carry an unsubscribe link and are never sent to someone who opted out.

PUBLIC_API_URL = os.environ.get("PUBLIC_API_URL", "https://svadista-backend.onrender.com").rstrip("/")
MESSAGE_LOG_DAYS = 400
# A provider that cannot be reached, or answers with a server error or "too busy", is tried again after these
# pauses. A message the provider refuses outright (a bad address) is not retried.
RETRY_DELAYS = (20, 120, 600)


def _again(status_code: Optional[int]) -> bool:
    """Worth another try? Only when the fault is on the provider's side."""
    return status_code is None or status_code == 429 or status_code >= 500


async def _gave_up(channel: str, to: str, kind: str, label: str, fault: str, tries: int) -> None:
    """The last try failed: log it, and for a message the customer is owed (an order update, a plan confirmation)
    tell the owner so it can be sent by hand. Alerts about alerts would loop, so an alert never raises another."""
    await log_message(channel, to, kind, f"failed: {fault} after {tries} tries", label)
    if kind == "service":
        notify_admin(f"A {channel} to a customer could not be sent",
                     f"<p>A <b>{channel}</b> to <b>{mask(to)}</b> failed {tries} times: {html_escape(fault)}.</p>"
                     f"<p>Subject: {html_escape(label)}</p><p>Please check the provider and, if needed, contact the customer another way. "
                     f"The attempt is in Admin › Messages.</p>")


def unsubscribe_token(email: str) -> str:
    from auth import SECRET_KEY
    return hmac.new(SECRET_KEY.encode(), (email or "").strip().lower().encode(), hashlib.sha256).hexdigest()[:32]


def unsubscribe_url(email: str) -> str:
    return f"{PUBLIC_API_URL}/api/unsubscribe?e={quote((email or '').strip().lower())}&t={unsubscribe_token(email)}"


async def email_opted_out(email: str) -> bool:
    from database import db
    return bool(await db.email_optouts.find_one({"email": (email or "").strip().lower()}, {"_id": 1}))


async def log_message(channel: str, to: str, kind: str, status: str, subject: str = "", ref: str = "",
                      provider_id: str = "") -> None:
    """One line per message sent or skipped, on every channel. Never raises."""
    try:
        from database import db
        await db.message_log.insert_one({
            "at": datetime.utcnow(), "channel": channel, "to": (to or "").strip().lower(), "kind": kind,
            "status": status, "subject": (subject or "")[:160], "ref": ref,
            "provider_id": provider_id or None, "delivered_at": None, "opened_at": None, "clicked_at": None,
        })
    except Exception as e:  # the log must never cost the customer their message
        logger.error("message_log insert failed: %s", e)


def _with_unsubscribe(html: str, email: str) -> str:
    link = unsubscribe_url(email)
    footer = (
        '<p style="text-align:center;font-size:12px;color:#9C7B6B;margin:10px 0 0">'
        "You are receiving this because you ordered from us or asked to hear from us. "
        f'<a href="{link}" style="color:#9C7B6B">Unsubscribe</a></p>'
    )
    return html.replace("</body>", footer + "</body>") if "</body>" in html else html + footer


# ── Low-level senders ────────────────────────────────────────────────────────



# ── Retries survive a restart ─────────────────────────────────────────────────
# Before each wait between tries the message is written to `message_retries`; when the loop finishes (sent, refused
# or given up) the row is removed. If the process dies mid-wait, `drain_retries()` (run at start-up and every few
# minutes) sends each stranded message once more and logs the outcome — so a retry is never silently lost (A-0003, MKT-004).

async def _remember_retry(channel: str, payload: dict, attempt: int, delay: int) -> Optional[str]:
    try:
        key = hashlib.sha256(f"{channel}|{payload.get('to')}|{payload.get('subject') or payload.get('body')}".encode()).hexdigest()[:32]
        await _get_db().message_retries.update_one({"_id": key}, {"$set": {"channel": channel, "payload": payload, "attempt": attempt,
                                                                    "due_at": datetime.utcnow() + timedelta(seconds=delay), "noted_at": datetime.utcnow()}}, upsert=True)
        return key
    except Exception as e:  # noqa: BLE001
        logger.debug("retry note failed: %s", e)
        return None


async def _forget_retry(key: Optional[str]) -> None:
    if key:
        try:
            await _get_db().message_retries.delete_one({"_id": key})
        except Exception:  # noqa: BLE001
            pass


RETRY_MAX_AGE_HOURS = 3   # an "order ready" text five hours late helps nobody; older strays are logged and dropped


async def drain_retries() -> int:
    """Send stranded retries (due, older than the longest in-process wait) once each. Returns how many were handled."""
    cutoff = datetime.utcnow() - timedelta(seconds=max(RETRY_DELAYS) + 60)
    too_old = datetime.utcnow() - timedelta(hours=RETRY_MAX_AGE_HOURS)
    async for row in _get_db().message_retries.find({"noted_at": {"$lt": too_old}}, {"_id": 1, "channel": 1, "payload": 1}).limit(200):
        if (await _get_db().message_retries.delete_one({"_id": row["_id"]})).deleted_count:
            p = row.get("payload") or {}
            await log_message(row.get("channel", "email"), p.get("to", ""), p.get("kind", "service"),
                              f"dropped: still unsent after {RETRY_MAX_AGE_HOURS} h (server was asleep)", (p.get("subject") or p.get("body") or "")[:60])
    handled = 0
    async for row in _get_db().message_retries.find({"noted_at": {"$lt": cutoff}}, {"_id": 1, "channel": 1, "payload": 1}).limit(50):
        claimed = await _get_db().message_retries.delete_one({"_id": row["_id"]})
        if not claimed.deleted_count:
            continue
        p = row.get("payload") or {}
        try:
            if row["channel"] == "email":
                await _send_email_now(p["to"], p["subject"], p["html"], p.get("kind", "service"), _final=True, _key=p.get("key"), _wrapped=True)
            elif row["channel"] == "sms":
                await _send_sms_now(p["to"], p["body"], p.get("kind", "service"), _final=True)
            handled += 1
        except Exception as e:  # noqa: BLE001
            logger.error("stranded retry failed: %s", e)
    return handled


async def retry_loop():
    from heartbeat import beat
    while True:
        try:
            await beat("message retries")
            await drain_retries()
        except asyncio.CancelledError:
            raise
        except Exception as e:  # noqa: BLE001
            logger.error("retry drain failed: %s", e)
        await asyncio.sleep(300)


async def _send_email_now(to: str, subject: str, html: str, kind: str = "service", _final: bool = False,
                          _key: Optional[str] = None, _wrapped: bool = False) -> None:
    if not to:
        return
    extra_headers = {}
    if kind == "marketing":
        if await email_opted_out(to):
            await log_message("email", to, kind, "skipped: unsubscribed", subject)
            return
        if not _wrapped:                     # a drained retry already carries its unsubscribe footer
            html = _with_unsubscribe(html, to)
        extra_headers = {"List-Unsubscribe": f"<{unsubscribe_url(to)}>", "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"}
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set — skipping email to %s (%s)", mask(to), subject)
        await log_message("email", to, kind, "skipped: email not set up", subject)
        return
    # One key for all tries of this message: Resend treats a repeat with the same key as the same email, so a retry
    # after a timeout that actually went through cannot send it twice (A-0003, MKT-004).
    import uuid
    idempotency_key = _key or uuid.uuid4().hex     # one key per message, kept for every try including a drained one
    note = None
    for attempt, delay in enumerate((0,) + (() if _final else RETRY_DELAYS), start=1):
        if delay:
            note = await _remember_retry("email", {"to": to, "subject": subject, "html": html, "kind": kind, "key": idempotency_key}, attempt, delay)
            await asyncio.sleep(delay)
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                r = await client.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {RESEND_API_KEY}",
                        "Content-Type": "application/json",
                        "Idempotency-Key": idempotency_key,
                    },
                    json={"from": RESEND_FROM, "to": [to], "subject": subject, "html": html,
                          **({"headers": extra_headers} if extra_headers else {})},
                )
        except Exception as e:
            logger.warning("Email try %s to=%s could not reach provider: %s", attempt, mask(to), e)
            code, fault = None, "could not reach provider"
        else:
            if r.status_code < 300:
                logger.info("Email sent to=%s subject=%r", mask(to), subject)
                try:
                    provider_id = r.json().get("id") or ""
                except Exception:
                    provider_id = ""
                await log_message("email", to, kind, "sent" if attempt == 1 else f"sent after {attempt} tries", subject, provider_id=provider_id)
                await _forget_retry(note)
                return
            logger.error("Resend error %s (try %s) → %s: %s", r.status_code, attempt, mask(to), r.text[:400])
            code, fault = r.status_code, f"provider {r.status_code}"
        if not _again(code):
            await _forget_retry(note)
            await log_message("email", to, kind, f"failed: {fault}", subject)
            return
    await _forget_retry(note)
    await _gave_up("email", to, kind, subject, fault, attempt)


async def _send_sms_now(to: str, body: str, kind: str = "service", _final: bool = False) -> None:
    # A marketing text goes only to a number that has not said STOP, and always says how to (owner decision D-041, A-0003 MKT-002)
    if kind == "marketing" and to:
        from whatsapp import is_opted_out
        if await is_opted_out(to):
            await log_message("sms", to, kind, "skipped: opted out", body[:60])
            return
        if "STOP" not in body:
            body = body.rstrip() + " Reply STOP to opt out."
    if not (TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER):
        logger.warning("Twilio not configured — skipping SMS to %s", mask(to))
        if to:
            await log_message("sms", to, kind, "skipped: text messages not set up", body[:60])
        return
    if not to:
        return
    # Ensure E.164-ish
    to_clean = to.strip().replace(" ", "")
    if not to_clean.startswith("+"):
        logger.warning("SMS 'to' is not E.164 (%s) — skipping", mask(to_clean))
        return
    note = None
    for attempt, delay in enumerate((0,) + (() if _final else RETRY_DELAYS), start=1):
        if delay:
            note = await _remember_retry("sms", {"to": to_clean, "body": body, "kind": kind}, attempt, delay)
            await asyncio.sleep(delay)
        try:
            async with httpx.AsyncClient(
                timeout=15, auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            ) as client:
                r = await client.post(
                    f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json",
                    data={"From": TWILIO_FROM_NUMBER, "To": to_clean, "Body": body[:480]},
                )
        except Exception as e:
            logger.warning("SMS try %s to=%s could not reach provider: %s", attempt, mask(to_clean), e)
            code, fault = None, "could not reach provider"
        else:
            if r.status_code < 300:
                logger.info("SMS sent to=%s", mask(to_clean))
                await log_message("sms", to_clean, kind, "sent" if attempt == 1 else f"sent after {attempt} tries", body[:60])
                await _forget_retry(note)
                return
            logger.error("Twilio error %s (try %s) → %s: %s", r.status_code, attempt, mask(to_clean), r.text[:400])
            code, fault = r.status_code, f"provider {r.status_code}"
        if not _again(code):
            await _forget_retry(note)
            await log_message("sms", to_clean, kind, f"failed: {fault}", body[:60])
            return
    await _forget_retry(note)
    await _gave_up("sms", to_clean, kind, body[:60], fault, attempt)


# ── Public fire-and-forget API ───────────────────────────────────────────────
# asyncio only holds a weak reference to a task — without a strong reference
# somewhere, the event loop can garbage-collect it mid-flight and the
# email/SMS silently never sends. Keep one here and let each task remove
# itself on completion.
_background_tasks: set = set()

def _fire(coro) -> None:
    try:
        task = asyncio.create_task(coro)
        _background_tasks.add(task)
        task.add_done_callback(_background_tasks.discard)
    except RuntimeError:
        # No running loop — best effort synchronous run
        asyncio.run(coro)


def send_email(to: str, subject: str, html: str, kind: str = "service") -> None:
    """kind="marketing" adds an unsubscribe link and respects opt-outs."""
    if not to:
        return
    _fire(_send_email_now(to, subject, html, kind))


def send_sms(to: str, body: str, kind: str = "service") -> None:
    if not to:
        return
    _fire(_send_sms_now(to, body, kind))


_ALERT_WINDOW: list = []          # send times of recent owner alerts (in memory; alerts only)
ALERT_CAP, ALERT_CAP_SECONDS = 10, 600


def notify_admin(subject: str, html: str, critical: bool = False) -> None:
    """To the owner; never carries an unsubscribe link, never alerts about itself. More than ALERT_CAP alerts in
    ALERT_CAP_SECONDS collapse into one "quietened" email so a flood cannot bury the inbox (A-0003, MKT-009)."""
    import time
    if critical:                              # money and outages always get through
        send_email(ADMIN_ALERT_EMAIL, subject, html, kind="alert")
        return
    now = time.monotonic()
    _ALERT_WINDOW[:] = [t for t in _ALERT_WINDOW if now - t < ALERT_CAP_SECONDS]
    if len(_ALERT_WINDOW) >= ALERT_CAP:
        if len(_ALERT_WINDOW) == ALERT_CAP:      # exactly once per burst
            _ALERT_WINDOW.append(now)
            send_email(ADMIN_ALERT_EMAIL, "Many alerts at once — the rest are in Admin › System log",
                       f"<p>More than {ALERT_CAP} alerts in {ALERT_CAP_SECONDS // 60} minutes. The next ones (new orders, enquiries, "
                       "replies, reviews) are not emailed for a few minutes — open Admin to see them. Payment and server-error alerts are "
                       "never held back.</p>", kind="alert")
        return
    _ALERT_WINDOW.append(now)
    send_email(ADMIN_ALERT_EMAIL, subject, html, kind="alert")


async def send_push_notification(token: str, title: str, body: str, data: Optional[dict] = None) -> None:
    """Send an Expo push notification. Fire-and-forget — never raises."""
    if not token or not token.startswith("ExponentPushToken"):
        return
    try:
        async with httpx.AsyncClient(timeout=6) as client:
            await client.post(
                "https://exp.host/--/api/v2/push/send",
                json={
                    "to": token,
                    "title": title,
                    "body": body,
                    "data": data or {},
                    "sound": "default",
                    "channelId": "orders",
                },
            )
    except Exception as e:
        logger.warning("Push notification failed: %s", e)


# ── Templated helpers (keep route files tidy) ────────────────────────────────

def email_password_reset(name: str, reset_url: str) -> tuple[str, str]:
    name = html_escape(str(name or ""))
    html = _wrap(
        "Reset your password",
        f"<p>Hi {name},</p>"
        "<p>We received a request to reset your Sree Svadista Prasada password. "
        "This link expires in 1 hour.</p>"
        "<p>If you didn't request this, you can safely ignore this email — your password won't change.</p>",
        "Reset Password", reset_url,
    )
    return "Reset your password", html


def email_welcome(name: str) -> tuple[str, str]:
    name = html_escape(str(name or ""))
    html = _wrap(
        f"Welcome, {name}!",
        "<p>Thank you for joining <b>Sree Svadista Prasada</b>. Your account is ready — "
        "browse today's menu, subscribe to our Dabba Wala weekly plan, or order a takeaway whenever you crave home-style South Indian cooking.</p>"
        "<p>We serve <b>Milton Keynes</b> and ship snacks UK-wide.</p>",
        "Open My Dashboard", f"{SITE_URL}/dashboard",
    )
    return "Welcome to Sree Svadista Prasada", html


def _order_disp(order: dict) -> str:
    return order.get("order_number") or order.get("id", "")[:8].upper()


def email_order_confirmation(order: dict, name: str) -> tuple[str, str]:
    name = html_escape(str(name or ""))
    items_rows = "".join(
        f'<tr><td style="padding:4px 0">{i.get("quantity",1)} × {i.get("name","Item")}</td>'
        f'<td style="padding:4px 0;text-align:right">£{(i.get("price",0)*i.get("quantity",1)):.2f}</td></tr>'
        for i in (order.get("items") or [])
    )
    addr = order.get("delivery_address") or {}
    addr_line = ", ".join(filter(None, [
        addr.get("line1"), addr.get("line2"), addr.get("city"), addr.get("postcode")
    ]))
    disp = _order_disp(order)
    is_takeaway = order.get("delivery_type") == "takeaway"
    slot = order.get("scheduled_slot_final") or ""
    slot_line = ""
    if is_takeaway and len(slot) >= 16:
        hh, mm = int(slot[11:13]), slot[14:16]
        slot_line = (
            f'<p style="color:#5C4B47;font-size:13px"><b>Collection time:</b> '
            f'{hh % 12 or 12}:{mm} {"am" if hh < 12 else "pm"}</p>'
        )
    dest_line = (
        slot_line + '<p style="color:#5C4B47;font-size:13px"><b>Collection from:</b> Greenleys kitchen, Milton Keynes</p>'
        if is_takeaway else
        f'<p style="color:#5C4B47;font-size:13px"><b>Deliver to:</b> {addr_line}</p>'
    )
    intro = (
        "We'll text you as soon as it's ready for collection.</p>" if is_takeaway
        else "We'll text you as soon as it's confirmed and on the way.</p>"
    )
    html = _wrap(
        "Order received",
        f"<p>Hi {name}, we've received your order <b>#{disp}</b>. " + intro +
        f'<table style="width:100%;font-size:14px;border-top:1px solid rgba(0,0,0,0.1);margin-top:10px">{items_rows}</table>'
        f'<p style="margin-top:12px"><b>Subtotal:</b> £{order.get("subtotal",0):.2f}<br>'
        + (f'<b>Coupon {order.get("coupon_code")}:</b> −£{order.get("coupon_discount",0):.2f}<br>' if order.get("coupon_code") else "")
        + f'<b>Delivery:</b> £{order.get("delivery_fee",0):.2f}<br>'
        f'<b>Total:</b> £{order.get("total",0):.2f}</p>'
        + dest_line,
        "Track My Order", f"{SITE_URL}/dashboard",
    )
    return f"Order confirmed · #{disp}", html


def email_order_status(order: dict, name: str, status: str) -> tuple[str, str]:
    name = html_escape(str(name or ""))
    is_takeaway = order.get("delivery_type") == "takeaway"
    pretty = {
        "confirmed": "Your order is confirmed",
        "preparing": "We're preparing your order",
        "ready": "Your order is ready for collection",
        "out_for_delivery": "Your order is on the way",
        "delivered": "Your order was collected" if is_takeaway else "Your order was delivered",
        "cancelled": "Your order was cancelled",
    }.get(status, "Order update")
    extra = {
        "ready": "<p>Come and collect it while it's hot — just give your order number at the door.</p>",
        "out_for_delivery": "<p>Our delivery partner is heading to you now. Please keep your phone handy.</p>",
        "delivered": "<p>We hope you enjoyed it! If you have a moment, a Google review helps other South Indian food lovers in Milton Keynes find us.</p>",
        "cancelled": "<p>If this was unexpected, please reply to this email and we'll look into it.</p>",
    }.get(status, "")
    # A status email is a service message and does not ask for a review; the review request does that once (A-0004 MKT-003)
    cta_text, cta_url = ("See your order", f"{SITE_URL}/dashboard?tab=orders") if status == "delivered" else ("Open Dashboard", f"{SITE_URL}/dashboard")
    disp = _order_disp(order)
    status_word = "ready for collection" if status == "ready" else status.replace("_", " ")
    html = _wrap(
        pretty,
        f"<p>Hi {name},</p><p>Order <b>#{disp}</b> is now <b>{status_word}</b>.</p>{extra}",
        cta_text, cta_url,
    )
    return f"{pretty} · #{disp}", html


def email_subscription_confirmation(sub: dict, name: str) -> tuple[str, str]:
    name = html_escape(str(name or ""))
    html = _wrap(
        "Dabba Wala subscription confirmed",
        f"<p>Welcome to the weekly meal family, {name}!</p>"
        f"<p><b>Plan:</b> {sub.get('plan','').title()}<br>"
        f"<b>Box:</b> {sub.get('box_type','prasada').title()}<br>"
        f"<b>Starts:</b> {sub.get('start_date','—')}<br>"
        f"<b>Ends:</b> {sub.get('end_date','—')}<br>"
        f"<b>Price:</b> £{sub.get('price',0):.2f}</p>"
        "<p>You can skip any day from your dashboard. Need to pause or change your plan? Just reply or message us — we're flexible.</p>",
        "Manage My Subscription", f"{SITE_URL}/dashboard",
    )
    return "Your Dabba Wala subscription is live", html


def email_enquiry_receipt(kind: str, name: str) -> tuple[str, str]:
    label = "catering enquiry" if kind == "catering" else "message"
    html = _wrap(
        "We've got your message",
        f"<p>Hi {html_escape(name)}, thanks for your {label}. Our team usually replies within a few hours during business hours.</p>"
        "<p>You'll see any reply in your dashboard under <b>Enquiries</b> — we'll email you too.</p>",
        "Open Dashboard", f"{SITE_URL}/dashboard",
    )
    return "We've received your enquiry", html


def email_enquiry_reply(name: str, admin_text: str) -> tuple[str, str]:
    name = html_escape(str(name or ""))
    safe = (admin_text or "").replace("<", "&lt;").replace(">", "&gt;")
    html = _wrap(
        "New reply to your enquiry",
        f"<p>Hi {name}, our team just replied:</p>"
        f'<blockquote style="margin:12px 0;padding:12px 14px;background:#FAF8F4;border-left:3px solid #800020">{safe}</blockquote>'
        "<p>You can reply from your dashboard.</p>",
        "View Conversation", f"{SITE_URL}/dashboard",
    )
    return "New reply from Sree Svadista Prasada", html


def email_delivery_skipped(name: str, date: str, short_notice: bool) -> tuple[str, str]:
    name = html_escape(str(name or ""))
    extra = (
        "<p style=\"color:#800020\"><b>Heads-up:</b> this is within 12 hours of delivery — "
        "we'll do our best but the box may already be prepped.</p>"
        if short_notice else ""
    )
    html = _wrap(
        "Delivery skipped",
        f"<p>Hi {name}, we've noted that you're skipping your Dabba Wala delivery on <b>{date}</b>.</p>"
        f"{extra}<p>Your plan continues as normal after that day.</p>",
        "Manage My Subscription", f"{SITE_URL}/dashboard",
    )
    return f"Delivery skipped · {date}", html


def email_subscription_cancelled(name: str, sub: dict) -> tuple[str, str]:
    name = html_escape(str(name or ""))
    html = _wrap(
        "Your Dabba Wala subscription is cancelled",
        f"<p>Hi {name}, your <b>{sub.get('plan','').title()}</b> plan has been cancelled. "
        "You won't be charged again and no further boxes will be delivered.</p>"
        "<p>We'd love to know what we could do better — just reply to this email.</p>",
        "Start a New Plan", f"{SITE_URL}/subscriptions",
    )
    return "Subscription cancelled", html


def email_subscription_expired(name: str, sub: dict) -> tuple[str, str]:
    name = html_escape(str(name or ""))
    html = _wrap(
        "Your Dabba Wala has ended — renew in one tap",
        f"<p>Hi {name}, your <b>{sub.get('plan','').title()}</b> Dabba Wala plan wrapped up on "
        f"<b>{sub.get('end_date','—')}</b>. We hope the week tasted like home.</p>"
        "<p>Renew now and we'll keep the same box type, address, and preferences.</p>",
        "Renew My Plan", f"{SITE_URL}/subscriptions",
    )
    return "Your Dabba Wala ended — renew?", html


def email_renewal_reminder(name: str, sub: dict) -> tuple[str, str]:
    name = html_escape(str(name or ""))
    html = _wrap(
        "Your Dabba Wala ends soon",
        f"<p>Hi {name}, a quick reminder that your <b>{sub.get('plan','').title()}</b> plan "
        f"ends on <b>{sub.get('end_date','—')}</b>. Renew now to avoid a break in your weekly meals.</p>",
        "Renew My Plan", f"{SITE_URL}/subscriptions",
    )
    return "Renew your Dabba Wala", html


def email_delivery_issue(name: str, date: str, description: str) -> tuple[str, str]:
    name = html_escape(str(name or ""))
    safe = (description or "").replace("<", "&lt;").replace(">", "&gt;") or "We hit a snag with today's delivery."
    html = _wrap(
        "About today's delivery",
        f"<p>Hi {name}, we wanted to flag an issue with your delivery on <b>{date}</b>:</p>"
        f'<blockquote style="margin:12px 0;padding:12px 14px;background:#FAF8F4;border-left:3px solid #800020">{safe}</blockquote>'
        "<p>Our team is on it — reply to this email if you need anything straight away.</p>",
        "Open Dashboard", f"{SITE_URL}/dashboard",
    )
    return f"Delivery update · {date}", html


def email_review_prompt(name: str, when_label: str) -> tuple[str, str]:
    name = html_escape(str(name or ""))
    html = _wrap(
        "How was it?",
        f"<p>Hi {name}, we hope you enjoyed {when_label}. Could you take 10 seconds to rate it? "
        "Your feedback directly shapes next week's menu.</p>",
        "Leave a Rating", f"{SITE_URL}/dashboard",
    )
    return "How was your meal?", html
