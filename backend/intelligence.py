"""The system looking after itself: measure, notice change, decide, act, log, and check later whether it worked.

Runs once a night (and on demand). Everything here is ordinary code — no AI call.

What it may do by itself (small, reversible, always logged with the reason and an undo):
  - choose which dishes are featured, from what is actually selling
  - fill in "goes well with" for dishes that have none, from what is bought together
  - switch off an automation that is causing unsubscribes
  - email the owner when a number moves sharply
What it only ever recommends: anything about prices, terms, refunds, the menu itself, or wording.
What it never does without enough data: anything. Each rule states its minimum, and "not enough
data yet — nothing changed" is a normal, logged result.
"""
import asyncio
import logging
import statistics
import uuid
from datetime import datetime, timedelta
from typing import Optional
from zoneinfo import ZoneInfo

from database import db
from heartbeat import beat
from notifications import notify_admin

logger = logging.getLogger(__name__)
LONDON = ZoneInfo("Europe/London")

# ── Minimums: below these the system watches and does nothing ────────────────
MIN_DISH_ORDERS_FOR_FEATURED = 30     # dish portions sold in the window before featured dishes follow sales
FEATURED_WINDOW_DAYS = 14
MIN_BOUGHT_TOGETHER = 5               # times two dishes shared a basket before one is suggested with the other
PAIRING_WINDOW_DAYS = 90
MIN_SENDS_TO_JUDGE_AUTOMATION = 10
UNSUBSCRIBE_LIMIT = 0.10              # more than 1 in 10 recipients unsubscribing switches an automation off
MIN_BASELINE_DAYS = 3                 # days of history before a change can be called a change
MIN_SECTION_ORDERS_FOR_ORDERING = 50  # portions sold in a menu section (30 days) before its dishes are put in sales order
ORDERING_WINDOW_DAYS = 30
NEW_DISH_DAYS = 14                    # a new dish is shown near the top for this long, so it gets a fair chance
RETIRE_AFTER_DAYS = 60                # on the menu this long with no sale, while its section sells, is worth a look
SITE_CHECK_PAGES = 60
WEEKLY_DAY = 0                        # Monday: the weekly site check and the weekly report
SITE_URL = "https://sreesvadistaprasada.com"
REVIEW_AFTER_DAYS = 14                # how long before asking "did that work?"
NOT_ON_SALE = {"pickles", "podis"}    # coming soon — never featured (owner rule D-024)

# metric -> (plain name, change that matters, smallest absolute move that matters, which direction is bad)
WATCHED = {
    "visits":          ("Visits", 0.40, 15, "down"),
    "orders":          ("Orders", 0.40, 3, "down"),
    "income":          ("Order income", 0.40, 40.0, "down"),
    "basket_rate":     ("Visits that add to basket", 0.35, 0.05, "down"),
    "checkout_done":   ("Checkouts that finish", 0.30, 0.15, "down"),
    "failures":        ("Failed payments or orders", 1.00, 3, "up"),
    "script_errors":   ("Script errors", 1.00, 5, "up"),
    "unsubscribes":    ("Unsubscribes", 1.00, 3, "up"),
}

DEFAULT_SETTINGS = {"menu_decisions": True, "owner_alerts": True, "customer_messages": False, "ai_investigation": True}


async def get_settings() -> dict:
    doc = await db.settings.find_one({"_id": "intelligence"}) or {}
    return {**DEFAULT_SETTINGS, **{k: v for k, v in doc.items() if k in DEFAULT_SETTINGS},
            "last_run_day": doc.get("last_run_day"), "last_run_at": doc.get("last_run_at")}


async def log_decision(kind: str, noticed: str, decided: str, did: str, level: int = 1,
                       undo: Optional[dict] = None, measure: Optional[dict] = None, by: str = "system") -> dict:
    """One line in "what the system did and why"."""
    doc = {
        "id": str(uuid.uuid4()), "at": datetime.utcnow(), "kind": kind, "by": by, "level": level,
        "noticed": noticed, "decided": decided, "did": did,
        "undo": undo, "undone_at": None, "measure": measure, "outcome": None,
        "response": None,     # for recommendations: the owner's "agreed" or "not now"
    }
    await db.decision_log.insert_one(dict(doc))
    return doc


# ── 1. Measure ───────────────────────────────────────────────────────────────

def _uk_day_bounds(day: str):
    start_local = datetime.strptime(day, "%Y-%m-%d").replace(tzinfo=LONDON)
    to_utc = lambda d: d.astimezone(ZoneInfo("UTC")).replace(tzinfo=None)   # noqa: E731
    return to_utc(start_local), to_utc(start_local + timedelta(days=1))


async def measure_day(day: str) -> dict:
    """The figures for one UK day, stored so later nights need not recount."""
    events = await db.events.find({"day": day}, {"_id": 0, "name": 1, "visit_id": 1}).to_list(None)
    by_visit: dict = {}
    for e in events:
        by_visit.setdefault(e["visit_id"], set()).add(e["name"])
    visits = len(by_visit)
    has = lambda name: sum(1 for names in by_visit.values() if name in names)   # noqa: E731
    began, bought = has("begin_checkout"), has("purchase")
    start, end = _uk_day_bounds(day)
    orders = await db.orders.find({"created_at": {"$gte": start, "$lt": end}, "status": {"$ne": "cancelled"}},
                                  {"_id": 0, "total": 1}).to_list(None)
    m = {
        "day": day, "visits": visits, "orders": len(orders), "income": round(sum(float(o.get("total") or 0) for o in orders), 2),
        "basket_rate": round(has("add_to_cart") / visits, 3) if visits else None,
        "checkout_done": round(bought / began, 3) if began else None,
        "failures": sum(1 for e in events if e["name"] in ("order_placed_failed", "payment_started_failed", "payment_failed")),
        "script_errors": sum(1 for e in events if e["name"] == "site_error"),
        "unsubscribes": await db.email_optouts.count_documents({"at": {"$gte": start, "$lt": end}}),
        "new_accounts": await db.users.count_documents({"created_at": {"$gte": start, "$lt": end}, "role": {"$ne": "admin"}}),
        "measured_at": datetime.utcnow(),
    }
    await db.daily_metrics.update_one({"day": day}, {"$set": m}, upsert=True)
    return m


# ── 2. Notice change ─────────────────────────────────────────────────────────

def compare(today: dict, history: list) -> list:
    """Each watched figure against its own recent normal. Deterministic; no AI."""
    weekday = datetime.strptime(today["day"], "%Y-%m-%d").weekday()
    same_weekday = [h for h in history if datetime.strptime(h["day"], "%Y-%m-%d").weekday() == weekday]
    out = []
    for key, (label, pct, min_move, bad) in WATCHED.items():
        current = today.get(key)
        pool = [h[key] for h in (same_weekday if len(same_weekday) >= MIN_BASELINE_DAYS else history) if h.get(key) is not None]
        row = {"metric": key, "label": label, "current": current, "usual": None, "change": None, "material": False, "worse": False,
               "note": ""}
        if current is None or len(pool) < MIN_BASELINE_DAYS:
            row["note"] = "not enough history yet"
            out.append(row)
            continue
        usual = statistics.mean(pool)
        move = current - usual
        row["usual"] = round(usual, 3)
        row["change"] = round(move / usual, 3) if usual else (1.0 if move > 0 else 0.0)
        big_enough = abs(move) >= min_move and (abs(row["change"]) >= pct or usual == 0)
        row["material"] = bool(big_enough)
        row["worse"] = bool(big_enough and ((bad == "down" and move < 0) or (bad == "up" and move > 0)))
        out.append(row)
    return out


# ── 3. Decide and act ────────────────────────────────────────────────────────

async def _sales(days: int) -> tuple:
    """Portions sold per dish, and how often each pair shared a basket."""
    since = datetime.utcnow() - timedelta(days=days)
    sold, together = {}, {}
    async for o in db.orders.find({"created_at": {"$gte": since}, "status": {"$ne": "cancelled"}}, {"_id": 0, "items": 1}):
        ids = []
        for i in o.get("items") or []:
            mid = i.get("menu_item_id") or i.get("id")
            if mid:
                sold[mid] = sold.get(mid, 0) + int(i.get("quantity") or 1)
                ids.append(mid)
        for a in set(ids):
            for b in set(ids):
                if a != b:
                    together.setdefault(a, {})
                    together[a][b] = together[a].get(b, 0) + 1
    return sold, together


async def decide_featured() -> dict:
    """Featured dishes follow what is selling — once there is enough selling to follow."""
    sold, _ = await _sales(FEATURED_WINDOW_DAYS)
    total = sum(sold.values())
    current = await db.menu_items.find({"featured": True}, {"_id": 0, "id": 1, "name": 1}).to_list(None)
    if total < MIN_DISH_ORDERS_FOR_FEATURED:
        return {"changed": False, "why": f"{total} portions sold in {FEATURED_WINDOW_DAYS} days; featured dishes follow sales from {MIN_DISH_ORDERS_FOR_FEATURED}"}
    how_many = len(current) or 12
    menu = {m["id"]: m async for m in db.menu_items.find({"available": True}, {"_id": 0, "id": 1, "name": 1, "category": 1, "sold_out_today": 1})}
    ranked = [mid for mid, _ in sorted(sold.items(), key=lambda kv: -kv[1])
              if mid in menu and (menu[mid].get("category") or "").lower() not in NOT_ON_SALE and not menu[mid].get("sold_out_today")]
    chosen = ranked[:how_many]
    keep = [c["id"] for c in current if c["id"] in menu and c["id"] not in chosen]     # fill any gap with what was there
    chosen += keep[: how_many - len(chosen)]
    before = sorted(c["id"] for c in current)
    if sorted(chosen) == before:
        return {"changed": False, "why": "the featured dishes already match the best sellers"}
    await db.menu_items.update_many({"featured": True}, {"$set": {"featured": False}})
    await db.menu_items.update_many({"id": {"$in": chosen}}, {"$set": {"featured": True}})
    added = [menu[i]["name"] for i in chosen if i not in before]
    removed = [c["name"] for c in current if c["id"] not in chosen]
    await log_decision(
        "featured dishes",
        f"{total} portions sold in the last {FEATURED_WINDOW_DAYS} days. Best sellers differ from the dishes featured on the home page.",
        "Feature the dishes customers are actually ordering.",
        f"Now featured: {', '.join(added) or 'no new dishes'}. No longer featured: {', '.join(removed) or 'none'}.",
        undo={"type": "featured", "ids": before},
        measure={"type": "orders_per_day", "before": round(await _orders_per_day(14, 0), 2)})
    return {"changed": True, "added": added, "removed": removed}


async def decide_order() -> dict:
    """Within each menu section, best sellers first — once the section has sold enough to know.
    New dishes are placed second so they are seen. Sections without enough sales stay alphabetical."""
    since = datetime.utcnow() - timedelta(days=ORDERING_WINDOW_DAYS)
    sold: dict = {}
    async for o in db.orders.find({"created_at": {"$gte": since}, "status": {"$ne": "cancelled"}}, {"_id": 0, "items": 1}):
        for i in o.get("items") or []:
            mid = i.get("menu_item_id") or i.get("id")
            if mid:
                sold[mid] = sold.get(mid, 0) + int(i.get("quantity") or 1)
    sections: dict = {}
    async for m in db.menu_items.find({"available": True}, {"_id": 0, "id": 1, "name": 1, "category": 1, "subcategory": 1, "created_at": 1, "sort_rank": 1}):
        sections.setdefault((m.get("category"), m.get("subcategory") or ""), []).append(m)
    ranked_sections, changes = [], 0
    new_cutoff = datetime.utcnow() - timedelta(days=NEW_DISH_DAYS)
    for (category, sub), dishes in sections.items():
        total = sum(sold.get(d["id"], 0) for d in dishes)
        if total < MIN_SECTION_ORDERS_FOR_ORDERING:
            continue
        by_sales = sorted(dishes, key=lambda d: (-sold.get(d["id"], 0), d["name"]))
        fresh = [d for d in by_sales if isinstance(d.get("created_at"), datetime) and d["created_at"] >= new_cutoff and sold.get(d["id"], 0) == 0]
        ordered = [d for d in by_sales if d not in fresh]
        ordered[1:1] = fresh                           # new, unsold dishes go straight after the best seller
        before = {d["id"]: d.get("sort_rank") for d in dishes}
        for rank, d in enumerate(ordered, start=1):
            if before[d["id"]] != rank:
                await db.menu_items.update_one({"id": d["id"]}, {"$set": {"sort_rank": rank}})
                changes += 1
        if any(before[d["id"]] != r for r, d in enumerate(ordered, start=1)):
            ranked_sections.append({"section": f"{category} / {sub}" if sub else str(category), "first": ordered[0]["name"],
                                    "before": before})
    if ranked_sections:
        await log_decision(
            "dish order",
            f"{len(ranked_sections)} menu section{'s have' if len(ranked_sections) != 1 else ' has'} sold at least {MIN_SECTION_ORDERS_FOR_ORDERING} portions in {ORDERING_WINDOW_DAYS} days.",
            "Show best sellers first in those sections; new dishes second so they are seen. Other sections stay alphabetical.",
            "; ".join(f"{r['section']}: now led by {r['first']}" for r in ranked_sections[:10]),
            undo={"type": "order", "ranks": {k: v for r in ranked_sections for k, v in r["before"].items()}},
            measure={"type": "orders_per_day", "before": round(await _orders_per_day(14, 0), 2)})
    return {"sections": len(ranked_sections), "changes": changes}


async def decide_pairings() -> dict:
    """Dishes with no "goes well with" get one from what is bought together. Owner-set pairings are never touched."""
    _, together = await _sales(PAIRING_WINDOW_DAYS)
    menu = {m["id"]: m async for m in db.menu_items.find({"available": True}, {"_id": 0, "id": 1, "name": 1, "pairs_with": 1, "category": 1})}
    filled = []
    for mid, m in menu.items():
        if m.get("pairs_with"):
            continue
        partners = [(other, n) for other, n in (together.get(mid) or {}).items()
                    if n >= MIN_BOUGHT_TOGETHER and other in menu and (menu[other].get("category") or "").lower() not in NOT_ON_SALE]
        if not partners:
            continue
        best = [other for other, _ in sorted(partners, key=lambda kv: -kv[1])[:3]]
        await db.menu_items.update_one({"id": mid}, {"$set": {"pairs_with": best, "pairs_with_set_by": "system"}})
        filled.append({"id": mid, "name": m["name"], "with": [menu[b]["name"] for b in best]})
    if filled:
        await log_decision(
            "goes well with",
            f"{len(filled)} dish{'es' if len(filled) != 1 else ''} had no suggestion, and customers have bought them with other dishes at least {MIN_BOUGHT_TOGETHER} times.",
            "Suggest what customers already buy together.",
            "; ".join(f"{f['name']} → {', '.join(f['with'])}" for f in filled[:12]) + ("…" if len(filled) > 12 else ""),
            undo={"type": "pairings", "ids": [f["id"] for f in filled]})
    return {"filled": len(filled)}


async def guard_automations() -> list:
    """An automation that makes people unsubscribe is switched off first and explained after."""
    stopped = []
    since = datetime.utcnow() - timedelta(days=14)
    async for cfg in db.automation_settings.find({"enabled": True}, {"_id": 0}):
        sends = await db.automation_sends.find({"automation": cfg["id"], "at": {"$gte": since}}, {"_id": 0}).to_list(None)
        if len(sends) < MIN_SENDS_TO_JUDGE_AUTOMATION:
            continue
        left = 0
        for s in sends:
            out = await db.email_optouts.find_one({"email": s["email"]}, {"_id": 0, "at": 1})
            if out and out.get("at") and s["at"] <= out["at"] <= s["at"] + timedelta(days=7):
                left += 1
        rate = left / len(sends)
        if rate > UNSUBSCRIBE_LIMIT:
            await db.automation_settings.update_one({"id": cfg["id"]}, {"$set": {
                "enabled": False, "updated_by": "the system", "updated_at": datetime.utcnow().isoformat()}})
            await log_decision(
                "automation switched off",
                f"{left} of the last {len(sends)} people sent this message unsubscribed within a week ({round(rate * 100)}%). The limit is {round(UNSUBSCRIBE_LIMIT * 100)}%.",
                "Stop sending it until the wording or timing has been looked at.",
                f'Switched off the automation "{cfg["id"].replace("_", " ")}".',
                undo={"type": "automation", "id": cfg["id"]})
            stopped.append(cfg["id"])
    return stopped


async def start_untouched_automations() -> list:
    """Only when the owner has allowed the system to manage customer messages. An automation an admin
    has ever switched off by hand is left alone."""
    from automations import CATALOGUE
    started = []
    for a in CATALOGUE:
        if await db.automation_settings.find_one({"id": a["id"]}, {"_id": 1}):
            continue
        await db.automation_settings.insert_one({"id": a["id"], "enabled": True, "coupon_code": None,
                                                 "updated_by": "the system", "updated_at": datetime.utcnow().isoformat()})
        await log_decision("customer message switched on",
                           f'You have allowed the system to manage customer messages, and "{a["name"]}" had never been set either way.',
                           "Start sending it, within the standing limits (40 a day, one message per customer in 7 days, never to anyone unsubscribed).",
                           f'Switched on "{a["name"]}": {a["who_text"]}', level=2, undo={"type": "automation_off", "id": a["id"]})
        started.append(a["name"])
    return started


async def recommendations() -> list:
    """Things worth a person's attention that the system will not change itself."""
    out = []
    since = datetime.utcnow() - timedelta(days=14)
    names = [m["name"].lower() async for m in db.menu_items.find({"available": True}, {"_id": 0, "name": 1})]
    searches, views = {}, {}
    async for e in db.events.find({"at": {"$gte": since}, "name": {"$in": ["search", "view_item"]}}, {"_id": 0, "name": 1, "props": 1, "items": 1}):
        if e["name"] == "search":
            term = str((e.get("props") or {}).get("term") or "").lower().strip()
            if term:
                searches[term] = searches.get(term, 0) + 1
        else:
            for i in e.get("items") or []:
                if i.get("name"):
                    views[i["name"]] = views.get(i["name"], 0) + 1
    missing = sorted(((t, n) for t, n in searches.items() if n >= 3 and not any(t in name for name in names)), key=lambda kv: -kv[1])[:5]
    if missing:
        out.append(("menu gap", "People searched the menu for things it does not have: " + ", ".join(f'"{t}" ({n} times)' for t, n in missing) + ".",
                    "Worth considering whether to cook any of these, or to point the search at the nearest dish."))
    sold, _ = await _sales(14)
    sold_names = set()
    async for m in db.menu_items.find({"id": {"$in": list(sold)}}, {"_id": 0, "name": 1}):
        sold_names.add(m["name"])
    ignored = sorted(((n, v) for n, v in views.items() if v >= 25 and n not in sold_names), key=lambda kv: -kv[1])[:5]
    if ignored and sum(sold.values()) >= 10:
        out.append(("dish interest", "Dishes opened often but not ordered in two weeks: " + ", ".join(f"{n} (opened {v} times)" for n, v in ignored) + ".",
                    "The photo, price or description may be putting people off. Worth a look."))
    # Dishes to consider retiring: on the menu a long time, never sold, in a section that does sell
    old = datetime.utcnow() - timedelta(days=RETIRE_AFTER_DAYS)
    sold60, _ = await _sales(RETIRE_AFTER_DAYS)
    section_sales, idle = {}, []
    async for m in db.menu_items.find({"available": True}, {"_id": 0, "id": 1, "name": 1, "category": 1, "created_at": 1, "price": 1}):
        section_sales[m.get("category")] = section_sales.get(m.get("category"), 0) + sold60.get(m["id"], 0)
        if not sold60.get(m["id"]) and isinstance(m.get("created_at"), datetime) and m["created_at"] <= old:
            idle.append(m)
    idle = [m for m in idle if section_sales.get(m.get("category"), 0) >= 30 and (m.get("category") or "").lower() not in NOT_ON_SALE][:8]
    if idle:
        out.append(("dishes not selling", f"On the menu for over {RETIRE_AFTER_DAYS} days with no sale, in sections that are selling: " + ", ".join(m["name"] for m in idle) + ".",
                    "Consider a better photo or description, a lower price, or taking them off so the menu is shorter."))

    # Prices worth a look — never changed automatically
    views14, adds14 = {}, {}
    async for e in db.events.find({"at": {"$gte": since}, "name": {"$in": ["view_item", "add_to_cart"]}}, {"_id": 0, "name": 1, "items": 1}):
        for i in e.get("items") or []:
            if i.get("name"):
                bucket = views14 if e["name"] == "view_item" else adds14
                bucket[i["name"]] = bucket.get(i["name"], 0) + 1
    eager = sorted(((n, v, adds14.get(n, 0)) for n, v in views14.items() if v >= 40 and adds14.get(n, 0) / v >= 0.5), key=lambda t: -t[1])[:4]
    shy = sorted(((n, v, adds14.get(n, 0)) for n, v in views14.items() if v >= 40 and adds14.get(n, 0) / v <= 0.05), key=lambda t: -t[1])[:4]
    if eager:
        out.append(("price worth a look", "Dishes that more than half of viewers add to their basket: " + ", ".join(f"{n} ({a} of {v})" for n, v, a in eager) + ".",
                    "Demand is strong at the current price. Whether to change it is yours to decide; nothing has been changed."))
    if shy:
        out.append(("price worth a look", "Dishes many people open and almost nobody adds: " + ", ".join(f"{n} ({a} of {v})" for n, v, a in shy) + ".",
                    "Price, photo or description may be the reason. Nothing has been changed."))

    # Opening hours against when people actually order (UK time)
    hours = [0] * 24
    async for o in db.orders.find({"created_at": {"$gte": datetime.utcnow() - timedelta(days=28)}, "status": {"$ne": "cancelled"}}, {"_id": 0, "created_at": 1}):
        if isinstance(o.get("created_at"), datetime):
            hours[o["created_at"].replace(tzinfo=ZoneInfo("UTC")).astimezone(LONDON).hour] += 1
    if sum(hours) >= 60:
        busy = [h for h, n in enumerate(hours) if n]
        quiet = [h for h in range(min(busy), max(busy) + 1) if hours[h] <= sum(hours) * 0.01]
        peak = max(range(24), key=lambda h: hours[h])
        text = f"Over four weeks, orders came in between {min(busy)}:00 and {max(busy) + 1}:00, busiest around {peak}:00."
        if quiet:
            text += " Almost nothing was ordered around " + ", ".join(f"{h}:00" for h in quiet[:6]) + "."
        out.append(("opening hours", text, "Worth comparing with the hours you are open. Nothing has been changed."))

    logged = []
    for kind, noticed, decided in out:
        recent = await db.decision_log.find_one({"kind": kind, "noticed": noticed, "at": {"$gte": datetime.utcnow() - timedelta(days=7)}}, {"_id": 1})
        if not recent:      # say it once a week, not every night
            logged.append(await log_decision(kind, noticed, decided, "Nothing changed — this one is for you to decide.", level=3))
    return logged


async def things_to_know(day: str) -> list:
    """Plain facts from yesterday that a person running the kitchen would want to hear. No action is taken."""
    start, end = _uk_day_bounds(day)
    lines = []
    low = await db.delivery_reviews.count_documents({"status": "submitted", "rating": {"$lte": 2},
                                                     "submitted_at": {"$gte": start.isoformat(), "$lt": end.isoformat()}})
    low += await db.reviews.count_documents({"rating": {"$lte": 2}, "created_at": {"$gte": start, "$lt": end}})
    if low:
        lines.append(f"{low} low review{'s' if low != 1 else ''} (1 or 2 stars) came in. Worth reading and replying to.")
    cancelled = await db.orders.count_documents({"status": "cancelled", "updated_at": {"$gte": start, "$lt": end}})
    if cancelled:
        lines.append(f"{cancelled} order{'s were' if cancelled != 1 else ' was'} cancelled.")
    refused = await db.events.count_documents({"day": day, "name": "coupon_failed"})
    if refused >= 5:
        lines.append(f"A coupon was refused {refused} times. A code may have expired or been shared wrongly.")
    week = (datetime.strptime(day, "%Y-%m-%d") + timedelta(days=8)).strftime("%Y-%m-%d")
    ending = await db.subscriptions.count_documents({"status": "active", "end_date": {"$gt": day, "$lte": week}})
    if ending:
        lines.append(f"{ending} Dabba Wala plan{'s end' if ending != 1 else ' ends'} in the next 7 days.")
    orphaned = await db.payments.count_documents({"alerted": True, "alerted_at": {"$gte": start.isoformat(), "$lt": end.isoformat()}})
    if orphaned:
        lines.append(f"{orphaned} payment{'s' if orphaned != 1 else ''} had no matching order. Check Stripe.")
    return lines


async def dishes_gone_quiet() -> list:
    now = datetime.utcnow()

    async def sold_between(a: int, b: int) -> dict:
        out: dict = {}
        async for o in db.orders.find({"created_at": {"$gte": now - timedelta(days=a), "$lt": now - timedelta(days=b)}, "status": {"$ne": "cancelled"}}, {"_id": 0, "items": 1}):
            for i in o.get("items") or []:
                if i.get("name"):
                    out[i["name"]] = out.get(i["name"], 0) + int(i.get("quantity") or 1)
        return out
    earlier, recent = await sold_between(21, 7), await sold_between(7, 0)
    if sum(recent.values()) < 20:          # a quiet week overall says nothing about one dish
        return []
    return [n for n, q in sorted(earlier.items(), key=lambda kv: -kv[1]) if q >= 8 and not recent.get(n)][:5]


async def site_check() -> Optional[dict]:
    """Fetch the public pages and report what a visitor or a search engine would trip over. Read-only."""
    import re
    import httpx
    found = []
    try:
        async with httpx.AsyncClient(timeout=20, follow_redirects=True, headers={"User-Agent": "SSP-site-check"}) as client:
            sitemap = await client.get(f"{SITE_URL}/sitemap.xml")
            urls = re.findall(r"<loc>(.*?)</loc>", sitemap.text)[:SITE_CHECK_PAGES]
            if not urls:
                return {"pages": 0, "found": ["the sitemap could not be read"]}
            for url in urls:
                path = url.replace(SITE_URL, "") or "/"
                try:
                    r = await client.get(url)
                except httpx.HTTPError:
                    found.append(f"{path} did not load")
                    continue
                if r.status_code != 200:
                    found.append(f"{path} returned {r.status_code}")
                    continue
                html = r.text
                if not re.search(r"<title>[^<]{5,}</title>", html):
                    found.append(f"{path} has no title")
                h1 = len(re.findall(r"<h1[\s>]", html))
                if h1 != 1:
                    found.append(f"{path} has {h1} main headings")
                if not re.search(r'<meta[^>]+name="description"[^>]+content="[^"]{50,}', html):
                    found.append(f"{path} has a missing or very short description")
                no_alt = len(re.findall(r"<img(?![^>]*\balt=)[^>]*>", html))
                if no_alt:
                    found.append(f"{path} has {no_alt} image(s) with no description")
            return {"pages": len(urls), "found": found}
    except Exception as e:
        logger.warning("Site check could not run: %s", e)
        return None


async def _orders_per_day(days: int, ending_days_ago: int) -> float:
    end = datetime.utcnow() - timedelta(days=ending_days_ago)
    n = await db.orders.count_documents({"created_at": {"$gte": end - timedelta(days=days), "$lt": end}, "status": {"$ne": "cancelled"}})
    return n / days


# ── 4. Check later whether it worked ─────────────────────────────────────────

async def review_outcomes() -> int:
    due = datetime.utcnow() - timedelta(days=REVIEW_AFTER_DAYS)
    done = 0
    async for d in db.decision_log.find({"outcome": None, "measure": {"$ne": None}, "undone_at": None, "at": {"$lte": due}}, {"_id": 0}):
        if d["measure"].get("type") == "orders_per_day":
            before, after = d["measure"]["before"], round(await _orders_per_day(REVIEW_AFTER_DAYS, 0), 2)
            verdict = "up" if after > before * 1.05 else "down" if after < before * 0.95 else "about the same"
            text = (f"Orders a day were {before} in the two weeks before and {after} in the two weeks after — {verdict}. "
                    "Other things changed in that time too, so this is a signal, not proof.")
            await db.decision_log.update_one({"id": d["id"]}, {"$set": {"outcome": text, "outcome_at": datetime.utcnow()}})
            done += 1
    return done


# ── Undo ─────────────────────────────────────────────────────────────────────

async def undo(decision_id: str, by: str) -> dict:
    d = await db.decision_log.find_one({"id": decision_id}, {"_id": 0})
    if not d or not d.get("undo"):
        return {"ok": False, "detail": "This entry has nothing to undo."}
    if d.get("undone_at"):
        return {"ok": False, "detail": "This was already undone."}
    u = d["undo"]
    if u["type"] == "featured":
        await db.menu_items.update_many({"featured": True}, {"$set": {"featured": False}})
        await db.menu_items.update_many({"id": {"$in": u["ids"]}}, {"$set": {"featured": True}})
    elif u["type"] == "order":
        for mid, rank in u["ranks"].items():
            await db.menu_items.update_one({"id": mid}, {"$set": {"sort_rank": rank}} if rank is not None else {"$unset": {"sort_rank": ""}})
    elif u["type"] == "pairings":
        await db.menu_items.update_many({"id": {"$in": u["ids"]}, "pairs_with_set_by": "system"},
                                        {"$set": {"pairs_with": []}, "$unset": {"pairs_with_set_by": ""}})
    elif u["type"] == "automation_off":
        await db.automation_settings.update_one({"id": u["id"]}, {"$set": {
            "enabled": False, "updated_by": by, "updated_at": datetime.utcnow().isoformat()}})
    elif u["type"] == "automation":
        await db.automation_settings.update_one({"id": u["id"]}, {"$set": {
            "enabled": True, "updated_by": by, "updated_at": datetime.utcnow().isoformat()}})
    await db.decision_log.update_one({"id": decision_id}, {"$set": {"undone_at": datetime.utcnow(), "undone_by": by}})
    return {"ok": True}


# ── The nightly run ──────────────────────────────────────────────────────────

async def run_review(now_local: Optional[datetime] = None) -> dict:
    """Measure yesterday, compare, act where the rules allow, log everything — including 'nothing to do'."""
    now_local = now_local or datetime.now(LONDON)
    cfg = await get_settings()
    yesterday = (now_local - timedelta(days=1)).strftime("%Y-%m-%d")
    for back in range(35, 0, -1):                       # fill any days not yet measured (cheap; a few queries each)
        day = (now_local - timedelta(days=back)).strftime("%Y-%m-%d")
        if back == 1 or not await db.daily_metrics.find_one({"day": day}, {"_id": 1}):
            await measure_day(day)
    today = await db.daily_metrics.find_one({"day": yesterday}, {"_id": 0})
    history = await db.daily_metrics.find({"day": {"$lt": yesterday, "$gte": (now_local - timedelta(days=36)).strftime("%Y-%m-%d")}},
                                          {"_id": 0}).to_list(None)
    history = [h for h in history if h.get("visits") or h.get("orders")]       # days before counting began are not "normal"
    signals = compare(today, history)

    did, skipped = [], []
    if cfg["menu_decisions"]:
        f = await decide_featured()
        (did if f["changed"] else skipped).append("Featured dishes: " + ("updated" if f["changed"] else f["why"]))
        o = await decide_order()
        (did if o["sections"] else skipped).append(f"Dish order: {o['sections']} section(s) put in sales order" if o["sections"]
                                                   else f"Dish order: no section has sold {MIN_SECTION_ORDERS_FOR_ORDERING} portions yet")
        p = await decide_pairings()
        (did if p["filled"] else skipped).append(f"Goes-well-with: {p['filled']} filled" if p["filled"] else "Goes-well-with: nothing bought together often enough yet")
    else:
        skipped.append("Menu decisions are switched off")
    if cfg["customer_messages"]:
        started = await start_untouched_automations()
        if started:
            did.append(f"Switched on {len(started)} customer message(s): {', '.join(started)}")
    stopped = await guard_automations()
    if stopped:
        did.append(f"Switched off {len(stopped)} automation(s) for causing unsubscribes")
    recs = await recommendations()
    reviewed = await review_outcomes()

    worse = [s for s in signals if s["worse"]]
    facts = await things_to_know(yesterday)
    if facts:
        await log_decision("things to know", " ".join(facts), "These need a person, not a rule.", "Nothing changed. Included in your morning email." if cfg["owner_alerts"] else "Nothing changed.", level=3)
    acted = list(did)        # what the system changed overnight, before the email line is added
    if (worse or facts or acted) and cfg["owner_alerts"]:
        lines = "".join(f"<li><b>{s['label']}</b>: {s['current']} yesterday, usually about {s['usual']}</li>" for s in worse)
        body = (f"<p>Compared with a normal {datetime.strptime(yesterday, '%Y-%m-%d').strftime('%A')}:</p><ul>{lines}</ul>" if worse else "")
        body += ("<p>Worth knowing:</p><ul>" + "".join(f"<li>{f}</li>" for f in facts) + "</ul>") if facts else ""
        body += ("<p>What the system did overnight:</p><ul>" + "".join(f"<li>{a}</li>" for a in acted) + "</ul>") if acted else ""
        subject = (f"Sree Svadista — {len(worse)} figure{'s' if len(worse) != 1 else ''} moved sharply yesterday" if worse
                   else f"Sree Svadista — {len(facts)} thing{'s' if len(facts) != 1 else ''} to know from yesterday" if facts
                   else f"Sree Svadista — the system made {len(acted)} change{'s' if len(acted) != 1 else ''} overnight")
        notify_admin(subject, body + "<p>Open Admin › System log for the detail.</p>")
        did.append(f"Emailed you: {len(worse)} figure(s) moved sharply, {len(facts)} thing(s) to know")

    # A dish that used to sell and has stopped
    dropped = await dishes_gone_quiet()
    if dropped:
        await log_decision("dish gone quiet", "Sold steadily two weeks ago and not at all in the last week: " + ", ".join(dropped) + ".",
                           "Check it is still shown, in stock and priced as you intend.", "Nothing changed — worth a look.", level=3)

    # Once a week, read the public pages the way a visitor's browser does
    checked_recently = await db.decision_log.find_one({"kind": "weekly site check", "at": {"$gte": datetime.utcnow() - timedelta(days=6)}}, {"_id": 1})
    if now_local.weekday() == WEEKLY_DAY and not checked_recently:
        problems = await site_check()
        if problems is not None:
            await log_decision("weekly site check", f"Read {problems['pages']} public pages." + (" Found: " + "; ".join(problems["found"][:8]) + "." if problems["found"] else " Every page loaded with a title and one main heading."),
                               "Listed for fixing." if problems["found"] else "No action needed.",
                               "Nothing changed automatically." if problems["found"] else "No action taken.", level=3 if problems["found"] else 1)

    # Something moved sharply for the worse and no rule above explains it: ask Claude once, with summary figures only
    if worse and cfg["ai_investigation"]:
        already = await db.decision_log.find_one({"kind": "investigation", "at": {"$gte": datetime.utcnow() - timedelta(hours=20)}}, {"_id": 1})
        if not already:
            from ai_ops import investigate
            result = await investigate({
                "yesterday": {k: v for k, v in today.items() if k != "measured_at"},
                "sharply_worse": [{"figure": s["label"], "yesterday": s["current"], "usually": s["usual"]} for s in worse],
                "previous_days": [{k: v for k, v in h.items() if k != "measured_at"} for h in sorted(history, key=lambda h: h["day"])[-14:]],
                "things_to_know": facts,
            })
            if result["ok"]:
                f = result["finding"]
                await log_decision("investigation", f["summary"],
                                   "Likely causes: " + "; ".join(f["likely_causes"][:4]) + ". Check first: " + "; ".join(f["what_to_check"][:4]) + ".",
                                   f'{f["recommendation"]} (Confidence: {f["confidence"]}. Written by Claude from summary figures; cost about ${result["cost_usd"]:.3f}.)',
                                   level=3, by="Claude")
                did.append("Asked Claude to look into the change; its finding is in the log")
            else:
                skipped.append(f"AI investigation skipped: {result['why']}")

    material = [s for s in signals if s["material"]]
    noticed = (", ".join(f"{s['label']} {'up' if s['change'] > 0 else 'down'} {abs(round(s['change'] * 100))}%" for s in material)
               if material else "No figure moved materially against its usual level." if history else
               "Not enough history yet to say what is normal.")
    if now_local.weekday() == WEEKLY_DAY and cfg["owner_alerts"]:
        sent_this_week = await db.decision_log.find_one({"kind": "weekly report", "at": {"$gte": datetime.utcnow() - timedelta(days=6)}}, {"_id": 1})
        if not sent_this_week:
            report = await weekly_report(now_local)
            await log_decision("weekly report", f"It is Monday. {report['actions']} action(s) by the system last week, {report['outcomes']} outcome(s) judged, {report['waiting']} item(s) waiting for you.",
                               "Send the owner the week's summary.", f'Emailed: "{report["subject"]}"')
    summary = await log_decision(
        "nightly review", f"Figures for {yesterday}: {today['visits']} visits, {today['orders']} orders, £{today['income']:.2f}. {noticed}",
        "No material change — nothing needed deciding." if not (did or recs) else "Acted where the rules allow; the rest is listed for you.",
        "; ".join(did) if did else "No action taken. " + "; ".join(skipped))
    await db.settings.update_one({"_id": "intelligence"}, {"$set": {"last_run_day": now_local.strftime("%Y-%m-%d"),
                                                                    "last_run_at": datetime.utcnow().isoformat()}}, upsert=True)
    return {"day": yesterday, "dish_order_changes": o["changes"] if cfg["menu_decisions"] else 0, "metrics": {k: v for k, v in today.items() if k != "measured_at"}, "signals": signals,
            "did": did, "skipped": skipped, "recommendations": len(recs), "outcomes_reviewed": reviewed, "log_id": summary["id"]}


# ── Emailed reports ─────────────────────────────────────────────────────────

def _money(v) -> str:
    return f"£{float(v or 0):,.2f}"


async def weekly_report(now_local: datetime) -> Optional[dict]:
    """Every Monday: the week's figures against the week before, what the system did and why,
    what came of earlier actions, and what is waiting for the owner."""
    def span(start_back: int, end_back: int) -> dict:
        return {"$gte": (now_local - timedelta(days=start_back)).strftime("%Y-%m-%d"), "$lt": (now_local - timedelta(days=end_back)).strftime("%Y-%m-%d")}

    async def totals(start_back: int, end_back: int) -> dict:
        rows = await db.daily_metrics.find({"day": span(start_back, end_back)}, {"_id": 0}).to_list(None)
        return {k: round(sum(float(r.get(k) or 0) for r in rows), 2) for k in ("visits", "orders", "income", "failures", "new_accounts", "unsubscribes")}

    this, last = await totals(7, 0), await totals(14, 7)
    week_ago = datetime.utcnow() - timedelta(days=7)
    entries = await db.decision_log.find({"at": {"$gte": week_ago}, "kind": {"$ne": "nightly review"}}, {"_id": 0}).sort("at", 1).to_list(None)
    actions = [e for e in entries if e.get("level", 1) < 3]
    waiting = await db.decision_log.find({"level": 3, "response": None, "at": {"$gte": datetime.utcnow() - timedelta(days=30)},
                                          "did": {"$not": {"$regex": "No action"}}}, {"_id": 0}).sort("at", -1).to_list(15)
    outcomes = await db.decision_log.find({"outcome_at": {"$gte": week_ago}}, {"_id": 0}).to_list(None)
    sends = await db.automation_sends.count_documents({"at": {"$gte": week_ago}})
    from ai_ops import month_to_date
    ai = await month_to_date()

    def change(key: str) -> str:
        a, b = this[key], last[key]
        if not b:
            return "" if not a else " (nothing the week before)"
        pct = round((a - b) / b * 100)
        return f" ({'+' if pct >= 0 else ''}{pct}% on the week before)"

    def bullet(items: list, empty: str) -> str:
        return ("<ul>" + "".join(f"<li>{i}</li>" for i in items) + "</ul>") if items else f"<p>{empty}</p>"

    html = (
        f"<p>Week to {(now_local - timedelta(days=1)).strftime('%A %d %B')}.</p>"
        "<h3>The week in figures</h3><ul>"
        f"<li><b>Visits:</b> {int(this['visits'])}{change('visits')}</li>"
        f"<li><b>Orders:</b> {int(this['orders'])}{change('orders')}</li>"
        f"<li><b>Order income:</b> {_money(this['income'])}{change('income')}</li>"
        f"<li><b>New accounts:</b> {int(this['new_accounts'])} · <b>Failed payments or orders:</b> {int(this['failures'])} · <b>Unsubscribes:</b> {int(this['unsubscribes'])}</li>"
        f"<li><b>Automatic customer messages sent:</b> {sends}</li></ul>"
        "<h3>What the system did, and why</h3>"
        + bullet([f"<b>{e['kind'].capitalize()}</b> — {e['did']} <i>Why: {e['noticed']}</i>" for e in actions],
                 "Nothing needed changing this week. It measured every night and found no reason to act.")
        + "<h3>What came of earlier actions</h3>"
        + bullet([f"<b>{e['kind'].capitalize()}</b> — {e['outcome']}" for e in outcomes], "No action was old enough to be judged this week (each is checked after two weeks).")
        + "<h3>Waiting for you</h3>"
        + bullet([f"<b>{e['kind'].capitalize()}</b> — {e['noticed']} {e['decided']}" for e in waiting], "Nothing is waiting for an answer.")
        + f"<p style='color:#777'>AI use this month: {ai['calls']} of {ai['call_cap']} calls, about ${ai['cost_usd']:.2f} of ${ai['cost_cap_usd']:.2f}. "
          "Everything above is in Admin › System log, where each automatic action can be undone.</p>"
    )
    subject = f"Sree Svadista — your week: {int(this['orders'])} orders, {_money(this['income'])}; {len(actions)} action{'s' if len(actions) != 1 else ''} by the system"
    notify_admin(subject, html)
    return {"subject": subject, "actions": len(actions), "waiting": len(waiting), "outcomes": len(outcomes)}


async def intelligence_loop():
    """Once a night, a little after 03:00 UK time, when nobody is ordering."""
    while True:
        try:
            now = datetime.now(LONDON)
            cfg = await get_settings()
            if now.hour >= 3 and cfg.get("last_run_day") != now.strftime("%Y-%m-%d"):
                await run_review(now)
            await beat("nightly review")
        except asyncio.CancelledError:
            raise
        except Exception as e:
            logger.error("Nightly review failed: %s", e)
        await asyncio.sleep(1800)
