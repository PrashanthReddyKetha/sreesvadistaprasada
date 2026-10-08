from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from datetime import datetime, timedelta
import asyncio
import logging
import math
import os
import re
import stripe
from pydantic import BaseModel, Field
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError
from database import db
from security import esc

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
from models import Order, OrderCreate, OrderStatusUpdate, OrderStatus
from audit_log import record_admin_action
from auth import get_current_user, get_optional_user, require_admin
from notifications import (
    send_email, send_sms, notify_admin,
    email_order_confirmation, email_order_status,
    create_notification, send_push_notification,
)
from whatsapp import notify_customer, whatsapp_enabled, tracking_link, first_name
from coupons import resolve_coupon, redeem as redeem_coupon

router = APIRouter(prefix="/orders", tags=["orders"])
logger = logging.getLogger(__name__)

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
MIN_CARD_PAYMENT       = 0.50   # Stripe will not take a GBP card payment below this
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
        "coupon_code":       None,
        "coupon_discount":   0.0,
        "coupon":            None,
        "grand_total":       grand_total,
        "order_type":        order_type,
        "zone":              zone,
        "free_delivery_at":  free_delivery_at,
        "postcode":          postcode.upper() if postcode else None,
    }


async def price_with_coupon(
    items_data: list, order_type: str, postcode: str, free_item_price: float,
    coupon_code: Optional[str], user_id: Optional[str], email: Optional[str],
) -> tuple[dict, Optional[str]]:
    """
    calculate_order_total + coupon. Returns (totals, coupon_error). A refused
    coupon never blocks pricing — totals come back without it and the reason
    is returned for the UI. Percent/fixed codes discount the food (after any
    loyalty free dish); free-delivery codes zero the delivery fee.
    """
    totals = calculate_order_total(items_data, order_type, postcode, free_item_price)
    if not coupon_code:
        return totals, None
    without_coupon = dict(totals)
    food_pence = round((totals["subtotal"] - totals["free_item_discount"]) * 100)
    applied, err = await resolve_coupon(
        coupon_code, scope="orders", base_pence=food_pence,
        delivery_pence=round(totals["delivery_fee"] * 100),
        user_id=user_id, email=email, order_type=order_type,
        has_loyalty_item=free_item_price > 0,
    )
    if err or not applied:
        return totals, err
    if applied["discount_type"] == "free_delivery":
        totals["delivery_fee"] = 0.0
    totals["coupon_code"] = applied["code"]
    totals["coupon_discount"] = applied["discount"]
    totals["coupon"] = applied
    totals["grand_total"] = round(
        totals["subtotal"] - totals["free_item_discount"]
        - (0.0 if applied["discount_type"] == "free_delivery" else applied["discount"])
        + totals["small_order_fee"] + totals["delivery_fee"] - totals["takeaway_discount"], 2
    )
    if totals["grand_total"] < MIN_CARD_PAYMENT:
        return without_coupon, (
            f"That code would take your total below £{MIN_CARD_PAYMENT:.2f}, the smallest card payment "
            "we can take — add another item to use it."
        )
    return totals, None


# ── Loyalty engine ────────────────────────────────────────────────────────────

async def _update_loyalty_on_completion(user_id: str, order_id: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        return

    # Atomic: two orders completed at once each get their own number (audit A-0003, BE-003)
    bumped = await db.users.find_one_and_update(
        {"id": user_id}, {"$inc": {"loyalty_order_count": 1}}, return_document=ReturnDocument.AFTER,
    )
    new_count = (bumped or {}).get("loyalty_order_count") or user.get("loyalty_order_count", 0) + 1
    position = new_count % 5

    update_data = {"loyalty_last_updated": datetime.utcnow().isoformat()}

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

    if update_data:
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
    coupon_code: Optional[str] = None
    customer_email: Optional[str] = None  # lets per-customer coupon rules work for guests


@router.post("/calculate")
async def preview_calculate(body: OrderCalculateRequest, current_user: Optional[dict] = Depends(get_optional_user)):
    """
    Live pricing preview — no auth. Called on every cart/postcode/type change.
    Looks up prices from DB so the resulting PaymentIntent total matches
    the server-verified total used at order creation.
    Does NOT create an order or charge anything.
    """
    from routes.pickup_slots import get_slot_settings, slot_in_grid, slot_remaining, open_now, closed_message
    slot_settings = await get_slot_settings()
    if slot_settings.get("paused"):
        raise HTTPException(status_code=400, detail=(
            slot_settings.get("paused_message")
            or "We're not taking orders right now — please check back soon."
        ))
    if body.order_type == "delivery" and not slot_settings.get("delivery_enabled"):
        raise HTTPException(status_code=400, detail=(
            "Delivery isn't available right now — please choose collection."
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

    if body.order_type == "takeaway" and not body.scheduled_slot and body.items and not open_now(slot_settings):
        raise HTTPException(status_code=400, detail=closed_message(slot_settings))
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
            # The free dish is added at full price and then discounted in full —
            # exactly how create_order prices it — so both totals always agree.
            items_data.append({"price": free_item_price, "quantity": 1})

    try:
        result, coupon_error = await price_with_coupon(
            items_data, body.order_type, body.postcode, free_item_price,
            body.coupon_code, current_user["sub"] if current_user else None, body.customer_email,
        )
        return {"ok": True, **result, "coupon_error": coupon_error}
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

    # Same payment submitted twice (double click, retry after a timeout) —
    # hand back the order that already exists instead of failing.
    if payload.payment_intent_id:
        existing = await db.orders.find_one({"payment_intent_id": payload.payment_intent_id}, {"_id": 0})
        if existing:
            if existing.get("user_id") != user_id:
                raise HTTPException(400, "This payment has already been used")
            return Order(**existing)

    # Validate loyalty redemption before pricing
    free_item_price = 0.0
    if payload.is_loyalty_redemption and not payload.loyalty_free_item_id:
        # No dish chosen — an ordinary order; never burn the reward for nothing
        payload.is_loyalty_redemption = False
    if payload.is_loyalty_redemption:
        if payload.loyalty_free_item_id not in {i.menu_item_id for i in payload.items}:
            raise HTTPException(400, "Your free dish isn't in the order — please add it again")
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
            payload.loyalty_free_item_name = item.get("name") or payload.loyalty_free_item_name
            payload.loyalty_free_item_original_price = free_item_price

    # Server-side pricing — look up each item price from the DB, never trust the client
    from restock import is_sold_out_today, london_today
    items_data = []
    has_preorder = False
    for i in payload.items:
        doc = await db.menu_items.find_one(
            {"id": i.menu_item_id, "available": True},
            {"name": 1, "price": 1, "sold_out_until": 1, "preorder_only": 1, "_id": 0})
        if not doc or is_sold_out_today(doc):
            raise HTTPException(404, detail=f"Item '{i.menu_item_id}' is not available")
        if doc.get("preorder_only"):
            has_preorder = True
        items_data.append({"price": float(doc["price"]), "quantity": i.quantity})
        # The stored order line is what the kitchen cooks from — take it from the DB too
        i.name = doc.get("name") or i.name
        i.price = float(doc["price"])

    if has_preorder and (
        payload.delivery_type != "takeaway"
        or not payload.scheduled_slot
        or payload.scheduled_slot[:10] <= london_today()
    ):
        raise HTTPException(400, "Pre-order items need a collection slot for tomorrow.")
    try:
        totals, coupon_error = await price_with_coupon(
            items_data, payload.delivery_type,
            payload.delivery_address.postcode if payload.delivery_address else "",
            free_item_price, payload.coupon_code, user_id, payload.customer_email,
        )
    except ValueError as e:
        raise HTTPException(400, detail=str(e))
    if payload.coupon_code and coupon_error:
        # Code stopped being valid between preview and payment (e.g. last use taken).
        # If the customer paid the full price anyway the order goes through below;
        # otherwise the amount check fails and the UI shows the "charged but not
        # confirmed" message for a manual fix.
        logger.warning("Coupon %s refused at order creation: %s", payload.coupon_code, coupon_error)

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
    from routes.payments import intent_purpose
    if intent_purpose(pi) != "order":
        raise HTTPException(400, "This payment can't be used for an order")
    expected_pence = round(totals["grand_total"] * 100)
    if pi.amount != expected_pence:
        raise HTTPException(400, "Payment amount does not match order total")

    # Assign the collection slot. Payment has already succeeded, so a full or
    # passed slot must NEVER reject the order — bump forward, else fall back to ASAP.
    scheduled_final = None
    slot_was_bumped = False
    from routes.pickup_slots import get_slot_settings, slot_in_grid, try_reserve_slot, generate_slots, next_slots, open_now, LONDON
    slot_settings = await get_slot_settings()
    now_ldn = datetime.now(LONDON)
    # The customer has paid. If the kitchen closed (by hours or by the pause switch) between pricing and payment, the
    # order is still taken — moved to the next collection time where needed — and the owner is told (A-0003 COM-001/007).
    kitchen_note = None
    if slot_settings.get("paused"):
        kitchen_note = "paid while ordering was paused"
    if payload.delivery_type == "takeaway" and not payload.scheduled_slot and not open_now(slot_settings, now_ldn):
        for cand in next_slots(slot_settings, now_ldn, limit=12):
            if await try_reserve_slot(slot_settings, cand["iso"]):
                scheduled_final = cand["iso"]
                slot_was_bumped = True
                break
        kitchen_note = (kitchen_note + "; " if kitchen_note else "") + "paid outside opening hours"
    if payload.delivery_type != "takeaway":
        if not open_now(slot_settings, now_ldn):
            kitchen_note = (kitchen_note + "; " if kitchen_note else "") + "delivery paid outside opening hours"
        if not slot_settings.get("delivery_enabled"):
            kitchen_note = (kitchen_note + "; " if kitchen_note else "") + "delivery paid while delivery is switched off"
    if payload.delivery_type == "takeaway" and payload.scheduled_slot:
        if slot_in_grid(slot_settings, payload.scheduled_slot, now_ldn) and await try_reserve_slot(slot_settings, payload.scheduled_slot):
            scheduled_final = payload.scheduled_slot
        else:
            for cand in next_slots(slot_settings, now_ldn, limit=40):          # today first, then tomorrow (A-0003, COM-008)
                if cand["iso"] > payload.scheduled_slot and await try_reserve_slot(slot_settings, cand["iso"]):
                    scheduled_final = cand["iso"]
                    slot_was_bumped = True
                    break
            # Nothing bookable at all → ASAP (scheduled_final stays None)

    # Redemption orders don't count toward loyalty
    is_qualifying = not payload.is_loyalty_redemption

    order = Order(
        **payload.model_dump(exclude={"user_id"}),
        subtotal=totals["subtotal"],
        small_order_fee=totals["small_order_fee"],
        delivery_fee=totals["delivery_fee"],
        takeaway_discount=totals["takeaway_discount"],
        free_item_discount=totals["free_item_discount"],
        coupon_discount=totals["coupon_discount"],
        total=totals["grand_total"],
        user_id=user_id,
        is_loyalty_qualifying=is_qualifying,
        payment_status="paid",  # verified as succeeded with Stripe above
    )
    order.coupon_code = totals["coupon_code"]
    # Server-authoritative: assigned here, never accepted from the client
    order.order_number = await next_order_number()
    order.scheduled_slot_final = scheduled_final
    try:
        order_doc = order.model_dump()
        if payload.marketing_consent is not None:                      # tick-box at checkout (A-0003, MKT-001)
            order_doc.update({"marketing_consent": bool(payload.marketing_consent), "marketing_consent_at": datetime.utcnow()})
            if user_id:
                await db.users.update_one({"id": user_id}, {"$set": {"marketing_consent": bool(payload.marketing_consent),
                                                                     "marketing_consent_at": datetime.utcnow(), "marketing_consent_source": "checkout"}})
        await db.orders.insert_one(order_doc)
    except DuplicateKeyError:
        # Lost a race with an identical submit — the other request made the order
        existing = await db.orders.find_one({"payment_intent_id": payload.payment_intent_id}, {"_id": 0})
        if existing and existing.get("user_id") == user_id:
            return Order(**existing)
        raise HTTPException(400, "This payment has already been used")

    if totals["coupon"]:
        ok = await redeem_coupon(
            totals["coupon"], scope="orders", ref_id=order.id, user_id=user_id,
            email=payload.customer_email, customer_name=payload.customer_name,
        )
        if not ok:
            notify_admin(
                f"Coupon over-redeemed · {totals['coupon_code']} · order #{order.order_number}",
                f"<p>Two customers used <b>{totals['coupon_code']}</b> at the same moment; the cap was "
                f"exceeded by one. Order <b>#{order.order_number}</b> was honoured at the discounted price.</p>",
            )

    # If redeeming, clear pending reward and increment redeemed counter
    if payload.is_loyalty_redemption and user_id:
        claimed = await db.users.update_one(
            {"id": user_id, "loyalty_pending_reward": True},
            {"$set": {"loyalty_pending_reward": False, "loyalty_last_updated": datetime.utcnow().isoformat()},
             "$inc": {"loyalty_rewards_redeemed": 1}},
        )
        if claimed.modified_count == 0:
            notify_admin(
                f"Loyalty reward used twice · order #{order.order_number}",
                f"<p>Order <b>#{order.order_number}</b> was paid with a free loyalty dish, but that reward "
                "had already been used by another order placed at the same moment. The order was honoured.</p>",
            )

    if kitchen_note:
        notify_admin(
            f"Order #{order.order_number} needs a look · {kitchen_note}",
            f"<p>Order <b>#{order.order_number}</b> for {esc(payload.customer_name)} (£{order.total:.2f}) was <b>{esc(kitchen_note)}</b>. "
            f"It has been taken{' and moved to ' + esc(slot_label(scheduled_final)) if slot_was_bumped and scheduled_final else ''}. "
            "If you cannot make it, cancel it in Admin › Orders and refund in Stripe.</p>",
        )

    subj, html = email_order_confirmation(order.model_dump(), payload.customer_name)
    send_email(payload.customer_email, subj, html)
    short_id = order.order_number
    if payload.delivery_type == "takeaway":
        when = f"Collect at {slot_label(scheduled_final)}." if scheduled_final else "We'll text you when it's ready to collect."
        if slot_was_bumped and payload.scheduled_slot:
            when = f"Your requested time was full — new collection time {slot_label(scheduled_final)}."
        elif slot_was_bumped:
            when = f"We were closed when you ordered — your collection time is {slot_label(scheduled_final)}."
        sms_body = f"Sree Svadista Prasada: order #{short_id} received — £{order.total:.2f}. {when}"
    else:
        when = "We'll message you when it's on the way."
        sms_body = f"Sree Svadista Prasada: order #{short_id} received — £{order.total:.2f}. We'll text you when it's on the way."
    notify_customer(
        "order_received", payload.customer_phone,
        [first_name(payload.customer_name), short_id, f"{order.total:.2f}", when,
         tracking_link("orders", order.id)],
        dedupe_key=f"order_received:{order.id}",
        sms_fallback=sms_body,
    )
    notify_admin(
        f"New order · £{order.total:.2f} · {payload.customer_name}",
        f"<p>New order <b>#{short_id}</b> from {esc(payload.customer_name)} "
        f"({esc(payload.customer_email)} · {esc(payload.customer_phone)}).</p>"
        f"<p>Total <b>£{order.total:.2f}</b> — open the admin dashboard to confirm.</p>",
    )
    return order


# ── Get orders ────────────────────────────────────────────────────────────────

@router.get("", response_model=List[Order])
async def get_orders(
    status: Optional[OrderStatus] = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    skip: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    """Newest first. `limit`/`skip` page through the list; the admin screens ask for a page, not the whole history (A-0003, BE-007)."""
    query = {}
    if current_user.get("role") != "admin":
        query["user_id"] = current_user["sub"]
    if status:
        query["status"] = status.value

    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).to_list(limit)
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
    admin: dict = Depends(require_admin),
):
    current_doc = await db.orders.find_one({"id": order_id}, {"_id": 0, "status": 1})
    if not current_doc:
        raise HTTPException(status_code=404, detail="Order not found")
    current_status = current_doc.get("status", "pending")
    allowed = ALLOWED_TRANSITIONS.get(current_status, set())
    if payload.status.value not in allowed:
        raise HTTPException(status_code=400, detail=f"Cannot move order from '{current_status}' to '{payload.status.value}'")
    # Conditioned on the status we checked: two taps at once cannot both pass and both send messages
    result = await db.orders.update_one(
        {"id": order_id, "status": current_status},
        {"$set": {"status": payload.status.value, "updated_at": datetime.utcnow()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=409, detail="This order was just changed by someone else — refresh and look again.")

    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if doc:
        await record_admin_action(admin, "changed an order's status", f"order {display_order_number(doc)} for {doc.get('customer_name') or 'a customer'}",
                                  {"status": current_status}, {"status": payload.status.value, "total": doc.get("total")})
        name = doc.get("customer_name") or "Customer"
        subj, html = email_order_status(doc, name, payload.status.value)
        if doc.get("customer_email"):
            send_email(doc["customer_email"], subj, html)
        disp = display_order_number(doc)
        is_takeaway = doc.get("delivery_type") == "takeaway"
        # The status text is a service message and does not ask for a rating; the review request (one per channel,
        # marketing, with opt-out) does that on its own (A-0003, MKT-003)
        delivered_sms = f"Order #{disp} {'collected' if is_takeaway else 'delivered'} — enjoy!"
        sms_copy = {
            "confirmed": f"Order #{disp} confirmed. We'll start prepping shortly.",
            "preparing": f"Order #{disp} is being prepared now.",
            "ready": f"Order #{disp} is READY for collection. See you soon!",
            "out_for_delivery": f"Order #{disp} is on the way. Please keep your phone handy.",
            "delivered": delivered_sms,
            "cancelled": f"Order #{disp} was cancelled." + (" Your payment will be refunded to the same card within a few days." if doc.get("payment_intent_id") else "") + " Reply to your confirmation email if this is wrong.",
        }.get(payload.status.value)
        # WhatsApp only for the moments that matter: ready / on the way / delivered / cancelled.
        # "confirmed" and "preparing" are visible on the tracking link from the first
        # message; a collected takeaway needs no message at all — they're holding the bag.
        wa_event = {
            "ready": "order_ready",
            "out_for_delivery": "order_on_the_way",
            "delivered": None if is_takeaway else "order_delivered",
            "cancelled": "order_cancelled",
        }.get(payload.status.value)
        if sms_copy and doc.get("customer_phone"):
            sms_text = f"Sree Svadista Prasada: {sms_copy}"
            if wa_event:
                notify_customer(
                    wa_event, doc["customer_phone"],
                    [first_name(name), disp, tracking_link("orders", order_id)],
                    dedupe_key=f"{wa_event}:{order_id}",
                    sms_fallback=sms_text,
                )
            elif not whatsapp_enabled():
                send_sms(doc["customer_phone"], sms_text)
        if payload.status.value == "cancelled" and doc.get("scheduled_slot_final"):
            from routes.pickup_slots import release_slot
            await release_slot(doc["scheduled_slot_final"])
        if payload.status.value == "cancelled" and doc.get("payment_intent_id") and doc.get("payment_status") != "refunded":
            await db.orders.update_one({"id": order_id}, {"$set": {"payment_status": "refund_due"}})
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
                "delivered": "Enjoy your meal!",
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

@router.put("/{order_id}/refunded")
async def mark_refunded(order_id: str, admin: dict = Depends(require_admin)):
    """The owner has refunded the payment in Stripe; the order stops showing "refund due" (A-0003, COM-011)."""
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    if doc.get("status") != "cancelled":
        raise HTTPException(status_code=400, detail="Only a cancelled order can be marked refunded.")
    await db.orders.update_one({"id": order_id}, {"$set": {"payment_status": "refunded", "refunded_at": datetime.utcnow()}})
    await record_admin_action(admin, "marked an order refunded", f"order {display_order_number(doc)} for {doc.get('customer_name') or 'a customer'}",
                              {"payment_status": doc.get("payment_status")}, {"payment_status": "refunded", "total": doc.get("total")})
    if doc.get("customer_email"):
        send_email(doc["customer_email"], f"Refund sent · order #{display_order_number(doc)}",
                   f"<p>Hi {esc(doc.get('customer_name') or 'there')},</p><p>We have refunded £{float(doc.get('total') or 0):.2f} for order "
                   f"<b>#{display_order_number(doc)}</b> to the card you paid with. Banks usually show it within 5–10 working days.</p>")
    return {"ok": True, "payment_status": "refunded"}


@router.delete("/{order_id}")
async def cancel_order(order_id: str, current_user: dict = Depends(get_current_user)):
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")

    if current_user.get("role") != "admin" and doc.get("user_id") != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Access denied")

    if doc["status"] not in ("pending", "confirmed"):
        raise HTTPException(status_code=400, detail="Order cannot be cancelled at this stage")

    result = await db.orders.update_one(
        {"id": order_id, "status": doc["status"]},
        {"$set": {"status": OrderStatus.cancelled.value, "updated_at": datetime.utcnow()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=409, detail="This order was just updated — refresh and look again.")
    if doc.get("scheduled_slot_final"):
        from routes.pickup_slots import release_slot
        await release_slot(doc["scheduled_slot_final"])

    # Notify customer of self-cancellation
    cust_email = doc.get("customer_email")
    cust_phone = doc.get("customer_phone")
    cust_name  = doc.get("customer_name") or "Customer"
    short_id   = display_order_number(doc)
    paid = doc.get("payment_status") == "paid" or bool(doc.get("payment_intent_id"))
    if paid:
        await db.orders.update_one({"id": order_id}, {"$set": {"payment_status": "refund_due"}})
        notify_admin(f"Refund due · order #{short_id} · £{float(doc.get('total') or 0):.2f}",
                     f"<p>{esc(cust_name)} cancelled order <b>#{short_id}</b> after paying £{float(doc.get('total') or 0):.2f}. "
                     f"Refund it in Stripe (payment {esc(doc.get('payment_intent_id') or '—')}); the order shows \"refund due\" until you mark it refunded.</p>")
    money = (f"<p>You paid £{float(doc.get('total') or 0):.2f}. We will refund it to the same card within a few days and email you when it is done; "
             "it can take your bank 5–10 working days to show.</p>") if paid else ""
    if cust_email:
        send_email(
            cust_email,
            f"Order #{short_id} Cancelled",
            f"<p>Hi {esc(cust_name)},</p><p>Your order <b>#{short_id}</b> has been cancelled as requested.</p>" + money +
            "<p>If you did not request this, please contact us immediately.</p>",
        )
    notify_customer(
        "order_cancelled", cust_phone,
        [first_name(cust_name), short_id, tracking_link("orders", order_id)],
        dedupe_key=f"order_cancelled:{order_id}",
        sms_fallback=f"Sree Svadista Prasada: Order #{short_id} cancelled. Contact us if this was not you.",
    )
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
