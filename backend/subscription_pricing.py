"""
Dabba Wala pricing — single source of truth for subscription totals.

All money maths is done in integer pence; floats only appear at the edges
(API responses, Stripe amount comparison is pence-to-pence).

Delivery rules:
  • Per-meal delivery fee = the standard zone fee (routes/orders.py) less 30%.
  • Every new account gets the delivery fee waived on its first 5 meals ("welcome").
  • An account that has subscribed before pays delivery from meal 1 ("returning").
    Guests have no account, so they are recognised by email instead.
"""
from __future__ import annotations
from typing import Optional

from database import db
from routes.orders import get_zone_from_postcode, ZONE_DELIVERY_FEE

PLAN_PRICE_PENCE = {"weekly": 7500, "monthly": 25000}
PLAN_MEALS = {"weekly": 5, "monthly": 20}

SUB_DELIVERY_DISCOUNT_PCT = 30   # subscription delivery is 30% below the standard zone fee
FREE_DELIVERY_MEALS = 5          # welcome offer: no delivery fee on the first 5 meals


def to_pence(amount: float) -> int:
    return int(round(amount * 100))


def subscription_fee_pence(zone: int) -> int:
    """Per-meal subscription delivery fee: standard zone fee less 30%, rounded half-up."""
    standard = to_pence(ZONE_DELIVERY_FEE[zone])
    return (standard * (100 - SUB_DELIVERY_DISCOUNT_PCT) + 50) // 100


def email_key(email: str) -> Optional[str]:
    return (email or "").strip().lower() or None


async def backfill_email_keys() -> None:
    """Stamp email_key on subscriptions created before delivery fees existed."""
    cursor = db.subscriptions.find(
        {"email_key": {"$exists": False}}, {"_id": 0, "id": 1, "customer_email": 1}
    )
    async for s in cursor:
        await db.subscriptions.update_one(
            {"id": s["id"]}, {"$set": {"email_key": email_key(s.get("customer_email", ""))}}
        )


async def has_subscribed_before(email: str, user_id: Optional[str]) -> bool:
    clauses = []
    if user_id:
        clauses.append({"user_id": user_id})
    if email_key(email):
        clauses.append({"email_key": email_key(email)})
    if not clauses:
        return False
    return bool(await db.subscriptions.find_one({"$or": clauses}, {"_id": 1}))


def build_quote(plan: str, postcode: str, returning: bool = False) -> dict:
    """
    Pure pricing. Raises ValueError for an unknown plan or a postcode outside
    the delivery area. *_pence fields are authoritative; float fields are for display.
    """
    plan = (plan or "").lower()
    if plan not in PLAN_PRICE_PENCE:
        raise ValueError("Unknown plan — choose weekly or monthly.")
    zone = get_zone_from_postcode(postcode)
    if zone is None:
        raise ValueError(
            "Sorry, Dabba Wala doesn't reach this postcode yet — we deliver across Milton Keynes."
        )

    meals = PLAN_MEALS[plan]
    plan_pence = PLAN_PRICE_PENCE[plan]
    fee_pence = subscription_fee_pence(zone)

    free_meals = 0 if returning else min(FREE_DELIVERY_MEALS, meals)
    charged_meals = meals - free_meals
    delivery_pence = charged_meals * fee_pence
    total_pence = plan_pence + delivery_pence

    promo_message = (
        "Welcome back! The delivery-fee waiver was our gift on your first plan — "
        "from here delivery is 30% below our standard rate."
        if returning else
        f"No delivery fee on your first {free_meals} meals — our welcome gift. You pay only for the food."
    )

    return {
        "plan": plan,
        "meals": meals,
        "zone": zone,
        "plan_price_pence": plan_pence,
        "standard_delivery_fee_pence": to_pence(ZONE_DELIVERY_FEE[zone]),
        "delivery_fee_per_meal_pence": fee_pence,
        "free_delivery_meals": free_meals,
        "charged_delivery_meals": charged_meals,
        "delivery_fee_total_pence": delivery_pence,
        "total_pence": total_pence,
        "plan_price": plan_pence / 100,
        "standard_delivery_fee": ZONE_DELIVERY_FEE[zone],
        "delivery_fee_per_meal": fee_pence / 100,
        "delivery_fee_total": delivery_pence / 100,
        "total": total_pence / 100,
        "delivery_discount_pct": SUB_DELIVERY_DISCOUNT_PCT,
        "promo_state": "returning" if returning else "welcome",
        "promo_message": promo_message,
        "coupon_code": None,
        "coupon_discount_pence": 0,
        "coupon_discount": 0.0,
        "coupon": None,
        "coupon_error": None,
    }


async def quote_subscription(
    plan: str, email: str, postcode: str, user_id: Optional[str],
    coupon_code: Optional[str] = None, box_type: Optional[str] = None,
) -> dict:
    """
    Price a sign-up. Raises ValueError on bad input. A refused coupon never
    blocks the quote — the reason comes back in coupon_error. Percent/fixed
    codes discount the plan price; free-delivery codes drop the delivery fee.
    """
    q = build_quote(plan, postcode, await has_subscribed_before(email, user_id))
    if not coupon_code:
        return q
    from coupons import resolve_coupon
    applied, err = await resolve_coupon(
        coupon_code, scope="subscriptions", base_pence=q["plan_price_pence"],
        delivery_pence=q["delivery_fee_total_pence"], user_id=user_id, email=email,
        plan=q["plan"], box_type=box_type,
    )
    if err or not applied:
        q["coupon_error"] = err
        return q
    if applied["discount_type"] == "free_delivery":
        q["delivery_fee_total_pence"] = 0
        q["delivery_fee_total"] = 0.0
        q["charged_delivery_meals"] = 0
        q["free_delivery_meals"] = q["meals"]
    q["coupon_code"] = applied["code"]
    q["coupon_discount_pence"] = applied["discount_pence"]
    q["coupon_discount"] = applied["discount_pence"] / 100
    q["coupon"] = applied
    plan_after = q["plan_price_pence"] - (0 if applied["discount_type"] == "free_delivery" else applied["discount_pence"])
    q["total_pence"] = plan_after + q["delivery_fee_total_pence"]
    q["total"] = q["total_pence"] / 100
    return q
