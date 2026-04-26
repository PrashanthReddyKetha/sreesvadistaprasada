from fastapi import APIRouter, Depends, HTTPException
import math
from datetime import datetime
from database import db
from auth import get_current_user

router = APIRouter(prefix="/loyalty", tags=["loyalty"])


def _serialize(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


def _build_journey(orders: list, order_count: int, pending_reward: bool, rewards_redeemed: int) -> list:
    journey = []
    order_index = 0
    slot_number = 1
    complete_cycles = order_count // 5

    for cycle in range(complete_cycles):
        for i in range(5):
            if order_index < len(orders):
                o = orders[order_index]
                journey.append({
                    "number": slot_number,
                    "type": "order",
                    "status": "completed",
                    "order_id": o.get("id"),
                    "date": (o.get("updated_at") or o.get("created_at")),
                })
                order_index += 1
            else:
                journey.append({"number": slot_number, "type": "order", "status": "completed"})
            slot_number += 1

        cycles_done = cycle + 1
        is_redeemed = cycles_done <= rewards_redeemed
        is_ready = (not is_redeemed) and pending_reward and (cycles_done == complete_cycles)
        journey.append({
            "number": "FREE",
            "type": "reward",
            "status": "redeemed" if is_redeemed else ("ready" if is_ready else "locked"),
            "cycle": cycles_done,
        })

    if not pending_reward:
        current_position = order_count % 5
        for i in range(current_position):
            if order_index < len(orders):
                o = orders[order_index]
                journey.append({
                    "number": slot_number,
                    "type": "order",
                    "status": "completed",
                    "order_id": o.get("id"),
                    "date": (o.get("updated_at") or o.get("created_at")),
                })
                order_index += 1
            else:
                journey.append({"number": slot_number, "type": "order", "status": "completed"})
            slot_number += 1

        remaining = 5 - current_position
        for i in range(remaining):
            journey.append({
                "number": slot_number,
                "type": "order",
                "status": "current" if i == 0 and order_count > 0 else "upcoming",
                "is_next_milestone": slot_number % 5 == 0,
            })
            slot_number += 1

        journey.append({"number": "FREE", "type": "reward", "status": "locked"})

    return journey


@router.get("/status")
async def get_loyalty_status(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(404, "User not found")

    order_count = user.get("loyalty_order_count", 0)
    pending_reward = user.get("loyalty_pending_reward", False)
    rewards_earned = user.get("loyalty_rewards_earned", 0)
    rewards_redeemed = user.get("loyalty_rewards_redeemed", 0)

    position = order_count % 5
    orders_until_next = 0 if pending_reward else ((5 - position) if position > 0 else 5)
    next_milestone = math.ceil((order_count + 1) / 5) * 5
    cycle = (order_count // 5) + (0 if pending_reward else 1)

    qualifying_orders = await db.orders.find(
        {
            "user_id": current_user["sub"],
            "is_loyalty_qualifying": True,
            "status": {"$in": ["delivered", "completed", "collected"]},
        },
        {"_id": 0},
        sort=[("loyalty_order_number", 1)],
    ).to_list(length=None)

    journey = _build_journey(qualifying_orders, order_count, pending_reward, rewards_redeemed)

    return {
        "order_count": order_count,
        "position": position,
        "cycle": cycle,
        "next_milestone": next_milestone,
        "orders_until_next": orders_until_next,
        "pending_reward": pending_reward,
        "rewards_earned": rewards_earned,
        "rewards_redeemed": rewards_redeemed,
        "journey": journey,
    }


@router.post("/redeem")
async def redeem_loyalty_reward(body: dict, current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(404, "User not found")
    if not user.get("loyalty_pending_reward", False):
        raise HTTPException(400, "No loyalty reward available")

    free_item_id = body.get("free_item_id")
    if not free_item_id:
        raise HTTPException(400, "free_item_id is required")

    free_item = await db.menu.find_one({"id": free_item_id, "available": True}, {"_id": 0})
    if not free_item:
        raise HTTPException(404, "Item not available")

    return {
        "valid": True,
        "free_item": {
            "id": free_item["id"],
            "name": free_item["name"],
            "original_price": free_item["price"],
            "charged_price": 0.0,
        },
    }


@router.get("/history")
async def get_loyalty_history(current_user: dict = Depends(get_current_user)):
    orders = await db.orders.find(
        {"user_id": current_user["sub"], "is_loyalty_qualifying": True},
        {"_id": 0},
        sort=[("loyalty_order_number", 1)],
    ).to_list(length=None)
    return orders
