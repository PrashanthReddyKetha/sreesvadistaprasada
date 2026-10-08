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
import re
import logging
from datetime import datetime, timedelta
from html import escape
from typing import Optional
from zoneinfo import ZoneInfo

from pymongo.errors import DuplicateKeyError

from database import db
from heartbeat import beat
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


# ── The words of each message ────────────────────────────────────────────────
# The owner can change these in Admin › Automations (kept in settings "message_texts"). Paragraphs are separated by a
# blank line; {first_name} is filled in. Any offer code is added after the last paragraph. The link is not editable.

TEXTS = {
    "first_order": {
        "subject": "How was your first order?", "heading": "Thank you for trying us",
        "body": "Hi {first_name}, thank you for your first order from our kitchen in Greenleys.\n\n"
                "We cook Telugu home food the way it is made at home, and we would love to cook for you again. "
                "If anything was not right, just reply to this email and tell us — we read every message.\n\n"
                "Next time, you might like to try a dosa for breakfast, a rice bowl for lunch, or one of the Andhra curries.",
        "button": "See the menu", "link": "/order?utm_source=email&utm_medium=automation&utm_campaign=first_order"},
    "going_quiet": {
        "subject": "It has been a little while", "heading": "We have missed cooking for you",
        "body": "Hi {first_name}, it has been a few weeks since your last order, so we wanted to say hello.\n\n"
                "The kitchen is cooking fresh every day — breakfast dosas and idli from the morning, curries, biryani and rice bowls through the day.",
        "button": "Order for collection", "link": "/order?utm_source=email&utm_medium=automation&utm_campaign=going_quiet"},
    "lapsed": {
        "subject": "Still cooking, if you are hungry", "heading": "A note from our kitchen",
        "body": "Hi {first_name}, you ordered from us a while ago and we hope you enjoyed it.\n\n"
                "We are still here in Greenleys, cooking Andhra home food to order. If you would like to hear from us less, "
                "the unsubscribe link below takes one tap.",
        "button": "See what is cooking", "link": "/order?utm_source=email&utm_medium=automation&utm_campaign=lapsed"},
    "plan_finished": {
        "subject": "Would you like your Dabba Wala back?", "heading": "Your tiffin plan",
        "body": "Hi {first_name}, your Dabba Wala plan finished recently. We hope the meals made your days a little easier.\n\n"
                "If you would like to start again — for a week or a month — it takes a couple of minutes, and you can skip any day you do not need.",
        "button": "Start a new plan", "link": "/subscriptions?utm_source=email&utm_medium=automation&utm_campaign=plan_finished"},
    "second_order": {
        "subject": "Thank you for coming back", "heading": "Two orders in — thank you",
        "body": "Hi {first_name}, thank you for ordering from us a second time. It means a great deal to a small kitchen.\n\n"
                "If you order with an account, every fifth order earns a free dish of your choice.",
        "button": "See the menu", "link": "/order?utm_source=email&utm_medium=automation&utm_campaign=second_order"},
    "reward_waiting": {
        "subject": "Your free dish is waiting", "heading": "You have a free dish to use",
        "body": "Hi {first_name}, your orders have earned you a free dish, and it has not been used yet.\n\n"
                "Choose any dish on your next order and take it off at checkout.",
        "button": "Use my free dish", "link": "/order?utm_source=email&utm_medium=automation&utm_campaign=reward_waiting"},
    "one_away": {
        "subject": "One more order to a free dish", "heading": "You are one order away",
        "body": "Hi {first_name}, your next order is the one that earns you a free dish of your choice.",
        "button": "Order now", "link": "/order?utm_source=email&utm_medium=automation&utm_campaign=one_away"},
    "high_spender": {
        "subject": "A thank-you from our kitchen", "heading": "Thank you",
        "body": "Hi {first_name}, you are one of the people who order from us most, and we wanted to say thank you properly.\n\n"
                "If there is a dish from home you wish we cooked, reply and tell us. We read every message.",
        "button": "See the menu", "link": "/order?utm_source=email&utm_medium=automation&utm_campaign=high_spender"},
    "tiffin_intro": {
        "subject": "Have you seen our Dabba Wala?", "heading": "Home-cooked meals, every weekday",
        "body": "Hi {first_name}, as you order from us regularly, you might like our Dabba Wala: a freshly cooked tiffin every weekday, "
                "for a week or a month, vegetarian or non-vegetarian.\n\n"
                "Rice, pickle and papad are always in the box; the dal, curry and sabzi change every day. You can skip any day you do not need.",
        "button": "See the plans", "link": "/subscriptions?utm_source=email&utm_medium=automation&utm_campaign=tiffin_intro"},
    "newsletter_welcome": {
        "subject": "Welcome to Sree Svadista Prasada", "heading": "Thank you for joining us",
        "body": "Thank you for signing up. We are a home kitchen in Greenleys, Milton Keynes, cooking Telugu and Andhra food to order — "
                "dosas and idli in the morning, curries, biryani and rice bowls through the day.\n\n"
                "We will write only when there is something worth telling you.",
        "button": "See the menu", "link": "/menu?utm_source=email&utm_medium=automation&utm_campaign=newsletter_welcome"},
    "account_no_order": {
        "subject": "Your account is ready when you are", "heading": "Ready when you are",
        "body": "Hi {first_name}, you opened an account with us a few days ago. Whenever you are hungry, ordering takes a couple of minutes "
                "and you collect from Greenleys.\n\n"
                "With an account, every fifth order earns a free dish.",
        "button": "See the menu", "link": "/order?utm_source=email&utm_medium=automation&utm_campaign=account_no_order"},
}
EDITABLE = ("subject", "heading", "body", "button")
LIMITS = {"subject": 120, "heading": 120, "body": 3000, "button": 40}


async def text_for(automation_id: str) -> dict:
    """The words as they will be sent: the owner's version where there is one, otherwise the original."""
    doc = await db.settings.find_one({"_id": "message_texts"}, {"_id": 0, automation_id: 1}) or {}
    own = doc.get(automation_id) or {}
    return {**TEXTS[automation_id], **{k: own[k] for k in EDITABLE if own.get(k)}}


def render(automation_id: str, text: dict, c: dict, code: Optional[str]) -> tuple:
    """Subject and HTML for one customer. The owner's words are plain text: escaped, then split into paragraphs."""
    paragraphs = [escape(p.strip()).replace("{first_name}", _first(c.get("name"))) for p in str(text["body"]).split("\n\n") if p.strip()]
    html = _wrap(escape(text["heading"]), "".join(f"<p>{p}</p>" for p in paragraphs) + _offer(code),
                 escape(text["button"]), f"{SITE_URL}{TEXTS[automation_id]['link']}")
    return str(text["subject"]).replace("{first_name}", _first(c.get("name"))), html


async def message(automation_id: str, c: dict, code: Optional[str]) -> tuple:
    return render(automation_id, await text_for(automation_id), c, code)


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


def _who_second_order(c: dict, now: datetime):
    d = _days_since(c.get("last_order"), now)
    return "second-order" if c["orders"] == 2 and d is not None and 2 <= d <= 10 else None


def _who_reward_waiting(c: dict, now: datetime):
    d = _days_since(c.get("last_order"), now)
    if c.get("loyalty_reward_waiting") and d is not None and d >= 7:
        return f'reward-waiting-since-{(c.get("last_order") or "")[:10]}'
    return None


def _who_one_away(c: dict, now: datetime):
    d = _days_since(c.get("last_order"), now)
    n = c.get("loyalty_orders") or 0
    if c.get("has_account") and n % 5 == 4 and not c.get("loyalty_reward_waiting") and d is not None and 3 <= d <= 21:
        return f"one-away-at-{n}"
    return None


def _who_high_spender(c: dict, now: datetime):
    return "high-spender" if "high_value" in (c.get("flags") or []) else None


def _who_orders_no_plan(c: dict, now: datetime):
    d = _days_since(c.get("last_order"), now)
    return "tiffin-intro" if c.get("dabba_stage") == "prospect" and c["orders"] >= 3 and d is not None and d <= 30 else None


def _who_newsletter_welcome(c: dict, now: datetime):
    d = _days_since(c.get("joined"), now)
    return "newsletter-welcome" if c.get("newsletter") and c["orders"] == 0 and c["plans"] == 0 and d is not None and d <= 3 else None


def _who_account_no_order(c: dict, now: datetime):
    d = _days_since(c.get("joined"), now)
    if c.get("has_account") and c["orders"] == 0 and c["plans"] == 0 and c["cancelled_orders"] == 0 and d is not None and 3 <= d <= 14:
        return "account-no-order"
    return None


CATALOGUE = [
    {"id": "first_order", "name": "After a first order",
     "who_text": "Customers with exactly one order, placed 3 to 14 days ago, and no meal plan running.",
     "what_text": "A thank-you, an invitation to reply if anything was wrong, and a nudge to order again.",
     "who": _who_first_order},
    {"id": "going_quiet", "name": "Regular customer going quiet",
     "who_text": "Customers with two or more orders and nothing for 30 to 60 days, with no meal plan running.",
     "what_text": "A short hello and a link to order.",
     "who": _who_going_quiet},
    {"id": "lapsed", "name": "Not seen for two months",
     "who_text": "Customers who have ordered before and have done nothing for 60 to 180 days.",
     "what_text": "One gentle note. Sent once per quiet spell.",
     "who": _who_lapsed},
    {"id": "plan_finished", "name": "After a meal plan finishes",
     "who_text": "Customers whose Dabba Wala plan finished 7 to 30 days ago and who have not started another.",
     "what_text": "An invitation to start a new plan.",
     "who": _who_plan_finished},
    {"id": "second_order", "name": "After a second order",
     "who_text": "Customers whose second order was placed 2 to 10 days ago.",
     "what_text": "A thank-you and a reminder that every fifth order earns a free dish.",
     "who": _who_second_order},
    {"id": "reward_waiting", "name": "Free dish earned but not used",
     "who_text": "Account holders with a free loyalty dish waiting and no order for a week or more.",
     "what_text": "A reminder that the free dish is there.",
     "who": _who_reward_waiting},
    {"id": "one_away", "name": "One order from a free dish",
     "who_text": "Account holders whose next order earns the free dish, last ordered 3 to 21 days ago.",
     "what_text": "Tells them their next order earns it.",
     "who": _who_one_away},
    {"id": "high_spender", "name": "Thank-you to your best customers",
     "who_text": "Customers who have spent £150 or more in total. Sent once, ever.",
     "what_text": "A personal thank-you and an invitation to suggest a dish.",
     "who": _who_high_spender},
    {"id": "tiffin_intro", "name": "Regular customer who has never tried Dabba Wala",
     "who_text": "Three or more orders, the latest within 30 days, and never a meal plan. Sent once, ever.",
     "what_text": "Introduces the tiffin plans.",
     "who": _who_orders_no_plan},
    {"id": "newsletter_welcome", "name": "Welcome to the newsletter",
     "who_text": "People who joined the newsletter in the last 3 days and have not ordered.",
     "what_text": "A short welcome saying who you are and what you cook.",
     "who": _who_newsletter_welcome},
    {"id": "account_no_order", "name": "Account opened, nothing ordered",
     "who_text": "People who opened an account 3 to 14 days ago and have not ordered.",
     "what_text": "A gentle nudge to place a first order.",
     "who": _who_account_no_order},
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


async def marketing_consented(email: str) -> bool:
    """The person's most recent choice about offers wins — a later unticked box or "off" in My Account withdraws an
    earlier yes. Joining the newsletter counts as yes. Unsubscribing always wins (A-0004 SEC-003 / MKT-008)."""
    from notifications import email_opted_out
    key = (email or "").strip().lower()
    if not key or await email_opted_out(key):
        return False
    choices = []
    user = await db.users.find_one({"email": key}, {"_id": 0, "marketing_consent": 1, "marketing_consent_at": 1})
    if user and user.get("marketing_consent") is not None:
        choices.append((user.get("marketing_consent_at") or datetime.min, bool(user["marketing_consent"])))
    for coll in (db.orders, db.subscriptions):
        doc = await coll.find_one({"customer_email": key, "marketing_consent": {"$exists": True}},
                                  {"_id": 0, "marketing_consent": 1, "marketing_consent_at": 1}, sort=[("marketing_consent_at", -1)])
        if doc:
            choices.append((doc.get("marketing_consent_at") or datetime.min, bool(doc["marketing_consent"])))
    if choices:
        latest = max(choices, key=lambda c: c[0] if isinstance(c[0], datetime) else datetime.min)
        if latest[1]:
            return True
        news = await db.newsletter.find_one({"email": {"$regex": f"^{re.escape(key)}$", "$options": "i"}, "active": {"$ne": False}}, {"_id": 0, "created_at": 1})
        joined = news.get("created_at") if news else None
        if isinstance(joined, str):
            try:
                joined = datetime.fromisoformat(joined.replace("Z", ""))
            except ValueError:
                joined = None
        # newsletter sign-up counts unless a dated "no" came after it
        return news is not None and (joined is None or latest[0] == datetime.min or (isinstance(joined, datetime) and joined > latest[0]))
    return bool(await db.newsletter.find_one({"email": {"$regex": f"^{re.escape(key)}$", "$options": "i"}, "active": {"$ne": False}}, {"_id": 1}))


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
        if not reason or not c.get("email") or c.get("is_test"):      # a test account is never sent a customer message
            continue
        skip = None
        if await email_opted_out(c["email"]):
            skip = "unsubscribed"
        elif not await marketing_consented(c["email"]):
            skip = "has not asked for offers"                     # consent-based since 2026-10-07 (owner decision, A-0003 MKT-001)
        elif c["email"] in recently:
            skip = f"had another message in the last {QUIET_DAYS} days"
        elif await db.automation_sends.find_one({"automation": automation_id, "email": c["email"], "reason": reason}, {"_id": 1}):
            skip = "already sent for this reason"
        out.append({"email": c["email"], "name": c["name"], "reason": reason, "skip": skip, "customer": c})
    return out


async def all_paused() -> bool:
    """One switch that stops every customer message the system sends on its own (A-0003, MKT-006)."""
    doc = await db.settings.find_one({"_id": "automations"}, {"_id": 0, "paused": 1})
    return bool(doc and doc.get("paused"))


async def run(automation_id: str, now: Optional[datetime] = None, local_hour: Optional[int] = None) -> dict:
    """Send to today's audience. Returns counts. Safe to call repeatedly."""
    now = now or datetime.utcnow()
    a, cfg = BY_ID[automation_id], await settings_for(automation_id)
    if not cfg.get("enabled"):
        return {"sent": 0, "skipped": 0, "reason": "switched off"}
    if await all_paused():
        return {"sent": 0, "skipped": 0, "reason": "all messages paused"}
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    sent_today = await db.automation_sends.count_documents({"automation": automation_id, "at": {"$gte": start_of_day}})
    sent = skipped = 0
    text = await text_for(automation_id)
    for person in await audience(automation_id, now):
        if person["skip"]:
            skipped += 1
            continue
        usual = person["customer"].get("usual_order_hour")
        hour = (local_hour if local_hour is not None else datetime.now(LONDON).hour)
        if usual is not None and 11 <= usual <= 18 and hour < usual - 1:
            continue        # wait: it will go out an hour before they usually order
        if sent_today + sent >= DAILY_CAP:
            break
        try:    # the unique index makes this claim atomic: two runs cannot both send
            await db.automation_sends.insert_one({
                "automation": automation_id, "email": person["email"], "reason": person["reason"], "at": now})
        except DuplicateKeyError:
            skipped += 1
            continue
        subject, html = render(automation_id, text, person["customer"], cfg.get("coupon_code"))
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
            await beat("automations")
        except asyncio.CancelledError:
            raise
        except Exception as e:
            logger.error("Automation tick failed: %s", e)
        await asyncio.sleep(1800)
