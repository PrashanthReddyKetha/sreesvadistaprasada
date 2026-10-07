"""
Twilio WhatsApp webhooks.

Configure on the Twilio WhatsApp sender:
    "When a message comes in"  → POST {PUBLIC_API_URL}/api/whatsapp/inbound
Delivery receipts are requested per message (StatusCallback) and land on /status.
"""
import base64
import hashlib
import hmac
import html
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Request, Response

from database import db
from notifications import TWILIO_AUTH_TOKEN, notify_admin
from whatsapp import PUBLIC_API_URL, handle_status_callback

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])

STOP_WORDS = {"stop", "unsubscribe", "stop all", "cancel updates", "opt out", "optout"}
START_WORDS = {"start", "subscribe", "unstop", "opt in", "optin"}
SUPPORT_NUMBER = "+44 7307 119962"


async def _verified_form(request: Request, path: str) -> dict:
    """Parse the form body and verify X-Twilio-Signature — rejects anything not from Twilio."""
    if not TWILIO_AUTH_TOKEN:
        raise HTTPException(status_code=403, detail="Not configured")
    form = {k: str(v) for k, v in (await request.form()).items()}
    signed = f"{PUBLIC_API_URL}{path}" + "".join(f"{k}{form[k]}" for k in sorted(form))
    expected = base64.b64encode(
        hmac.new(TWILIO_AUTH_TOKEN.encode(), signed.encode(), hashlib.sha1).digest()
    ).decode()
    if not hmac.compare_digest(expected, request.headers.get("X-Twilio-Signature", "")):
        raise HTTPException(status_code=403, detail="Invalid signature")
    return form


def _twiml(message: str = "") -> Response:
    body = f"<Message>{html.escape(message)}</Message>" if message else ""
    return Response(
        content=f'<?xml version="1.0" encoding="UTF-8"?><Response>{body}</Response>',
        media_type="application/xml",
    )


@router.post("/status")
async def whatsapp_status(request: Request):
    form = await _verified_form(request, "/api/whatsapp/status")
    await handle_status_callback(form.get("MessageSid", ""), form.get("MessageStatus", ""))
    return {"ok": True}


@router.post("/inbound")
async def whatsapp_inbound(request: Request):
    form = await _verified_form(request, "/api/whatsapp/inbound")
    phone = form.get("From", "").replace("whatsapp:", "")
    text = form.get("Body", "").strip()
    word = text.lower().strip(" .!")
    if not phone:
        return _twiml()

    if word in STOP_WORDS or word.split()[:1] == ["stop"]:      # "STOP please" counts too (A-0003, MKT-016)
        await db.wa_optouts.update_one(
            {"phone": phone},
            {"$set": {"phone": phone, "opted_out_at": datetime.utcnow().isoformat()}},
            upsert=True,
        )
        return _twiml(
            "Done — no more WhatsApp updates from Sree Svadista Prasada. "
            "Essential order updates will come by text instead. Reply START to switch back on."
        )

    if word in START_WORDS:
        await db.wa_optouts.delete_one({"phone": phone})
        return _twiml("Welcome back! WhatsApp order updates are switched on again.")

    # Anything else is a real question — pass it to the team, and point the
    # customer at the staffed number at most once a day so we never nag.
    notify_admin(
        f"WhatsApp reply from {phone}",
        f"<p>A customer replied to an order-update message:</p>"
        f"<blockquote>{html.escape(text) or '(no text)'}</blockquote>"
        f"<p>Reply to them directly on WhatsApp: {html.escape(phone)}</p>",
    )
    now = datetime.utcnow()
    seen = await db.wa_inbound.find_one({"phone": phone}, {"_id": 0, "auto_replied_at": 1})
    if seen and seen.get("auto_replied_at", "") > (now - timedelta(hours=24)).isoformat():
        return _twiml()
    await db.wa_inbound.update_one(
        {"phone": phone}, {"$set": {"phone": phone, "auto_replied_at": now.isoformat()}}, upsert=True
    )
    return _twiml(
        "Thanks for your message! This number only sends order updates, but we've passed your "
        f"message to the team. For a quick answer, WhatsApp or call us on {SUPPORT_NUMBER}. "
        "Reply STOP to turn these updates off."
    )
