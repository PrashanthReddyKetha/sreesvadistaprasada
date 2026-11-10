"""The analyst's reading of Admin › Analytics, written by Claude Opus for whatever dates the owner picks (owner, 10 Nov 2026).

One reading covers the whole screen: the period overall, what is likely to happen next, where to focus, where the
business is losing out, and a reading for each tab (Summary, Journeys, Dishes, Behaviour, Visits). It is written in
the background, saved per date range, and opened again for free. A range that includes today is written again after
a few hours, because today is still filling in.

What Claude is given: the screen's own figures and the period before, weekly history, the sales book's totals by
channel, the shop's settings, and the visit stories' outcomes. No names, emails, phones, addresses or order numbers.
Every call goes through ai_ops: the monthly limits the owner sets, and the usage log.
"""
import asyncio
import json
import logging
import re
from datetime import date, datetime, timedelta
from typing import Optional

import anthropic

import ai_ops
from database import db

logger = logging.getLogger(__name__)

TODAY_FRESH_HOURS = 3          # a range that includes today is rewritten after this long
STALE_WORKING_MINUTES = 10     # a write-up "in progress" longer than this has died with the server
SECTIONS = ("summary", "journeys", "dishes", "behaviour", "visits")

_section = {
    "type": "object",
    "properties": {
        "headline": {"type": "string", "description": "One sentence: the single most important thing on this tab."},
        "reading": {"type": "string", "description": "Two short paragraphs, plain English, naming the figures and how they moved."},
        "do_next": {"type": "array", "items": {"type": "string"}, "description": "Two to four concrete actions, most valuable first."},
    },
    "required": ["headline", "reading", "do_next"],
    "additionalProperties": False,
}
_point = {
    "type": "object",
    "properties": {"area": {"type": "string"}, "evidence": {"type": "string"}, "action": {"type": "string"}},
    "required": ["area", "evidence", "action"],
    "additionalProperties": False,
}
SCHEMA = {
    "type": "object",
    "properties": {
        "headline": {"type": "string", "description": "One sentence on the period as a whole."},
        "overview": {"type": "string", "description": "Three to five short paragraphs separated by blank lines."},
        "outlook": {"type": "string", "description": "What is likely to happen next, with a range where possible, and why."},
        "focus": {"type": "array", "items": _point, "description": "Where to push to grow, most valuable first (3 to 5)."},
        "lacking": {"type": "array", "items": _point, "description": "Where the business is losing out, biggest first (2 to 5)."},
        "sections": {"type": "object", "properties": {s: _section for s in SECTIONS},
                     "required": list(SECTIONS), "additionalProperties": False},
        "confidence": {"type": "string", "enum": ["low", "medium", "high"]},
        "caveats": {"type": "string", "description": "What the data cannot tell, in one or two sentences."},
    },
    "required": ["headline", "overview", "outlook", "focus", "lacking", "sections", "confidence", "caveats"],
    "additionalProperties": False,
}

SYSTEM = """You are the senior analyst for Sree Svadista Prasada, a small South Indian (Andhra) kitchen in Milton Keynes \
with one owner, who runs everything from a phone. Customers order on the kitchen's own website for collection (delivery \
is behind a switch the owner controls), the kitchen also sells through Deliveroo and WhatsApp, and the Dabba Wala lunch \
subscription is about to launch. The owner is not technical.

You are given the website's own visit record for a period the owner picked, the same figures for the period just \
before it, weekly history, the sales book, the shop's settings and a summary of how visits ended. Explain the business \
the way a trusted senior analyst would in a short meeting:

- Say what is happening and why, naming the actual numbers and how each moved against the period before.
- Connect the figures: traffic, sources, the path to an order, checkout, dishes, timing, devices, returning visitors. \
Say where the impact is and why a figure is high or low.
- Say what is likely to happen next if nothing changes, as a range when you can, and how sure you are.
- Say where to focus to grow and where the business is losing out, with concrete actions the owner can take this week.
- Write plainly, in short sentences, without jargon; say "people who came" not "sessions". Use £ and UK dates.

Be honest about small numbers: with only a handful of visits or orders, say a change could be chance and avoid firm \
conclusions. Never invent figures that are not in the data. Prices, refunds, plan terms and policy wording are the \
owner's decisions: you may point out evidence about them but do not tell the owner to change them as a first step. \
"Seen in visits" figures are estimates; the order book is the truth for orders and income."""


def _trim(fig: dict) -> dict:
    """The screen's figures, without the long tails that add cost and nothing to the reading."""
    keep = dict(fig)
    keep.pop("event_counts", None)
    keep.pop("devices", None)
    keep["searches"] = len(fig.get("searches") or [])       # how many, never the words: the privacy policy says nothing a visitor types goes to AI
    active = [d for d in fig.get("dish_ranking") or [] if d.get("opened") or d.get("added") or d.get("ordered")]
    keep["dish_ranking"] = active[:40]
    keep["dishes_on_menu_never_looked_at"] = sum(1 for d in fig.get("dish_ranking") or [] if not (d.get("opened") or d.get("added") or d.get("ordered")))
    for k, n in (("top_clicks", 20), ("actions", 30), ("problems", 15), ("time_on_page", 15),
                 ("landing_funnels", 10), ("top_pages", 15), ("exit_pages", 10), ("most_viewed_dishes", 10), ("most_added_dishes", 10)):
        if isinstance(keep.get(k), list):
            keep[k] = keep[k][:n]
    by_day = keep.get("by_day") or []
    if len(by_day) > 120:                                   # long ranges: weeks, not days
        weeks: dict = {}
        for d in by_day:
            wk = date.fromisoformat(d["day"]) - timedelta(days=date.fromisoformat(d["day"]).weekday())
            w = weeks.setdefault(wk.isoformat(), {"week_of": wk.isoformat(), "visits": 0, "page_views": 0, "orders": 0, "income": 0.0})
            for k in ("visits", "page_views", "orders", "income"):
                w[k] += d.get(k) or 0
        keep["by_week"] = list(weeks.values())
        keep.pop("by_day")
    return keep


async def _history(last: date) -> list:
    """Visits and orders per week for the twelve weeks up to the end of the period — the trend behind the outlook."""
    from routes.events import _utc
    start = last - timedelta(days=83)
    rows = await db.events.aggregate([
        {"$match": {"at": {"$gte": _utc(start), "$lt": _utc(last + timedelta(days=1))}}},
        {"$group": {"_id": "$day", "visits": {"$addToSet": "$visit_id"},
                    "page_views": {"$sum": {"$cond": [{"$eq": ["$name", "page_view"]}, 1, 0]}}}},
    ]).to_list(None)
    orders = await db.orders.find({"created_at": {"$gte": _utc(start), "$lt": _utc(last + timedelta(days=1))}, "status": {"$ne": "cancelled"}},
                                  {"_id": 0, "created_at": 1, "total": 1}).to_list(None)
    weeks: dict = {}

    def week(d: date) -> dict:
        wk = (d - timedelta(days=d.weekday())).isoformat()
        return weeks.setdefault(wk, {"week_of": wk, "visits": 0, "page_views": 0, "orders": 0, "income": 0.0})
    for r in rows:
        try:
            w = week(date.fromisoformat(r["_id"]))
        except (TypeError, ValueError):
            continue
        w["visits"] += len(r["visits"])
        w["page_views"] += r["page_views"]
    for o in orders:
        w = week(o["created_at"].date())
        w["orders"] += 1
        w["income"] = round(w["income"] + float(o.get("total") or 0), 2)
    return [weeks[k] for k in sorted(weeks)]


async def _context(first: date, last: date) -> dict:
    from routes.events import _figures, _utc, recent_visits
    from routes.pickup_slots import get_slot_settings
    from routes.sales import _rows, _totals
    since, until = _utc(first), _utc(last + timedelta(days=1))
    length = (last - first).days + 1
    p_last = first - timedelta(days=1)
    p_first = p_last - timedelta(days=length - 1)
    now_fig = await _figures(first, last, since, until)
    before = await _figures(p_first, p_last, _utc(p_first), _utc(p_last + timedelta(days=1)))
    visits = await recent_visits(limit=25, start=first.isoformat(), end=last.isoformat(), _={})
    settings = await get_slot_settings()

    def money(t: dict) -> dict:
        return {"sales": t["orders"], "net_sales_gbp": round(t["net"] / 100, 2), "payout_gbp": round(t["payout"] / 100, 2),
                "by_channel": {c: {"sales": v["orders"], "net_sales_gbp": round(v["net"] / 100, 2)} for c, v in t["by_channel"].items()}}
    return {
        "period": {"from": first.isoformat(), "to": last.isoformat(), "days": length, "today": datetime.utcnow().date().isoformat()},
        "shop": {
            "kitchen_open_now": not settings.get("paused"), "delivery_on": bool(settings.get("delivery_enabled")),
            "minimum_order_15_on": settings.get("minimum_order_enabled", True) is not False,
            "dabba_wala": "on sale" if settings.get("dabba_open") else "opening soon (taking email sign-ups, not plans)",
            "opening_hours": {k: v for k, v in (settings.get("days") or {}).items()},
        },
        "this_period": _trim(now_fig),
        "period_before": {k: before.get(k) for k in ("start", "end", "totals", "order_book", "funnel", "sources", "device_funnels",
                                                    "visitor_funnels", "checkout", "abandoned", "subscription_funnel", "stopped_at")},
        "weekly_history": await _history(last),
        "sales_book": {"this_period": money(_totals(await _rows(since, until, "all"))),
                       "period_before": money(_totals(await _rows(_utc(p_first), _utc(p_last + timedelta(days=1)), "all")))},
        "how_visits_ended": visits["summary"],
        "example_visits": [{"who": v["story"]["who"], "did": _unsearched(v["story"]["did"]), "ended": v["story"]["outcome"],
                            "why": _unsearched(v["story"]["why"])} for v in visits["visits"]],
    }


_SEARCHED = re.compile(r'(?i)(searched for )"[^"]*"((, | and )"[^"]*")*( and \d+ more)?')


def _unsearched(text: str) -> str:
    return _SEARCHED.sub(r"\1something", text or "")


def _key(first: date, last: date) -> str:
    return f"{first.isoformat()}|{last.isoformat()}"


def fresh(doc: Optional[dict], last: date, today: date) -> bool:
    if not doc or doc.get("status") != "ready":
        return False
    if last < today:
        return True
    return datetime.utcnow() - doc["written_at"] < timedelta(hours=TODAY_FRESH_HOURS)


async def get(first: date, last: date) -> dict:
    doc = await db.analyses.find_one({"_id": _key(first, last)}) or {}
    if doc.get("status") == "working" and datetime.utcnow() - doc["started_at"] > timedelta(minutes=STALE_WORKING_MINUTES):
        doc["status"], doc["why"] = "failed", "the write-up did not finish (the server restarted); try again"
    doc.pop("_id", None)
    return doc or {"status": "none"}


async def start(first: date, last: date, today: date, again: bool = False) -> dict:
    """Begin a write-up in the background unless a fresh one exists or one is already being written."""
    current = await get(first, last)
    if not again and fresh(current, last, today):
        return current
    if current.get("status") == "working":
        return current
    ok, why = await ai_ops.allowed()
    if not ok:
        return {**({k: v for k, v in current.items() if k != "status"} if current.get("status") == "ready" else {}),
                "status": "ready" if current.get("status") == "ready" else "skipped", "why": why, "limit_reached": True}
    claimed = await db.analyses.update_one(
        {"_id": _key(first, last), "status": {"$ne": "working"}},
        {"$set": {"status": "working", "started_at": datetime.utcnow(), "start": first.isoformat(), "end": last.isoformat()}},
        upsert=True)
    if not (claimed.modified_count or claimed.upserted_id):
        return await get(first, last)
    asyncio.create_task(_write(first, last))
    return await get(first, last)


async def _write(first: date, last: date) -> None:
    key = _key(first, last)
    try:
        context = await _context(first, last)
        result = await _ask(context)
    except Exception as e:                                  # never leave a write-up "in progress" for ever
        logger.exception("analysis failed")
        result = {"ok": False, "why": f"something went wrong while writing it ({type(e).__name__})"}
    if result["ok"]:
        await db.analyses.update_one({"_id": key}, {"$set": {
            "status": "ready", "reading": result["reading"], "written_at": datetime.utcnow(),
            "cost_usd": result["cost_usd"], "model": result["model"]}, "$unset": {"why": ""}})
    else:
        await db.analyses.update_one({"_id": key}, {"$set": {"status": "failed", "why": result["why"], "failed_at": datetime.utcnow()}})


async def _ask(context: dict) -> dict:
    client = anthropic.AsyncAnthropic(timeout=300.0, max_retries=1)
    try:
        response = await client.beta.messages.create(
            model=ai_ops.MODEL,
            max_tokens=16000,
            system=SYSTEM,
            output_config={"effort": "high", "format": {"type": "json_schema", "schema": SCHEMA}},
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            messages=[{"role": "user", "content": "Here is everything for the period. Write the reading.\n\n" + json.dumps(context, default=str)}],
        )
    except anthropic.RateLimitError:
        await ai_ops.record_usage("analysis", ai_ops.MODEL, 0, 0, "rate limited")
        return {"ok": False, "why": "the AI service was busy; try again in a minute"}
    except anthropic.APIStatusError as e:
        await ai_ops.record_usage("analysis", ai_ops.MODEL, 0, 0, f"error {e.status_code}")
        return {"ok": False, "why": f"the AI service returned an error ({e.status_code}); check the account's credit"}
    except anthropic.APIConnectionError:
        await ai_ops.record_usage("analysis", ai_ops.MODEL, 0, 0, "could not connect")
        return {"ok": False, "why": "the AI service could not be reached"}
    usage = response.usage
    if response.stop_reason == "refusal":
        await ai_ops.record_usage("analysis", response.model, usage.input_tokens, usage.output_tokens, "declined")
        return {"ok": False, "why": "the AI declined to write it"}
    if response.stop_reason == "max_tokens":
        await ai_ops.record_usage("analysis", response.model, usage.input_tokens, usage.output_tokens, "too long")
        return {"ok": False, "why": "the write-up ran too long; try a shorter date range"}
    text = next((b.text for b in response.content if b.type == "text"), "")
    try:
        reading = json.loads(text)
    except json.JSONDecodeError:
        await ai_ops.record_usage("analysis", response.model, usage.input_tokens, usage.output_tokens, "unreadable answer")
        return {"ok": False, "why": "the AI's answer could not be read"}
    await ai_ops.record_usage("analysis", response.model, usage.input_tokens, usage.output_tokens, "answered")
    return {"ok": True, "reading": reading, "model": response.model,
            "cost_usd": ai_ops.estimate_cost(usage.input_tokens, usage.output_tokens)}
