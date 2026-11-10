"""The descriptions under every table in Admin › Analytics (analyst.py), for the dates picked. Written by rules from the
figures — no AI, no cost. Admin only."""
from typing import Optional

from fastapi import APIRouter, Depends

import analyst
from auth import require_admin
from routes.events import period

router = APIRouter(prefix="/admin", tags=["analysis"])


@router.get("/analytics/analysis")
async def read_analysis(start: Optional[str] = None, end: Optional[str] = None, _: dict = Depends(require_admin)):
    first, last, *_rest = period(30, start, end)
    return await analyst.write(first, last)
