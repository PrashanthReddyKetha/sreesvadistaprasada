"""Pickup time slots — public slot grid + admin-configurable settings.

Settings live in a single db.settings doc (_id="pickup_slots").
Slot capacity bookings live in db.slot_bookings, written only when a cap is set.
All slot math is Europe/London — the server clock (UTC on Render) is never used naively.
"""
from datetime import datetime, timedelta, date
from typing import Optional, Dict
from zoneinfo import ZoneInfo

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field, field_validator

from database import db
from auth import require_admin

router = APIRouter(prefix="", tags=["pickup-slots"])

LONDON = ZoneInfo("Europe/London")
SETTINGS_ID = "pickup_slots"
DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

DEFAULT_SETTINGS = {
    "_id": SETTINGS_ID,
    "enabled": True,
    "paused": False,
    "paused_message": "",
    "slot_minutes": 15,
    # Minimum prep time: every order needs 40 minutes before collection/delivery
    "lead_time_minutes": 40,
    "max_orders_per_slot": None,  # None = unlimited
    "days": {
        "mon": {"closed": False, "open": "08:00", "close": "20:30"},
        "tue": {"closed": False, "open": "08:00", "close": "20:30"},
        "wed": {"closed": False, "open": "08:00", "close": "20:30"},
        "thu": {"closed": False, "open": "08:00", "close": "20:30"},
        "fri": {"closed": False, "open": "08:00", "close": "21:00"},
        "sat": {"closed": False, "open": "08:00", "close": "21:00"},
        "sun": {"closed": False, "open": "08:00", "close": "20:30"},
    },
}


class DayHours(BaseModel):
    closed: bool = False
    open: str = "08:00"
    close: str = "20:30"

    @field_validator("open", "close")
    @classmethod
    def _hhmm(cls, v: str) -> str:
        try:
            datetime.strptime(v, "%H:%M")
        except ValueError:
            raise ValueError("Times must be HH:MM (24h)")
        return v


class PickupSlotSettingsUpdate(BaseModel):
    enabled: Optional[bool] = None
    paused: Optional[bool] = None
    paused_message: Optional[str] = Field(None, max_length=200)
    slot_minutes: Optional[int] = None
    lead_time_minutes: Optional[int] = Field(None, ge=0, le=240)
    max_orders_per_slot: Optional[int] = Field(None, ge=1, le=100)
    clear_max_orders: bool = False  # explicit "set back to unlimited"
    days: Optional[Dict[str, DayHours]] = None

    @field_validator("slot_minutes")
    @classmethod
    def _slot_len(cls, v):
        if v is not None and v not in (10, 15, 20, 30):
            raise ValueError("slot_minutes must be 10, 15, 20 or 30")
        return v

    @field_validator("days")
    @classmethod
    def _day_keys(cls, v):
        if v is not None:
            bad = set(v) - set(DAY_KEYS)
            if bad:
                raise ValueError(f"Unknown day keys: {sorted(bad)}")
            for d in v.values():
                if not d.closed and d.open >= d.close:
                    raise ValueError("Opening time must be before closing time")
        return v


async def get_slot_settings() -> dict:
    doc = await db.settings.find_one({"_id": SETTINGS_ID})
    if not doc:
        return dict(DEFAULT_SETTINGS)
    # Fill any missing keys so partial docs never break slot math
    merged = dict(DEFAULT_SETTINGS)
    merged.update(doc)
    return merged


async def seed_slot_settings():
    """Idempotent — called from server lifespan."""
    existing = await db.settings.find_one({"_id": SETTINGS_ID}, {"_id": 1})
    if not existing:
        await db.settings.insert_one(dict(DEFAULT_SETTINGS))


def _parse_hhmm(day: date, hhmm: str) -> datetime:
    t = datetime.strptime(hhmm, "%H:%M").time()
    return datetime.combine(day, t, tzinfo=LONDON)


def generate_slots(settings: dict, day: date, now: Optional[datetime] = None) -> list[dict]:
    """All slots for a London calendar day that are still bookable (past lead time)."""
    now = now or datetime.now(LONDON)
    hours = settings["days"].get(DAY_KEYS[day.weekday()])
    if not hours or hours.get("closed"):
        return []
    step = timedelta(minutes=settings["slot_minutes"])
    cur = _parse_hhmm(day, hours["open"])
    close = _parse_hhmm(day, hours["close"])
    # Prep clock starts when the kitchen opens, not when the order was placed
    earliest = max(now, cur) + timedelta(minutes=settings["lead_time_minutes"])
    slots = []
    while cur + step <= close:
        if cur >= earliest:
            h12 = cur.hour % 12 or 12
            ampm = "am" if cur.hour < 12 else "pm"
            slots.append({
                "iso": cur.strftime("%Y-%m-%dT%H:%M"),
                "label": f"{h12}:{cur.minute:02d} {ampm}",
                "end_label": (cur + step).strftime("%H:%M"),
            })
        cur += step
    return slots


def slot_in_grid(settings: dict, slot_iso: str, now: Optional[datetime] = None) -> bool:
    """True if slot_iso is a currently bookable slot (today or tomorrow, London time)."""
    try:
        day = datetime.strptime(slot_iso[:10], "%Y-%m-%d").date()
    except ValueError:
        return False
    now = now or datetime.now(LONDON)
    if day not in (now.date(), now.date() + timedelta(days=1)):
        return False
    return any(s["iso"] == slot_iso for s in generate_slots(settings, day, now))


async def slot_remaining(settings: dict, slot_iso: str) -> Optional[int]:
    """Remaining capacity for a slot, or None when uncapped."""
    cap = settings.get("max_orders_per_slot")
    if not cap:
        return None
    doc = await db.slot_bookings.find_one({"_id": slot_iso}, {"count": 1})
    return max(0, cap - (doc.get("count", 0) if doc else 0))


async def try_reserve_slot(settings: dict, slot_iso: str) -> bool:
    """Atomically reserve one unit of slot capacity. Always True when uncapped."""
    cap = settings.get("max_orders_per_slot")
    if not cap:
        return True
    from pymongo.errors import DuplicateKeyError
    try:
        r = await db.slot_bookings.update_one(
            {"_id": slot_iso, "count": {"$lt": cap}},
            {"$inc": {"count": 1}},
            upsert=True,
        )
        return r.modified_count == 1 or r.upserted_id is not None
    except DuplicateKeyError:
        # Lost the upsert race — retry once without upsert
        r = await db.slot_bookings.update_one(
            {"_id": slot_iso, "count": {"$lt": cap}},
            {"$inc": {"count": 1}},
        )
        return r.modified_count == 1


async def release_slot(slot_iso: Optional[str]):
    if slot_iso:
        await db.slot_bookings.update_one(
            {"_id": slot_iso, "count": {"$gt": 0}},
            {"$inc": {"count": -1}},
        )


# ── Public API ────────────────────────────────────────────────────────────────

@router.get("/pickup-slots")
async def list_pickup_slots(date_str: Optional[str] = Query(None, alias="date")):
    settings = await get_slot_settings()
    now = datetime.now(LONDON)

    if settings.get("paused"):
        return {
            "paused": True,
            "message": settings.get("paused_message") or "We're not taking orders right now — please check back soon.",
            "slots": [], "asap_available": False,
        }

    if date_str:
        try:
            day = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(400, "date must be YYYY-MM-DD")
        if day not in (now.date(), now.date() + timedelta(days=1)):
            raise HTTPException(400, "Only today and tomorrow can be booked")
    else:
        day = now.date()

    slots = generate_slots(settings, day, now)
    cap = settings.get("max_orders_per_slot")
    if cap and slots:
        docs = await db.slot_bookings.find(
            {"_id": {"$in": [s["iso"] for s in slots]}}
        ).to_list(length=len(slots))
        counts = {d["_id"]: d.get("count", 0) for d in docs}
        for s in slots:
            s["remaining"] = max(0, cap - counts.get(s["iso"], 0))
            s["available"] = s["remaining"] > 0
    else:
        for s in slots:
            s["remaining"] = None
            s["available"] = True

    hours = settings["days"].get(DAY_KEYS[day.weekday()], {})
    is_open_now = bool(slots) or (
        not hours.get("closed")
        and day == now.date()
        and _parse_hhmm(day, hours.get("open", "00:00")) <= now <= _parse_hhmm(day, hours.get("close", "00:00"))
    )
    closed_today = hours.get("closed", False) or (day == now.date() and not slots and not is_open_now)

    return {
        "paused": False,
        "date": day.isoformat(),
        "slot_minutes": settings["slot_minutes"],
        "asap_available": day == now.date() and is_open_now,
        "closed": closed_today and not slots,
        "slots": slots,
    }


# ── Admin API ─────────────────────────────────────────────────────────────────

@router.get("/admin/settings/pickup-slots")
async def get_settings_admin(_: dict = Depends(require_admin)):
    settings = await get_slot_settings()
    settings.pop("_id", None)
    return settings


@router.put("/admin/settings/pickup-slots")
async def update_settings_admin(payload: PickupSlotSettingsUpdate, admin: dict = Depends(require_admin)):
    updates = {}
    data = payload.model_dump(exclude_unset=True, exclude={"clear_max_orders"})
    for k, v in data.items():
        if k == "days" and v is not None:
            for day_key, hours in v.items():
                updates[f"days.{day_key}"] = hours if isinstance(hours, dict) else hours
        elif v is not None:
            updates[k] = v
    if payload.clear_max_orders:
        updates["max_orders_per_slot"] = None
    if not updates:
        raise HTTPException(400, "Nothing to update")
    updates["updated_at"] = datetime.utcnow().isoformat()
    updates["updated_by"] = admin.get("sub")
    await db.settings.update_one({"_id": SETTINGS_ID}, {"$set": updates}, upsert=True)
    settings = await get_slot_settings()
    settings.pop("_id", None)
    return settings
