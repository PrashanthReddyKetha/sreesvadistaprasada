"""Our own record of what visitors do on the site — independent of Google Analytics.

POST /api/events           public; the site sends small batches of events
GET  /api/admin/analytics  admin; visits, funnel, sources, top dishes, by day

Privacy: no name, email, phone or address is stored here. A visit id is always
present; a returning-visitor id is only sent by the browser when the visitor has
accepted analytics cookies. IP addresses are not stored. Events are deleted
automatically after RETENTION_DAYS.
"""
import re
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from typing import List, Optional

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field

from auth import require_admin
from database import db
from security import RateLimit

router = APIRouter(tags=["Events"])

RETENTION_DAYS = 400
LONDON = ZoneInfo("Europe/London")   # days and hours are the kitchen's, not UTC
MAX_BATCH = 25
_rate = RateLimit(120, 60)   # batches per minute per visitor

# Any lower-case name is accepted, so a new action on the site needs no change here.
_NAME = re.compile(r"^[a-z][a-z0-9_]{1,39}$")
FUNNEL = ["page_view", "view_item", "add_to_cart", "begin_checkout", "purchase"]
PROP_KEYS = {"value", "transaction_id", "coupon", "plan", "box_type", "step_number", "step_name", "source",
             "enquiry_type", "category", "location", "item_id", "item_name", "quantity", "term", "method", "reason",
             "label", "area", "href", "seconds", "percent", "status", "message"}
_EMAIL = re.compile(r"[^\s@]+@[^\s@]+")
_DIGITS = re.compile(r"\d[\d\s-]{5,}\d")
_ID = re.compile(r"^[A-Za-z0-9_-]{8,64}$")


def _clean(value, limit=120):
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value
    if value is None:
        return None
    # second line of defence: the browser already strips these from labels
    return _DIGITS.sub("[number]", _EMAIL.sub("[email]", str(value)))[:limit]


class EventIn(BaseModel):
    name: str = Field(max_length=40)
    path: str = Field(default="", max_length=200)
    props: dict = Field(default_factory=dict)
    items: List[dict] = Field(default_factory=list)


class Attribution(BaseModel):
    source: str = Field(default="", max_length=80)
    medium: str = Field(default="", max_length=80)
    campaign: str = Field(default="", max_length=120)
    referrer: str = Field(default="", max_length=120)    # host only
    landing: str = Field(default="", max_length=200)     # first path of the visit


class Batch(BaseModel):
    visit_id: str
    visitor_id: Optional[str] = None
    signed_in: bool = False                              # a flag only — never who
    device: str = Field(default="", max_length=10)       # phone | desktop
    attribution: Attribution = Field(default_factory=Attribution)
    events: List[EventIn] = Field(max_length=MAX_BATCH)


@router.post("/events", status_code=202)
async def record_events(batch: Batch, request: Request, _=Depends(_rate)):
    if not _ID.match(batch.visit_id) or (batch.visitor_id and not _ID.match(batch.visitor_id)):
        return {"stored": 0}
    now = datetime.utcnow()
    local = datetime.now(LONDON)
    docs = []
    for e in batch.events:
        if not _NAME.match(e.name):
            continue
        docs.append({
            "name": e.name, "path": e.path.split("?")[0], "at": now, "day": local.strftime("%Y-%m-%d"), "hour": local.hour,
            "visit_id": batch.visit_id, "visitor_id": batch.visitor_id, "signed_in": batch.signed_in, "device": batch.device,
            "source": batch.attribution.source, "medium": batch.attribution.medium, "campaign": batch.attribution.campaign,
            "referrer": batch.attribution.referrer, "landing": batch.attribution.landing.split("?")[0],
            "props": {k: _clean(v) for k, v in e.props.items() if k in PROP_KEYS},
            "items": [{"id": _clean(i.get("id"), 64), "name": _clean(i.get("name")), "quantity": i.get("quantity") if isinstance(i.get("quantity"), int) else 1}
                      for i in e.items[:30] if isinstance(i, dict)],
        })
    if docs:
        await db.events.insert_many(docs)
    return {"stored": len(docs)}


def channel(e: dict) -> str:
    """A plain-language name for where the visit came from."""
    src, med, ref = (e.get("source") or "").lower(), (e.get("medium") or "").lower(), (e.get("referrer") or "").lower()
    if src:
        return f"{src} ({med})" if med else src
    if not ref:
        return "Direct or unknown"
    for needle, label in (("google", "Google search"), ("bing", "Bing search"), ("duckduckgo", "DuckDuckGo search"),
                          ("instagram", "Instagram"), ("facebook", "Facebook"), ("fb.", "Facebook"), ("whatsapp", "WhatsApp"),
                          ("wa.me", "WhatsApp"), ("t.co", "X / Twitter"), ("youtube", "YouTube"), ("tiktok", "TikTok")):
        if needle in ref:
            return label
    return ref


@router.get("/admin/analytics")
async def analytics(days: int = 30, _: dict = Depends(require_admin)):
    days = max(1, min(days, RETENTION_DAYS))
    since = datetime.utcnow() - timedelta(days=days)
    events = await db.events.find({"at": {"$gte": since}}, {"_id": 0}).to_list(None)

    visits, by_day, pages, viewed, added, sources, devices = {}, {}, {}, {}, {}, {}, {}
    clicks, searches, problems, hours, stay, action_visits = {}, {}, {}, {}, {}, {}
    ordered_dishes, last_page = {}, {}
    for e in events:
        action_visits.setdefault(e["name"], set()).add(e["visit_id"])
        p = e.get("props") or {}
        if e["name"] == "click":
            key = (p.get("label") or "", p.get("area") or "", e["path"])
            clicks[key] = clicks.get(key, 0) + 1
        elif e["name"] == "search" and p.get("term"):
            term = str(p["term"]).lower()
            searches[term] = searches.get(term, 0) + 1
        elif e["name"] == "site_error" or e["name"].endswith("_failed"):
            key = (e["name"], p.get("reason") or p.get("message") or "", e["path"])
            problems[key] = problems.get(key, 0) + 1
        elif e["name"] == "page_leave":
            t = stay.setdefault(e["path"], [0, 0, 0])
            t[0] += 1; t[1] += p.get("seconds") or 0; t[2] += p.get("percent") or 0
        if e["name"] == "purchase":
            for i in e.get("items") or []:
                if i.get("name"):
                    ordered_dishes[i["name"]] = ordered_dishes.get(i["name"], 0) + (i.get("quantity") or 1)
        if e["name"] == "page_view":
            prev = last_page.get(e["visit_id"])
            if prev is None or e["at"] >= prev[0]:
                last_page[e["visit_id"]] = (e["at"], e["path"])
            h = (e.get("hour") if e.get("hour") is not None else e["at"].hour)
            hours[h] = hours.get(h, 0) + 1
        v = visits.setdefault(e["visit_id"], {"names": set(), "first": e, "value": 0.0, "order": None})
        v["names"].add(e["name"])
        if e["name"] == "purchase":
            v["value"] += float(e["props"].get("value") or 0)
            v["order"] = e["props"].get("transaction_id")
        d = by_day.setdefault(e["day"], {"day": e["day"], "visits": set(), "page_views": 0, "orders": 0, "income": 0.0})
        d["visits"].add(e["visit_id"])
        if e["name"] == "page_view":
            d["page_views"] += 1
            pages[e["path"]] = pages.get(e["path"], 0) + 1
        elif e["name"] == "purchase":
            d["orders"] += 1
            d["income"] += float(e["props"].get("value") or 0)
        elif e["name"] in ("view_item", "add_to_cart"):
            bucket = viewed if e["name"] == "view_item" else added
            for i in e.get("items") or []:
                if i.get("name"):
                    bucket[i["name"]] = bucket.get(i["name"], 0) + (1 if e["name"] == "view_item" else i.get("quantity") or 1)

    for v in visits.values():
        ch = channel(v["first"])
        s = sources.setdefault(ch, {"source": ch, "visits": 0, "added_to_basket": 0, "orders": 0, "income": 0.0})
        s["visits"] += 1
        s["added_to_basket"] += "add_to_cart" in v["names"]
        s["orders"] += "purchase" in v["names"]
        s["income"] += v["value"]
        dev = v["first"].get("device") or "unknown"
        devices[dev] = devices.get(dev, 0) + 1

    def top(d, n=15):
        return [{"name": k, "count": c} for k, c in sorted(d.items(), key=lambda kv: -kv[1])[:n]]

    exits: dict = {}
    for vid, (_, path) in last_page.items():
        if "purchase" not in visits[vid]["names"]:          # where visits that did not order ended
            exits[path] = exits.get(path, 0) + 1
    interest = sorted(
        ({"name": n, "opened": v, "added": added.get(n, 0), "ordered": ordered_dishes.get(n, 0)} for n, v in viewed.items()),
        key=lambda d: (d["ordered"], -d["opened"]))[:15]
    checkout_steps = [("begin_checkout", "Started checkout"), ("payment_started", "Started paying"), ("purchase", "Order placed")]
    checkout = [{"step": label, "visits": sum(1 for v in visits.values() if name in v["names"])} for name, label in checkout_steps]
    checkout.append({"step": "Payment or order failed", "visits": sum(
        1 for v in visits.values() if v["names"] & {"order_placed_failed", "payment_started_failed", "payment_failed"})})

    funnel = [{"step": step, "visits": sum(1 for v in visits.values() if step in v["names"])} for step in FUNNEL]
    counts: dict = {}
    for e in events:
        counts[e["name"]] = counts.get(e["name"], 0) + 1
    return {
        "days": days,
        "since": since.isoformat(),
        "totals": {
            "visits": len(visits),
            "returning_visitors_known": len({e["visitor_id"] for e in events if e.get("visitor_id")}),
            "page_views": counts.get("page_view", 0),
            "orders": counts.get("purchase", 0),
            "income": round(sum(v["value"] for v in visits.values()), 2),
            "plans_sold": counts.get("subscription_purchase", 0),
        },
        "funnel": funnel,
        "by_day": [{**d, "visits": len(d["visits"]), "income": round(d["income"], 2)} for d in sorted(by_day.values(), key=lambda d: d["day"])],
        "sources": sorted(({**s, "income": round(s["income"], 2)} for s in sources.values()), key=lambda s: -s["visits"]),
        "devices": devices,
        "top_pages": top(pages),
        "most_viewed_dishes": top(viewed),
        "most_added_dishes": top(added),
        "event_counts": counts,
        "exit_pages": top(exits, 12),
        "interest_without_orders": interest,
        "checkout": checkout,
        "actions": sorted(({"name": n, "count": c, "visits": len(action_visits[n])} for n, c in counts.items()), key=lambda a: -a["count"]),
        "top_clicks": [{"label": k[0], "area": k[1], "page": k[2], "count": c} for k, c in sorted(clicks.items(), key=lambda kv: -kv[1])[:40]],
        "searches": top(searches, 25),
        "problems": [{"name": k[0], "detail": k[1], "page": k[2], "count": c} for k, c in sorted(problems.items(), key=lambda kv: -kv[1])[:25]],
        "by_hour": [{"hour": h, "page_views": hours.get(h, 0)} for h in range(24)],
        "time_on_page": sorted(({"page": pth, "views": t[0], "average_seconds": round(t[1] / t[0]), "average_scroll": round(t[2] / t[0])}
                                for pth, t in stay.items() if t[0]), key=lambda r: -r["views"])[:20],
    }


@router.get("/admin/analytics/visits")
async def recent_visits(limit: int = 40, _: dict = Depends(require_admin)):
    """The latest visits, each with everything the visitor did, in order."""
    limit = max(1, min(limit, 100))
    since = datetime.utcnow() - timedelta(days=30)      # bounded: never scans the whole record
    latest = await db.events.aggregate([
        {"$match": {"at": {"$gte": since}}},
        {"$group": {"_id": "$visit_id", "last": {"$max": "$at"}, "first": {"$min": "$at"}, "count": {"$sum": 1}}},
        {"$sort": {"last": -1}}, {"$limit": limit},
    ]).to_list(None)
    ids = [v["_id"] for v in latest]
    events = await db.events.find({"visit_id": {"$in": ids}}, {"_id": 0}).sort("at", 1).to_list(None)
    by_visit: dict = {}
    for e in events:
        by_visit.setdefault(e["visit_id"], []).append(e)
    out = []
    for v in latest:
        evs = by_visit.get(v["_id"], [])
        if not evs:
            continue
        names = {e["name"] for e in evs}
        out.append({
            "visit_id": v["_id"][:8], "started": v["first"].isoformat(), "ended": v["last"].isoformat(),
            "minutes": round((v["last"] - v["first"]).total_seconds() / 60, 1),
            "source": channel(evs[0]), "landing": evs[0].get("landing") or evs[0]["path"], "device": evs[0].get("device") or "",
            "returning": bool(evs[0].get("visitor_id")), "signed_in": any(e.get("signed_in") for e in evs), "ordered": "purchase" in names or "order_placed" in names,
            "added_to_basket": "add_to_cart" in names,
            "events": [{"at": e["at"].isoformat(), "name": e["name"], "path": e["path"], "props": e.get("props") or {},
                        "items": [i.get("name") for i in e.get("items") or [] if i.get("name")]} for e in evs[:300]],
        })
    return {"visits": out}
