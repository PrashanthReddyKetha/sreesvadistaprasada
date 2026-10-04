"""Marketing automations: the right message, to the right customer, once.

Each automation is a fixed, readable rule — who qualifies, what they are sent — not a
free-form builder. Every one is OFF until an admin switches it on, and can be previewed
(who would receive it, and the exact message) without sending anything.

Safeguards, all enforced here:
- off by default; switching on is an admin action and is recorded
- never to someone who unsubscribed (the email sender also checks)
- never the same message twice for the same reason (unique claim per automation + reason)
- no customer gets more than one automation message in any 7 days
- a daily cap per automation, so a mistake cannot become a mass mailing
- sent only in UK daytime
"""
import asyncio
import logging
from datetime import datetime, timedelta
from html import escape
from typing import Optional
from zoneinfo import ZoneInfo

from pymongo.errors import DuplicateKeyError

from database import db
from notifications import SITE_URL, _wrap, email_opted_out, send_email

logger = logging.getLogger(__name__)
LONDON = ZoneInfo("Europe/London")

DAILY_CAP = 40                 # per automation, per day
QUIET_DAYS = 7                 # gap between automation messages to one customer
RESULT_WINDOW_DAYS = 14        # an order within this long of a message counts as "ordered after"


def _first(name: str) -> str:
    parts = (name or "").split()
    return escape(parts[0]) if parts else "there"


def _offer(code: Optional[str]) -> str:
    if not code:
        return ""
    return (f'<p style="text-align:center;margin:18px 0;padding:12px;background:#FAF8F4;border-radius:10px">'
            f'A small thank-you: use the code <b>{escape(code)}</b> at checkout.</p>')


def _days_since(iso: Optional[str], now: datetime) -> Optional[int]:
    if not iso:
        return None
    try:
        return (now - datetime.fromisoformat(iso)).days
    except ValueError:
        return None


# ── The catalogue ────────────────────────────────────────────────────────────
# who(c, now) -> the reason this customer qualifies today (used as the send-once key), or None.

def _who_first_order(c: dict, now: datetime):
    d = _days_since(c.get("last_order"), now)
    return "first-order" if c["orders"] == 1 and not c["active_plan"] and d is not None and 3 <= d <= 14 else None


def _who_going_quiet(c: dict, now: datetime):
    return f'quiet-since-{(c.get("last_order") or "")[:10]}' if "at_risk" in (c.get("flags") or []) else None


def _who_lapsed(c: dict, now: datetime):
    d = _days_since(c.get("last_activity"), now)
    if c["segment"] == "lapsed" and c["orders"] >= 1 and d is not None and 60 < d <= 180:
        return f'lapsed-since-{(c.get("last_activity") or "")[:10]}'
    return None


def _who_plan_finished(c: dict, now: datetime):
    end = c.get("last_plan_end")
    if c.get("dabba_stage") != "expired" or not end:
        return None
    try:
        d = (now.date() - datetime.strptime(end, "%Y-%m-%d").date()).days
    except ValueError:
        return None
    return f"plan-ended-{end}" if 7 <= d <= 30 else None


def _msg_first_order(c: dict, code: Optional[str]):
    return "How was your first order?", _wrap(
        "Thank you for trying us",
        f"<p>Hi {_first(c['name'])}, thank you for your first order from our kitchen in Greenleys.</p>"
        "<p>We cook Telugu home food the way it is made at home, and we would love to cook for you again. "
        "If anything was not right, just reply to this email and tell us — we read every message.</p>"
        "<p>Next time, you might like to try a dosa for breakfast, a rice bowl for lunch, or one of the Andhra curries.</p>"
        + _offer(code), "See the menu", f"{SITE_URL}/order?utm_source=email&utm_medium=automation&utm_campaign=first_order")


def _msg_going_quiet(c: dict, code: Optional[str]):
    return "It has been a little while", _wrap(
        "We have missed cooking for you",
        f"<p>Hi {_first(c['name'])}, it has been a few weeks since your last order, so we wanted to say hello.</p>"
        "<p>The kitchen is cooking fresh every day — breakfast dosas and idli from the morning, curries, biryani and rice bowls through the day.</p>"
        + _offer(code), "Order for collection", f"{SITE_URL}/order?utm_source=email&utm_medium=automation&utm_campaign=going_quiet")


def _msg_lapsed(c: dict, code: Optional[str]):
    return "Still cooking, if you are hungry", _wrap(
        "A note from our kitchen",
        f"<p>Hi {_first(c['name'])}, you ordered from us a while ago and we hope you enjoyed it.</p>"
        "<p>We are still here in Greenleys, cooking Andhra home food to order. If you would like to hear from us less, "
        "the unsubscribe link below takes one tap.</p>"
        + _offer(code), "See what is cooking", f"{SITE_URL}/order?utm_source=email&utm_medium=automation&utm_campaign=lapsed")


def _msg_plan_finished(c: dict, code: Optional[str]):
    return "Would you like your Dabba Wala back?", _wrap(
        "Your tiffin plan",
        f"<p>Hi {_first(c['name'])}, your Dabba Wala plan finished recently. We hope the meals made your days a little easier.</p>"
        "<p>If you would like to start again — for a week or a month — it takes a couple of minutes, and you can skip any day you do not need.</p>"
        + _offer(code), "Start a new plan", f"{SITE_URL}/subscriptions?utm_source=email&utm_medium=automation&utm_campaign=plan_finished")


CATALOGUE = [
    {"id": "first_order", "name": "After a first order",
     "who_text": "Customers with exactly one order, placed 3 to 14 days ago, and no meal plan running.",
     "what_text": "A thank-you, an invitation to reply if anything was wrong, and a nudge to order again.",
     "who": _who_first_order, "message": _msg_first_order},
    {"id": "going_quiet", "name": "Regular customer going quiet",
     "who_text": "Customers with two or more orders and nothing for 30 to 60 days, with no meal plan running.",
     "what_text": "A short hello and a link to order.",
     "who": _who_going_quiet, "message": _msg_going_quiet},
    {"id": "lapsed", "name": "Not seen for two months",
     "who_text": "Customers who have ordered before and have done nothing for 60 to 180 days.",
     "what_text": "One gentle note. Sent once per quiet spell.",
     "who": _who_lapsed, "message": _msg_lapsed},
    {"id": "plan_finished", "name": "After a meal plan finishes",
     "who_text": "Customers whose Dabba Wala plan finished 7 to 30 days ago and who have not started another.",
     "what_text": "An invitation to start a new plan.",
     "who": _who_plan_finished, "message": _msg_plan_finished},
]
BY_ID = {a["id"]: a for a in CATALOGUE}

# Listed in admin so the owner can see them, but not possible yet.
UNAVAILABLE = [
    {"id": "abandoned_basket", "name": "Basket left without ordering",
     "why": "Website visits are not linked to named customers, so the system cannot know whose basket it was. "
            "Needs the owner's decision on linking a signed-in customer's visits to their account."},
]

# Already running elsewhere in the system (shown for completeness; not controlled here).
BUILT_IN = [
    {"name": "Plan ending in 2 days", "what": "Email and WhatsApp reminder, once per plan"},
    {"name": "Plan finished", "what": "One email on the day the plan ends"},
    {"name": "Order and delivery updates", "what": "Email and WhatsApp at each step of an order"},
    {"name": "Review request", "what": "Email and text after an order or meal is delivered, once"},
    {"name": "Back in stock / kitchen reopened", "what": "To customers who asked to be told"},
]


async def settings_for(automation_id: str) -> dict:
    doc = await db.automation_settings.find_one({"id": automation_id}, {"_id": 0})
    return doc or {"id": automation_id, "enabled": False, "coupon_code": None}


async def audience(automation_id: str, now: Optional[datetime] = None) -> list:
    """Everyone who would be sent this automation right now, after every safeguard."""
    from routes.customers import build_customers
    now = now or datetime.utcnow()
    a = BY_ID[automation_id]
    recently = {s["email"] async for s in db.automation_sends.find(
        {"at": {"$gte": now - timedelta(days=QUIET_DAYS)}}, {"_id": 0, "email": 1})}
    out = []
    for c in await build_customers(now):
        reason = a["who"](c, now)
        if not reason or not c.get("email"):
            continue
        skip = None
        if await email_opted_out(c["email"]):
            skip = "unsubscribed"
        elif c["email"] in recently:
            skip = f"had another message in the last {QUIET_DAYS} days"
        elif await db.automation_sends.find_one({"automation": automation_id, "email": c["email"], "reason": reason}, {"_id": 1}):
            skip = "already sent for this reason"
        out.append({"email": c["email"], "name": c["name"], "reason": reason, "skip": skip, "customer": c})
    return out


async def run(automation_id: str, now: Optional[datetime] = None) -> dict:
    """Send to today's audience. Returns counts. Safe to call repeatedly."""
    now = now or datetime.utcnow()
    a, cfg = BY_ID[automation_id], await settings_for(automation_id)
    if not cfg.get("enabled"):
        return {"sent": 0, "skipped": 0, "reason": "switched off"}
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    sent_today = await db.automation_sends.count_documents({"automation": automation_id, "at": {"$gte": start_of_day}})
    sent = skipped = 0
    for person in await audience(automation_id, now):
        if person["skip"]:
            skipped += 1
            continue
        if sent_today + sent >= DAILY_CAP:
            break
        try:    # the unique index makes this claim atomic: two runs cannot both send
            await db.automation_sends.insert_one({
                "automation": automation_id, "email": person["email"], "reason": person["reason"], "at": now})
        except DuplicateKeyError:
            skipped += 1
            continue
        subject, html = a["message"](person["customer"], cfg.get("coupon_code"))
        send_email(person["email"], subject, html, kind="marketing")
        sent += 1
    if sent:
        logger.info("Automation %s: sent %s, skipped %s", automation_id, sent, skipped)
    return {"sent": sent, "skipped": skipped}


async def results(automation_id: str, now: Optional[datetime] = None) -> dict:
    """What happened after the messages went out: did those customers order?"""
    now = now or datetime.utcnow()
    sends = await db.automation_sends.find({"automation": automation_id}, {"_id": 0}).to_list(None)
    ordered = income = 0
    for s in sends:
        window_end = s["at"] + timedelta(days=RESULT_WINDOW_DAYS)
        order = await db.orders.find_one({
            "customer_email": {"$regex": f"^{__import__('re').escape(s['email'])}$", "$options": "i"},
            "status": {"$ne": "cancelled"}, "created_at": {"$gt": s["at"], "$lte": window_end}}, {"_id": 0, "total": 1})
        if order:
            ordered += 1
            income += float(order.get("total") or 0)
    last = max((s["at"] for s in sends), default=None)
    return {"sent": len(sends), "ordered_after": ordered, "income_after": round(income, 2),
            "last_sent": last.isoformat() if last else None, "window_days": RESULT_WINDOW_DAYS}


async def automation_loop():
    """Every 30 minutes in UK daytime, run whatever is switched on."""
    while True:
        try:
            if 10 <= datetime.now(LONDON).hour < 18:
                for a in CATALOGUE:
                    await run(a["id"])
        except asyncio.CancelledError:
            raise
        except Exception as e:
            logger.error("Automation tick failed: %s", e)
        await asyncio.sleep(1800)
