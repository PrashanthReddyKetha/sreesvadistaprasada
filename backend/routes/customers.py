"""Admin customer view (CRM): one row per person, built from what is already held —
accounts, orders, Dabba Wala plans and the newsletter list. Read-only; nothing is stored.

People are matched on email address (lower-cased), so a guest who orders twice with the
same email, or who later opens an account, is one customer.
"""
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends

from auth import require_admin
from database import db

router = APIRouter(prefix="/admin/customers", tags=["Admin Customers"])

LAPSED_AFTER_DAYS = 60     # no order for this long, and no running plan
REGULAR_FROM_ORDERS = 5


def _key(email: Optional[str]) -> str:
    return (email or "").strip().lower()


def _as_dt(value) -> Optional[datetime]:
    if isinstance(value, datetime):
        return value.replace(tzinfo=None)
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)
        except ValueError:
            return None
    return None


def _segment(c: dict, now: datetime) -> str:
    if c["active_plan"]:
        return "subscriber"
    if c["orders"] == 0 and c["plans"] == 0:
        return "lead"
    last = c["last_activity"]
    if last and (now - last) > timedelta(days=LAPSED_AFTER_DAYS):
        return "lapsed"
    if c["orders"] >= REGULAR_FROM_ORDERS:
        return "regular"
    if c["orders"] >= 2:
        return "repeat"
    return "new"


async def build_customers(now: Optional[datetime] = None) -> list:
    now = now or datetime.utcnow()
    people: dict = {}

    def person(email: str) -> dict:
        k = _key(email)
        if k not in people:
            people[k] = {
                "email": k, "name": "", "phone": "", "user_id": None, "has_account": False,
                "joined": None, "orders": 0, "cancelled_orders": 0, "order_spend": 0.0,
                "first_order": None, "last_order": None, "last_order_number": None,
                "collection_orders": 0, "delivery_orders": 0,
                "plans": 0, "active_plan": None, "plan_spend": 0.0, "last_plan_end": None,
                "loyalty_orders": 0, "loyalty_reward_waiting": False,
                "newsletter": False, "last_activity": None,
            }
        return people[k]

    def touch(c: dict, when: Optional[datetime]):
        if when and (c["last_activity"] is None or when > c["last_activity"]):
            c["last_activity"] = when

    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(None)
    by_id = {}
    for u in users:
        if u.get("role") == "admin" or not _key(u.get("email")):
            continue
        c = person(u["email"])
        c.update(name=u.get("name") or "", phone=u.get("phone") or "", user_id=u.get("id"), has_account=True,
                 joined=_as_dt(u.get("created_at")), loyalty_orders=u.get("loyalty_order_count", 0),
                 loyalty_reward_waiting=bool(u.get("loyalty_pending_reward")))
        by_id[u.get("id")] = c
    admin_ids = {u.get("id") for u in users if u.get("role") == "admin"}

    orders = await db.orders.find({}, {"_id": 0, "items": 0}).to_list(None)
    for o in orders:
        if o.get("user_id") in admin_ids:
            continue
        c = by_id.get(o.get("user_id")) or (person(o["customer_email"]) if _key(o.get("customer_email")) else None)
        if c is None:
            continue
        c["name"] = c["name"] or o.get("customer_name") or ""
        c["phone"] = c["phone"] or o.get("customer_phone") or ""
        if o.get("status") == "cancelled":
            c["cancelled_orders"] += 1
            continue
        when = _as_dt(o.get("created_at"))
        c["orders"] += 1
        c["order_spend"] += float(o.get("total") or 0)
        c["collection_orders" if o.get("delivery_type") == "takeaway" else "delivery_orders"] += 1
        if when:
            if c["first_order"] is None or when < c["first_order"]:
                c["first_order"] = when
            if c["last_order"] is None or when > c["last_order"]:
                c["last_order"], c["last_order_number"] = when, o.get("order_number")
        touch(c, when)

    today = now.strftime("%Y-%m-%d")
    subs = await db.subscriptions.find({}, {"_id": 0, "audit_trail": 0, "internal_notes": 0}).to_list(None)
    for s in subs:
        if s.get("user_id") in admin_ids:
            continue
        c = by_id.get(s.get("user_id")) or (person(s["customer_email"]) if _key(s.get("customer_email")) else None)
        if c is None:
            continue
        c["name"] = c["name"] or s.get("customer_name") or ""
        c["phone"] = c["phone"] or s.get("customer_phone") or ""
        if s.get("status") == "cancelled":
            continue
        c["plans"] += 1
        c["plan_spend"] += float(s.get("price") or 0)
        end = s.get("end_date") or ""
        if end and (c["last_plan_end"] is None or end > c["last_plan_end"]):
            c["last_plan_end"] = end
        # "active" in the database can be stale; a plan only counts as running until its end date
        if s.get("status") == "active" and (not end or end >= today):
            c["active_plan"] = f'{s.get("plan", "")} {s.get("box_type", "")}'.strip()
        touch(c, _as_dt(end) or _as_dt(s.get("created_at")))

    for n in await db.newsletter.find({"active": True}, {"_id": 0}).to_list(None):
        if _key(n.get("email")):
            c = person(n["email"])
            c["newsletter"] = True
            c["joined"] = c["joined"] or _as_dt(n.get("created_at"))

    out = []
    for c in people.values():
        c["total_spend"] = round(c["order_spend"] + c["plan_spend"], 2)
        c["order_spend"], c["plan_spend"] = round(c["order_spend"], 2), round(c["plan_spend"], 2)
        c["average_order"] = round(c["order_spend"] / c["orders"], 2) if c["orders"] else 0.0
        c["segment"] = _segment(c, now)
        c["days_since_last_order"] = (now - c["last_order"]).days if c["last_order"] else None
        for f in ("joined", "first_order", "last_order", "last_activity"):
            c[f] = c[f].isoformat() if c[f] else None
        out.append(c)
    out.sort(key=lambda c: (c["total_spend"], c["last_activity"] or ""), reverse=True)
    return out


@router.get("")
async def list_customers(_: dict = Depends(require_admin)):
    customers = await build_customers()
    buyers = [c for c in customers if c["orders"] or c["plans"]]
    segments: dict = {}
    for c in customers:
        segments[c["segment"]] = segments.get(c["segment"], 0) + 1
    order_count = sum(c["orders"] for c in customers)
    order_spend = sum(c["order_spend"] for c in customers)
    return {
        "summary": {
            "people": len(customers),
            "buyers": len(buyers),
            "repeat_buyers": sum(1 for c in buyers if c["orders"] + c["plans"] >= 2),
            "segments": segments,
            "order_revenue": round(order_spend, 2),
            "plan_revenue": round(sum(c["plan_spend"] for c in customers), 2),
            "average_order": round(order_spend / order_count, 2) if order_count else 0.0,
            "newsletter": sum(1 for c in customers if c["newsletter"]),
            "lapsed_after_days": LAPSED_AFTER_DAYS,
        },
        "customers": customers,
    }
