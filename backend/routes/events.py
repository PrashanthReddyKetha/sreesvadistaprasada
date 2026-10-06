"""Our own record of what visitors do on the site — independent of Google Analytics.

POST /api/events           public; the site sends small batches of events
GET  /api/admin/analytics  admin; visits, funnel, sources, top dishes, by day

Privacy: no name, email, phone or address is stored here. A returning-visitor id is only
sent by the browser when the visitor has accepted analytics cookies. IP addresses are not
stored. Events are deleted automatically after RETENTION_DAYS.

What counts as one visit: everything the same browser does with no pause longer than 30 minutes.
"The same browser" is the visitor id for someone who accepted cookies. For everyone else nothing
is kept on their device, so the visitor's address and browser type are combined with a random
value that is replaced every day, turned into a short code, and the address is thrown away. The
code cannot be turned back into an address and cannot link one day to the next.
"""
import hashlib
import re
import secrets
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, ValidationError

from auth import require_admin
from database import db
from audit_log import record_admin_action
from security import RateLimit, client_ip
from routes.customers import is_test_account

router = APIRouter(tags=["Events"])

RETENTION_DAYS = 400
LONDON = ZoneInfo("Europe/London")   # days and hours are the kitchen's, not UTC
UTC = ZoneInfo("UTC")
EPOCH = datetime(1970, 1, 1)
MAX_BATCH = 25
MAX_BODY = 200_000          # bytes; a full batch is a few thousand
MAX_HELD_MS = 10 * 60000    # an event older than this when its batch left is stamped with the arrival time instead
VISIT_GAP_MINUTES = 30      # a pause longer than this starts a new visit
JOIN_PAGE_LOADS = True      # see "What counts as one visit" above
MENU_PATHS = ("/order", "/menu", "/breakfast", "/prasada", "/svadista", "/street-food", "/drinks", "/ragi-specials", "/snacks")
_rate = RateLimit(120, 60)   # batches per minute per visitor

# Any lower-case name is accepted, so a new action on the site needs no change here.
_NAME = re.compile(r"^[a-z][a-z0-9_]{1,39}$")
FUNNEL = ["page_view", "looked_at_menu", "add_to_cart", "begin_checkout", "purchase"]
PROP_KEYS = {"value", "transaction_id", "coupon", "plan", "box_type", "step_number", "step_name", "source",
             "enquiry_type", "category", "location", "item_id", "item_name", "quantity", "term", "method", "reason",
             "label", "area", "href", "seconds", "percent", "status", "message", "view"}
_EMAIL = re.compile(r"[^\s@]+@[^\s@]+")
_DIGITS = re.compile(r"\d[\d\s-]{5,}\d")
_ID = re.compile(r"^[A-Za-z0-9_-]{8,64}$")
# Search-engine crawlers, link checkers, speed tests and scripts run the site's code too. They are not visitors.
_ROBOT = re.compile(
    r"bot/|bot;|googlebot|bingbot|petalbot|crawler|spider|slurp|headless|lighthouse|page ?speed|gtmetrix|pingdom|ptst|prerender|"
    r"phantomjs|datadog|site24x7|uptime|statuscake|screaming frog|facebookexternalhit|bingpreview|mediapartners|"
    r"google-inspectiontool|googleother|feedfetcher|google-read-aloud|adsbot|apis-google|chatgpt|oai-search|gptbot|"
    r"claudebot|claude-user|perplexity|bytespider|ia_archiver|python|curl/|wget|java/|go-http|node-fetch|axios|okhttp|"
    r"libwww|httpclient", re.I)


_MEANT_TO_REPEAT = re.compile(r"\s*(increase|decrease|one more|one less|next|previous)\b", re.I)


def is_robot(user_agent: str) -> bool:
    return bool(_ROBOT.search(user_agent or ""))


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
    ts: Optional[float] = None                           # the browser's clock when it happened, in milliseconds


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
    sent: Optional[float] = None                         # the browser's clock when the batch left, in milliseconds
    events: List[EventIn] = Field(max_length=MAX_BATCH)


async def _day_code(request: Request, day: str) -> str:
    """A short code for "the same browser today". The salt changes daily; neither the address nor the
    browser type is stored."""
    doc = await db.settings.find_one({"_id": "event_salt"})
    if not doc or doc.get("day") != day:
        try:
            # only one of two requests arriving together at midnight may set the day's value
            await db.settings.update_one({"_id": "event_salt", "day": {"$ne": day}},
                                         {"$set": {"day": day, "salt": secrets.token_hex(16)}}, upsert=True)
        except Exception:
            pass                                         # the other request set it first
        doc = await db.settings.find_one({"_id": "event_salt"})
    raw = f'{doc["salt"]}|{client_ip(request)}|{request.headers.get("user-agent", "")}'
    return hashlib.sha256(raw.encode()).hexdigest()[:20]


async def _latest(query: dict) -> Optional[dict]:
    found = await db.events.find(query, {"_id": 0, "visit_id": 1, "at": 1}).sort("at", -1).limit(1).to_list(1)
    return found[0] if found else None


@router.post("/events", status_code=202)
async def record_events(request: Request, _=Depends(_rate)):
    # The body is read as text whatever its declared type. The site sends plain text, so the browser needs no
    # permission round-trip first and a batch sent as the page closes is not lost; older pages send JSON.
    raw = await request.body()
    if len(raw) > MAX_BODY:
        raise HTTPException(status_code=413, detail="Batch too large")
    try:
        batch = Batch.model_validate_json(raw)
    except ValidationError:
        raise HTTPException(status_code=422, detail="Badly formed batch")
    if not _ID.match(batch.visit_id) or (batch.visitor_id and not _ID.match(batch.visitor_id)):
        return {"stored": 0}
    if is_robot(request.headers.get("user-agent", "")):
        return {"stored": 0}
    now = datetime.utcnow()
    visit_id, day_code = batch.visit_id, None
    if JOIN_PAGE_LOADS:
        since = now - timedelta(minutes=VISIT_GAP_MINUTES)
        if batch.visitor_id:
            who = {"visitor_id": batch.visitor_id}
        else:
            # No cookie consent, so the browser forgets its visit number on every full page load
            day_code = await _day_code(request, datetime.now(LONDON).strftime("%Y-%m-%d"))
            who = {"day_code": day_code}
        last = await _latest(who)                        # this browser's latest event, whenever it was
        if last and last["at"] >= since:
            visit_id = last["visit_id"]
        else:
            same = await _latest({"visit_id": batch.visit_id})
            if same and same["at"] < since:
                # The browser kept its visit number through a long pause (a tab left open). This is a new visit.
                anchor = max(same["at"], last["at"]) if last else same["at"]
                visit_id = hashlib.sha256(f"{batch.visit_id}|{anchor.isoformat()}".encode()).hexdigest()[:24]
    docs = []
    for e in batch.events:
        if not _NAME.match(e.name):
            continue
        # Events wait a few seconds in the browser before they are sent: stamp each with when it happened
        held = (batch.sent - e.ts) if (batch.sent and e.ts) else 0
        at = now - timedelta(milliseconds=held) if 0 < held <= MAX_HELD_MS else now
        local = at.replace(tzinfo=UTC).astimezone(LONDON)
        docs.append({
            "name": e.name, "path": e.path.split("?")[0], "at": at, "day": local.strftime("%Y-%m-%d"), "hour": local.hour,
            "ts": int(e.ts) if e.ts and e.ts > 0 else None,
            "visit_id": visit_id, "day_code": day_code, "visitor_id": batch.visitor_id, "signed_in": batch.signed_in, "device": batch.device,
            "source": batch.attribution.source, "medium": batch.attribution.medium, "campaign": batch.attribution.campaign,
            "referrer": batch.attribution.referrer, "landing": batch.attribution.landing.split("?")[0],
            "props": {k: _clean(v) for k, v in e.props.items() if k in PROP_KEYS},
            "items": [{"id": _clean(i.get("id"), 64), "name": _clean(i.get("name")), "quantity": i.get("quantity") if isinstance(i.get("quantity"), int) else 1}
                      for i in e.items[:30] if isinstance(i, dict)],
        })
    if docs:
        await db.events.insert_many(docs)
    out = {"stored": len(docs)}
    if visit_id != batch.visit_id:
        out["visit"] = visit_id                          # the browser carries on with the number the visit already has
    return out


# Where a visit came from, by the referring site's host name (from an Android app: the app's package name).
# A host matches when it is that domain or sits under it — never because the letters merely appear in it.
_NOT_A_SOURCE = ("sreesvadistaprasada.com", "sreesvadistaprasada.vercel.app", "ssp-nextjs.vercel.app", "stripe.com")
_SOURCES = (
    ("Gmail", ("mail.google.com", "com.google.android.gm")),
    ("Google search", ("com.google.android.googlequicksearchbox",)),
    ("Bing search", ("bing.com",)), ("DuckDuckGo search", ("duckduckgo.com",)), ("Yahoo Mail", ("mail.yahoo.com",)),
    ("Yahoo search", ("search.yahoo.com",)), ("Ecosia search", ("ecosia.org",)), ("Brave search", ("search.brave.com",)),
    ("Instagram", ("instagram.com", "com.instagram.android")),
    ("Facebook", ("facebook.com", "fb.com", "fb.me", "messenger.com", "com.facebook.katana", "com.facebook.orca")),
    ("WhatsApp", ("whatsapp.com", "wa.me", "com.whatsapp", "com.whatsapp.w4b")),
    ("X / Twitter", ("t.co", "twitter.com", "x.com", "com.twitter.android")),
    ("YouTube", ("youtube.com", "youtu.be", "com.google.android.youtube")),
    ("TikTok", ("tiktok.com", "com.zhiliaoapp.musically")),
    ("LinkedIn", ("linkedin.com", "lnkd.in")), ("Reddit", ("reddit.com",)), ("Snapchat", ("snapchat.com",)),
    ("Nextdoor", ("nextdoor.co.uk", "nextdoor.com")),
    ("Outlook", ("outlook.live.com", "outlook.office.com", "outlook.office365.com")),
)
_GOOGLE_SEARCH = re.compile(r"^(www\.|m\.)?google\.[a-z]{2,3}(\.[a-z]{2})?$")
_PINTEREST = re.compile(r"(^|\.)pinterest\.[a-z]{2,3}(\.[a-z]{2})?$")


def _is(host: str, domain: str) -> bool:
    return host == domain or host.endswith("." + domain)


def channel(e: dict) -> str:
    """A plain-language name for where the visit came from."""
    src, med, ref = (e.get("source") or "").lower(), (e.get("medium") or "").lower(), (e.get("referrer") or "").lower()
    if src:
        return f"{src} ({med})" if med else src
    host = ref.split("/")[0].split(":")[0]
    if not host or any(_is(host, own) for own in _NOT_A_SOURCE):
        return "Direct or unknown"
    for label, domains in _SOURCES:
        if any(_is(host, d) for d in domains):
            return label
    if _GOOGLE_SEARCH.match(host):
        return "Google search"
    if _is(host, "google.com") or host.startswith("com.google."):
        return "Google (other)"                          # Maps, Business Profile, sign-in and other Google pages
    if _PINTEREST.search(host):
        return "Pinterest"
    return host


def _in_order(events: list) -> list:
    """The events in the order they happened, each with the time it happened ("when"); of the several time-on-page
    reports one page view can send, only the last is kept.

    Events are stamped on arrival, and a batch that waited for the server to wake arrives late. The browser's own
    clock gives the true order and gaps within a visit; the smallest delay seen in the visit puts it on our clock."""
    by_visit: dict = {}
    for e in events:
        by_visit.setdefault(e["visit_id"], []).append(e)
    out = []
    for evs in by_visit.values():
        stamped = [e for e in evs if e.get("ts")]
        shift = min((e["at"] - EPOCH).total_seconds() * 1000 - e["ts"] for e in stamped) if stamped else 0
        final: dict = {}
        for e in evs:
            e["when"] = EPOCH + timedelta(milliseconds=e["ts"] + shift) if e.get("ts") else e["at"]
            view = (e.get("props") or {}).get("view") if e["name"] == "page_leave" else None
            if view and (view not in final or (e["props"].get("seconds") or 0) >= (final[view]["props"].get("seconds") or 0)):
                final[view] = e
        out += [e for e in evs if e["name"] != "page_leave" or not (e.get("props") or {}).get("view") or final[e["props"]["view"]] is e]
    out.sort(key=lambda e: e["when"])
    return out


def _step(e: dict) -> str:
    """The name an event goes by in the order funnel. Paying for a meal plan is not a step towards a food order."""
    if e["name"] in ("payment_started", "payment_started_failed") and (e.get("props") or {}).get("method") == "subscription":
        return "plan_" + e["name"]
    return e["name"]


def _units(e: dict) -> int:
    return sum(i.get("quantity") or 1 for i in e.get("items") or []) or 1


async def _first_seen(events: list) -> dict:
    """When each visitor who accepted cookies was first seen, over the whole record — not only the period asked for."""
    ids = list({e["visitor_id"] for e in events if e.get("visitor_id")})
    if not ids:
        return {}
    rows = await db.events.aggregate([{"$match": {"visitor_id": {"$in": ids}}},
                                      {"$group": {"_id": "$visitor_id", "first": {"$min": "$at"}}}]).to_list(None)
    return {r["_id"]: r["first"] for r in rows}


def _came_back(evs: list, first_seen: dict) -> Optional[bool]:
    """None: cookies not accepted, so it cannot be known. True: this visitor had been here before this visit."""
    known = [e for e in evs if e.get("visitor_id")]
    if not known:
        return None
    first = first_seen.get(known[0]["visitor_id"])
    return bool(first and first < min(e["at"] for e in known))


async def _order_book(since: datetime, events: list) -> dict:
    """Orders and plans as the order book has them. The visit record only knows the orders it saw being placed."""
    staff ={u["id"] async for u in db.users.find({}, {"_id": 0, "id": 1, "email": 1, "role": 1})
             if u.get("role") == "admin" or is_test_account(u.get("email"))}

    def real(doc: dict) -> bool:
        return doc.get("user_id") not in staff and not is_test_account(doc.get("customer_email"))
    period = {"created_at": {"$gte": since}, "status": {"$ne": "cancelled"}}
    orders = [o async for o in db.orders.find(period, {"_id": 0, "id": 1, "order_number": 1, "total": 1, "user_id": 1, "customer_email": 1}) if real(o)]
    plans = [s async for s in db.subscriptions.find(period, {"_id": 0, "price": 1, "user_id": 1, "customer_email": 1}) if real(s)]
    seen = {str(e["props"]["transaction_id"]) for e in events if e["name"] == "purchase" and (e.get("props") or {}).get("transaction_id")}
    return {
        "orders": len(orders), "income": round(sum(float(o.get("total") or 0) for o in orders), 2),
        "orders_seen_in_a_visit": sum(1 for o in orders if (o.get("order_number") or str(o.get("id") or "")[-6:].upper()) in seen),
        "plans_sold": len(plans), "plan_income": round(sum(float(s.get("price") or 0) for s in plans), 2),
    }


@router.get("/admin/analytics")
async def analytics(days: int = 30, _: dict = Depends(require_admin)):
    days = max(1, min(days, RETENTION_DAYS))
    # "Last N days" = today and the N-1 London calendar days before it, so every day row is a whole day (A-0003, ANA-005)
    start_ldn = datetime.now(LONDON).replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days - 1)
    since = start_ldn.astimezone(UTC).replace(tzinfo=None)
    events = _in_order(await db.events.find({"at": {"$gte": since}}, {"_id": 0, "day_code": 0}).sort("at", 1).to_list(None))

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
            if prev is None or e["when"] >= prev[0]:
                last_page[e["visit_id"]] = (e["when"], e["path"])
            h = (e.get("hour") if e.get("hour") is not None else e["at"].hour)
            hours[h] = hours.get(h, 0) + 1
        v = visits.setdefault(e["visit_id"], {"names": set(), "first": e, "value": 0.0, "order": None})
        v["names"].add(_step(e))
        v["names"].add("page_view")          # every visit arrived, whether or not that first event was kept
        if e["name"] in ("view_item", "menu_category_view", "add_to_cart") or (e["name"] == "page_view" and e["path"].startswith(MENU_PATHS)):
            v["names"].add("looked_at_menu")
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

    # Reaching a later step means the earlier ones were reached too: a basket saved on an earlier visit still had to
    # exist for checkout to start, and an order placed from a reloaded checkout page still went through checkout.
    for v in visits.values():
        for later, earlier in (("purchase", "begin_checkout"), ("payment_started", "begin_checkout"),
                               ("begin_checkout", "add_to_cart"), ("add_to_cart", "looked_at_menu")):
            if later in v["names"]:
                v["names"].add(earlier)

    for v in visits.values():
        ch = channel(v["first"])
        s = sources.setdefault(ch, {"source": ch, "visits": 0, "added_to_basket": 0, "orders": 0, "income": 0.0})
        s["visits"] += 1
        s["added_to_basket"] += "add_to_cart" in v["names"]
        s["orders"] += "purchase" in v["names"]
        s["income"] += v["value"]
        dev = v["first"].get("device") or "unknown"
        devices[dev] = devices.get(dev, 0) + 1

    # ── Journeys: each visit's events in order ───────────────────────────────
    STEPS = [("page_view", "Arrived"), ("looked_at_menu", "Looked at the menu"), ("add_to_cart", "Added to basket"),
             ("begin_checkout", "Started checkout"), ("payment_started", "Started paying"), ("purchase", "Ordered")]
    ordered_events: dict = {}
    for e in events:
        ordered_events.setdefault(e["visit_id"], []).append(e)

    def funnel_row(label: str, group: list) -> dict:
        row = {"name": label, "visits": len(group)}
        for name, _ in STEPS[1:]:
            row[name] = sum(1 for v in group if name in visits[v]["names"])
        row["order_rate"] = round(row["purchase"] / len(group), 3) if group else 0
        return row

    by_landing, by_device, by_kind = {}, {}, {"First visit": [], "Returning visitor": [], "Cookies not accepted": []}
    for vid, v in visits.items():
        first = v["first"]
        by_landing.setdefault(first.get("landing") or first.get("path") or "/", []).append(vid)
        by_device.setdefault(first.get("device") or "unknown", []).append(vid)
    first_seen = await _first_seen(events)
    for vid, evs in ordered_events.items():
        back = _came_back(evs, first_seen)
        by_kind["Cookies not accepted" if back is None else "Returning visitor" if back else "First visit"].append(vid)
    landing_funnels = [funnel_row(path, group) for path, group in sorted(by_landing.items(), key=lambda kv: -len(kv[1]))[:12]]
    device_funnels = [funnel_row(d, group) for d, group in sorted(by_device.items(), key=lambda kv: -len(kv[1]))]
    visitor_funnels = [funnel_row(k, group) for k, group in by_kind.items() if group]

    # Where visits that did not order stopped: the furthest step reached, and the last thing done at the two costly stages
    furthest, last_at_checkout, last_at_basket = {}, {}, {}
    abandoned_baskets, abandoned_value, minutes_to_order = 0, 0.0, []
    for vid, evs in ordered_events.items():
        names = visits[vid]["names"]
        if "purchase" in names:
            bought_at = next(e["when"] for e in evs if e["name"] == "purchase")
            minutes_to_order.append(max((bought_at - evs[0]["when"]).total_seconds(), 0) / 60)
            continue
        reached = next(label for name, label in reversed(STEPS) if name in names or name == "page_view")
        furthest[reached] = furthest.get(reached, 0) + 1
        meaningful = [e for e in evs if e["name"] not in ("page_leave", "scroll_depth")]
        last = meaningful[-1] if meaningful else evs[-1]
        what = (last.get("props") or {}).get("label") or (last.get("props") or {}).get("reason") or ""
        last_text = f'{last["name"].replace("_", " ")}{": " + str(what) if what else ""} on {last["path"]}'
        # What was still in the basket: everything added in this visit, less everything taken back out
        worth = lambda name: sum(float((e.get("props") or {}).get("value") or 0) for e in evs if e["name"] == name)   # noqa: E731
        still_in = sum(_units(e) for e in evs if e["name"] == "add_to_cart") - sum(_units(e) for e in evs if e["name"] == "remove_from_cart")
        if "begin_checkout" in names:
            last_at_checkout[last_text] = last_at_checkout.get(last_text, 0) + 1
            abandoned_baskets += 1
            # the basket as it stood when checkout began — it may have been filled on an earlier visit
            began = [float(e["props"]["value"]) for e in evs if e["name"] == "begin_checkout" and isinstance((e.get("props") or {}).get("value"), (int, float))]
            abandoned_value += began[-1] if began else max(worth("add_to_cart") - worth("remove_from_cart"), 0)
        elif still_in > 0:
            last_at_basket[last_text] = last_at_basket.get(last_text, 0) + 1
            abandoned_baskets += 1
            abandoned_value += max(worth("add_to_cart") - worth("remove_from_cart"), 0)
    minutes_to_order.sort()

    def median(values: list):
        values = sorted(values)
        return round(values[len(values) // 2], 1) if values else None

    # Time between steps (minutes), from each visit's first occurrence of the step
    gaps = {"Arriving to first dish added": [], "Adding to starting checkout": [], "Starting checkout to starting to pay": [], "Starting to pay to order placed": []}
    pairs = [("Arriving to first dish added", None, "add_to_cart"), ("Adding to starting checkout", "add_to_cart", "begin_checkout"),
             ("Starting checkout to starting to pay", "begin_checkout", "payment_started"), ("Starting to pay to order placed", "payment_started", "purchase")]
    paths_ordered, paths_left, weekday_groups = {}, {}, {}
    field_last, taps, bands = {}, {}, {}
    slot_views, slot_picks = {"today": [], "tomorrow": []}, {}
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    def band(price) -> str:
        try:
            p = float(price)
        except (TypeError, ValueError):
            return ""
        return "Under £5" if p < 5 else "£5 to £7.99" if p < 8 else "£8 to £10.99" if p < 11 else "£11 and over"

    for vid, evs in ordered_events.items():
        first_at = {}
        for e in evs:
            first_at.setdefault(_step(e), e["when"])
        for label, a, b in pairs:
            start = evs[0]["when"] if a is None else first_at.get(a)
            if start and first_at.get(b) and first_at[b] >= start:
                gaps[label].append((first_at[b] - start).total_seconds() / 60)
        route = []
        for e in evs:
            if e["name"] == "page_view" and (not route or route[-1] != e["path"]):
                route.append(e["path"])
        if route:
            key = " → ".join(route[:5]) + (" → …" if len(route) > 5 else "")
            target = paths_ordered if "purchase" in visits[vid]["names"] else paths_left
            target[key] = target.get(key, 0) + 1
        try:
            weekday_groups.setdefault(datetime.strptime(evs[0]["day"], "%Y-%m-%d").weekday(), []).append(vid)
        except (KeyError, ValueError):
            pass
        done = visits[vid]["names"] & {"purchase", "subscription_purchase", "login", "sign_up", "enquiry_submit"}
        # a search box is not a form to be given up on; searches have their own table
        focused = [e for e in evs if e["name"] == "field_focus" and not str((e.get("props") or {}).get("label") or "").lower().startswith("search")]
        if focused and not done:
            last = focused[-1]
            k = (last["path"], (last.get("props") or {}).get("area") or "", (last.get("props") or {}).get("label") or "")
            field_last[k] = field_last.get(k, 0) + 1
        opened_here: dict = {}        # dish -> [price band, times opened, times added after being opened]
        for e in evs:
            p = e.get("props") or {}
            if e["name"] == "repeated_taps":
                # quantity buttons are meant to be tapped several times; older records still hold them
                if not _MEANT_TO_REPEAT.match(str(p.get("label") or "")):
                    k = (p.get("label") or "", e["path"])
                    taps[k] = taps.get(k, 0) + 1
            elif e["name"] == "view_item" and band(p.get("value")):
                for i in e.get("items") or []:
                    if i.get("name"):
                        opened_here.setdefault(i["name"], [band(p.get("value")), 0, 0])[1] += 1
            elif e["name"] == "add_to_cart":
                for i in e.get("items") or []:
                    if i.get("name") in opened_here:
                        opened_here[i["name"]][2] += 1
            elif e["name"] == "slots_viewed" and p.get("method") in slot_views and p.get("percent") is not None:
                slot_views[p["method"]].append(float(p["percent"]))
            elif e["name"] == "slot_selected" and p.get("label"):
                slot_picks[str(p["label"])] = slot_picks.get(str(p["label"]), 0) + 1
        # Of the times a dish was opened, how many were followed by adding that dish. Dishes added straight from a
        # list were never opened, so they say nothing about whether a price puts people off.
        for b, opens, adds in opened_here.values():
            row = bands.setdefault(b, {"opened": 0, "added": 0})
            row["opened"] += opens
            row["added"] += min(adds, opens)
    band_order = ["Under £5", "£5 to £7.99", "£8 to £10.99", "£11 and over"]
    total_picks = sum(slot_picks.values())

    # Dishes taken back out of the basket
    removed: dict = {}
    for e in events:
        if e["name"] == "remove_from_cart":
            for i in e.get("items") or []:
                if i.get("name"):
                    removed[i["name"]] = removed.get(i["name"], 0) + (i.get("quantity") or 1)
    removals = [{"name": n, "removed": q, "added": added.get(n, 0), "removal_rate": round(q / added[n], 2) if added.get(n) else None}
                for n, q in sorted(removed.items(), key=lambda kv: -kv[1])[:15]]

    # Dabba Wala: each step of the plan wizard
    sub_visits = [vid for vid, v in visits.items() if v["names"] & {"begin_subscription", "subscription_step_view"}]
    step_reached: dict = {}
    for vid in sub_visits:
        for e in ordered_events[vid]:
            if e["name"] == "subscription_step_view":
                p = e.get("props") or {}
                key = (int(p.get("step_number") or 0), str(p.get("step_name") or f"Step {p.get('step_number')}"))
                step_reached.setdefault(key, set()).add(vid)
    subscription_funnel = [{"step": "Opened the plan page", "visits": len(sub_visits)}]
    subscription_funnel += [{"step": f"{n}. {label}", "visits": len(vs)} for (n, label), vs in sorted(step_reached.items())]
    for name, label in (("select_subscription_plan", "Chose a plan"), ("plan_priced", "Saw the price for their postcode"),
                        ("subscription_purchase", "Bought a plan")):
        subscription_funnel.append({"step": label, "visits": sum(1 for vid in sub_visits if name in visits[vid]["names"])})

    def top(d, n=15):
        return [{"name": k, "count": c} for k, c in sorted(d.items(), key=lambda kv: -kv[1])[:n]]

    exits: dict = {}
    for vid, (_, path) in last_page.items():
        if "purchase" not in visits[vid]["names"]:          # where visits that did not order ended
            exits[path] = exits.get(path, 0) + 1
    def verdict(opened: int, add: int, ordered: int) -> str:
        if opened < 10:
            return "Too few views to judge"
        if ordered >= max(3, opened * 0.15):
            return "Selling well — worth featuring"
        if add >= opened * 0.2 and ordered == 0:
            return "Added to baskets but not bought — check the checkout"
        if add < opened * 0.05:
            return "Looked at, rarely chosen — check photo, price, description"
        return "Steady"

    interest = sorted(
        ({"name": n, "opened": v, "added": added.get(n, 0), "ordered": ordered_dishes.get(n, 0),
          "verdict": verdict(v, added.get(n, 0), ordered_dishes.get(n, 0))} for n, v in viewed.items()),
        key=lambda d: (d["ordered"], -d["opened"]))[:15]
    menu = await db.menu_items.find({"available": True}, {"_id": 0, "name": 1, "category": 1, "subcategory": 1, "price": 1}).to_list(None)
    on_menu = {m["name"]: m for m in menu}
    section_names = {"breakfast": "Breakfast", "veg": "Prasada (veg)", "nonVeg": "Svadista (non-veg)", "streetFood": "Street food",
                     "drinks": "Drinks", "ragiSpecials": "Ragi specials", "pickles": "Pickles", "podis": "Podis"}
    dish_ranking = sorted(
        ({"name": n, "section": section_names.get((on_menu.get(n) or {}).get("category"), "No longer on the menu" if n not in on_menu else ""),
          "price": (on_menu.get(n) or {}).get("price"),
          "opened": viewed.get(n, 0), "added": added.get(n, 0), "ordered": ordered_dishes.get(n, 0),
          "verdict": ("Not looked at yet" if not (viewed.get(n) or added.get(n) or ordered_dishes.get(n))
                      else verdict(viewed.get(n, 0), added.get(n, 0), ordered_dishes.get(n, 0)))}
         for n in set(on_menu) | set(viewed) | set(added) | set(ordered_dishes)),
        key=lambda d: (-d["ordered"], -d["added"], -d["opened"], d["name"]))
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
        "order_book": await _order_book(since, events),
        "funnel": funnel,
        "by_day": [{**d, "visits": len(d["visits"]), "income": round(d["income"], 2)} for d in sorted(by_day.values(), key=lambda d: d["day"])],
        "sources": sorted(({**s, "income": round(s["income"], 2)} for s in sources.values()), key=lambda s: -s["visits"]),
        "devices": devices,
        "top_pages": top(pages),
        "most_viewed_dishes": top(viewed),
        "most_added_dishes": top(added),
        "event_counts": counts,
        "exit_pages": top(exits, 12),
        "landing_funnels": landing_funnels,
        "device_funnels": device_funnels,
        "visitor_funnels": visitor_funnels,
        "stopped_at": [{"step": label, "visits": furthest.get(label, 0)} for _, label in STEPS[:-1]],
        "last_action_before_leaving_checkout": top(last_at_checkout, 10),
        "last_action_before_leaving_with_a_basket": top(last_at_basket, 10),
        "abandoned": {"visits": abandoned_baskets, "basket_value": round(max(abandoned_value, 0), 2)},
        "minutes_to_order": {"median": round(minutes_to_order[len(minutes_to_order) // 2], 1) if minutes_to_order else None,
                             "orders_measured": len(minutes_to_order)},
        "removals": removals,
        "step_times": [{"between": label, "median_minutes": median(v), "visits": len(v)} for label, v in gaps.items()],
        "paths_that_ordered": top(paths_ordered, 8),
        "paths_that_left": top(paths_left, 8),
        "weekday_funnels": [funnel_row(day_names[d], weekday_groups[d]) for d in sorted(weekday_groups)],
        "field_drop_off": [{"page": k[0], "form": k[1], "last_field": k[2], "visits": n} for k, n in sorted(field_last.items(), key=lambda kv: -kv[1])[:15]],
        "repeated_taps": [{"label": k[0], "page": k[1], "visits": n} for k, n in sorted(taps.items(), key=lambda kv: -kv[1])[:15]],
        "price_bands": [{"band": b, **bands[b], "add_rate": round(bands[b]["added"] / bands[b]["opened"], 2) if bands[b]["opened"] else None}
                        for b in band_order if b in bands],
        "collection_slots": {
            "times_shown": {d: {"views": len(v), "average_percent_full": round(sum(v) / len(v)) if v else None} for d, v in slot_views.items()},
            "chosen": [{"name": n, "count": c} for n, c in sorted(slot_picks.items(), key=lambda kv: -kv[1])[:12]],
            "chose_asap_share": round(slot_picks.get("ASAP", 0) / total_picks, 2) if total_picks else None,
        },
        "subscription_funnel": subscription_funnel,
        "interest_without_orders": interest,
        "dish_ranking": dish_ranking,
        "checkout": checkout,
        "actions": sorted(({"name": n, "count": c, "visits": len(action_visits[n])} for n, c in counts.items()), key=lambda a: -a["count"]),
        "top_clicks": [{"label": k[0], "area": k[1], "page": k[2], "count": c} for k, c in sorted(clicks.items(), key=lambda kv: -kv[1])[:40]],
        "searches": top(searches, 25),
        "problems": [{"name": k[0], "detail": k[1], "page": k[2], "count": c} for k, c in sorted(problems.items(), key=lambda kv: -kv[1])[:25]],
        "by_hour": [{"hour": h, "page_views": hours.get(h, 0)} for h in range(24)],
        "time_on_page": sorted(({"page": pth, "views": t[0], "average_seconds": round(t[1] / t[0]), "average_scroll": round(t[2] / t[0])}
                                for pth, t in stay.items() if t[0]), key=lambda r: -r["views"])[:20],
    }


@router.post("/admin/analytics/reset")
async def start_afresh(admin: dict = Depends(require_admin)):
    """Empty the visit record and the stored daily figures, so counting starts again from now.
    Orders, customers, plans and messages are not touched."""
    gone = await db.events.delete_many({})
    await db.daily_metrics.delete_many({})
    await record_admin_action(admin, "emptied the visit record", "Analytics", {"events": gone.deleted_count}, {"events": 0})
    return {"ok": True, "removed": gone.deleted_count}


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
    events = _in_order(await db.events.find({"visit_id": {"$in": ids}}, {"_id": 0}).sort("at", 1).to_list(None))
    first_seen = await _first_seen(events)
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
            "visit_id": v["_id"][:8], "started": evs[0]["when"].isoformat(), "ended": evs[-1]["when"].isoformat(),
            "minutes": round((evs[-1]["when"] - evs[0]["when"]).total_seconds() / 60, 1),
            "source": channel(evs[0]), "landing": evs[0].get("landing") or evs[0]["path"], "device": evs[0].get("device") or "",
            "returning": bool(_came_back(evs, first_seen)), "signed_in": any(e.get("signed_in") for e in evs), "ordered": "purchase" in names or "order_placed" in names,
            "added_to_basket": "add_to_cart" in names,
            "events": [{"at": e["when"].isoformat(), "name": e["name"], "path": e["path"], "props": e.get("props") or {},
                        "items": [i.get("name") for i in e.get("items") or [] if i.get("name")]} for e in evs[:300]],
        })
    return {"visits": out}
