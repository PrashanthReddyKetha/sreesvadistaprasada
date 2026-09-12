from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from datetime import datetime, timedelta
import asyncio
import math
import os
import re
import stripe
from pydantic import BaseModel, Field
from pymongo import ReturnDocument
from database import db

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
from models import Order, OrderCreate, OrderStatusUpdate, OrderStatus
from auth import get_current_user, get_optional_user, require_admin
from notifications import (
    send_email, send_sms, notify_admin,
    email_order_confirmation, email_order_status,
    create_notification, send_push_notification,
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

# ── Valid status transitions ──────────────────────────────────────────────────
ALLOWED_TRANSITIONS = {
    "pending":          {"confirmed", "cancelled"},
    "confirmed":        {"preparing", "cancelled"},
    "preparing":        {"ready", "out_for_delivery", "cancelled"},
    "ready":            {"out_for_delivery", "delivered", "cancelled"},
    "out_for_delivery": {"delivered", "cancelled"},
    "delivered":        set(),
    "cancelled":        set(),
}


# ── Short order numbers ───────────────────────────────────────────────────────

async def next_order_number() -> str:
    """Atomic global counter → SP1001, SP1002, ..."""
    doc = await db.counters.find_one_and_update(
        {"_id": "order_number"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return f"SP{1000 + doc['seq']}"


def display_order_number(order: dict) -> str:
    """Customer-facing order number; legacy orders fall back to the id prefix."""
    return order.get("order_number") or order["id"][:8].upper()


def slot_label(slot_iso: Optional[str]) -> Optional[str]:
    """'2026-09-07T18:15' → '6:15 pm'."""
    if not slot_iso or len(slot_iso) < 16:
        return None
    try:
        hh, mm = int(slot_iso[11:13]), slot_iso[14:16]
    except ValueError:
        return None
    return f"{hh % 12 or 12}:{mm} {'am' if hh < 12 else 'pm'}"


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
                "Sorry, your postcode is outside our current delivery area. "
                "We deliver across Milton Keynes — or you're welcome to collect from our Greenleys kitchen."
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


class OrderCalculateItem(BaseModel):
    menu_item_id: str
    quantity: int = Field(default=1, ge=1, le=50)

class OrderCalculateRequest(BaseModel):
    items: List[OrderCalculateItem] = []
    order_type: str = "delivery"
    postcode: str = ""
    free_item_id: Optional[str] = None
    scheduled_slot: Optional[str] = None  # takeaway collection slot, validated below


@router.post("/calculate")
async def preview_calculate(body: OrderCalculateRequest):
    """
    Live pricing preview — no auth. Called on every cart/postcode/type change.
    Looks up prices from DB so the resulting PaymentIntent total matches
    the server-verified total used at order creation.
    Does NOT create an order or charge anything.
    """
    from routes.pickup_slots import get_slot_settings, slot_in_grid, slot_remaining
    slot_settings = await get_slot_settings()
    if slot_settings.get("paused"):
        raise HTTPException(status_code=400, detail=(
            slot_settings.get("paused_message")
            or "We're not taking orders right now — please check back soon."
        ))

    from restock import is_sold_out_today, london_today
    items_data = []
    has_preorder = False
    for i in body.items:
        doc = await db.menu_items.find_one(
            {"id": i.menu_item_id},
            {"price": 1, "name": 1, "available": 1, "sold_out_until": 1, "preorder_only": 1, "_id": 0})
        if not doc or not doc.get("available") or is_sold_out_today(doc):
            name = (doc or {}).get("name") or "An item in your basket"
            raise HTTPException(status_code=404, detail=f"{name} has just sold out — please remove it from your basket to continue.")
        if doc.get("preorder_only"):
            has_preorder = True
        items_data.append({"price": float(doc["price"]), "quantity": i.quantity})

    # Pre-order items are made overnight: collection only, tomorrow's slots only
    if has_preorder:
        if body.order_type != "takeaway":
            raise HTTPException(status_code=400, detail=(
                "Your basket includes a pre-order item (made fresh overnight) — "
                "please switch to collection and pick a slot for tomorrow."))
        if not body.scheduled_slot or body.scheduled_slot[:10] <= london_today():
            raise HTTPException(status_code=400, detail=(
                "Pre-order items are prepared the night before — "
                "please choose a collection slot for tomorrow."))

    if body.scheduled_slot and body.order_type == "takeaway":
        if not slot_in_grid(slot_settings, body.scheduled_slot):
            raise HTTPException(status_code=400, detail="That collection time has just passed — please pick another.")
        remaining = await slot_remaining(slot_settings, body.scheduled_slot)
        if remaining is not None and remaining <= 0:
            raise HTTPException(status_code=400, detail="That collection time has just filled up — please pick another.")

    free_item_price = 0.0
    if body.free_item_id:
        free_doc = await db.menu_items.find_one({"id": body.free_item_id, "available": True}, {"price": 1, "_id": 0})
        if free_doc:
            free_item_price = float(free_doc["price"])

    try:
        result = calculate_order_total(
            items=items_data,
            order_type=body.order_type,
            postcode=body.postcode,
            free_item_price=free_item_price,
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
    # Guest checkouts never get to pick whose account the order lands on —
    # only a verified JWT can attribute an order to a user.
    user_id = current_user["sub"] if current_user else None

    # Validate loyalty redemption before pricing
    free_item_price = 0.0
    if payload.is_loyalty_redemption:
        if not user_id:
            raise HTTPException(400, "Must be logged in to redeem a loyalty reward")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user or not user.get("loyalty_pending_reward"):
            raise HTTPException(400, "No loyalty reward available")
        if payload.loyalty_free_item_id:
            item = await db.menu_items.find_one({"id": payload.loyalty_free_item_id, "available": True}, {"_id": 0})
            if not item:
                raise HTTPException(404, "Free item not available")
            # Discount comes from the DB, never the client-supplied price
            free_item_price = float(item["price"])

    # Server-side pricing — look up each item price from the DB, never trust the client
    from restock import is_sold_out_today, london_today
    items_data = []
    has_preorder = False
    for i in payload.items:
        doc = await db.menu_items.find_one(
            {"id": i.menu_item_id, "available": True},
            {"price": 1, "sold_out_until": 1, "preorder_only": 1, "_id": 0})
        if not doc or is_sold_out_today(doc):
            raise HTTPException(404, detail=f"Item '{i.menu_item_id}' is not available")
        if doc.get("preorder_only"):
            has_preorder = True
        items_data.append({"price": float(doc["price"]), "quantity": i.quantity})

    if has_preorder and (
        payload.delivery_type != "takeaway"
        or not payload.scheduled_slot
        or payload.scheduled_slot[:10] <= london_today()
    ):
        raise HTTPException(400, "Pre-order items need a collection slot for tomorrow.")
    try:
        totals = calculate_order_total(
            items=items_data,
            order_type=payload.delivery_type,
            postcode=payload.delivery_address.postcode if payload.delivery_address else "",
            free_item_price=free_item_price,
        )
    except ValueError as e:
        raise HTTPException(400, detail=str(e))

    # Verify payment with Stripe before creating the order
    if not payload.payment_intent_id:
        raise HTTPException(400, "Payment is required to place an order")
    try:
        loop = asyncio.get_event_loop()
        pi = await loop.run_in_executor(None, lambda: stripe.PaymentIntent.retrieve(payload.payment_intent_id))
    except stripe.StripeError:
        raise HTTPException(400, "Invalid payment — please try again")
    if pi.status != "succeeded":
        raise HTTPException(400, "Payment was not completed — please try again")
    expected_pence = round(totals["grand_total"] * 100)
    if pi.amount != expected_pence:
        raise HTTPException(400, "Payment amount does not match order total")

    # Assign the collection slot. Payment has already succeeded, so a full or
    # passed slot must NEVER reject the order — bump forward, else fall back to ASAP.
    scheduled_final = None
    slot_was_bumped = False
    if payload.delivery_type == "takeaway" and payload.scheduled_slot:
        from routes.pickup_slots import get_slot_settings, slot_in_grid, try_reserve_slot, generate_slots, LONDON
        slot_settings = await get_slot_settings()
        now_ldn = datetime.now(LONDON)
        if slot_in_grid(slot_settings, payload.scheduled_slot, now_ldn) and await try_reserve_slot(slot_settings, payload.scheduled_slot):
            scheduled_final = payload.scheduled_slot
        else:
            for cand in generate_slots(slot_settings, now_ldn.date(), now_ldn):
                if cand["iso"] > payload.scheduled_slot and await try_reserve_slot(slot_settings, cand["iso"]):
                    scheduled_final = cand["iso"]
                    slot_was_bumped = True
                    break
            # No same-day slot left → ASAP (scheduled_final stays None)

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
    # Server-authoritative: assigned here, never accepted from the client
    order.order_number = await next_order_number()
    order.scheduled_slot_final = scheduled_final
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
    short_id = order.order_number
    if payload.delivery_type == "takeaway":
        when = f"Collect at {slot_label(scheduled_final)}." if scheduled_final else "We'll text you when it's ready to collect."
        if slot_was_bumped:
            when = f"Your requested time was full — new collection time {slot_label(scheduled_final)}."
        sms_body = f"Sree Svadista Prasada: order #{short_id} received — £{order.total:.2f}. {when}"
    else:
        sms_body = f"Sree Svadista Prasada: order #{short_id} received — £{order.total:.2f}. We'll text you when it's on the way."
    send_sms(payload.customer_phone, sms_body)
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

    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
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
    current_doc = await db.orders.find_one({"id": order_id}, {"_id": 0, "status": 1})
    if not current_doc:
        raise HTTPException(status_code=404, detail="Order not found")
    current_status = current_doc.get("status", "pending")
    allowed = ALLOWED_TRANSITIONS.get(current_status, set())
    if payload.status.value not in allowed:
        raise HTTPException(status_code=400, detail=f"Cannot move order from '{current_status}' to '{payload.status.value}'")
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
        disp = display_order_number(doc)
        is_takeaway = doc.get("delivery_type") == "takeaway"
        delivered_sms = (
            f"Order #{disp} collected — enjoy! Rate it on your dashboard."
            if is_takeaway else
            f"Order #{disp} delivered — enjoy! Rate it on your dashboard."
        )
        sms_copy = {
            "confirmed": f"Order #{disp} confirmed. We'll start prepping shortly.",
            "preparing": f"Order #{disp} is being prepared now.",
            "ready": f"Order #{disp} is READY for collection. See you soon!",
            "out_for_delivery": f"Order #{disp} is on the way. Please keep your phone handy.",
            "delivered": delivered_sms,
            "cancelled": f"Order #{disp} was cancelled. Reply to your confirmation email if this is wrong.",
        }.get(payload.status.value)
        if sms_copy and doc.get("customer_phone"):
            send_sms(doc["customer_phone"], f"Sree Svadista Prasada: {sms_copy}")
        if payload.status.value == "cancelled" and doc.get("scheduled_slot_final"):
            from routes.pickup_slots import release_slot
            await release_slot(doc["scheduled_slot_final"])
        if payload.status.value == "delivered":
            from routes.reviews import ensure_order_review_stub
            await ensure_order_review_stub(doc)

        # Trigger loyalty update for qualifying completed orders
        if payload.status.value == "delivered" and doc.get("is_loyalty_qualifying", True):
            user_id = doc.get("user_id")
            if user_id and not doc.get("loyalty_credited"):
                await db.orders.update_one({"id": order_id}, {"$set": {"loyalty_credited": True}})
                await _update_loyalty_on_completion(user_id=user_id, order_id=order_id)

        # In-app notification
        user_id = doc.get("user_id")
        if user_id:
            notif_titles = {
                "confirmed": "Order confirmed! 🎉",
                "preparing": "Chefs are cooking your order 🍳",
                "ready": "Ready for collection! 🛍️",
                "out_for_delivery": "Your order is on the way! 🛵",
                "delivered": "Order collected — enjoy! 🛍️" if is_takeaway else "Order delivered — enjoy! 🏠",
                "cancelled": "Order cancelled",
            }
            notif_bodies = {
                "confirmed": f"Order #{disp} confirmed. We'll start prepping shortly.",
                "preparing": f"Your order #{disp} is being prepared right now.",
                "ready": f"Order #{disp} is ready — come and collect it while it's hot!",
                "out_for_delivery": "Your order is heading to you. Should arrive in 10–15 mins.",
                "delivered": "Enjoy your meal! Please rate your experience in the dashboard.",
                "cancelled": f"Order #{disp} has been cancelled.",
            }
            if payload.status.value in notif_titles:
                await create_notification(
                    user_id=user_id,
                    title=notif_titles[payload.status.value],
                    body=notif_bodies[payload.status.value],
                    notif_type="order_status",
                    action_url="/dashboard?tab=orders",
                )
        # Push notification
        if user_id:
            user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "push_token": 1})
            push_token = user_doc.get("push_token") if user_doc else None
            if push_token:
                push_titles = {
                    "confirmed": "Order confirmed 🎉",
                    "preparing": "Chefs are cooking 🍳",
                    "ready": "Ready for collection! 🛍️",
                    "out_for_delivery": "On the way! 🛵",
                    "delivered": "Collected! 🛍️" if is_takeaway else "Delivered! 🏠",
                    "cancelled": "Order cancelled",
                }
                push_bodies = {
                    "confirmed": f"Order #{disp} confirmed. We'll start prepping shortly.",
                    "preparing": f"Your order #{disp} is being prepared right now.",
                    "ready": f"Order #{disp} is ready — come and collect it while it's hot!",
                    "out_for_delivery": "Your order is heading to you. Should arrive in 10–15 mins.",
                    "delivered": "Enjoy your meal!",
                    "cancelled": f"Order #{disp} has been cancelled.",
                }
                if payload.status.value in push_titles:
                    await send_push_notification(
                        push_token,
                        push_titles[payload.status.value],
                        push_bodies[payload.status.value],
                        data={"orderId": order_id, "status": payload.status.value},
                    )

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
    if doc.get("scheduled_slot_final"):
        from routes.pickup_slots import release_slot
        await release_slot(doc["scheduled_slot_final"])

    # Notify customer of self-cancellation
    cust_email = doc.get("customer_email")
    cust_phone = doc.get("customer_phone")
    cust_name  = doc.get("customer_name") or "Customer"
    short_id   = display_order_number(doc)
    if cust_email:
        send_email(
            cust_email,
            f"Order #{short_id} Cancelled",
            f"<p>Hi {cust_name},</p><p>Your order <b>#{short_id}</b> has been cancelled as requested.</p>"
            "<p>If you did not request this, please contact us immediately.</p>",
        )
    if cust_phone:
        send_sms(cust_phone, f"Sree Svadista Prasada: Order #{short_id} cancelled. Contact us if this was not you.")
    user_id = doc.get("user_id")
    if user_id:
        await create_notification(
            user_id=user_id,
            title="Order cancelled",
            body=f"Order #{short_id} has been cancelled.",
            notif_type="order_status",
            action_url="/dashboard?tab=orders",
        )
    return {"message": "Order cancelled"}
