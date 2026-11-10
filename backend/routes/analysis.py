"""The analyst's reading of Admin › Analytics (analyst.py), and the monthly AI limits the owner sets. Admin only."""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

import ai_ops
import analyst
from audit_log import record_admin_action
from auth import require_admin
from database import db
from routes.events import LONDON, period

router = APIRouter(prefix="/admin", tags=["analysis"])


class Ask(BaseModel):
    start: Optional[str] = None
    end: Optional[str] = None
    again: bool = False                      # write it again even though a fresh one exists


def _out(doc: dict, used: dict) -> dict:
    return {**doc, "ai_this_month": used}


@router.get("/analytics/analysis")
async def read_analysis(start: Optional[str] = None, end: Optional[str] = None, _: dict = Depends(require_admin)):
    first, last, *_rest = period(30, start, end)
    doc = await analyst.get(first, last)
    if doc.get("status") == "ready":
        doc["fresh"] = analyst.fresh({**doc, "status": "ready"}, last, datetime.now(LONDON).date())
    return _out(doc, await ai_ops.month_to_date())


@router.post("/analytics/analysis")
async def write_analysis(body: Ask, _: dict = Depends(require_admin)):
    first, last, *_rest = period(30, body.start, body.end)
    doc = await analyst.start(first, last, datetime.now(LONDON).date(), again=body.again)
    return _out(doc, await ai_ops.month_to_date())


class Limits(BaseModel):
    cost_cap_usd: float = Field(ge=0, le=500)
    call_cap: int = Field(ge=0, le=5000)


@router.get("/ai/limits")
async def read_limits(_: dict = Depends(require_admin)):
    return await ai_ops.month_to_date()


@router.put("/ai/limits")
async def set_limits(body: Limits, admin: dict = Depends(require_admin)):
    before = await ai_ops.limits()
    await db.settings.update_one({"_id": "ai_limits"}, {"$set": body.model_dump()}, upsert=True)
    await record_admin_action(admin, "changed the monthly AI limits", "AI", before, body.model_dump())
    return await ai_ops.month_to_date()
