from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from datetime import datetime
import math
from database import db
from models import Order, OrderCreate, OrderStatusUpdate, OrderStatus
from auth import get_current_user, get_optional_user, require_admin
from notifications import (
    send_email, send_sms, notify_admin,
    email_order_confirmation, email_order_status,
    create_notification,
)

router = APIRouter(prefix="/orders", tags=["orders"])

DELIVERY_FEE = 3.99
MIN_ORDER = 15.0


# ── Pricing ───────────────────────────────────────────────────────────────────

def _calculate_totals(
    items: list,
    delivery_type: str,
    is_loyalty_redemption: bool,
    free_item_original_price: float,
    postcode: str,
) -> dict:
    subtotal = round(sum(i.price * i.quantity for i in items), 2)

    free_item_discount = 0.0
    if is_loyalty_redemption and free_item_original_price > 0:
        free_item_discount = round(free_item_original_price, 2)

    subtotal_after_free = round(subtotal - free_item_discount, 2)

    takeaway_discount = 0.0
    if delivery_type == "takeaway" and subtotal_after_free >= MIN_ORDER:
        takeaway_discount = round(subtotal_after_free * 0.10, 2)

    food_total = round(subtotal_after_free - takeaway_discount, 2)

    if delivery_type == "takeaway":
        delivery_fee = 0.0
    elif subtotal >= 30:
        delivery_fee = 0.0
    else:
        delivery_fee = DELIVERY_FEE

    grand_total = round(food_total + delivery_fee, 2)

    return {
        "subtotal": subtotal,
        "free_item_discount": free_item_discount,
        "takeaway_discount": takeaway_discount,
        "delivery_fee": delivery_fee,
        "total": grand_total,
    }


# ── Loyalty engine ────────────────────────────────────────────────────────────

async def _update_loyalty_on_completion(user_id: str, order_id: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        return

    new_count = user.get("loyalty_order_count", 0) + 1
    position = new_count % 5

    update_data = {
        "loyalty_order_count": new_count,
        "loyalty_last_updated": datetime.utcnow().isoformat(),
    }

    # Tag order with its sequence number
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"loyalty_order_number": new_count}},
    )

    name = user.get("name", "there")
    next_milestone = math.ceil((new_count + 1) / 5) * 5

    if position == 0:
        # Full cycle complete — unlock reward
        new_rewards = user.get("loyalty_rewards_earned", 0) + 1
        update_data["loyalty_rewards_earned"] = new_rewards
        update_data["loyalty_pending_reward"] = True
        await create_notification(
            user_id=user_id,
            title="🎁 Free dish earned! Claim it on your next order",
            body=(
                f"You've completed {new_count} orders — your free dish is ready. "
                "Choose any item from our entire menu. No minimum order. Only the delivery fee."
            ),
            notif_type="loyalty_reward",
            action_url="/dashboard?tab=loyalty",
        )

    elif position == 1 and new_count == 1:
        # Very first order
        await create_notification(
            user_id=user_id,
            title="Order 1 of 5 — your loyalty journey has started!",
            body=(
                "Every 5 orders earns you a free dish from our entire menu. "
                "4 more to go. Track your progress in the Loyalty tab."
            ),
            notif_type="loyalty_progress",
            action_url="/dashboard?tab=loyalty",
        )

    elif position == 1 and new_count > 5:
        # New cycle started after claiming
        await create_notification(
            user_id=user_id,
            title="New cycle started — 4 more orders to your next free dish",
            body=(
                "You've claimed your reward and started a new cycle. "
                "4 more completed orders and you earn another free dish."
            ),
            notif_type="loyalty_progress",
            action_url="/dashboard?tab=loyalty",
        )

    elif position == 3:
        await create_notification(
            user_id=user_id,
            title="Halfway there! 2 more orders for a free dish",
            body=(
                f"You've completed 3 out of 5 orders. Just 2 more and you'll earn "
                f"a free dish from our entire menu. Any item. No minimum order. "
                f"Your reward is at order {next_milestone}."
            ),
            notif_type="loyalty_progress",
            action_url="/dashboard?tab=loyalty",
        )

    elif position == 4:
        await create_notification(
            user_id=user_id,
            title="Just 1 more order for your free dish!",
            body=(
                "You are one order away from earning a free dish — "
                "any item from our entire menu, completely free. "
                f"No minimum order. Only the delivery fee. "
                f"Your reward unlocks at order {next_milestone}."
            ),
            notif_type="loyalty_progress",
            action_url="/dashboard?tab=loyalty",
        )

    await db.users.update_one({"id": user_id}, {"$set": update_data})


# ── Create order ───────────────────────────────────────────────────────────────

@router.post("", response_model=Order)
async def create_order(
    payload: OrderCreate,
    current_user: Optional[dict] = Depends(get_optional_user),
):
    user_id = current_user["sub"] if current_user else payload.user_id

    # Validate minimum order
    subtotal = round(sum(i.price * i.quantity for i in payload.items), 2)
    if subtotal < MIN_ORDER:
        raise HTTPException(400, f"Minimum order is £{MIN_ORDER:.0f}")

    # Validate loyalty redemption
    if payload.is_loyalty_redemption:
        if not user_id:
            raise HTTPException(400, "Must be logged in to redeem a loyalty reward")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user or not user.get("loyalty_pending_reward"):
            raise HTTPException(400, "No loyalty reward available")
        if payload.loyalty_free_item_id:
            item = await db.menu.find_one({"id": payload.loyalty_free_item_id, "available": True})
            if not item:
                raise HTTPException(404, "Free item not available")

    totals = _calculate_totals(
        items=payload.items,
        delivery_type=payload.delivery_type,
        is_loyalty_redemption=payload.is_loyalty_redemption,
        free_item_original_price=payload.loyalty_free_item_original_price,
        postcode=payload.delivery_address.postcode,
    )

    # Redemption orders don't count toward loyalty
    is_qualifying = not payload.is_loyalty_redemption

    order = Order(
        **payload.model_dump(exclude={"user_id"}),
        subtotal=totals["subtotal"],
        delivery_fee=totals["delivery_fee"],
        takeaway_discount=totals["takeaway_discount"],
        free_item_discount=totals["free_item_discount"],
        total=totals["total"],
        user_id=user_id,
        is_loyalty_qualifying=is_qualifying,
    )
    await db.orders.insert_one(order.model_dump())

    # If redeeming, clear pending reward and increment redeemed counter
    if payload.is_loyalty_redemption and user_id:
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        redeemed = user.get("loyalty_rewards_redeemed", 0) + 1
        await db.users.update_one(
            {"id": user_id},
            {"$set": {
                "loyalty_pending_reward": False,
                "loyalty_rewards_redeemed": redeemed,
                "loyalty_last_updated": datetime.utcnow().isoformat(),
            }},
        )

    subj, html = email_order_confirmation(order.model_dump(), payload.customer_name)
    send_email(payload.customer_email, subj, html)
    short_id = order.id[:8].upper()
    send_sms(
        payload.customer_phone,
        f"Sree Svadista Prasada: order #{short_id} received — £{order.total:.2f}. We'll text you when it's on the way.",
    )
    notify_admin(
        f"New order · £{order.total:.2f} · {payload.customer_name}",
        f"<p>New order <b>#{short_id}</b> from {payload.customer_name} "
        f"({payload.customer_email} · {payload.customer_phone}).</p>"
        f"<p>Total <b>£{order.total:.2f}</b> — open the admin dashboard to confirm.</p>",
    )
    return order


# ── Get orders ────────────────────────────────────────────────────────────────

@router.get("", response_model=List[Order])
async def get_orders(
    status: Optional[OrderStatus] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    query = {}
    if current_user.get("role") != "admin":
        query["user_id"] = current_user["sub"]
    if status:
        query["status"] = status.value

    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return orders


@router.get("/{order_id}", response_model=Order)
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")

    if current_user.get("role") != "admin" and doc.get("user_id") != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Access denied")

    return doc


# ── Update order status ───────────────────────────────────────────────────────

@router.put("/{order_id}/status", response_model=Order)
async def update_order_status(
    order_id: str,
    payload: OrderStatusUpdate,
    _: dict = Depends(require_admin),
):
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": payload.status.value, "updated_at": datetime.utcnow().isoformat()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")

    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if doc:
        name = doc.get("customer_name") or "Customer"
        subj, html = email_order_status(doc, name, payload.status.value)
        if doc.get("customer_email"):
            send_email(doc["customer_email"], subj, html)
        sms_copy = {
            "confirmed": f"Order #{order_id[:8].upper()} confirmed. We'll start prepping shortly.",
            "preparing": f"Order #{order_id[:8].upper()} is being prepared now.",
            "out_for_delivery": f"Order #{order_id[:8].upper()} is on the way. Please keep your phone handy.",
            "delivered": f"Order #{order_id[:8].upper()} delivered — enjoy! Rate it on your dashboard.",
            "cancelled": f"Order #{order_id[:8].upper()} was cancelled. Reply to your confirmation email if this is wrong.",
        }.get(payload.status.value)
        if sms_copy and doc.get("customer_phone"):
            send_sms(doc["customer_phone"], f"Sree Svadista Prasada: {sms_copy}")
        if payload.status.value == "delivered":
            from routes.reviews import ensure_order_review_stub
            await ensure_order_review_stub(doc)

        # Trigger loyalty update for qualifying completed orders
        if payload.status.value == "delivered" and doc.get("is_loyalty_qualifying", True):
            user_id = doc.get("user_id")
            if user_id:
                await _update_loyalty_on_completion(user_id=user_id, order_id=order_id)

    return doc


# ── Cancel order ──────────────────────────────────────────────────────────────

@router.delete("/{order_id}")
async def cancel_order(order_id: str, current_user: dict = Depends(get_current_user)):
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")

    if current_user.get("role") != "admin" and doc.get("user_id") != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Access denied")

    if doc["status"] not in ("pending", "confirmed"):
        raise HTTPException(status_code=400, detail="Order cannot be cancelled at this stage")

    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": OrderStatus.cancelled.value, "updated_at": datetime.utcnow().isoformat()}},
    )
    return {"message": "Order cancelled"}
