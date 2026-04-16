"""
Admin endpoints for Dabba Wala subscription management.
All routes require admin role.
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from datetime import datetime, timedelta
from database import db
from models import (
    WeeklyMenuDay, WeeklyMenuDayCreate, WeeklyMenuPublish,
    WeeklyMenuNotes, WeeklyMenuTemplate,
)
from auth import require_admin
from notifications import (
    send_email, send_sms, notify_admin,
    email_subscription_cancelled, email_renewal_reminder, email_delivery_issue,
)
import uuid

router = APIRouter(prefix="/admin", tags=["admin-dabba-wala"])


# ─── helpers ──────────────────────────────────────────────────────────────────

def today_str():
    return datetime.utcnow().strftime("%Y-%m-%d")


def audit_entry(admin: dict, field: str, old, new, reason: str = None):
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "admin_id": admin["sub"],
        "admin_name": admin.get("name", "Admin"),
        "action": "field_updated",
        "field": field,
        "old_value": old,
        "new_value": new,
        "reason": reason,
    }


# ─── Weekly Menu ──────────────────────────────────────────────────────────────

@router.post("/menu")
async def upsert_menu_day(
    payload: WeeklyMenuDayCreate,
    current_user: dict = Depends(require_admin),
):
    """Create or update a single day's menu entry."""
    existing = await db.weekly_menu_days.find_one(
        {"date": payload.date, "box_type": payload.box_type}, {"_id": 0}
    )
    if existing:
        await db.weekly_menu_days.update_one(
            {"date": payload.date, "box_type": payload.box_type},
            {"$set": {**payload.model_dump(), "updated_at": datetime.utcnow()}}
        )
        return {**existing, **payload.model_dump()}
    else:
        doc = WeeklyMenuDay(**payload.model_dump())
        await db.weekly_menu_days.insert_one(doc.model_dump())
        return doc


@router.post("/menu/publish")
async def publish_week(
    payload: WeeklyMenuPublish,
    current_user: dict = Depends(require_admin),
):
    """Publish all draft entries for a given week."""
    try:
        week_start = datetime.strptime(payload.week_start, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid week format")

    dates = [(week_start + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(5)]
    result = await db.weekly_menu_days.update_many(
        {"date": {"$in": dates}, "status": "draft"},
        {"$set": {"status": "published", "updated_at": datetime.utcnow()}}
    )
    return {"published": result.modified_count}


@router.get("/menu/templates")
async def get_templates(current_user: dict = Depends(require_admin)):
    templates = await db.weekly_menu_templates.find({}, {"_id": 0}).to_list(50)
    return templates


@router.post("/menu/templates")
async def save_template(
    payload: WeeklyMenuTemplate,
    current_user: dict = Depends(require_admin),
):
    try:
        week_start = datetime.strptime(payload.week_start, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid week format")

    dates = [(week_start + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(5)]
    days = await db.weekly_menu_days.find(
        {"date": {"$in": dates}}, {"_id": 0}
    ).to_list(10)

    doc = {
        "id": str(uuid.uuid4()),
        "name": payload.name,
        "week_start": payload.week_start,
        "days": days,
        "created_at": datetime.utcnow().isoformat(),
    }
    await db.weekly_menu_templates.insert_one(doc)
    return doc


@router.post("/menu/notes")
async def save_menu_notes(
    payload: WeeklyMenuNotes,
    current_user: dict = Depends(require_admin),
):
    await db.weekly_menu_notes.update_one(
        {"week_start": payload.week_start},
        {"$set": {"notes": payload.notes, "week_start": payload.week_start, "updated_at": datetime.utcnow().isoformat()}},
        upsert=True,
    )
    return {"ok": True}


# ─── Subscription management (PATCH endpoints) ────────────────────────────────

async def _get_sub_or_404(sub_id: str):
    doc = await db.subscriptions.find_one({"id": sub_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return doc


@router.patch("/subscriptions/{sub_id}/preferences")
async def update_preferences(sub_id: str, payload: dict, current_user: dict = Depends(require_admin)):
    doc = await _get_sub_or_404(sub_id)
    old = doc.get("preferences", [])
    new = payload.get("preferences", [])
    entry = audit_entry(current_user, "preferences", old, new)
    await db.subscriptions.update_one(
        {"id": sub_id},
        {"$set": {"preferences": new}, "$push": {"audit_trail": entry}}
    )
    return {"ok": True}


@router.patch("/subscriptions/{sub_id}/custom-request")
async def update_custom_request(sub_id: str, payload: dict, current_user: dict = Depends(require_admin)):
    doc = await _get_sub_or_404(sub_id)
    old = doc.get("custom_request")
    new = payload.get("custom_request", "")
    entry = audit_entry(current_user, "custom_request", old, new)
    await db.subscriptions.update_one(
        {"id": sub_id},
        {"$set": {"custom_request": new}, "$push": {"audit_trail": entry}}
    )
    return {"ok": True}


@router.patch("/subscriptions/{sub_id}/address")
async def update_address(sub_id: str, payload: dict, current_user: dict = Depends(require_admin)):
    doc = await _get_sub_or_404(sub_id)
    old = doc.get("delivery_address")
    new = payload.get("delivery_address", {})
    entry = audit_entry(current_user, "delivery_address", old, new)
    await db.subscriptions.update_one(
        {"id": sub_id},
        {"$set": {"delivery_address": new}, "$push": {"audit_trail": entry}}
    )
    return {"ok": True}


@router.patch("/subscriptions/{sub_id}/delivery-instruction")
async def update_delivery_instruction(sub_id: str, payload: dict, current_user: dict = Depends(require_admin)):
    doc = await _get_sub_or_404(sub_id)
    old = doc.get("delivery_instruction")
    new = payload.get("delivery_instruction", "door")
    entry = audit_entry(current_user, "delivery_instruction", old, new)
    await db.subscriptions.update_one(
        {"id": sub_id},
        {"$set": {"delivery_instruction": new}, "$push": {"audit_trail": entry}}
    )
    return {"ok": True}


@router.patch("/subscriptions/{sub_id}/box-type")
async def update_box_type(sub_id: str, payload: dict, current_user: dict = Depends(require_admin)):
    doc = await _get_sub_or_404(sub_id)
    old = doc.get("box_type")
    new = payload.get("box_type", old)
    entry = audit_entry(current_user, "box_type", old, new)
    await db.subscriptions.update_one(
        {"id": sub_id},
        {"$set": {"box_type": new}, "$push": {"audit_trail": entry}}
    )
    return {"ok": True}


@router.patch("/subscriptions/{sub_id}/plan")
async def update_plan(sub_id: str, payload: dict, current_user: dict = Depends(require_admin)):
    doc = await _get_sub_or_404(sub_id)
    old_plan = doc.get("plan")
    new_plan = payload.get("plan", old_plan)
    new_price = payload.get("price", doc.get("price", 0))
    entry = audit_entry(current_user, "plan", old_plan, new_plan, payload.get("reason"))
    await db.subscriptions.update_one(
        {"id": sub_id},
        {"$set": {"plan": new_plan, "price": new_price}, "$push": {"audit_trail": entry}}
    )
    return {"ok": True}


@router.patch("/subscriptions/{sub_id}/end-date")
async def update_end_date(sub_id: str, payload: dict, current_user: dict = Depends(require_admin)):
    doc = await _get_sub_or_404(sub_id)
    old = doc.get("end_date")
    new = payload.get("end_date")
    entry = audit_entry(current_user, "end_date", old, new, payload.get("reason"))
    await db.subscriptions.update_one(
        {"id": sub_id},
        {"$set": {"end_date": new}, "$push": {"audit_trail": entry}}
    )
    return {"ok": True}


@router.patch("/subscriptions/{sub_id}/status")
async def force_update_status(sub_id: str, payload: dict, current_user: dict = Depends(require_admin)):
    doc = await _get_sub_or_404(sub_id)
    old = doc.get("status")
    new = payload.get("status")
    entry = audit_entry(current_user, "status", old, new, payload.get("reason"))
    entry["forced_by_admin"] = payload.get("forced_by_admin", False)
    await db.subscriptions.update_one(
        {"id": sub_id},
        {"$set": {"status": new}, "$push": {"audit_trail": entry}}
    )
    if old != new and new == "cancelled":
        name = doc.get("customer_name") or "there"
        if doc.get("customer_email"):
            subj, html = email_subscription_cancelled(name, doc)
            send_email(doc["customer_email"], subj, html)
    return {"ok": True}


@router.post("/subscriptions/{sub_id}/notes")
async def add_internal_note(sub_id: str, payload: dict, current_user: dict = Depends(require_admin)):
    await _get_sub_or_404(sub_id)
    note = {
        "id": str(uuid.uuid4()),
        "text": payload.get("text", ""),
        "admin_name": current_user.get("name", "Admin"),
        "created_at": datetime.utcnow().isoformat(),
    }
    await db.subscriptions.update_one(
        {"id": sub_id},
        {"$push": {"internal_notes": note}}
    )
    return note


@router.post("/subscriptions/{sub_id}/send-renewal-reminder")
async def send_renewal_reminder(sub_id: str, current_user: dict = Depends(require_admin)):
    doc = await _get_sub_or_404(sub_id)
    name = doc.get("customer_name") or "there"
    sent = False
    if doc.get("customer_email"):
        subj, html = email_renewal_reminder(name, doc)
        send_email(doc["customer_email"], subj, html)
        sent = True
    if doc.get("customer_phone"):
        send_sms(
            doc["customer_phone"],
            f"Sree Svadista Prasada: your Dabba Wala ends {doc.get('end_date','soon')}. Renew at sreesvadistaprasada.com/dabbawala",
        )
        sent = True
    entry = audit_entry(current_user, "renewal_reminder_sent", None, datetime.utcnow().isoformat())
    await db.subscriptions.update_one({"id": sub_id}, {"$push": {"audit_trail": entry}})
    return {"ok": True, "sent": sent}


@router.get("/subscriptions/{sub_id}/history")
async def get_subscriber_history(sub_id: str, current_user: dict = Depends(require_admin)):
    doc = await _get_sub_or_404(sub_id)
    user_id = doc.get("user_id")
    if not user_id:
        return []
    history = await db.subscriptions.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return history


# ─── Operations ───────────────────────────────────────────────────────────────

@router.get("/dabba-wala/alerts")
async def get_alerts(current_user: dict = Depends(require_admin)):
    alerts = []
    today = today_str()
    tomorrow = (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d")
    in_3_days = (datetime.utcnow() + timedelta(days=3)).strftime("%Y-%m-%d")

    # New subscriptions starting today or tomorrow
    new_subs = await db.subscriptions.find(
        {"start_date": {"$in": [today, tomorrow]}, "status": "active"},
        {"_id": 0, "id": 1, "customer_name": 1, "start_date": 1, "box_type": 1}
    ).to_list(50)
    for s in new_subs:
        alerts.append({
            "type": "red",
            "message": f"New subscription starts {s['start_date']} — kitchen must be informed",
            "subscriber_name": s["customer_name"],
            "subscriber_id": s["id"],
        })

    # Ending within 3 days without renewal
    ending = await db.subscriptions.find(
        {"end_date": {"$lte": in_3_days, "$gte": today}, "status": "active"},
        {"_id": 0, "id": 1, "customer_name": 1, "end_date": 1}
    ).to_list(50)
    for s in ending:
        alerts.append({
            "type": "amber",
            "message": f"Subscription ends {s['end_date']} — no renewal yet",
            "subscriber_name": s["customer_name"],
            "subscriber_id": s["id"],
        })

    return alerts


@router.get("/dabba-wala/deliveries/today")
async def get_todays_deliveries(current_user: dict = Depends(require_admin)):
    today = today_str()
    # Active subscriptions whose date range includes today (weekday only)
    if datetime.utcnow().weekday() >= 5:  # Saturday/Sunday
        return []

    subs = await db.subscriptions.find(
        {"status": "active", "start_date": {"$lte": today}, "end_date": {"$gte": today}},
        {"_id": 0}
    ).to_list(200)

    deliveries = []
    for i, s in enumerate(subs):
        # Fetch today's menu for this box type
        menu_doc = await db.weekly_menu_days.find_one(
            {"date": today, "box_type": s["box_type"], "status": "published"},
            {"_id": 0}
        )
        delivery_id = f"{s['id']}_{today}"
        tracking = await db.delivery_tracking.find_one(
            {"delivery_id": delivery_id}, {"_id": 0}
        )
        deliveries.append({
            "delivery_id": delivery_id,
            "sub_id": s["id"],
            "seq": i + 1,
            "name": s["customer_name"].split()[0] if s.get("customer_name") else "—",
            "full_name": s.get("customer_name", ""),
            "box_type": s.get("box_type", "prasada"),
            "preferences": s.get("preferences", []),
            "custom_request": s.get("custom_request"),
            "address": s.get("delivery_address", {}),
            "delivery_instruction": s.get("delivery_instruction", "door"),
            "neighbour_name": s.get("neighbour_name"),
            "neighbour_door": s.get("neighbour_door"),
            "safe_place_description": s.get("safe_place_description"),
            "menu": menu_doc,
            "status": (tracking or {}).get("status", "confirmed"),
        })

    return deliveries


@router.patch("/dabba-wala/deliveries/{delivery_id}/status")
async def update_delivery_status(delivery_id: str, payload: dict, current_user: dict = Depends(require_admin)):
    # delivery_id format: {sub_id}_{date}
    new_status = payload.get("status", "delivered")
    await db.delivery_tracking.update_one(
        {"delivery_id": delivery_id},
        {"$set": {"status": new_status, "updated_at": datetime.utcnow().isoformat()}},
        upsert=True,
    )
    try:
        sub_id, date = delivery_id.rsplit("_", 1)
    except ValueError:
        sub_id, date = None, None

    if sub_id and date:
        sub = await db.subscriptions.find_one({"id": sub_id}, {"_id": 0})
        if sub and sub.get("customer_phone"):
            sms_copy = {
                "out_for_delivery": f"Sree Svadista Prasada: your Dabba Wala box for {date} is on the way. Please keep your phone handy.",
                "delivered": f"Sree Svadista Prasada: your Dabba Wala box for {date} has been delivered — enjoy! Rate today's meal on your dashboard.",
            }.get(new_status)
            if sms_copy:
                send_sms(sub["customer_phone"], sms_copy)
        if new_status == "delivered" and sub:
            menu_doc = await db.weekly_menu_days.find_one(
                {"date": date, "box_type": sub.get("box_type", "prasada")}, {"_id": 0}
            )
            from routes.reviews import ensure_meal_day_review_stub
            await ensure_meal_day_review_stub(sub, date, menu_doc)
    return {"ok": True}


@router.post("/dabba-wala/deliveries/{delivery_id}/issue")
async def flag_delivery_issue(delivery_id: str, payload: dict, current_user: dict = Depends(require_admin)):
    description = payload.get("description", "")
    await db.delivery_tracking.update_one(
        {"delivery_id": delivery_id},
        {"$set": {
            "status": "issue",
            "issue_description": description,
            "updated_at": datetime.utcnow().isoformat()
        }},
        upsert=True,
    )
    try:
        sub_id, date = delivery_id.rsplit("_", 1)
    except ValueError:
        sub_id, date = None, None
    if sub_id and date:
        sub = await db.subscriptions.find_one({"id": sub_id}, {"_id": 0})
        if sub:
            name = sub.get("customer_name") or "there"
            if sub.get("customer_email"):
                subj, html = email_delivery_issue(name, date, description)
                send_email(sub["customer_email"], subj, html)
            notify_admin(
                f"Delivery issue flagged · {name} · {date}",
                f"<p><b>{name}</b> ({sub.get('customer_email','—')}) — delivery {delivery_id}:</p>"
                f"<p>{description or '(no description)'}</p>",
            )
    return {"ok": True}


@router.post("/dabba-wala/deliveries/{date}/route-order")
async def save_route_order(date: str, payload: dict, current_user: dict = Depends(require_admin)):
    await db.delivery_routes.update_one(
        {"date": date},
        {"$set": {"order": payload.get("order", []), "updated_at": datetime.utcnow().isoformat()}},
        upsert=True,
    )
    return {"ok": True}


@router.get("/dabba-wala/subscribers/counts")
async def get_subscriber_counts(current_user: dict = Depends(require_admin)):
    today = today_str()
    in_7 = (datetime.utcnow() + timedelta(days=7)).strftime("%Y-%m-%d")

    total    = await db.subscriptions.count_documents({})
    active   = await db.subscriptions.count_documents({"status": "active", "end_date": {"$gte": today}})
    ending   = await db.subscriptions.count_documents({"status": "active", "end_date": {"$gte": today, "$lte": in_7}})
    expired  = await db.subscriptions.count_documents({"status": "expired"})
    cancelled = await db.subscriptions.count_documents({"status": "cancelled"})

    return {
        "all": total,
        "active": active,
        "ending_soon": ending,
        "expired": expired,
        "cancelled": cancelled,
    }


# ─── Analytics ────────────────────────────────────────────────────────────────

@router.get("/dabba-wala/analytics/summary")
async def get_analytics_summary(current_user: dict = Depends(require_admin)):
    today = today_str()
    month_ago = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")

    active = await db.subscriptions.count_documents({"status": "active", "end_date": {"$gte": today}})
    total = await db.subscriptions.count_documents({})

    # MRR: sum of active subscription prices
    pipeline = [{"$match": {"status": "active"}}, {"$group": {"_id": None, "total": {"$sum": "$price"}}}]
    mrr_result = await db.subscriptions.aggregate(pipeline).to_list(1)
    mrr = mrr_result[0]["total"] if mrr_result else 0.0

    # Meals this month (5 meals per weekly sub, 20 per monthly)
    recent_subs = await db.subscriptions.find(
        {"created_at": {"$gte": datetime.strptime(month_ago, "%Y-%m-%d")}},
        {"plan": 1}
    ).to_list(200)
    meals_this_month = sum(5 if s.get("plan") == "weekly" else 20 for s in recent_subs)

    # Churn: cancelled in last 30 days / total that month
    cancelled_recent = await db.subscriptions.count_documents({
        "status": "cancelled",
        "created_at": {"$gte": datetime.strptime(month_ago, "%Y-%m-%d")}
    })
    churn_pct = round((cancelled_recent / max(total, 1)) * 100, 1)

    return {
        "active_subscribers": active,
        "monthly_revenue": round(mrr, 2),
        "meals_this_month": meals_this_month,
        "churn_rate": churn_pct,
    }


@router.get("/dabba-wala/analytics/churn")
async def get_churn(current_user: dict = Depends(require_admin)):
    month_ago = datetime.utcnow() - timedelta(days=30)
    subs = await db.subscriptions.find(
        {"status": "cancelled", "created_at": {"$gte": month_ago}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return subs


@router.get("/dabba-wala/analytics/ending-soon")
async def get_ending_soon(current_user: dict = Depends(require_admin)):
    today = today_str()
    in_30 = (datetime.utcnow() + timedelta(days=30)).strftime("%Y-%m-%d")
    subs = await db.subscriptions.find(
        {"status": "active", "end_date": {"$gte": today, "$lte": in_30}},
        {"_id": 0}
    ).sort("end_date", 1).to_list(100)
    return subs
