from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from database import db
from models import Subscription, SubscriptionCreate, SubscriptionStatusUpdate, SubscriptionStatus
from auth import get_current_user, get_optional_user, require_admin

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

PLAN_PRICES = {
    "weekly": 45.0,
    "monthly": 160.0,
    "family": 280.0,
}


@router.post("", response_model=Subscription)
async def create_subscription(
    payload: SubscriptionCreate,
    current_user: Optional[dict] = Depends(get_optional_user),
):
    price = PLAN_PRICES.get(payload.plan.lower(), 0.0)
    user_id = current_user["sub"] if current_user else payload.user_id

    subscription = Subscription(
        **payload.model_dump(),
        price=price,
        user_id=user_id,
    )
    await db.subscriptions.insert_one(subscription.model_dump())
    return subscription


@router.get("", response_model=List[Subscription])
async def get_subscriptions(
    status: Optional[SubscriptionStatus] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    query = {}
    if current_user.get("role") != "admin":
        query["user_id"] = current_user["sub"]
    if status:
        query["status"] = status.value

    subs = await db.subscriptions.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return subs


@router.get("/{sub_id}", response_model=Subscription)
async def get_subscription(sub_id: str, current_user: dict = Depends(get_current_user)):
    doc = await db.subscriptions.find_one({"id": sub_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Subscription not found")

    if current_user.get("role") != "admin" and doc.get("user_id") != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Access denied")

    return doc


@router.put("/{sub_id}/status", response_model=Subscription)
async def update_subscription_status(
    sub_id: str,
    payload: SubscriptionStatusUpdate,
    current_user: dict = Depends(get_current_user),
):
    doc = await db.subscriptions.find_one({"id": sub_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Subscription not found")

    if current_user.get("role") != "admin" and doc.get("user_id") != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Access denied")

    await db.subscriptions.update_one(
        {"id": sub_id}, {"$set": {"status": payload.status.value}}
    )
    doc["status"] = payload.status.value
    return doc
