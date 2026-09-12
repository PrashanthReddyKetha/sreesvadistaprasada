"""Web push routes — browser subscription, tracking beacons, admin campaigns.

Public:
  GET  /push/public-key      → VAPID application server key for pushManager.subscribe
  POST /push/subscribe       → store/refresh a subscription (endpoint-keyed upsert)
  POST /push/unsubscribe     → remove a subscription
  POST /push/track           → analytics beacon from the service worker
                               (?c=<campaign_id>&e=received|clicked, no body —
                               callable with mode:'no-cors' from sw.js)

Admin:
  GET    /admin/push/overview        → subscriber count + campaign list
  POST   /admin/push/send            → send now, or schedule (London time)
  DELETE /admin/push/campaigns/{id}  → cancel a scheduled campaign
"""
import asyncio
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field

from database import db
from auth import require_admin, get_optional_user
from web_push import ensure_vapid_keys, dispatch_campaign, new_campaign, LONDON

router = APIRouter(prefix="", tags=["push"])


class PushKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscription(BaseModel):
    endpoint: str = Field(min_length=10, max_length=2000)
    keys: PushKeys


class UnsubscribeBody(BaseModel):
    endpoint: str


class CampaignCreate(BaseModel):
    title: str = Field(min_length=1, max_length=80)
    body: str = Field(min_length=1, max_length=300)
    url: str = Field(default="/order", max_length=300)
    # "YYYY-MM-DDTHH:MM" from <input type=datetime-local>, London wall time
    schedule_at: Optional[str] = None


@router.get("/push/public-key")
async def public_key():
    keys = await ensure_vapid_keys()
    return {"public_key": keys["public_key"]}


@router.post("/push/subscribe")
async def subscribe(sub: PushSubscription, current_user: Optional[dict] = Depends(get_optional_user)):
    await db.push_subs.update_one(
        {"endpoint": sub.endpoint},
        {"$set": {
            "endpoint": sub.endpoint,
            "keys": sub.keys.model_dump(),
            "user_id": current_user.get("id") if current_user else None,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
         "$setOnInsert": {"created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"ok": True}


@router.post("/push/unsubscribe")
async def unsubscribe(body: UnsubscribeBody):
    await db.push_subs.delete_one({"endpoint": body.endpoint})
    return {"ok": True}


@router.post("/push/track")
async def track(c: str = Query(max_length=64), e: str = Query(max_length=16)):
    if e not in ("received", "clicked"):
        raise HTTPException(400, "Unknown event")
    await db.push_campaigns.update_one({"id": c}, {"$inc": {f"stats.{e}": 1}})
    return {"ok": True}


# ── Admin ────────────────────────────────────────────────────────────────────

@router.get("/admin/push/overview")
async def push_overview(admin: dict = Depends(require_admin)):
    subscribers = await db.push_subs.count_documents({})
    campaigns = await db.push_campaigns.find({}, {"_id": 0}) \
        .sort("created_at", -1).to_list(50)
    return {"subscribers": subscribers, "campaigns": campaigns}


@router.post("/admin/push/send")
async def push_send(body: CampaignCreate, admin: dict = Depends(require_admin)):
    send_at_utc = None
    if body.schedule_at:
        try:
            local = datetime.strptime(body.schedule_at, "%Y-%m-%dT%H:%M").replace(tzinfo=LONDON)
        except ValueError:
            raise HTTPException(400, "schedule_at must be YYYY-MM-DDTHH:MM")
        as_utc = local.astimezone(timezone.utc)
        if as_utc <= datetime.now(timezone.utc):
            raise HTTPException(400, "Scheduled time is in the past — pick a future time or send now.")
        send_at_utc = as_utc.isoformat()

    campaign = new_campaign(body.title, body.body, body.url, send_at_utc)
    await db.push_campaigns.insert_one({**campaign})
    if send_at_utc is None:
        # Fire in the background so the admin UI gets an instant response
        asyncio.create_task(dispatch_campaign(campaign["id"]))
        return {"ok": True, "id": campaign["id"], "status": "sending"}
    return {"ok": True, "id": campaign["id"], "status": "scheduled", "send_at_utc": send_at_utc}


@router.delete("/admin/push/campaigns/{campaign_id}")
async def push_cancel(campaign_id: str, admin: dict = Depends(require_admin)):
    res = await db.push_campaigns.update_one(
        {"id": campaign_id, "status": "scheduled"},
        {"$set": {"status": "cancelled"}},
    )
    if res.modified_count == 0:
        raise HTTPException(400, "Only scheduled campaigns can be cancelled.")
    return {"ok": True}
