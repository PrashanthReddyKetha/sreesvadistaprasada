from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from database import db
from auth import require_admin, get_current_user
from notifications import create_notification

router = APIRouter(prefix="/admin/loyalty", tags=["admin-loyalty"])


@router.get("/stats")
async def loyalty_stats(_: dict = Depends(require_admin)):
    pipeline_earned = [
        {"$group": {"_id": None, "total": {"$sum": "$loyalty_rewards_earned"}}},
    ]
    pipeline_redeemed = [
        {"$group": {"_id": None, "total": {"$sum": "$loyalty_rewards_redeemed"}}},
    ]
    pipeline_pending = [
        {"$match": {"loyalty_pending_reward": True}},
        {"$count": "count"},
    ]
    pipeline_almost = [
        {"$project": {"pos": {"$mod": ["$loyalty_order_count", 5]}, "loyalty_pending_reward": 1}},
        {"$match": {"pos": 4, "loyalty_pending_reward": False}},
        {"$count": "count"},
    ]
    pipeline_participants = [
        {"$match": {"loyalty_order_count": {"$gt": 0}}},
        {"$count": "count"},
    ]
    pipeline_total_users = [{"$count": "count"}]

    earned_r = await db.users.aggregate(pipeline_earned).to_list(1)
    redeemed_r = await db.users.aggregate(pipeline_redeemed).to_list(1)
    pending_r = await db.users.aggregate(pipeline_pending).to_list(1)
    almost_r = await db.users.aggregate(pipeline_almost).to_list(1)
    participants_r = await db.users.aggregate(pipeline_participants).to_list(1)
    total_users_r = await db.users.aggregate(pipeline_total_users).to_list(1)

    total_users = total_users_r[0]["count"] if total_users_r else 0
    participants = participants_r[0]["count"] if participants_r else 0

    return {
        "total_rewards_earned": earned_r[0]["total"] if earned_r else 0,
        "total_rewards_redeemed": redeemed_r[0]["total"] if redeemed_r else 0,
        "pending_count": pending_r[0]["count"] if pending_r else 0,
        "almost_there_count": almost_r[0]["count"] if almost_r else 0,
        "participation_rate": round(participants / total_users * 100, 1) if total_users else 0,
    }


@router.get("/pending")
async def loyalty_pending(_: dict = Depends(require_admin)):
    users = await db.users.find(
        {"loyalty_pending_reward": True},
        {"_id": 0, "id": 1, "name": 1, "email": 1, "phone": 1,
         "loyalty_order_count": 1, "loyalty_rewards_earned": 1,
         "loyalty_rewards_redeemed": 1, "loyalty_last_updated": 1},
    ).sort("loyalty_last_updated", -1).to_list(200)
    return users


@router.get("/upcoming")
async def loyalty_upcoming(_: dict = Depends(require_admin)):
    """Users who are 1 order away from a reward (position == 4)."""
    all_users = await db.users.find(
        {"loyalty_pending_reward": False, "loyalty_order_count": {"$gt": 0}},
        {"_id": 0, "id": 1, "name": 1, "email": 1, "phone": 1,
         "loyalty_order_count": 1, "loyalty_last_updated": 1},
    ).to_list(1000)
    return [u for u in all_users if u.get("loyalty_order_count", 0) % 5 == 4]


@router.get("/user/{user_id}")
async def loyalty_user_history(user_id: str, _: dict = Depends(require_admin)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(404, "User not found")
    orders = await db.orders.find(
        {"user_id": user_id, "is_loyalty_qualifying": True},
        {"_id": 0},
        sort=[("loyalty_order_number", 1)],
    ).to_list(None)
    return {"user": user, "qualifying_orders": orders}


@router.post("/adjust")
async def loyalty_adjust(body: dict, admin: dict = Depends(require_admin)):
    user_id = body.get("user_id")
    action = body.get("action")
    reason = body.get("reason", "").strip()

    if not user_id or not action:
        raise HTTPException(400, "user_id and action are required")
    if not reason:
        raise HTTPException(400, "reason is required for audit trail")
    if action not in ("add_order", "grant_reward", "remove_reward"):
        raise HTTPException(400, "Invalid action")

    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(404, "User not found")

    update = {}
    notif_title = notif_body = None

    if action == "add_order":
        new_count = user.get("loyalty_order_count", 0) + 1
        update["loyalty_order_count"] = new_count
        if new_count % 5 == 0:
            update["loyalty_rewards_earned"] = user.get("loyalty_rewards_earned", 0) + 1
            update["loyalty_pending_reward"] = True
            notif_title = "🎁 Free dish earned!"
            notif_body = "Your loyalty count was updated by the team. Your free dish is ready to claim."

    elif action == "grant_reward":
        update["loyalty_pending_reward"] = True
        update["loyalty_rewards_earned"] = user.get("loyalty_rewards_earned", 0) + 1
        notif_title = "🎁 Free dish granted!"
        notif_body = "Our team has granted you a free dish reward. Choose any item on your next order."

    elif action == "remove_reward":
        update["loyalty_pending_reward"] = False

    update["loyalty_last_updated"] = datetime.utcnow().isoformat()
    await db.users.update_one({"id": user_id}, {"$set": update})

    # Audit log stored on user doc
    audit_entry = {
        "action": action,
        "reason": reason,
        "admin_id": admin["sub"],
        "timestamp": datetime.utcnow().isoformat(),
        "before": {
            "loyalty_order_count": user.get("loyalty_order_count", 0),
            "loyalty_pending_reward": user.get("loyalty_pending_reward", False),
            "loyalty_rewards_earned": user.get("loyalty_rewards_earned", 0),
        },
    }
    await db.users.update_one({"id": user_id}, {"$push": {"loyalty_audit": audit_entry}})

    if notif_title:
        await create_notification(
            user_id=user_id,
            title=notif_title,
            body=notif_body,
            notif_type="loyalty_reward",
            action_url="/dashboard?tab=loyalty",
        )

    return {"ok": True}
