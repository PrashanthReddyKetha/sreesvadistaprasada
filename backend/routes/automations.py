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
    subject, html = await engine.message(automation_id, sample["customer"] if sample else {"name": "Asha"}, cfg.get("coupon_code"))
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
    subject, html = await engine.message(automation_id, {"name": me.get("name") or "there"}, cfg.get("coupon_code"))
    send_email(me["email"], f"[Test] {subject}", html, kind="marketing")
    return {"ok": True, "sent_to": me["email"]}


# ── The words of a message: read, try out, save, put back ─────────────────────

class MessageText(BaseModel):
    subject: str = Field(max_length=engine.LIMITS["subject"])
    heading: str = Field(max_length=engine.LIMITS["heading"])
    body: str = Field(max_length=engine.LIMITS["body"])
    button: str = Field(max_length=engine.LIMITS["button"])


def _tidy(payload: MessageText) -> dict:
    text = {k: " ".join(getattr(payload, k).split()) if k != "body" else "\n\n".join(p.strip() for p in getattr(payload, k).replace("\r", "").split("\n\n") if p.strip())
            for k in engine.EDITABLE}
    missing = [k for k in engine.EDITABLE if not text[k]]
    if missing:
        raise HTTPException(status_code=400, detail=f"Please fill in: {', '.join(missing)}.")
    return text


@router.get("/{automation_id}/text")
async def get_text(automation_id: str, _: dict = Depends(require_admin)):
    _get(automation_id)
    current = await engine.text_for(automation_id)
    original = engine.TEXTS[automation_id]
    return {"current": {k: current[k] for k in engine.EDITABLE}, "original": {k: original[k] for k in engine.EDITABLE},
            "is_custom": any(current[k] != original[k] for k in engine.EDITABLE), "limits": engine.LIMITS,
            "placeholders": ["{first_name}"], "link": original["link"]}


@router.post("/{automation_id}/text/preview")
async def preview_text(automation_id: str, payload: MessageText, _: dict = Depends(require_admin)):
    """What the message would look like with these words — nothing is saved or sent."""
    _get(automation_id)
    cfg = await engine.settings_for(automation_id)
    subject, html = engine.render(automation_id, {**engine.TEXTS[automation_id], **_tidy(payload)}, {"name": "Asha Reddy"}, cfg.get("coupon_code"))
    return {"subject": subject, "html": html}


@router.put("/{automation_id}/text")
async def save_text(automation_id: str, payload: MessageText, admin: dict = Depends(require_admin)):
    a = _get(automation_id)
    before = await engine.text_for(automation_id)
    text = _tidy(payload)
    await db.settings.update_one({"_id": "message_texts"}, {"$set": {automation_id: text}}, upsert=True)
    await record_admin_action(admin, "message words changed", a["name"], {k: before[k] for k in engine.EDITABLE}, text)
    return {"ok": True, "current": text}


@router.delete("/{automation_id}/text")
async def reset_text(automation_id: str, admin: dict = Depends(require_admin)):
    a = _get(automation_id)
    before = await engine.text_for(automation_id)
    await db.settings.update_one({"_id": "message_texts"}, {"$unset": {automation_id: ""}})
    await record_admin_action(admin, "message words put back to the original", a["name"], {k: before[k] for k in engine.EDITABLE},
                              {k: engine.TEXTS[automation_id][k] for k in engine.EDITABLE})
    return {"ok": True, "current": {k: engine.TEXTS[automation_id][k] for k in engine.EDITABLE}}


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
