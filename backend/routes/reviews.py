"""
Post-delivery review prompts.

Three types of delivery reviews:
  - "order"         – one per delivered takeaway order
  - "meal_day"      – one per delivered Dabba Wala meal (quick rating)
  - "week_summary"  – one per subscription week (detailed review)

Stubs are created by hooks in orders / admin_dabba_wala when a delivery
flips to "delivered" and surfaced to the customer on their dashboard.
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from database import db
from auth import get_current_user
import uuid
import logging

router = APIRouter(prefix="/reviews", tags=["reviews"])
logger = logging.getLogger(__name__)


# ── Models ───────────────────────────────────────────────────────────────────

class ReviewSubmit(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    text: Optional[str] = None
    favourite_item_ids: Optional[List[str]] = None  # meal_day / week_summary


# ── Helpers ──────────────────────────────────────────────────────────────────

async def _ensure_stub(
    *,
    user_id: str,
    review_type: str,
    ref_id: str,
    sub_id: Optional[str] = None,
    order_id: Optional[str] = None,
    meal_date: Optional[str] = None,
    week_start: Optional[str] = None,
    menu_item_ids: Optional[List[str]] = None,
    menu_item_names: Optional[List[str]] = None,
):
    """Idempotently create a pending review stub."""
    existing = await db.delivery_reviews.find_one(
        {"user_id": user_id, "type": review_type, "ref_id": ref_id}, {"_id": 0}
    )
    if existing:
        return existing
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": review_type,
        "ref_id": ref_id,
        "sub_id": sub_id,
        "order_id": order_id,
        "meal_date": meal_date,
        "week_start": week_start,
        "menu_item_ids": menu_item_ids or [],
        "menu_item_names": menu_item_names or [],
        "status": "pending",
        "rating": None,
        "text": None,
        "favourite_item_ids": [],
        "created_at": datetime.utcnow().isoformat(),
        "submitted_at": None,
        "reminder_sent_at": None,
    }
    await db.delivery_reviews.insert_one(doc)
    doc.pop("_id", None)
    return doc


async def ensure_order_review_stub(order: dict):
    """Called when an order transitions to 'delivered'."""
    user_id = order.get("user_id")
    if not user_id:
        return
    items = order.get("items", [])
    await _ensure_stub(
        user_id=user_id,
        review_type="order",
        ref_id=order["id"],
        order_id=order["id"],
        menu_item_ids=[i.get("menu_item_id") or i.get("id") for i in items if i],
        menu_item_names=[i.get("name") for i in items if i and i.get("name")],
    )
    # Log SMS reminder (actual dispatch is a TODO – see send_sms_reminder).
    await _schedule_sms_reminder(user_id, "order", order["id"])


async def ensure_meal_day_review_stub(sub: dict, date: str, menu_doc: Optional[dict]):
    """Called when a Dabba Wala meal_day delivery is marked 'delivered'."""
    user_id = sub.get("user_id")
    if not user_id:
        return
    ref_id = f"{sub['id']}_{date}"
    item_names: List[str] = []
    item_ids: List[str] = []
    if menu_doc:
        for m in menu_doc.get("meals", []) or []:
            if isinstance(m, dict):
                if m.get("id"): item_ids.append(m["id"])
                if m.get("name"): item_names.append(m["name"])
            elif isinstance(m, str):
                item_names.append(m)
    await _ensure_stub(
        user_id=user_id,
        review_type="meal_day",
        ref_id=ref_id,
        sub_id=sub["id"],
        meal_date=date,
        menu_item_ids=item_ids,
        menu_item_names=item_names,
    )
    # If this delivery falls on the last weekday of the sub week, also stub a week summary.
    try:
        d = datetime.strptime(date, "%Y-%m-%d")
        if d.weekday() == 4:  # Friday
            week_start = (d - timedelta(days=4)).strftime("%Y-%m-%d")
            await _ensure_stub(
                user_id=user_id,
                review_type="week_summary",
                ref_id=f"{sub['id']}_{week_start}",
                sub_id=sub["id"],
                week_start=week_start,
            )
    except ValueError:
        pass
    await _schedule_sms_reminder(user_id, "meal_day", ref_id)


async def _schedule_sms_reminder(user_id: str, review_type: str, ref_id: str):
    """Record that an SMS reminder should go out. Real dispatch left as integration
    point (e.g. Twilio / WhatsApp Business). For now we log + stamp the review."""
    user = await db.users.find_one({"id": user_id}, {"phone": 1, "name": 1})
    phone = (user or {}).get("phone")
    now = datetime.utcnow().isoformat()
    await db.delivery_reviews.update_one(
        {"user_id": user_id, "type": review_type, "ref_id": ref_id},
        {"$set": {"reminder_sent_at": now}},
    )
    if phone:
        logger.info(
            "SMS reminder queued: to=%s type=%s ref=%s  — 'How was your meal? Leave a quick rating at /dashboard.'",
            phone, review_type, ref_id,
        )
    # TODO: wire Twilio or WhatsApp Business API here.


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/pending")
async def list_pending(current_user: dict = Depends(get_current_user)):
    items = await db.delivery_reviews.find(
        {"user_id": current_user["sub"], "status": "pending"},
        {"_id": 0},
    ).sort("created_at", -1).to_list(200)
    return items


@router.get("/mine")
async def list_mine(current_user: dict = Depends(get_current_user)):
    items = await db.delivery_reviews.find(
        {"user_id": current_user["sub"]},
        {"_id": 0},
    ).sort("created_at", -1).to_list(500)
    return items


@router.post("/{review_id}/submit")
async def submit_review(
    review_id: str, payload: ReviewSubmit, current_user: dict = Depends(get_current_user)
):
    doc = await db.delivery_reviews.find_one({"id": review_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Review not found")
    if doc.get("user_id") != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Not yours")
    if doc.get("status") == "submitted":
        raise HTTPException(status_code=400, detail="Already submitted")

    now = datetime.utcnow().isoformat()
    await db.delivery_reviews.update_one(
        {"id": review_id},
        {"$set": {
            "rating": payload.rating,
            "text": payload.text,
            "favourite_item_ids": payload.favourite_item_ids or [],
            "status": "submitted",
            "submitted_at": now,
        }},
    )

    # Fan out favourite items to the per-item reviews collection so the rating
    # shows up on the item page alongside organic reviews. Only for ratings ≥ 4.
    if payload.rating >= 4 and payload.favourite_item_ids:
        user = await db.users.find_one({"id": current_user["sub"]}, {"name": 1})
        user_name = (user or {}).get("name", "Customer")
        for item_id in payload.favourite_item_ids:
            already = await db.reviews.find_one({"menu_item_id": item_id, "user_id": current_user["sub"]})
            if already:
                continue
            await db.reviews.insert_one({
                "id": str(uuid.uuid4()),
                "menu_item_id": item_id,
                "user_id": current_user["sub"],
                "user_name": user_name,
                "rating": payload.rating,
                "comment": payload.text or "",
                "created_at": now,
            })

    return {"ok": True}


@router.post("/{review_id}/dismiss")
async def dismiss_review(review_id: str, current_user: dict = Depends(get_current_user)):
    doc = await db.delivery_reviews.find_one({"id": review_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Review not found")
    if doc.get("user_id") != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Not yours")
    await db.delivery_reviews.update_one(
        {"id": review_id}, {"$set": {"status": "dismissed"}}
    )
    return {"ok": True}
