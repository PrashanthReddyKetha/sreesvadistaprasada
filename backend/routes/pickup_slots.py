"""Pickup time slots — public slot grid + admin-configurable settings.

Settings live in a single db.settings doc (_id="pickup_slots").
Slot capacity bookings live in db.slot_bookings, written only when a cap is set.
All slot math is Europe/London — the server clock (UTC on Render) is never used naively.
"""
from datetime import datetime, timedelta, date
from typing import Optional, Dict
from zoneinfo import ZoneInfo

import asyncio
import logging
import uuid

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, EmailStr, Field, field_validator

from database import db
from security import RateLimit
from audit_log import record_admin_action
from auth import require_admin, get_optional_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["pickup-slots"])

LONDON = ZoneInfo("Europe/London")
SETTINGS_ID = "pickup_slots"
DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

DEFAULT_SETTINGS = {
    "_id": SETTINGS_ID,
    "enabled": True,
    "paused": False,
    "paused_message": "",
    # Single-order delivery on/off (admin toggle). Off = collection only.
    "delivery_enabled": False,
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
    delivery_enabled: Optional[bool] = None
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

@router.get("/kitchen-status")
async def kitchen_status():
    """Public — lets the site show a 'kitchen closed' banner and disable checkout."""
    settings = await get_slot_settings()
    return {
        "open": not settings.get("paused"),
        "delivery_enabled": bool(settings.get("delivery_enabled")),
        "message": settings.get("paused_message") or "Our kitchen is closed today — we're not taking orders right now. Please check back soon.",
    }


@router.get("/opening-hours")
async def opening_hours():
    """Public — the hours set in admin, so the site's structured data never disagrees with them."""
    settings = await get_slot_settings()
    days = settings.get("days") or {}
    return {"days": {k: {"closed": bool(v.get("closed")), "open": v.get("open"), "close": v.get("close")}
                     for k, v in days.items() if k in DAY_KEYS}}


class ReopenSubscribe(BaseModel):
    email: EmailStr
    name: Optional[str] = Field(None, max_length=80)


@router.post("/kitchen-status/notify-me")
async def kitchen_reopen_subscribe(body: ReopenSubscribe, user: Optional[dict] = Depends(get_optional_user),
                                   _: None = Depends(RateLimit(5, 3600, "Too many requests. Please try again later."))):
    """Customer asks to be told when the kitchen reopens. One row per email."""
    settings = await get_slot_settings()
    if not settings.get("paused"):
        return {"ok": True, "already_open": True}
    email = body.email.lower().strip()
    await db.reopen_subs.update_one(
        {"email": email},
        {"$set": {
            "id": str(uuid.uuid4()),
            "email": email,
            "name": (body.name or (user or {}).get("name") or "").strip(),
            "user_id": (user or {}).get("id"),
            "created_at": datetime.utcnow().isoformat(),
        }},
        upsert=True,
    )
    return {"ok": True}


REOPEN_QUIET_HOURS = 12      # one "we're open" message to everyone at most this often
REOPEN_MIN_CLOSED_MINUTES = 30   # a closed-and-reopened within this is a slip of the switch, not news


async def broadcast_kitchen_reopened(closed_at: Optional[datetime] = None):
    """Fire-and-forget: push to every push subscriber + email everyone who asked.
    Held back when the kitchen was only closed for a moment, or when everyone was told within the last 12 hours —
    so a switch flicked twice cannot message every customer twice."""
    from notifications import send_email, _wrap, SITE_URL, log_message
    from web_push import new_campaign, send_to_all

    now = datetime.utcnow()
    if closed_at and (now - closed_at) < timedelta(minutes=REOPEN_MIN_CLOSED_MINUTES):
        await log_message("push", "everyone", "marketing", f"skipped: kitchen was closed for under {REOPEN_MIN_CLOSED_MINUTES} minutes", "Kitchen reopened")
        return
    settings = await db.settings.find_one({"_id": SETTINGS_ID}, {"_id": 0, "last_reopen_broadcast_at": 1}) or {}
    last = settings.get("last_reopen_broadcast_at")
    if last and (now - datetime.fromisoformat(last)) < timedelta(hours=REOPEN_QUIET_HOURS):
        await log_message("push", "everyone", "marketing", f"skipped: everyone was told within the last {REOPEN_QUIET_HOURS} hours", "Kitchen reopened")
        return
    await db.settings.update_one({"_id": SETTINGS_ID}, {"$set": {"last_reopen_broadcast_at": now.isoformat()}}, upsert=True)

    title = "We're open! 🍛"
    body = "The kitchen is cooking again — order now for today's fresh Andhra meals."

    try:
        campaign = new_campaign(title, body, "/order", None)
        campaign["source"] = "kitchen_reopen"
        stats = await send_to_all(campaign)
        campaign.update(status="sent", sent_at=datetime.utcnow().isoformat(), stats={**campaign["stats"], **stats})
        await db.push_campaigns.insert_one(campaign)
        logger.info("Kitchen reopen push: %s", stats)
    except Exception as e:
        logger.warning("Kitchen reopen push failed: %s", e)

    subs = await db.reopen_subs.find({}, {"_id": 0}).to_list(length=2000)
    for sub in subs:
        greeting = f"Hi {sub['name']}," if sub.get("name") else "Hi,"
        html = _wrap(
            title,
            f"<p>{greeting}</p><p>You asked us to let you know when the kitchen reopened &mdash; "
            "we're back and taking orders now.</p>"
            "<p>Fresh, authentic Andhra food, cooked to order in Milton Keynes.</p>",
            "Order now", f"{SITE_URL}/order",
        )
        send_email(sub["email"], "We're open again — order today 🍛", html, kind="marketing")
    if subs:
        await db.reopen_subs.delete_many({})
        logger.info("Kitchen reopen emails queued: %d", len(subs))


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
    before = await get_slot_settings()
    was_paused = bool(before.get("paused"))
    if updates.get("paused") is True and not was_paused:
        updates["paused_at"] = datetime.utcnow().isoformat()        # so a reopening knows how long the kitchen was closed
    await db.settings.update_one({"_id": SETTINGS_ID}, {"$set": updates}, upsert=True)
    settings = await get_slot_settings()
    settings.pop("_id", None)
    changed = {k: v for k, v in updates.items() if k not in ("updated_at", "updated_by", "paused_at")}
    words = "paused ordering" if changed.get("paused") is True else "resumed ordering" if changed.get("paused") is False         else "switched delivery on" if changed.get("delivery_enabled") is True else "switched delivery off" if changed.get("delivery_enabled") is False         else "changed ordering settings"
    await record_admin_action(admin, words, "ordering settings", {k: before.get(k) for k in changed}, changed)
    # Closed → open transition: tell everyone who's waiting
    if was_paused and updates.get("paused") is False:
        closed_at = None
        try:
            closed_at = datetime.fromisoformat(before["paused_at"]) if before.get("paused_at") else None
        except (TypeError, ValueError):
            pass
        asyncio.create_task(broadcast_kitchen_reopened(closed_at))
    return settings
