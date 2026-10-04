"""Admin control of marketing automations: see, preview, test, switch on or off.

GET  /api/admin/automations                 the list, each with its state and results
GET  /api/admin/automations/{id}/preview    who would receive it now, and the exact message
POST /api/admin/automations/{id}/test       send the message to the admin's own email only
PUT  /api/admin/automations/{id}            switch on/off, set an optional coupon code
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

import automations as engine
from audit_log import record_admin_action
from auth import require_admin
from database import db
from notifications import send_email

router = APIRouter(prefix="/admin/automations", tags=["Admin Automations"])


def _get(automation_id: str) -> dict:
    a = engine.BY_ID.get(automation_id)
    if not a:
        raise HTTPException(status_code=404, detail="No such automation.")
    return a


@router.get("")
async def list_automations(_: dict = Depends(require_admin)):
    out = []
    for a in engine.CATALOGUE:
        cfg = await engine.settings_for(a["id"])
        people = await engine.audience(a["id"])
        out.append({
            "id": a["id"], "name": a["name"], "who": a["who_text"], "what": a["what_text"],
            "enabled": bool(cfg.get("enabled")), "coupon_code": cfg.get("coupon_code"),
            "changed_by": cfg.get("updated_by"), "changed_at": cfg.get("updated_at"),
            "would_send_now": sum(1 for p in people if not p["skip"]),
            "held_back_now": sum(1 for p in people if p["skip"]),
            "results": await engine.results(a["id"]),
        })
    return {
        "automations": out, "unavailable": engine.UNAVAILABLE, "built_in": engine.BUILT_IN,
        "rules": {"daily_cap": engine.DAILY_CAP, "quiet_days": engine.QUIET_DAYS, "result_window_days": engine.RESULT_WINDOW_DAYS,
                  "hours": "10:00 to 18:00, UK time"},
    }


@router.get("/{automation_id}/preview")
async def preview(automation_id: str, _: dict = Depends(require_admin)):
    a = _get(automation_id)
    cfg = await engine.settings_for(automation_id)
    people = await engine.audience(automation_id)
    sample = next((p for p in people if not p["skip"]), people[0] if people else None)
    subject, html = a["message"](sample["customer"] if sample else {"name": "Asha"}, cfg.get("coupon_code"))
    return {
        "subject": subject, "html": html,
        "would_send": [{"name": p["name"], "email": p["email"]} for p in people if not p["skip"]][:200],
        "held_back": [{"name": p["name"], "email": p["email"], "why": p["skip"]} for p in people if p["skip"]][:200],
    }


@router.post("/{automation_id}/test")
async def send_test(automation_id: str, admin: dict = Depends(require_admin)):
    a = _get(automation_id)
    me = await db.users.find_one({"id": admin["sub"]}, {"_id": 0, "email": 1, "name": 1})
    if not me or not me.get("email"):
        raise HTTPException(status_code=400, detail="Your admin account has no email address to send the test to.")
    cfg = await engine.settings_for(automation_id)
    subject, html = a["message"]({"name": me.get("name") or "there"}, cfg.get("coupon_code"))
    send_email(me["email"], f"[Test] {subject}", html, kind="marketing")
    return {"ok": True, "sent_to": me["email"]}


class AutomationUpdate(BaseModel):
    enabled: Optional[bool] = None
    coupon_code: Optional[str] = Field(default=None, max_length=40)
    clear_coupon: bool = False


@router.put("/{automation_id}")
async def update(automation_id: str, payload: AutomationUpdate, admin: dict = Depends(require_admin)):
    _get(automation_id)
    before = await engine.settings_for(automation_id)
    after = dict(before)
    if payload.enabled is not None:
        after["enabled"] = payload.enabled
    if payload.clear_coupon:
        after["coupon_code"] = None
    elif payload.coupon_code is not None:
        code = payload.coupon_code.strip().upper()
        if code and not await db.coupons.find_one({"code": code}, {"_id": 1}):
            raise HTTPException(status_code=400, detail=f"There is no coupon with the code {code}. Create it under Coupons first.")
        after["coupon_code"] = code or None
    me = await db.users.find_one({"id": admin["sub"]}, {"_id": 0, "name": 1})
    after.update(id=automation_id, updated_by=(me or {}).get("name") or "Admin", updated_at=datetime.utcnow().isoformat())
    await db.automation_settings.update_one({"id": automation_id}, {"$set": after}, upsert=True)
    await record_admin_action(admin, "automation changed", engine.BY_ID[automation_id]["name"],
                              {"on": bool(before.get("enabled")), "coupon": before.get("coupon_code")},
                              {"on": bool(after.get("enabled")), "coupon": after.get("coupon_code")})
    return {"ok": True, "enabled": bool(after.get("enabled")), "coupon_code": after.get("coupon_code")}
