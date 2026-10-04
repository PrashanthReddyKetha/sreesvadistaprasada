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
from typing import List, Optional

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field

from auth import get_optional_user, require_admin
from database import db
from security import RateLimit

router = APIRouter(tags=["Events"])

RETENTION_DAYS = 400
MAX_BATCH = 25
_rate = RateLimit(120, 60)   # batches per minute per visitor

ALLOWED = {
    "page_view", "menu_category_view", "view_item", "add_to_cart", "remove_from_cart", "view_cart",
    "begin_checkout", "purchase", "begin_subscription", "subscription_step_view", "select_subscription_plan",
    "subscription_purchase", "notify_me_signup", "newsletter_signup", "whatsapp_click", "enquiry_submit",
    "login", "sign_up", "coupon_applied", "coupon_failed", "payment_failed", "search", "review_submitted", "reorder",
}
FUNNEL = ["page_view", "view_item", "add_to_cart", "begin_checkout", "purchase"]
PROP_KEYS = {"value", "transaction_id", "coupon", "plan", "box_type", "step_number", "step_name", "source",
             "enquiry_type", "category", "location", "item_id", "item_name", "quantity", "term", "method", "reason"}
_ID = re.compile(r"^[A-Za-z0-9_-]{8,64}$")


def _clean(value, limit=120):
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value
    return str(value)[:limit] if value is not None else None


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
    device: str = Field(default="", max_length=10)       # phone | desktop
    attribution: Attribution = Field(default_factory=Attribution)
    events: List[EventIn] = Field(max_length=MAX_BATCH)


@router.post("/events", status_code=202)
async def record_events(batch: Batch, request: Request, user: Optional[dict] = Depends(get_optional_user), _=Depends(_rate)):
    if not _ID.match(batch.visit_id) or (batch.visitor_id and not _ID.match(batch.visitor_id)):
        return {"stored": 0}
    now = datetime.utcnow()
    docs = []
    for e in batch.events:
        if e.name not in ALLOWED:
            continue
        docs.append({
            "name": e.name, "path": e.path.split("?")[0], "at": now, "day": now.strftime("%Y-%m-%d"),
            "visit_id": batch.visit_id, "visitor_id": batch.visitor_id, "signed_in": bool(user), "device": batch.device,
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
    for e in events:
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
    }
