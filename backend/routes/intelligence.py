"""Admin view of what the system does by itself, and the switches that govern it.

GET  /api/admin/system-log                  settings, latest figures against normal, and the decision log
POST /api/admin/system-log/run              run the nightly review now
POST /api/admin/system-log/{id}/undo        reverse one automatic action
PUT  /api/admin/system-log/settings         the three switches
"""
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

import ai_ops
import intelligence as brain
from audit_log import record_admin_action
from auth import require_admin
from database import db

router = APIRouter(prefix="/admin/system-log", tags=["Admin System Log"])


def _plain(d: dict) -> dict:
    return {
        "id": d["id"], "at": d["at"].isoformat(), "kind": d["kind"], "by": d.get("by", "system"), "level": d.get("level", 1),
        "noticed": d["noticed"], "decided": d["decided"], "did": d["did"],
        "can_undo": bool(d.get("undo")) and not d.get("undone_at"),
        "undone_at": d["undone_at"].isoformat() if d.get("undone_at") else None, "undone_by": d.get("undone_by"),
        "outcome": d.get("outcome"),
        "response": d.get("response"), "responded_by": d.get("responded_by"),
        "can_respond": d.get("level", 1) == 3 and not d.get("response") and "No action" not in d["did"],
    }


@router.get("")
async def system_log(days: int = 30, _: dict = Depends(require_admin)):
    days = max(1, min(days, 180))
    since = datetime.utcnow() - timedelta(days=days)
    entries = await db.decision_log.find({"at": {"$gte": since}}, {"_id": 0}).sort("at", -1).to_list(300)
    latest = await db.daily_metrics.find({}, {"_id": 0, "measured_at": 0}).sort("day", -1).to_list(36)
    signals = []
    if latest:
        history = [h for h in latest[1:] if h.get("visits") or h.get("orders")]
        signals = brain.compare(latest[0], history)
    return {
        "settings": await brain.get_settings(),
        "ai": {**(await ai_ops.month_to_date()), "model": ai_ops.MODEL,
               "recent": [{**u, "at": u["at"].isoformat()} async for u in db.ai_usage.find({}, {"_id": 0}).sort("at", -1).limit(15)]},
        "latest_day": latest[0] if latest else None,
        "signals": signals,
        "recent_days": list(reversed(latest[:14])),
        "entries": [_plain(e) for e in entries],
        "rules": {
            "featured_from_portions": brain.MIN_DISH_ORDERS_FOR_FEATURED, "featured_window_days": brain.FEATURED_WINDOW_DAYS,
            "bought_together_from": brain.MIN_BOUGHT_TOGETHER, "unsubscribe_limit_percent": round(brain.UNSUBSCRIBE_LIMIT * 100),
            "review_after_days": brain.REVIEW_AFTER_DAYS, "runs_at": "a little after 03:00, UK time",
        },
    }


@router.get("/actions")
async def admin_actions(days: int = 30, limit: int = 200, _: dict = Depends(require_admin)):
    """What people changed in admin: who, when, what, before and after. The system's own actions are in the decision log."""
    days, limit = max(1, min(days, 400)), max(1, min(limit, 500))
    rows = await db.admin_audit.find({"at": {"$gte": datetime.utcnow() - timedelta(days=days)}}, {"_id": 0}).sort("at", -1).to_list(limit)
    return {"days": days, "actions": [{**r, "at": r["at"].isoformat()} for r in rows]}


@router.get("/errors")
async def server_errors(days: int = 7, _: dict = Depends(require_admin)):
    """Requests that failed on the server: when, which route, what kind of error. No customer details are kept."""
    rows = await db.error_log.find({"at": {"$gte": datetime.utcnow() - timedelta(days=max(1, min(days, 90)))}}, {"_id": 0}).sort("at", -1).to_list(200)
    return {"errors": [{**r, "at": r["at"].isoformat()} for r in rows]}


@router.post("/run")
async def run_now(admin: dict = Depends(require_admin)):
    result = await brain.run_review()
    await record_admin_action(admin, "ran the system review by hand", "System log")
    return result


@router.post("/{decision_id}/undo")
async def undo(decision_id: str, admin: dict = Depends(require_admin)):
    me = await db.users.find_one({"id": admin["sub"]}, {"_id": 0, "name": 1})
    result = await brain.undo(decision_id, (me or {}).get("name") or "Admin")
    if not result["ok"]:
        raise HTTPException(status_code=400, detail=result["detail"])
    await record_admin_action(admin, "undid an automatic action", decision_id)
    return result


class Response(BaseModel):
    answer: str     # "agreed" or "not now"


@router.post("/{decision_id}/respond")
async def respond(decision_id: str, payload: Response, admin: dict = Depends(require_admin)):
    """Record the owner's answer to a recommendation. Nothing is changed by this — it is so the system
    stops repeating a suggestion that has been dealt with, and so the log shows what was decided."""
    if payload.answer not in ("agreed", "not now"):
        raise HTTPException(status_code=400, detail="Answer must be 'agreed' or 'not now'.")
    me = await db.users.find_one({"id": admin["sub"]}, {"_id": 0, "name": 1})
    done = await db.decision_log.update_one({"id": decision_id, "level": 3, "response": None},
                                            {"$set": {"response": payload.answer, "responded_by": (me or {}).get("name") or "Admin",
                                                      "responded_at": datetime.utcnow()}})
    if not done.modified_count:
        raise HTTPException(status_code=400, detail="This entry is not waiting for an answer.")
    return {"ok": True}


class SettingsUpdate(BaseModel):
    ai_investigation: Optional[bool] = None
    menu_decisions: Optional[bool] = None
    owner_alerts: Optional[bool] = None
    customer_messages: Optional[bool] = None


@router.put("/settings")
async def update_settings(payload: SettingsUpdate, admin: dict = Depends(require_admin)):
    before = await brain.get_settings()
    change = {k: v for k, v in payload.model_dump().items() if v is not None}
    if change:
        await db.settings.update_one({"_id": "intelligence"}, {"$set": change}, upsert=True)
        await record_admin_action(admin, "changed what the system may do by itself", "System log",
                                  {k: before[k] for k in change}, change)
    return await brain.get_settings()
