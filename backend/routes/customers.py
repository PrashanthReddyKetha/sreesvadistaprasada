"""Admin customer view (CRM): one row per person, built from what is already held —
accounts, orders, Dabba Wala plans and the newsletter list. Read-only; nothing is stored.

People are matched on email address (lower-cased), so a guest who orders twice with the
same email, or who later opens an account, is one customer.
"""
import re
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends

from auth import require_admin
from database import db

router = APIRouter(prefix="/admin/customers", tags=["Admin Customers"])

LAPSED_AFTER_DAYS = 60     # no order for this long, and no running plan
REGULAR_FROM_ORDERS = 5
AT_RISK_AFTER_DAYS = 30    # a returning customer who has gone quiet, but is not yet lapsed
HIGH_VALUE_FROM = 150.0    # total spent, orders and plans together
EXPIRING_WITHIN_DAYS = 3   # a running plan this close to its last meal
PLAN_MEALS = {"weekly": 5, "monthly": 20}


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


def _dabba_stage(c: dict, today: str, soon: str) -> str:
    """Where this person is with Dabba Wala. Reported only — it changes no terms.
    prospect -> trial -> active -> expiring -> expired / cancelled."""
    if c["running_plan_end"]:
        if c["running_plan_end"] <= soon:
            return "expiring"
        return "trial" if c["plans"] == 1 and c["running_plan_type"] == "weekly" else "active"
    if c["plans"] or c["cancelled_plans"]:
        return "cancelled" if c["last_plan_status"] == "cancelled" else "expired"
    return "prospect" if c["orders"] else "none"


def _flags(c: dict, now: datetime) -> list:
    out = []
    if c["total_spend"] >= HIGH_VALUE_FROM:
        out.append("high_value")
    last = c["last_activity"]
    if c["orders"] >= 2 and not c["active_plan"] and last:
        quiet_for = now - last
        after = timedelta(days=AT_RISK_AFTER_DAYS)
        # With three or more orders the customer's own usual gap is known: someone who orders
        # weekly is "going quiet" after about ten days, not thirty.
        if c["orders"] >= 3 and c["first_order"] and c["last_order"]:
            usual_gap = (c["last_order"] - c["first_order"]) / (c["orders"] - 1)
            after = min(after, max(timedelta(days=10), usual_gap * 1.5))
            c["usual_gap_days"] = round(usual_gap.total_seconds() / 86400, 1)
        if after < quiet_for <= timedelta(days=LAPSED_AFTER_DAYS):
            out.append("at_risk")
    if c["cancelled_orders"] and not c["orders"]:
        out.append("only_cancelled")
    return out


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
                "cancelled_plans": 0, "last_plan_status": None, "last_plan_started": None,
                "running_plan_end": None, "running_plan_type": None,
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
        started = _as_dt(s.get("created_at"))
        if started and (c["last_plan_started"] is None or started > c["last_plan_started"]):
            c["last_plan_started"], c["last_plan_status"] = started, s.get("status")
        if s.get("status") == "cancelled":
            c["cancelled_plans"] += 1
            continue
        c["plans"] += 1
        c["plan_spend"] += float(s.get("price") or 0)
        end = s.get("end_date") or ""
        if end and (c["last_plan_end"] is None or end > c["last_plan_end"]):
            c["last_plan_end"] = end
        # "active" in the database can be stale; a plan only counts as running until its end date
        if s.get("status") == "active" and (not end or end >= today):
            c["active_plan"] = f'{s.get("plan", "")} {s.get("box_type", "")}'.strip()
            c["running_plan_end"], c["running_plan_type"] = end or "9999-12-31", s.get("plan")
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
        c["flags"] = _flags(c, now)
        c["dabba_stage"] = _dabba_stage(c, today, (now + timedelta(days=EXPIRING_WITHIN_DAYS)).strftime("%Y-%m-%d"))
        c["days_since_last_order"] = (now - c["last_order"]).days if c["last_order"] else None
        for f in ("joined", "first_order", "last_order", "last_activity", "last_plan_started"):
            c[f] = c[f].isoformat() if c[f] else None
        out.append(c)
    out.sort(key=lambda c: (c["total_spend"], c["last_activity"] or ""), reverse=True)
    return out


@router.get("")
async def list_customers(_: dict = Depends(require_admin)):
    customers = await build_customers()
    buyers = [c for c in customers if c["orders"] or c["plans"]]
    segments, stages, flags = {}, {}, {}
    for c in customers:
        segments[c["segment"]] = segments.get(c["segment"], 0) + 1
        stages[c["dabba_stage"]] = stages.get(c["dabba_stage"], 0) + 1
        for f in c["flags"]:
            flags[f] = flags.get(f, 0) + 1
    order_count = sum(c["orders"] for c in customers)
    order_spend = sum(c["order_spend"] for c in customers)
    return {
        "summary": {
            "people": len(customers),
            "buyers": len(buyers),
            "repeat_buyers": sum(1 for c in buyers if c["orders"] + c["plans"] >= 2),
            "segments": segments,
            "dabba_stages": stages,
            "flags": flags,
            "definitions": {"lapsed_after_days": LAPSED_AFTER_DAYS, "at_risk_after_days": AT_RISK_AFTER_DAYS,
                            "high_value_from": HIGH_VALUE_FROM, "regular_from_orders": REGULAR_FROM_ORDERS,
                            "expiring_within_days": EXPIRING_WITHIN_DAYS},
            "order_revenue": round(order_spend, 2),
            "plan_revenue": round(sum(c["plan_spend"] for c in customers), 2),
            "average_order": round(order_spend / order_count, 2) if order_count else 0.0,
            "newsletter": sum(1 for c in customers if c["newsletter"]),
            "lapsed_after_days": LAPSED_AFTER_DAYS,
        },
        "customers": customers,
    }


# ── One customer's history, in date order ────────────────────────────────────

STATUS_WORDS = {"pending": "placed", "confirmed": "confirmed", "preparing": "being prepared", "ready": "ready",
                "out_for_delivery": "out for delivery", "delivered": "completed", "cancelled": "cancelled",
                "active": "running", "expired": "finished"}


def _entry(when, kind: str, title: str, detail: str = "", amount=None) -> Optional[dict]:
    at = _as_dt(when)
    if not at:
        return None
    return {"at": at.isoformat(), "kind": kind, "title": title, "detail": detail, "amount": amount}


@router.get("/timeline")
async def customer_timeline(email: str, _: dict = Depends(require_admin)):
    """Everything on record for one person (matched on email, plus their account), newest first."""
    key = _key(email)
    same_email = {"$regex": f"^{re.escape(key)}$", "$options": "i"}
    user = await db.users.find_one({"email": same_email}, {"_id": 0, "password_hash": 0})
    uid = user.get("id") if user else None
    mine = [{"customer_email": same_email}] + ([{"user_id": uid}] if uid else [])
    out = []

    if user:
        out.append(_entry(user.get("created_at"), "account", "Opened an account",
                          "with Google" if user.get("google_id") else "with email and password"))
        for a in user.get("loyalty_audit") or []:
            out.append(_entry(a.get("timestamp"), "loyalty", "Loyalty adjusted by the kitchen", a.get("reason") or ""))

    orders = await db.orders.find({"$or": mine}, {"_id": 0}).to_list(None)
    for o in orders:
        dishes = ", ".join(f'{i.get("quantity", 1)} x {i.get("name")}' for i in (o.get("items") or [])[:6] if i.get("name"))
        how = "collection" if o.get("delivery_type") == "takeaway" else "delivery"
        number = o.get("order_number") or "order"
        out.append(_entry(o.get("created_at"), "order", f"Ordered ({number}, {how})", dishes, float(o.get("total") or 0)))
        if o.get("coupon_code"):
            out.append(_entry(o.get("created_at"), "coupon", f"Used coupon {o['coupon_code']}", f"on {number}",
                              -float(o.get("coupon_discount") or 0)))
        if o.get("is_loyalty_redemption"):
            out.append(_entry(o.get("created_at"), "loyalty", "Used a free loyalty dish", o.get("loyalty_free_item_name") or ""))
        if o.get("status") in ("delivered", "cancelled") and o.get("updated_at") and o.get("updated_at") != o.get("created_at"):
            out.append(_entry(o.get("updated_at"), "order", f"Order {number} {STATUS_WORDS[o['status']]}"))

    plan_filter = {"$or": mine + [{"email_key": key}]}
    plans = await db.subscriptions.find(plan_filter, {"_id": 0, "audit_trail": 0, "internal_notes": 0}).to_list(None)
    for p in plans:
        name = f'{p.get("plan", "")} {p.get("box_type", "")} plan'.strip()
        history = p.get("status_history") or []
        if not history:      # plans bought before status history was kept
            out.append(_entry(p.get("created_at"), "plan", f"Bought a {name}", f'{p.get("start_date", "")} to {p.get("end_date", "")}',
                              float(p.get("price") or 0)))
            if p.get("cancelled_at"):
                out.append(_entry(p.get("cancelled_at"), "plan", f"{name.capitalize()} cancelled"))
        for h in history:
            if h.get("from") is None:
                out.append(_entry(h.get("at"), "plan", f"Bought a {name}", f'{p.get("start_date", "")} to {p.get("end_date", "")}',
                                  float(p.get("price") or 0)))
            else:
                why = " — ".join(x for x in (f'by {h.get("by")}' if h.get("by") else "", h.get("reason") or "") if x)
                out.append(_entry(h.get("at"), "plan", f'{name.capitalize()} {STATUS_WORDS.get(h.get("to"), h.get("to"))}', why))
    plan_ids = [p["id"] for p in plans if p.get("id")]
    if plan_ids:
        async for d in db.delivery_tracking.find({"sub_id": {"$in": plan_ids}, "status": "skipped"}, {"_id": 0}):
            day = (d.get("delivery_id") or "").rsplit("_", 1)[-1]
            note = "short notice" if d.get("short_notice") else ""
            if d.get("made_up"):
                note = (note + "; " if note else "") + f'make-up meal given for {d.get("makeup_date", "a later day")}'
            out.append(_entry(d.get("skipped_at") or d.get("updated_at"), "plan", f"Skipped the meal on {day}", note))

    if uid:
        async for r in db.delivery_reviews.find({"user_id": uid, "status": "submitted"}, {"_id": 0}):
            out.append(_entry(r.get("submitted_at"), "review", f'Reviewed {"a meal" if r.get("type") != "order" else "an order"}: {r.get("rating")} of 5',
                              (r.get("text") or "")[:200]))
        async for r in db.reviews.find({"user_id": uid}, {"_id": 0}):
            out.append(_entry(r.get("created_at"), "review", f'Reviewed a dish: {r.get("rating")} of 5', (r.get("comment") or "")[:200]))

    contact_filter = {"$or": [{"email": same_email}] + ([{"user_id": uid}] if uid else [])}
    async for m in db.contact_messages.find(contact_filter, {"_id": 0}):
        out.append(_entry(m.get("created_at"), "enquiry", "Sent a message", (m.get("subject") or "")[:120]))
    async for m in db.catering_enquiries.find(contact_filter, {"_id": 0}):
        out.append(_entry(m.get("created_at"), "enquiry", "Asked about catering", (m.get("event_type") or "")[:120]))
    news = await db.newsletter.find_one({"email": same_email}, {"_id": 0})
    if news:
        out.append(_entry(news.get("created_at"), "newsletter", "Joined the newsletter", "" if news.get("active") else "since unsubscribed"))

    out = sorted((e for e in out if e), key=lambda e: e["at"], reverse=True)
    person = next((c for c in await build_customers() if c["email"] == key), None)
    return {"customer": person, "timeline": out}


# ── How customers behave, as a whole ─────────────────────────────────────────

@router.get("/insights")
async def customer_insights(_: dict = Depends(require_admin)):
    """Repeat buying, monthly cohorts and the Dabba Wala journey. Figures only — no names."""
    now = datetime.utcnow()
    admin_ids = {u["id"] async for u in db.users.find({"role": "admin"}, {"_id": 0, "id": 1})}
    by_person: dict = {}
    async for o in db.orders.find({"status": {"$ne": "cancelled"}}, {"_id": 0, "items": 0}):
        if o.get("user_id") in admin_ids:
            continue
        who = o.get("user_id") or _key(o.get("customer_email"))
        when = _as_dt(o.get("created_at"))
        if who and when:
            by_person.setdefault(who, []).append(when)

    buyers = len(by_person)
    gaps, cohorts = [], {}
    for dates in by_person.values():
        dates.sort()
        month = dates[0].strftime("%Y-%m")
        c = cohorts.setdefault(month, {"month": month, "new_customers": 0, "back_within_30": 0, "back_within_60": 0, "back_within_90": 0,
                                       "old_enough_30": 0, "old_enough_60": 0, "old_enough_90": 0})
        c["new_customers"] += 1
        age = (now - dates[0]).days
        second = (dates[1] - dates[0]).days if len(dates) > 1 else None
        if second is not None:
            gaps.append(second)
        for d in (30, 60, 90):
            if age >= d:                       # only customers who have had the full window count
                c[f"old_enough_{d}"] += 1
                if second is not None and second <= d:
                    c[f"back_within_{d}"] += 1
    gaps.sort()
    repeaters = sum(1 for d in by_person.values() if len(d) > 1)

    today = now.strftime("%Y-%m-%d")
    soon = (now + timedelta(days=EXPIRING_WITHIN_DAYS)).strftime("%Y-%m-%d")
    plans_by_person: dict = {}
    dabba = {"plans_sold": 0, "weekly": 0, "monthly": 0, "running": 0, "expiring_soon": 0, "cancelled": 0,
             "finished": 0, "meals_sold": 0, "meals_skipped": 0, "makeup_meals": 0}
    plan_ids = []
    async for s in db.subscriptions.find({}, {"_id": 0, "audit_trail": 0, "internal_notes": 0}):
        if s.get("user_id") in admin_ids:
            continue
        dabba["plans_sold"] += 1
        plan_ids.append(s.get("id"))
        if s.get("plan") in PLAN_MEALS:
            dabba[s["plan"]] += 1
            dabba["meals_sold"] += PLAN_MEALS[s["plan"]]
        end = s.get("end_date") or ""
        running = s.get("status") == "active" and (not end or end >= today)
        if s.get("status") == "cancelled":
            dabba["cancelled"] += 1
        elif running:
            dabba["running"] += 1
            dabba["expiring_soon"] += bool(end and end <= soon)
        else:
            dabba["finished"] += 1
        who = s.get("user_id") or s.get("email_key") or _key(s.get("customer_email"))
        if who:
            plans_by_person.setdefault(who, []).append({"at": _as_dt(s.get("created_at")) or now, "plan": s.get("plan"),
                                                        "running": running, "cancelled": s.get("status") == "cancelled"})
    if plan_ids:
        async for d in db.delivery_tracking.find({"sub_id": {"$in": plan_ids}, "status": "skipped"}, {"_id": 0}):
            dabba["meals_skipped"] += 1
            dabba["makeup_meals"] += bool(d.get("made_up"))

    started_weekly = finished_first = came_back = weekly_to_monthly = 0
    for plans in plans_by_person.values():
        plans.sort(key=lambda p: p["at"])
        first = plans[0]
        started_weekly += first["plan"] == "weekly"
        if not first["running"]:                    # their first plan is over, one way or another
            finished_first += 1
            came_back += len(plans) > 1
        weekly_to_monthly += first["plan"] == "weekly" and any(p["plan"] == "monthly" for p in plans[1:])
    dabba.update(
        subscribers_ever=len(plans_by_person),
        started_with_a_weekly_plan=started_weekly,
        first_plan_finished=finished_first,
        bought_again_after_first_plan=came_back,
        moved_from_weekly_to_monthly=weekly_to_monthly,
        skip_rate=round(dabba["meals_skipped"] / dabba["meals_sold"], 3) if dabba["meals_sold"] else None,
        renewal_rate=round(came_back / finished_first, 3) if finished_first else None,
    )
    order_people = set(by_person)
    return {
        "orders": {
            "buyers": buyers,
            "ordered_more_than_once": repeaters,
            "repeat_rate": round(repeaters / buyers, 3) if buyers else None,
            "median_days_to_second_order": gaps[len(gaps) // 2] if gaps else None,
            "buyers_who_also_took_a_plan": sum(1 for who in plans_by_person if who in order_people),
        },
        "cohorts": sorted(cohorts.values(), key=lambda c: c["month"], reverse=True)[:12],
        "dabba": dabba,
        "note": "Counts come from orders and plans on record. Rates are left blank until there is something to divide by.",
    }
