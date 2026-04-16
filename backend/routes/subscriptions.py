from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from datetime import datetime, timedelta
from database import db
from models import Subscription, SubscriptionCreate, SubscriptionStatusUpdate, SubscriptionStatus
from auth import get_current_user, get_optional_user, require_admin
from notifications import (
    send_email, send_sms, notify_admin,
    email_subscription_confirmation, email_delivery_skipped,
    email_subscription_cancelled, email_subscription_expired,
)

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

PLAN_PRICES = {
    "weekly":  45.0,
    "monthly": 160.0,
}

PLAN_DAYS = {
    "weekly":  4,   # Mon + 4 = Fri
    "monthly": 27,  # Mon + 27 = 4th Friday
}


@router.post("", response_model=Subscription)
async def create_subscription(
    payload: SubscriptionCreate,
    current_user: Optional[dict] = Depends(get_optional_user),
):
    price = PLAN_PRICES.get(payload.plan.lower(), 45.0)
    days  = PLAN_DAYS.get(payload.plan.lower(), 4)
    user_id = current_user["sub"] if current_user else payload.user_id

    # Calculate end_date and cancellation window
    try:
        start = datetime.strptime(payload.start_date, "%Y-%m-%d")
        end   = start + timedelta(days=days)
        end_date_str = end.strftime("%Y-%m-%d")
    except Exception:
        end_date_str = None

    cancellation_window = (datetime.utcnow() + timedelta(hours=48)).isoformat()

    subscription = Subscription(
        **payload.model_dump(exclude={'user_id'}),
        price=price,
        user_id=user_id,
        end_date=end_date_str,
        cancellation_window_expires=cancellation_window,
    )
    await db.subscriptions.insert_one(subscription.model_dump())
    subj, html = email_subscription_confirmation(subscription.model_dump(), payload.customer_name)
    send_email(payload.customer_email, subj, html)
    send_sms(
        payload.customer_phone,
        f"Sree Svadista Prasada: your {payload.plan} Dabba Wala subscription is confirmed. Starts {payload.start_date}.",
    )
    notify_admin(
        f"New subscription · {payload.plan} · {payload.customer_name}",
        f"<p>{payload.customer_name} ({payload.customer_email}) started a <b>{payload.plan}</b> "
        f"{payload.box_type} plan from {payload.start_date}.</p>",
    )
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

    # Auto-expire subscriptions whose end_date has passed
    today = datetime.utcnow().strftime("%Y-%m-%d")
    for s in subs:
        if s.get("status") == "active" and s.get("end_date") and s["end_date"] < today:
            s["status"] = "expired"
            update = {"status": "expired"}
            if not s.get("expired_notified_at"):
                update["expired_notified_at"] = datetime.utcnow().isoformat()
                if s.get("customer_email"):
                    subj, html = email_subscription_expired(s.get("customer_name") or "there", s)
                    send_email(s["customer_email"], subj, html)
            await db.subscriptions.update_one({"id": s["id"]}, {"$set": update})

    return subs


@router.get("/{sub_id}", response_model=Subscription)
async def get_subscription(sub_id: str, current_user: dict = Depends(get_current_user)):
    doc = await db.subscriptions.find_one({"id": sub_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Subscription not found")

    if current_user.get("role") != "admin" and doc.get("user_id") != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Access denied")

    return doc


@router.get("/{sub_id}/deliveries")
async def get_sub_deliveries(sub_id: str, current_user: dict = Depends(get_current_user)):
    """Return per-day delivery statuses for a subscription's active week range."""
    sub = await db.subscriptions.find_one({"id": sub_id}, {"_id": 0})
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    if current_user.get("role") != "admin" and sub.get("user_id") != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Access denied")

    start = datetime.strptime(sub["start_date"], "%Y-%m-%d")
    end = datetime.strptime(sub["end_date"], "%Y-%m-%d") if sub.get("end_date") else start + timedelta(days=4)

    # Build weekday-only date list
    dates = []
    d = start
    while d <= end:
        if d.weekday() < 5:
            dates.append(d.strftime("%Y-%m-%d"))
        d += timedelta(days=1)

    tracking = {
        t["delivery_id"]: t
        async for t in db.delivery_tracking.find({"delivery_id": {"$in": [f"{sub_id}_{dt}" for dt in dates]}}, {"_id": 0})
    }

    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    from routes.reviews import ensure_meal_day_review_stub
    result = []
    for dt in dates:
        t = tracking.get(f"{sub_id}_{dt}")
        status = (t or {}).get("status")
        if not status:
            status = "upcoming" if dt >= today_str else "delivered"
        result.append({
            "date": dt,
            "status": status,
            "skipped_at": (t or {}).get("skipped_at"),
            "issue_description": (t or {}).get("issue_description"),
        })
        # Any delivered past meal should have a review stub — catches days that
        # were auto-marked delivered without an admin patch.
        if status == "delivered" and sub.get("user_id"):
            menu_doc = await db.weekly_menu_days.find_one(
                {"date": dt, "box_type": sub.get("box_type", "prasada")}, {"_id": 0}
            )
            await ensure_meal_day_review_stub(sub, dt, menu_doc)
    return result


@router.post("/{sub_id}/deliveries/{date}/skip")
async def skip_delivery(sub_id: str, date: str, current_user: dict = Depends(get_current_user)):
    """Customer marks a specific day as skipped."""
    sub = await db.subscriptions.find_one({"id": sub_id}, {"_id": 0})
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    if current_user.get("role") != "admin" and sub.get("user_id") != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        delivery_day = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date")

    now = datetime.utcnow()
    hours_until = (delivery_day.replace(hour=12) - now).total_seconds() / 3600
    if hours_until < 0:
        raise HTTPException(status_code=400, detail="Cannot skip a past delivery")

    short_notice = hours_until < 12
    await db.delivery_tracking.update_one(
        {"delivery_id": f"{sub_id}_{date}"},
        {"$set": {
            "delivery_id": f"{sub_id}_{date}",
            "sub_id": sub_id,
            "status": "skipped",
            "skipped_at": now.isoformat(),
            "short_notice": short_notice,
            "updated_at": now.isoformat(),
        }},
        upsert=True,
    )

    name = sub.get("customer_name") or "there"
    if sub.get("customer_email"):
        subj, html = email_delivery_skipped(name, date, short_notice)
        send_email(sub["customer_email"], subj, html)
    if sub.get("customer_phone"):
        send_sms(
            sub["customer_phone"],
            f"Sree Svadista Prasada: your Dabba Wala on {date} is skipped. Plan resumes after that day.",
        )
    if short_notice:
        notify_admin(
            f"Short-notice skip · {name} · {date}",
            f"<p><b>{name}</b> ({sub.get('customer_email','—')}) skipped <b>{date}</b> "
            f"with less than 12 hours notice. Kitchen may have already started prep.</p>",
        )
    return {"ok": True, "short_notice": short_notice}


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

    old_status = doc.get("status")
    new_status = payload.status.value
    await db.subscriptions.update_one(
        {"id": sub_id}, {"$set": {"status": new_status}}
    )
    doc["status"] = new_status

    if old_status != new_status and new_status == "cancelled":
        name = doc.get("customer_name") or "there"
        if doc.get("customer_email"):
            subj, html = email_subscription_cancelled(name, doc)
            send_email(doc["customer_email"], subj, html)
        notify_admin(
            f"Subscription cancelled · {name}",
            f"<p><b>{name}</b> ({doc.get('customer_email','—')}) cancelled their "
            f"<b>{doc.get('plan','')}</b> plan.</p>",
        )
    return doc
