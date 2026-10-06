"""Customer communications: unsubscribe, and the admin view of everything sent.

GET/POST /api/unsubscribe      public; the link in every marketing email
GET      /api/admin/messages   admin; the send log across email, text and WhatsApp
"""
import base64
import hashlib
import hmac
import json
import os
import time
from datetime import datetime, timedelta

from pymongo.errors import DuplicateKeyError
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

from audit_log import record_admin_action
from auth import get_current_user, require_admin
from database import db
from notifications import SITE_URL, _wrap, send_email, unsubscribe_token

router = APIRouter(tags=["Communications"])


def _page(title: str, text: str) -> str:
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>{title} — Sree Svadista Prasada</title></head>
<body style="margin:0;background:#FDFBF7;font-family:Georgia,serif;color:#3b2a24">
<div style="max-width:480px;margin:12vh auto;padding:28px;background:#fff;border:1px solid rgba(244,196,48,.35);border-radius:14px;text-align:center">
<p style="font-size:22px;color:#800020;font-weight:700;margin:0 0 12px">Sree Svadista Prasada</p>
<h1 style="font-size:20px;margin:0 0 10px">{title}</h1><p style="line-height:1.55">{text}</p>
<p><a href="{SITE_URL}" style="color:#800020">Back to the website</a></p></div></body></html>"""


async def _unsubscribe(e: str, t: str) -> bool:
    email = (e or "").strip().lower()
    if not email or not hmac.compare_digest(t or "", unsubscribe_token(email)):
        return False
    await db.email_optouts.update_one(
        {"email": email}, {"$setOnInsert": {"email": email, "at": datetime.utcnow(), "source": "email link"}}, upsert=True)
    await db.newsletter.update_many({"email": {"$regex": f"^{__import__('re').escape(email)}$", "$options": "i"}}, {"$set": {"active": False}})
    return True


@router.get("/unsubscribe", response_class=HTMLResponse)
async def unsubscribe(e: str = "", t: str = ""):
    if await _unsubscribe(e, t):
        return _page("You are unsubscribed", "We will not send you offers, reminders or review requests by email. "
                     "You will still get emails about an order or plan you have with us.")
    return HTMLResponse(_page("This link did not work", "Please reply to any of our emails and we will take you off the list."), status_code=400)


@router.post("/unsubscribe")
async def unsubscribe_one_click(e: str = "", t: str = ""):
    """Used by mail apps that offer their own unsubscribe button."""
    return {"ok": await _unsubscribe(e, t)}


# ── A newsletter, written by the owner, to everyone on the list ───────────────

class Newsletter(BaseModel):
    subject: str = Field(min_length=1, max_length=120)
    heading: str = Field(default="", max_length=120)
    body: str = Field(min_length=1, max_length=6000)
    button: str = Field(default="See the menu", max_length=40)
    link: str = Field(default="/menu", max_length=200)      # a path on our own site
    confirm: bool = False


def _newsletter_html(n: Newsletter) -> str:
    """The owner's plain text as an email: paragraphs split on blank lines, shown as text, never as HTML."""
    from html import escape
    paragraphs = [f"<p>{escape(p.strip())}</p>" for p in n.body.replace("\r", "").split("\n\n") if p.strip()]
    path = n.link if n.link.startswith("/") else "/menu"
    sep = "&" if "?" in path else "?"
    return _wrap(escape(n.heading or n.subject), "".join(paragraphs), escape(n.button), f"{SITE_URL}{path}{sep}utm_source=email&utm_medium=newsletter")


async def _newsletter_recipients() -> list:
    """Active newsletter sign-ups who have not unsubscribed, each address once."""
    out, seen = [], set()
    async for s in db.newsletter.find({"active": {"$ne": False}}, {"_id": 0, "email": 1}):
        email = (s.get("email") or "").strip().lower()
        if email and email not in seen and not await db.email_optouts.find_one({"email": email}, {"_id": 1}):
            seen.add(email)
            out.append(email)
    return out


@router.post("/admin/newsletter/preview")
async def newsletter_preview(payload: Newsletter, _: dict = Depends(require_admin)):
    return {"subject": payload.subject, "html": _newsletter_html(payload), "recipients": len(await _newsletter_recipients())}


@router.post("/admin/newsletter/test")
async def newsletter_test(payload: Newsletter, admin: dict = Depends(require_admin)):
    me = await db.users.find_one({"id": admin["sub"]}, {"_id": 0, "email": 1})
    if not me or not me.get("email"):
        raise HTTPException(status_code=400, detail="Your admin account has no email address to send the test to.")
    send_email(me["email"], f"[Test] {payload.subject}", _newsletter_html(payload), kind="marketing")
    return {"ok": True, "sent_to": me["email"]}


@router.post("/admin/newsletter/send")
async def newsletter_send(payload: Newsletter, admin: dict = Depends(require_admin)):
    """To the whole list, once. Needs confirm=true; the same subject cannot go out twice in a day."""
    if not payload.confirm:
        raise HTTPException(status_code=400, detail="Please confirm the send.")
    recent = await db.newsletter_sends.find_one({"subject": payload.subject, "at": {"$gte": datetime.utcnow() - timedelta(days=1)}}, {"_id": 1})
    if recent:
        raise HTTPException(status_code=409, detail="A newsletter with this subject was sent in the last 24 hours.")
    recipients = await _newsletter_recipients()
    if not recipients:
        raise HTTPException(status_code=400, detail="Nobody is on the list.")
    html = _newsletter_html(payload)
    # The claim is the record itself, keyed on subject + day: two confirmed taps at once cannot both send (A-0003, MKT-005)
    claim_id = f"{payload.subject.strip().lower()}|{datetime.utcnow():%Y-%m-%d}"
    try:
        await db.newsletter_sends.insert_one({"_id": claim_id, "at": datetime.utcnow(), "subject": payload.subject, "recipients": len(recipients), "by": admin.get("sub")})
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="This newsletter is already being sent.")
    for email in recipients:
        send_email(email, payload.subject, html, kind="marketing")
    await record_admin_action(admin, "newsletter sent", payload.subject, None, {"recipients": len(recipients)})
    return {"ok": True, "recipients": len(recipients)}


# ── A signed-in customer's own choice, in My Account ──────────────────────────

class Preference(BaseModel):
    marketing_email: bool


@router.get("/me/preferences")
async def my_preferences(user: dict = Depends(get_current_user)):
    email = (user.get("email") or "").strip().lower()
    return {"marketing_email": not await db.email_optouts.find_one({"email": email}, {"_id": 1}) if email else False}


@router.put("/me/preferences")
async def set_my_preferences(payload: Preference, user: dict = Depends(get_current_user)):
    """Offers, reminders and review requests by email: on or off. Emails about an order or plan are always sent."""
    email = (user.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Your account has no email address.")
    if payload.marketing_email:
        await db.email_optouts.delete_one({"email": email})
    else:
        await db.email_optouts.update_one({"email": email}, {"$setOnInsert": {"email": email, "at": datetime.utcnow(), "source": "my account"}}, upsert=True)
        await db.newsletter.update_many({"email": {"$regex": f"^{__import__('re').escape(email)}$", "$options": "i"}}, {"$set": {"active": False}})
    return {"marketing_email": payload.marketing_email}


def _resend_signature_ok(secret: str, msg_id: str, timestamp: str, body: bytes, header: str) -> bool:
    """Resend signs webhooks the Svix way: HMAC-SHA256 over "id.timestamp.body" with the base64 secret after "whsec_"."""
    try:
        if abs(time.time() - int(timestamp)) > 300:
            return False
        key = base64.b64decode(secret.split("_", 1)[1] if secret.startswith("whsec_") else secret)
    except (ValueError, IndexError):
        return False
    expected = base64.b64encode(hmac.new(key, f"{msg_id}.{timestamp}.".encode() + body, hashlib.sha256).digest()).decode()
    return any(hmac.compare_digest(expected, part.split(",", 1)[-1]) for part in (header or "").split())


RESEND_EVENTS = {"email.delivered": "delivered_at", "email.opened": "opened_at", "email.clicked": "clicked_at"}


@router.post("/webhooks/resend")
async def resend_webhook(request: Request):
    """Delivery, open and click reports from the email provider. Inert until RESEND_WEBHOOK_SECRET is set."""
    secret = os.environ.get("RESEND_WEBHOOK_SECRET")
    if not secret:
        raise HTTPException(status_code=503, detail="Email reports are not set up.")
    body = await request.body()
    h = request.headers
    if not _resend_signature_ok(secret, h.get("svix-id", ""), h.get("svix-timestamp", ""), body, h.get("svix-signature", "")):
        raise HTTPException(status_code=401, detail="Signature did not match.")
    event = json.loads(body)
    kind, email_id = event.get("type"), (event.get("data") or {}).get("email_id")
    if not email_id:
        return {"ok": True}
    if kind in RESEND_EVENTS:      # keep the first time each thing happened
        await db.message_log.update_one({"provider_id": email_id, RESEND_EVENTS[kind]: None}, {"$set": {RESEND_EVENTS[kind]: datetime.utcnow()}})
    elif kind in ("email.bounced", "email.complained"):
        await db.message_log.update_one({"provider_id": email_id}, {"$set": {"status": "failed: " + ("bounced" if kind.endswith("bounced") else "marked as spam")}})
        if kind == "email.complained":      # someone who reports us as spam is unsubscribed at once
            row = await db.message_log.find_one({"provider_id": email_id}, {"_id": 0, "to": 1})
            if row and row.get("to"):
                await db.email_optouts.update_one({"email": row["to"]}, {"$setOnInsert": {"email": row["to"], "at": datetime.utcnow(), "source": "spam report"}}, upsert=True)
    return {"ok": True}


@router.get("/admin/messages")
async def message_log(days: int = 30, limit: int = 200, _: dict = Depends(require_admin)):
    days, limit = max(1, min(days, 400)), max(1, min(limit, 500))
    since = datetime.utcnow() - timedelta(days=days)
    rows = await db.message_log.find({"at": {"$gte": since}}, {"_id": 0}).sort("at", -1).to_list(5000)
    summary: dict = {}
    for r in rows:
        key = (r.get("channel"), r.get("kind"), (r.get("status") or "").split(":")[0])
        summary[key] = summary.get(key, 0) + 1
    wa = await db.wa_messages.find({"created_at": {"$gte": since.isoformat()}}, {"_id": 0}).to_list(5000)
    for m in wa:
        status = m.get("status") or "queued"
        outcome = "sent" if status in ("sent", "delivered", "read", "queued") else ("skipped" if status.startswith(("skipped", "sms")) else "failed")
        key = ("whatsapp", "marketing" if m.get("event") == "sub_renewal" else "service", outcome)
        summary[key] = summary.get(key, 0) + 1
    emails = [r for r in rows if r.get("channel") == "email" and r.get("status") == "sent"]
    tracked = [r for r in emails if r.get("provider_id")]
    by_subject: dict = {}
    for r in tracked:
        b = by_subject.setdefault(r.get("subject") or "", {"subject": r.get("subject") or "", "sent": 0, "delivered": 0, "opened": 0, "clicked": 0})
        b["sent"] += 1
        b["delivered"] += bool(r.get("delivered_at")); b["opened"] += bool(r.get("opened_at")); b["clicked"] += bool(r.get("clicked_at"))
    return {
        "email_reports": {
            "connected": bool(os.environ.get("RESEND_WEBHOOK_SECRET")),
            "sent": len(tracked), "delivered": sum(1 for r in tracked if r.get("delivered_at")),
            "opened": sum(1 for r in tracked if r.get("opened_at")), "clicked": sum(1 for r in tracked if r.get("clicked_at")),
            "by_subject": sorted(by_subject.values(), key=lambda b: -b["sent"])[:20],
        },
        "days": days,
        "summary": [{"channel": c, "kind": k, "outcome": o, "count": n} for (c, k, o), n in sorted(summary.items(), key=lambda kv: -kv[1])],
        "unsubscribed": await db.email_optouts.count_documents({}),
        "whatsapp_opted_out": await db.wa_optouts.count_documents({}),
        "messages": [{**r, "at": r["at"].isoformat(), **{k: (r[k].isoformat() if r.get(k) else None) for k in ("delivered_at", "opened_at", "clicked_at")}}
                     for r in rows[:limit]],
    }
