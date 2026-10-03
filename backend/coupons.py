"""
Coupon engine — validation, discount maths and redemption bookkeeping.

A coupon belongs to exactly one world: "orders" (single orders) or
"subscriptions" (Dabba Wala). The two never cross — a Dabba Wala code is
refused at checkout and vice versa, whatever its other rules say.

Money maths is done in pence. The routes call `resolve_coupon()` to turn a
typed code + basket context into either a discount or a plain-English refusal,
then `redeem()` once payment has succeeded.
"""
from __future__ import annotations
import secrets
import string
from datetime import datetime, timezone
from typing import Optional

from pymongo import ReturnDocument

from database import db

SCOPES = ("orders", "subscriptions")
KINDS = ("single", "multi")
DISCOUNT_TYPES = ("percent", "fixed", "free_delivery")

# Unambiguous alphabet for generated codes — no 0/O or 1/I mix-ups over the phone
_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def normalize_code(code: str) -> str:
    return "".join(ch for ch in (code or "").upper() if ch.isalnum() or ch in "-_")


def generate_code(prefix: str = "", length: int = 8) -> str:
    body = "".join(secrets.choice(_CODE_ALPHABET) for _ in range(length))
    return normalize_code(f"{prefix}{body}") if prefix else body


def email_key(email: str) -> Optional[str]:
    return (email or "").strip().lower() or None


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def to_pence(amount) -> int:
    return int(round(float(amount or 0) * 100))


def status_of(c: dict, now: Optional[str] = None) -> str:
    """Derived lifecycle state shown in the admin list."""
    now = now or _now()
    if c.get("status") == "paused":
        return "paused"
    if c.get("starts_at") and c["starts_at"] > now:
        return "scheduled"
    if c.get("expires_at") and c["expires_at"] <= now:
        return "expired"
    cap = 1 if c.get("kind") == "single" else c.get("max_redemptions")
    if cap and c.get("redemptions_count", 0) >= cap:
        return "used_up"
    return "active"


def public_view(c: dict) -> dict:
    """What the checkout coupon panel needs to show a card and grey it out locally."""
    return {
        "code": c["code"],
        "name": c.get("name") or c["code"],
        "description": c.get("description") or "",
        "scope": c["scope"],
        "discount_type": c["discount_type"],
        "discount_value": c.get("discount_value"),
        "max_discount": c.get("max_discount"),
        "min_subtotal": c.get("min_subtotal"),
        "order_type": c.get("order_type", "any"),
        "plan": c.get("plan", "any"),
        "box_type": c.get("box_type", "any"),
        "first_order_only": bool(c.get("first_order_only")),
        "expires_at": c.get("expires_at"),
        "exclusive": bool(c.get("assigned_email") or c.get("assigned_user_id")),
    }


# ── Discount maths ────────────────────────────────────────────────────────────

def discount_pence(c: dict, base_pence: int, delivery_pence: int) -> int:
    """
    Saving in pence for this coupon on a basket.
    base_pence     — the food / plan price the percentage or fixed amount applies to
    delivery_pence — what the customer would pay for delivery without the coupon
    Never more than the thing it discounts, never negative.
    """
    t = c["discount_type"]
    if t == "free_delivery":
        return max(0, delivery_pence)
    if t == "percent":
        saving = (base_pence * int(round(float(c.get("discount_value") or 0) * 100)) + 5000) // 10000
        if c.get("max_discount"):
            saving = min(saving, to_pence(c["max_discount"]))
    elif t == "fixed":
        saving = to_pence(c.get("discount_value"))
    else:
        return 0
    return max(0, min(saving, base_pence))


def describe(c: dict) -> str:
    t = c["discount_type"]
    if t == "free_delivery":
        return "Free delivery"
    if t == "percent":
        v = float(c.get("discount_value") or 0)
        s = f"{v:g}% off"
        return f"{s} (up to £{float(c['max_discount']):.2f})" if c.get("max_discount") else s
    return f"£{float(c.get('discount_value') or 0):.2f} off"


# ── Validation ────────────────────────────────────────────────────────────────

async def _redemptions_by_customer(coupon_id: str, user_id: Optional[str], email: Optional[str]) -> int:
    clauses = []
    if user_id:
        clauses.append({"user_id": user_id})
    if email_key(email):
        clauses.append({"email_key": email_key(email)})
    if not clauses:
        return 0
    return await db.coupon_redemptions.count_documents({"coupon_id": coupon_id, "$or": clauses})


async def _is_first_time(scope: str, user_id: Optional[str], email: Optional[str]) -> bool:
    clauses = []
    if user_id:
        clauses.append({"user_id": user_id})
    if email_key(email):
        clauses.append({"email_key": email_key(email)})
        if scope == "orders":
            clauses.append({"customer_email": {"$regex": f"^{_re_escape(email.strip())}$", "$options": "i"}})
    if not clauses:
        return True
    coll = db.orders if scope == "orders" else db.subscriptions
    query = {"$or": clauses}
    if scope == "orders":
        query["status"] = {"$ne": "cancelled"}
    return await coll.find_one(query, {"_id": 1}) is None


def _re_escape(s: str) -> str:
    import re
    return re.escape(s)


async def resolve_coupon(
    code: str,
    *,
    scope: str,
    base_pence: int,
    delivery_pence: int,
    user_id: Optional[str],
    email: Optional[str],
    order_type: Optional[str] = None,   # orders: delivery | takeaway
    plan: Optional[str] = None,         # subscriptions: weekly | monthly
    box_type: Optional[str] = None,     # subscriptions: prasada | svadista
    has_loyalty_item: bool = False,
) -> tuple[Optional[dict], Optional[str]]:
    """
    Returns (applied, error). `applied` is {code, name, label, discount_pence, discount, coupon_id}
    or None; `error` is a customer-facing sentence or None.
    """
    norm = normalize_code(code)
    if not norm:
        return None, None
    c = await db.coupons.find_one({"code": norm}, {"_id": 0})
    if not c:
        return None, "We don't recognise that code — check the spelling and try again."

    if c["scope"] != scope:
        return None, (
            "That code is for Dabba Wala plans only." if c["scope"] == "subscriptions"
            else "That code is for single orders only, not Dabba Wala plans."
        )

    st = status_of(c)
    if st == "paused":
        return None, "That code isn't active right now."
    if st == "scheduled":
        return None, "That code isn't valid yet — check the start date on your offer."
    if st == "expired":
        return None, "That code has expired."
    if st == "used_up":
        return None, "That code has already been used." if c["kind"] == "single" else "That code has reached its limit — all gone, sorry!"

    if c.get("assigned_user_id") or c.get("assigned_email"):
        mine = (c.get("assigned_user_id") and c["assigned_user_id"] == user_id) or (
            c.get("assigned_email") and email_key(c["assigned_email"]) == email_key(email)
        )
        if not mine:
            return None, "That code belongs to another customer's account."

    if has_loyalty_item:
        return None, "A coupon can't be combined with your free loyalty dish — one offer per order."

    if scope == "orders" and c.get("order_type", "any") not in ("any", None) and c["order_type"] != order_type:
        return None, f"That code is for {c['order_type']} orders only."
    if scope == "subscriptions":
        if c.get("plan", "any") not in ("any", None) and c["plan"] != (plan or "").lower():
            return None, f"That code is for the {c['plan']} plan only."
        if c.get("box_type", "any") not in ("any", None) and c["box_type"] != (box_type or "").lower():
            return None, f"That code is for the {c['box_type'].title()} box only."

    if c.get("min_subtotal") and base_pence < to_pence(c["min_subtotal"]):
        short = (to_pence(c["min_subtotal"]) - base_pence) / 100
        return None, f"Add £{short:.2f} more to use this code (minimum £{float(c['min_subtotal']):.2f})."

    if c.get("first_order_only") and not await _is_first_time(scope, user_id, email):
        return None, "That code is for first-time customers only."

    per_customer = c.get("per_customer_limit") if c["kind"] == "multi" else 1
    if per_customer and await _redemptions_by_customer(c["id"], user_id, email) >= per_customer:
        return None, "You've already used that code."

    if c["discount_type"] == "free_delivery" and delivery_pence <= 0:
        return None, (
            "Delivery is already free on this basket, so that code wouldn't save you anything."
            if scope == "orders" and order_type != "takeaway"
            else "That code gives free delivery, which doesn't apply here."
        )

    saving = discount_pence(c, base_pence, delivery_pence)
    if saving <= 0:
        return None, "That code wouldn't save you anything on this basket."

    return {
        "coupon_id": c["id"],
        "code": c["code"],
        "name": c.get("name") or c["code"],
        "label": describe(c),
        "discount_type": c["discount_type"],
        "discount_pence": saving,
        "discount": saving / 100,
    }, None


# ── Redemption ────────────────────────────────────────────────────────────────

async def redeem(
    applied: dict, *, scope: str, ref_id: str, user_id: Optional[str], email: Optional[str], customer_name: str = ""
) -> bool:
    """
    Record a redemption after payment succeeded. Returns False when the coupon
    was already used up by a concurrent checkout — the caller still honours the
    paid order (money has been taken) and flags it for the admin.
    """
    coupon = await db.coupons.find_one({"id": applied["coupon_id"]}, {"_id": 0, "kind": 1, "max_redemptions": 1})
    cap = 1 if (coupon or {}).get("kind") == "single" else (coupon or {}).get("max_redemptions")
    flt = {"id": applied["coupon_id"]}
    if cap:
        flt["redemptions_count"] = {"$lt": cap}
    updated = await db.coupons.find_one_and_update(
        flt,
        {"$inc": {"redemptions_count": 1, "total_discount_pence": applied["discount_pence"]},
         "$set": {"last_redeemed_at": _now()}},
        return_document=ReturnDocument.AFTER,
    )
    await db.coupon_redemptions.insert_one({
        "coupon_id": applied["coupon_id"],
        "code": applied["code"],
        "scope": scope,
        "ref_id": ref_id,
        "user_id": user_id,
        "email_key": email_key(email),
        "customer_name": customer_name,
        "discount_pence": applied["discount_pence"],
        "over_cap": updated is None,
        "created_at": _now(),
    })
    return updated is not None


async def available_for(scope: str, user_id: Optional[str], email: Optional[str]) -> list[dict]:
    """Listed public offers plus any exclusive codes assigned to this customer, active only."""
    clauses = [{"listed": True, "assigned_user_id": None, "assigned_email": None}]
    if user_id:
        clauses.append({"assigned_user_id": user_id})
    if email_key(email):
        clauses.append({"assigned_email": {"$regex": f"^{_re_escape(email.strip())}$", "$options": "i"}})
    cursor = db.coupons.find({"scope": scope, "status": {"$ne": "paused"}, "$or": clauses}, {"_id": 0})
    now = _now()
    out = []
    async for c in cursor:
        if status_of(c, now) != "active":
            continue
        out.append(public_view(c))
    out.sort(key=lambda v: (not v["exclusive"], v["expires_at"] or "9999"))
    return out
