"""Customer communications: unsubscribe, and the admin view of everything sent.

GET/POST /api/unsubscribe      public; the link in every marketing email
GET      /api/admin/messages   admin; the send log across email, text and WhatsApp
"""
import hmac
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse

from auth import require_admin
from database import db
from notifications import SITE_URL, unsubscribe_token

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
    return {
        "days": days,
        "summary": [{"channel": c, "kind": k, "outcome": o, "count": n} for (c, k, o), n in sorted(summary.items(), key=lambda kv: -kv[1])],
        "unsubscribed": await db.email_optouts.count_documents({}),
        "whatsapp_opted_out": await db.wa_optouts.count_documents({}),
        "messages": [{**r, "at": r["at"].isoformat()} for r in rows[:limit]],
    }
