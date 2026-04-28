from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from datetime import datetime
import math
import re
from database import db
from models import Order, OrderCreate, OrderStatusUpdate, OrderStatus
from auth import get_current_user, get_optional_user, require_admin
from notifications import (
    send_email, send_sms, notify_admin,
    email_order_confirmation, email_order_status,
    create_notification,
)

router = APIRouter(prefix="/orders", tags=["orders"])

# ── Zone-based delivery pricing ───────────────────────────────────────────────

POSTCODE_ZONES = {
    # Zone 1 — 0 to 2 miles from MK12 6LF
    "MK12": 1, "MK11": 1, "MK13": 1, "MK8": 1, "MK19": 1,
    # Zone 2 — 2 to 5 miles
    "MK9": 2, "MK14": 2, "MK16": 2, "MK5": 2, "MK6": 2,
    # Zone 3 — 5 to 8 miles
    "MK4": 3, "MK7": 3, "MK10": 3, "MK15": 3, "MK3": 3, "MK2": 3,
    # Zone 4 — 8 to 12 miles
    "MK1": 4, "MK17": 4, "MK18": 4,
}

ZONE_DELIVERY_FEE = {1: 2.49, 2: 2.99, 3: 3.99, 4: 4.99}
ZONE_FREE_DELIVERY_THRESHOLD = {1: 28.00, 2: 30.00, 3: 35.00, 4: 40.00}

MINIMUM_ORDER         = 15.00
SMALL_ORDER_FEE       = 1.50
SMALL_ORDER_THRESHOLD = 19.99   # small order fee applies if subtotal <= this
TAKEAWAY_DISCOUNT_PCT = 0.10


# ── Pricing helpers ───────────────────────────────────────────────────────────

def get_zone_from_postcode(postcode: str) -> Optional[int]:
    """Returns zone 1-4 for MK postcodes, None if outside delivery area."""
    if not postcode:
        return None
    clean = postcode.upper().replace(" ", "")
    # UK inward code is always 3 chars (digit+letter+letter).
    # Strip it to isolate the outward (district) — prevents "MK89BX" matching "MK89".
    outward = clean[:-3] if len(clean) >= 5 else clean
    match = re.match(r'^(MK\d{1,2})$', outward)
    if match:
        return POSTCODE_ZONES.get(match.group(1))
    return None


def calculate_order_total(
    items: list,           # list of dicts: {"price": float, "quantity": int}
    order_type: str,       # "delivery" | "takeaway"
    postcode: str = "",
    free_item_price: float = 0.0,
) -> dict:
    """
    Single source of truth for all order pricing.
    Always called server-side — never trust the client total.
    items must be plain dicts with 'price' and 'quantity' keys.
    """
    # 1. Gross subtotal (free item included at full price in items list)
    subtotal = round(sum(i["price"] * i["quantity"] for i in items), 2)

    # 2. Minimum order check on gross subtotal
    if subtotal < MINIMUM_ORDER:
        raise ValueError(
            f"Minimum order is £{MINIMUM_ORDER:.2f}. "
            f"Your basket is £{subtotal:.2f}."
        )

    # 3. Loyalty free item discount
    free_item_discount = round(free_item_price, 2) if free_item_price > 0 else 0.0
    subtotal_after_free = round(subtotal - free_item_discount, 2)

    if order_type == "takeaway":
        small_order_fee   = 0.0
        delivery_fee      = 0.0
        free_delivery_at  = None
        zone              = None
        takeaway_discount = round(subtotal_after_free * TAKEAWAY_DISCOUNT_PCT, 2)

    elif order_type == "delivery":
        # Small order fee — delivery only, on subtotal after free item
        if MINIMUM_ORDER <= subtotal_after_free <= SMALL_ORDER_THRESHOLD:
            small_order_fee = SMALL_ORDER_FEE
        else:
            small_order_fee = 0.0

        zone = get_zone_from_postcode(postcode)
        if zone is None:
            raise ValueError(
                "We don't deliver to this postcode yet. "
                "Please choose Collect or enter a valid MK postcode."
            )

        free_delivery_at = ZONE_FREE_DELIVERY_THRESHOLD[zone]
        delivery_fee = 0.0 if subtotal_after_free >= free_delivery_at else ZONE_DELIVERY_FEE[zone]
        takeaway_discount = 0.0

    else:
        raise ValueError("order_type must be 'delivery' or 'takeaway'")

    grand_total = round(
        subtotal_after_free + small_order_fee + delivery_fee - takeaway_discount, 2
    )

    return {
        "subtotal":          subtotal,
        "free_item_discount": free_item_discount,
        "small_order_fee":   small_order_fee,
        "delivery_fee":      delivery_fee,
        "takeaway_discount": takeaway_discount,
        "grand_total":       grand_total,
        "order_type":        order_type,
        "zone":              zone,
        "free_delivery_at":  free_delivery_at,
        "postcode":          postcode.upper() if postcode else None,
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


# ── Pricing endpoints ─────────────────────────────────────────────────────────

@router.get("/check-postcode")
async def check_delivery_postcode(postcode: str):
    """Zone lookup — no auth. Called by CartDrawer and checkout on postcode entry."""
    zone = get_zone_from_postcode(postcode)
    if zone is None:
        return {
            "deliverable": False,
            "postcode": postcode.upper(),
            "message": "We don't deliver here yet. You can still collect — choose Takeaway.",
        }
    return {
        "deliverable": True,
        "postcode": postcode.upper(),
        "zone": zone,
        "delivery_fee": ZONE_DELIVERY_FEE[zone],
        "free_delivery_over": ZONE_FREE_DELIVERY_THRESHOLD[zone],
        "minimum_order": MINIMUM_ORDER,
        "small_order_threshold": SMALL_ORDER_THRESHOLD,
        "small_order_fee": SMALL_ORDER_FEE,
    }


@router.post("/calculate")
async def preview_calculate(body: dict):
    """
    Live pricing preview — no auth. Called on every cart/postcode/type change.
    Does NOT create an order or charge anything.
    """
    try:
        result = calculate_order_total(
            items=body.get("items", []),
            order_type=body.get("order_type", "delivery"),
            postcode=body.get("postcode", ""),
            free_item_price=float(body.get("free_item_price", 0.0)),
        )
        return {"ok": True, **result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Create order ───────────────────────────────────────────────────────────────

@router.post("", response_model=Order)
async def create_order(
    payload: OrderCreate,
    current_user: Optional[dict] = Depends(get_optional_user),
):
    user_id = current_user["sub"] if current_user else payload.user_id

    # Validate loyalty redemption before pricing
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

    # Server-side pricing — never trust the client total
    items_data = [{"price": i.price, "quantity": i.quantity} for i in payload.items]
    try:
        totals = calculate_order_total(
            items=items_data,
            order_type=payload.delivery_type,
            postcode=payload.delivery_address.postcode if payload.delivery_address else "",
            free_item_price=payload.loyalty_free_item_original_price,
        )
    except ValueError as e:
        raise HTTPException(400, detail=str(e))

    # Redemption orders don't count toward loyalty
    is_qualifying = not payload.is_loyalty_redemption

    order = Order(
        **payload.model_dump(exclude={"user_id"}),
        subtotal=totals["subtotal"],
        small_order_fee=totals["small_order_fee"],
        delivery_fee=totals["delivery_fee"],
        takeaway_discount=totals["takeaway_discount"],
        free_item_discount=totals["free_item_discount"],
        total=totals["grand_total"],
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
