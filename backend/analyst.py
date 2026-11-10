"""A short description under every table and graph in Admin › Analytics, for whatever dates the owner picks: what it
shows, how it moved against the period before, the likely reason, and what to do (owner, 10 Nov 2026).

Written by rules on our own server from the screen's own figures — no AI, no cost, nothing sent anywhere (the owner
spends nothing beyond the Claude subscription). With few visits, the descriptions say so instead of drawing conclusions.
"""
from datetime import date, datetime, timedelta

from database import db

SMALL = 30            # fewer visits than this: a hint, not a trend

NOTES = ("overall", "traffic", "funnel", "sources", "landing", "device", "visitor", "stopped", "dabba", "left_checkout",
         "left_basket", "weekday", "step_times", "price", "routes_ordered", "routes_left", "fields", "taps", "slots", "removals",
         "checkout", "exits", "dishes", "most_opened", "most_added", "pages", "days", "actions", "clicks", "searches", "problems",
         "time_on_page", "hours", "visits")


def _page(path: str) -> str:
    from visit_story import page_name
    return page_name(path)


def _pct(a, b) -> str:
    return f"{round(a / b * 100)}%" if b else "—"


def _money(v) -> str:
    return f"£{float(v or 0):,.2f}"


def _day(iso: str) -> str:
    return datetime.fromisoformat(iso).strftime("%a %-d %b")


def _moved(now, before, money=False) -> str:
    """'up 20% from 12' / 'down 5% from £40.00' / 'the same as the period before' / 'none in the period before'."""
    if before is None:
        return ""
    if not before and not now:
        return "none in the period before either"
    if not before:
        return "none in the period before"
    if now == before:
        return "the same as the period before"
    shown = _money(before) if money else f"{before:g}" if isinstance(before, float) else str(before)
    return f"{'up' if now > before else 'down'} {round(abs(now - before) / before * 100)}% from {shown}"


def _n(count, one: str, many: str = "") -> str:
    """'1 visit' / '3 visits' / '1 person' / '2 people'."""
    return f"{count} {one if count == 1 else (many or one + 's')}"


def _route(route: str) -> str:
    return " → ".join(p if p == "…" else _page(p) for p in route.split(" → "))


def _mins(m) -> str:
    return "under a minute" if m < 1 else f"about {m:g} min"


def _few(visits: int) -> str:
    return f" With only {visits} visit{'s' if visits != 1 else ''}, read this as a hint, not a trend." if visits < SMALL else ""


def _top(rows, key="count"):
    rows = [r for r in rows or [] if (r.get(key) or 0) > 0]
    return rows[0] if rows else None


def notes(now: dict, before: dict, summary: dict, history: list, shop: dict, sales: dict) -> dict:
    """Every description, from the period's figures and the period before's."""
    t, bt = now["totals"], before["totals"]
    book, bbook = now.get("order_book") or {}, before.get("order_book") or {}
    visits, orders, income = t["visits"], book.get("orders", 0), book.get("income", 0.0)
    few = _few(visits)
    out = {}
    funnel = {f["step"]: f["visits"] for f in now["funnel"]}
    looked, added, began, bought = (funnel.get(k, 0) for k in ("looked_at_menu", "add_to_cart", "begin_checkout", "purchase"))

    # ── The period as a whole ──────────────────────────────────────────────────
    if not visits:
        out["overall"] = "No visits were recorded for these dates, so there is nothing to read yet."
    else:
        o = [f"{_n(visits, 'visit')} ({_moved(visits, bt['visits'])}) and "
             + (f"{_n(orders, 'website order')} worth {_money(income)} ({_moved(income, bbook.get('income', 0), money=True)})."
                if orders else "no website orders.")]
        if orders or bbook.get("orders"):
            o.append(f"{_pct(orders, visits)} of visits ordered"
                     + (f", against {_pct(bbook.get('orders', 0), bt['visits'])} the period before." if bt["visits"] else "."))
        if summary.get("lost_visits"):
            o.append(f"{_n(summary['lost_visits'], 'visit')} got as far as a basket or checkout and didn't order"
                     + (f", leaving about {_money(summary['lost_value'])} of food behind" if summary.get("lost_value") else "")
                     + " — the quickest orders to win back.")
        if sales.get("sales"):
            ch = ", ".join(f"{k} {v['sales']}" for k, v in sorted(sales["by_channel"].items(), key=lambda kv: -kv[1]["sales"]))
            o.append(f"Across every channel the sales book has {sales['sales']} sales worth {_money(sales['net_sales_gbp'])} ({ch}).")
        weeks = [w for w in history if w["visits"]]
        if len(weeks) >= 4:
            recent = weeks[-4:]
            o.append(f"If the last four weeks carry on, expect about {min(w['visits'] for w in recent)}–{max(w['visits'] for w in recent)} visits "
                     f"and {min(w['orders'] for w in recent)}–{max(w['orders'] for w in recent)} website orders next week.")
        closed = next((x["visits"] for x in summary.get("outcomes", []) if x["outcome"] == "Kitchen was closed"), 0)
        if closed and closed >= max(2, visits * 0.2):
            o.append(f"Focus first: {closed} visits came while the kitchen was closed — keeping the kitchen switch open during opening "
                     "hours is the biggest single gain.")
        elif began and bought < began:
            o.append(f"Focus first: {began - bought} of {began} checkouts didn't finish — the Journeys tab shows where they stopped.")
        elif looked and added / looked < 0.15:
            o.append(f"Focus first: only {_pct(added, looked)} of people who looked at the menu added anything — photos, prices and the "
                     "first dishes shown matter most.")
        elif visits < 100:
            o.append("Focus first: more people need to find the site — Google Business Profile posts, Instagram, and asking happy "
                     "customers to share.")
        out["overall"] = " ".join(o) + few

    # ── Traffic graph ──────────────────────────────────────────────────────────
    days = now.get("by_day") or []
    if not t["page_views"]:
        out["traffic"] = "No page views in this period."
    elif now["days"] == 1:
        hours = [h for h in now.get("by_hour") or [] if h["page_views"]]
        busiest = max(hours, key=lambda h: h["page_views"]) if hours else None
        out["traffic"] = (f"{t['page_views']} page views on this day ({_moved(t['page_views'], bt['page_views'])})"
                          + (f", busiest at {busiest['hour']:02d}:00 with {busiest['page_views']}." if busiest else "."))
    else:
        best = max(days, key=lambda d: d["page_views"])
        active = sum(1 for d in days if d["visits"])
        half = len(days) // 2
        first, second = sum(d["visits"] for d in days[:half]), sum(d["visits"] for d in days[half:])
        trend = ("Visits picked up in the second half of the period." if second > first * 1.2 else
                 "Visits fell away in the second half of the period." if first > second * 1.2 else "Visits held fairly steady through the period.")
        out["traffic"] = (f"{t['page_views']} page views over {now['days']} days ({_moved(t['page_views'], bt['page_views'])}); the busiest day was "
                          f"{_day(best['day'])} with {best['page_views']}. Visitors came on {active} of the {now['days']} days. {trend}")

    # ── From visit to order ────────────────────────────────────────────────────
    if visits:
        steps = [("looked at the menu", looked), ("added to the basket", added), ("started checkout", began), ("ordered", bought)]
        prev, prev_n, worst = "visited", visits, None
        for name, n in steps:
            if prev_n and (worst is None or (prev_n - n) / prev_n > worst[2]):
                worst = (prev, name, (prev_n - n) / prev_n, prev_n - n)
            prev, prev_n = name, n
        out["funnel"] = (f"Of {visits} visits, {looked} looked at the menu, {added} added food, {began} started checkout and {bought} ordered. "
                         + (f"The biggest drop is between \"{worst[0]}\" and \"{worst[1]}\": {_n(worst[3], 'person', 'people')} ({round(worst[2] * 100)}%) stopped "
                            "there — that step is where to work." if worst and worst[3] else "") + few)
    else:
        out["funnel"] = "No visits in this period, so no path to an order to read."

    # ── Sources ───────────────────────────────────────────────────────────────
    src = now.get("sources") or []
    if src:
        top = src[0]
        conv = [s for s in src if s["visits"] >= 5 and s["orders"]]
        best = max(conv, key=lambda s: s["orders"] / s["visits"]) if conv else None
        before_top = (before.get("sources") or [{}])[0].get("source")
        out["sources"] = " ".join(x for x in (
            f"{top['source']} brought the most people: {top['visits']} of {visits} visits ({_pct(top['visits'], visits)}).",
            f"{best['source']} turned visits into orders best ({best['orders']} from {best['visits']})." if best else "",
            f"The period before, the top source was {before_top}." if before_top and before_top != top["source"] else "",
            "\"Direct or unknown\" means people typing the address, using a bookmark or an app link." if any(s["source"] == "Direct or unknown" for s in src[:3]) else "",
        ) if x)
    else:
        out["sources"] = "No visits, so no sources to compare."

    def funnel_note(rows, what):
        rows = [r for r in rows or [] if r["visits"]]
        if not rows:
            return f"Nothing to compare by {what} yet."
        top = rows[0]
        txt = f"Most visits came via {_page(top['name']) if top['name'].startswith('/') else top['name']} ({top['visits']}; {top['add_to_cart']} added food, {top['purchase']} ordered)."
        weak = next((r for r in rows if r["visits"] >= 5 and not r["add_to_cart"] and r is not top), None)
        if weak:
            txt += f" {_page(weak['name']) if weak['name'].startswith('/') else weak['name']} had {weak['visits']} visits and nobody added food — worth a look."
        ordered = max(rows, key=lambda r: r["purchase"])
        if ordered["purchase"] and ordered is not top:
            txt += f" Orders came most from {_page(ordered['name']) if ordered['name'].startswith('/') else ordered['name']}."
        return txt
    out["landing"] = funnel_note(now.get("landing_funnels"), "landing page")

    dev = {r["name"]: r for r in now.get("device_funnels") or []}
    ph, pc = dev.get("phone"), dev.get("desktop")
    if ph or pc:
        parts = [f"{label}: {_n(r['visits'], 'visit')}, {r['purchase']} ordered ({_pct(r['purchase'], r['visits'])})" for label, r in (("Phones", ph), ("computers", pc)) if r]
        tip = ""
        if ph and pc and ph["visits"] >= 5 and pc["visits"] >= 5 and ph["purchase"] / ph["visits"] < pc["purchase"] / pc["visits"]:
            tip = " Phones order less often than computers — try ordering on a phone yourself to see what gets in the way."
        elif ph and ph["visits"] > (pc or {}).get("visits", 0):
            tip = " Most people use phones, so check every change on a phone first."
        out["device"] = "; ".join(parts) + "." + tip
    else:
        out["device"] = "No visits to split by device."

    kinds = {r["name"]: r for r in now.get("visitor_funnels") or []}
    if kinds:
        new, back, unk = kinds.get("First visit"), kinds.get("Returning visitor"), kinds.get("Cookies not accepted")
        line = ", ".join(x for x in (f"{new['visits']} first visits ({new['purchase']} ordered)" if new else "",
                                      f"{back['visits']} returning ({back['purchase']} ordered)" if back else "") if x)
        line = (line + "." if line else "") + (f" {unk['visits']} didn't accept cookies, so whether they were new can't be told." if unk else "")
        if back and new and back["visits"] >= 3 and new["visits"] and back["purchase"] / back["visits"] > new["purchase"] / new["visits"]:
            line += " Returning visitors order more readily — reminders to past customers (with their consent) should pay off."
        out["visitor"] = line.strip()
    else:
        out["visitor"] = "No visits to split into new and returning."

    stopped = [s for s in now.get("stopped_at") or [] if s["visits"]]
    ab = now.get("abandoned") or {}
    out["stopped"] = (f"Most visits that didn't order stopped at \"{max(stopped, key=lambda s: s['visits'])['step']}\" "
                      f"({max(s['visits'] for s in stopped)})."
                      + (f" {ab['visits']} left with food in the basket worth about {_money(ab.get('basket_value'))} "
                         f"({_moved(ab['visits'], (before.get('abandoned') or {}).get('visits', 0))})." if ab.get("visits") else "")
                      if stopped else "Nobody left part-way in this period.")

    sub = now.get("subscription_funnel") or []
    opened = sub[0]["visits"] if sub else 0
    if not opened:
        out["dabba"] = "Nobody opened the Dabba Wala page in this period."
    elif shop.get("dabba_wala") == "opening soon":
        out["dabba"] = (f"{_n(opened, 'visit')} opened the Dabba Wala page. It's opening soon, so these are people to tell at launch — "
                        "the sign-ups are in Admin › Dabba Wala.")
    else:
        out["dabba"] = f"{opened} visits opened the Dabba Wala page and {next((s['visits'] for s in sub if s['step'] == 'Bought a plan'), 0)} bought a plan."

    def last_note(rows, where):
        top = _top(rows)
        if not top:
            return f"Nobody left {where} in this period."
        return (f"The most common last step before leaving {where} was \"{top['name']}\" ({top['count']}). The step just before "
                "someone leaves is usually where the doubt or the problem is.")
    out["left_checkout"] = last_note(now.get("last_action_before_leaving_checkout"), "the checkout")
    out["left_basket"] = last_note(now.get("last_action_before_leaving_with_a_basket"), "with a basket")

    wk = [w for w in now.get("weekday_funnels") or [] if w["visits"]]
    if len(wk) >= 2:
        busy, quiet = max(wk, key=lambda w: w["visits"]), min(wk, key=lambda w: w["visits"])
        best = max(wk, key=lambda w: (w["purchase"], w["visits"]))
        out["weekday"] = (f"{busy['name']} was the busiest day ({busy['visits']} visits) and {quiet['name']} the quietest ({quiet['visits']})."
                          + (f" Most orders came on {best['name']} ({best['purchase']})." if best["purchase"] else "")
                          + " Post specials the evening before the busy days." + few)
    else:
        out["weekday"] = "Not enough days with visits to compare weekdays yet."

    st = [s for s in now.get("step_times") or [] if s.get("median_minutes") is not None]
    if st:
        slow = max(st, key=lambda s: s["median_minutes"])
        out["step_times"] = (" ".join(f"{s['between']}: {_mins(s['median_minutes'])}." for s in st)
                             + (f" The slowest stretch is \"{slow['between'].lower()}\" — something there makes people hesitate."
                                if len(st) > 1 and slow["median_minutes"] >= 3 else ""))
    else:
        out["step_times"] = "Too few visits reached two steps to time them."

    bands = [b for b in now.get("price_bands") or [] if b["opened"]]
    if bands:
        rates = [(b["band"], b["added"] / b["opened"]) for b in bands]
        hi, lo = max(rates, key=lambda r: r[1]), min(rates, key=lambda r: r[1])
        band = lambda b: b[0].lower() + b[1:]                                  # noqa: E731
        out["price"] = (f"Dishes at {band(hi[0])} were added most often after being opened ({round(hi[1] * 10, 1):g} in 10)"
                        + (f", dishes at {band(lo[0])} least ({round(lo[1] * 10, 1):g} in 10). A big gap suggests price matters; with few views it may "
                           "just be chance." if lo != hi else ".") + few)
    else:
        out["price"] = "No dish was opened with a price recorded, so price can't be judged yet."

    ro, rl = _top(now.get("paths_that_ordered")), _top(now.get("paths_that_left"))
    out["routes_ordered"] = (f"The most common route to an order: {_route(ro['name'])} ({ro['count']}). Make that route easy to start — link to it "
                             "from posts." if ro else "No orders were traced to a route in this period.")
    out["routes_left"] = (f"The most common route that ended without an order: {_route(rl['name'])} ({rl['count']})." if rl
                          else "No routes without an order in this period.")

    fld = (now.get("field_drop_off") or [None])[0]
    out["fields"] = (f"People most often gave up on the \"{fld['last_field']}\" field ({_page(fld['page'])}, {fld['visits']}). Ask whether that "
                     "field is needed at that moment, or say why it's asked." if fld else "Nobody gave up part-way through a form.")
    tp = (now.get("repeated_taps") or [None])[0]
    out["taps"] = (f"\"{tp['label']}\" on {_page(tp['page'])} was tapped again and again in {tp['visits']} visit{'s' if tp['visits'] != 1 else ''} "
                   "— it may not respond, or respond too slowly. Try it on a phone." if tp else
                   "Nothing was tapped repeatedly — buttons seem to respond.")

    cs = now.get("collection_slots") or {}
    shown = (cs.get("times_shown") or {}).get("today") or {}
    if shown.get("views") or cs.get("chosen"):
        asap = cs.get("chose_asap_share")
        out["slots"] = (f"Today's collection times were shown {shown.get('views', 0)} times"
                        + (f", on average {shown['average_percent_full']}% full" if shown.get("average_percent_full") is not None else "") + "."
                        + (f" {round(asap * 100)}% chose \"as soon as possible\"" + (" — people mostly want food now, so keep ready times short."
                                                                                      if asap >= 0.5 else ".") if asap is not None else ""))
    else:
        out["slots"] = "Nobody looked at collection times in this period."

    rm = (now.get("removals") or [None])[0]
    out["removals"] = (f"{rm['name']} was taken back out most ({rm['removed']} of {rm['added']} added). Check its price and portion description."
                       if rm else "Nothing was taken back out of a basket.")
    ck = {c["step"]: c["visits"] for c in now.get("checkout") or []}
    bck = {c["step"]: c["visits"] for c in before.get("checkout") or []}
    if ck.get("Started checkout"):
        failed = ck.get("Payment or order failed", 0)
        out["checkout"] = (f"{ck['Started checkout']} started checkout, {ck.get('Started paying', 0)} started paying and {ck.get('Order placed', 0)} "
                           f"ordered ({bck.get('Order placed', 0)} the period before)."
                           + (f" {failed} hit a failed payment or order — Stripe shows the reason." if failed else ""))
    else:
        out["checkout"] = "Nobody reached checkout in this period."
    ex = _top(now.get("exit_pages"))
    out["exits"] = (f"Visits without an order ended most on {_page(ex['name'])} ({ex['count']}). A clear next step there (Order now, today's "
                    "specials) gives people somewhere to go." if ex else "No visits ended without an order.")

    # ── Dishes ────────────────────────────────────────────────────────────────
    ranking = now.get("dish_ranking") or []
    active = [d for d in ranking if d["opened"] or d["added"] or d["ordered"]]
    if active:
        star = max(active, key=lambda d: (d["ordered"], d["added"], d["opened"]))
        looked_only = [d for d in active if d["opened"] >= 3 and not d["added"]]
        unseen = len(ranking) - len(active)
        out["dishes"] = (f"{len(active)} of {len(ranking)} dishes were looked at, added or ordered. {star['name']} did best ({star['opened']} opened, "
                         f"{star['added']} added, {star['ordered']} ordered)."
                         + (f" {', '.join(d['name'] for d in looked_only[:3])} were opened but never added — check photo, price and description."
                            if looked_only else "")
                         + (f" {unseen} dishes weren't looked at at all; feature a few or trim the menu." if unseen > 10 else ""))
    else:
        out["dishes"] = "No dish was looked at in this period."
    mo, ma = now.get("most_viewed_dishes") or [], now.get("most_added_dishes") or []
    out["most_opened"] = ("Opened most: " + ", ".join(f"{d['name']} ({d['count']})" for d in mo[:3]) + ". These catch the eye — make sure "
                          "they look their best." if mo else "No dishes were opened.")
    out["most_added"] = ("Added most: " + ", ".join(f"{d['name']} ({d['count']})" for d in ma[:3]) + ". Good ones to show first and pair with "
                         "a side." if ma else "Nothing was added to a basket.")

    # ── Behaviour ──────────────────────────────────────────────────────────────
    tpg = now.get("top_pages") or []
    out["pages"] = ("Viewed most: " + ", ".join(f"{_page(p['name'])} ({p['count']})" for p in tpg[:3]) + "." if tpg else "No pages were viewed.")
    if any(d["visits"] for d in days):
        best = max(days, key=lambda d: d["visits"])
        out["days"] = (f"The best day was {_day(best['day'])} with {_n(best['visits'], 'visit')} and {_n(best['orders'], 'order')} seen. Look at what happened "
                       "that day (a post, a share, the weather) — and do it again.")
    else:
        out["days"] = "No visits on any day in this period."
    acts = {a["name"]: a for a in now.get("actions") or []}
    special = [(k, label) for k, label in (("whatsapp_click", "tapped WhatsApp"), ("enquiry_submit", "sent an enquiry"),
                                           ("sign_up", "created an account"), ("dabba_notify_signup", "asked about Dabba Wala"),
                                           ("kitchen_closed_seen", "saw the kitchen closed")) if k in acts]
    out["actions"] = ((f"{len(acts)} different kinds of action were recorded."
                       + (" Worth noticing: " + ", ".join(f"{acts[k]['visits']} visits {label}" for k, label in special) + "." if special else ""))
                      if acts else "Nothing was recorded.")
    clk = (now.get("top_clicks") or [None])[0]
    out["clicks"] = (f"The most tapped was \"{clk['label']}\" ({_page(clk['page'])}, {clk['count']} times)." if clk else "Nothing was tapped.")
    srch = now.get("searches") or []
    out["searches"] = ("Searched most: " + ", ".join(f"\"{s['name']}\" ({s['count']})" for s in srch[:5]) + ". Anything searched for that isn't "
                       "on the menu is demand worth noting." if srch else "Nobody used the search.")
    prob = now.get("problems") or []
    out["problems"] = (f"{sum(p['count'] for p in prob)} problems were hit; the most common was {prob[0]['name'].replace('_', ' ')}"
                       + (f" (\"{prob[0]['detail']}\")" if prob[0].get("detail") else "") + f" on {_page(prob[0]['page'])}. Fix the top one first."
                       if prob else "No problems were recorded — good.")
    measured = [r for r in now.get("time_on_page") or [] if r["views"] >= 3]
    if measured:
        long_ = max(measured, key=lambda r: r["average_seconds"])
        shallow = min(measured, key=lambda r: r["average_scroll"])
        out["time_on_page"] = (f"People stayed longest on {_page(long_['page'])} (about {long_['average_seconds']}s). {_page(shallow['page'])[0].upper()}"
                               f"{_page(shallow['page'])[1:]} was read least far ({shallow['average_scroll']}% down) — put what matters near the top there.")
    else:
        out["time_on_page"] = "Too few page views measured to compare time on pages."
    hrs = sorted((h for h in now.get("by_hour") or [] if h["page_views"]), key=lambda h: -h["page_views"])[:2]
    out["hours"] = ("Busiest hours: " + ", ".join("%02d:00 (%d)" % (h["hour"], h["page_views"]) for h in hrs)
                    + ". Post on social media an hour before the peak, and have the kitchen open and stocked then." if hrs
                    else "No page views to place by hour.")

    # ── Visits ────────────────────────────────────────────────────────────────
    ends = [o for o in summary.get("outcomes") or [] if o["outcome"] != "Ordered"]
    out["visits"] = ((f"The most common ending without an order was \"{ends[0]['outcome'].lower()}\" ({_n(ends[0]['visits'], 'visit')})"
                      + (f", then \"{ends[1]['outcome'].lower()}\" ({ends[1]['visits']})" if len(ends) > 1 else "")
                      + ". Open a few of those visits below to see exactly what they did.") if ends else
                     "Every visit in this period ended in an order." if visits else "No visits in this period.")
    return {k: out.get(k, "") for k in NOTES}


async def _history(last: date) -> list:
    """Visits and orders per week for the twelve weeks up to the end of the period — behind the "next week" range."""
    from routes.events import _utc
    start, end = _utc(last - timedelta(days=83)), _utc(last + timedelta(days=1))
    rows = await db.events.aggregate([{"$match": {"at": {"$gte": start, "$lt": end}}},
                                      {"$group": {"_id": "$day", "visits": {"$addToSet": "$visit_id"}}}]).to_list(None)
    orders = await db.orders.find({"created_at": {"$gte": start, "$lt": end}, "status": {"$ne": "cancelled"}}, {"_id": 0, "created_at": 1}).to_list(None)
    weeks: dict = {}

    def week(d: date) -> dict:
        wk = (d - timedelta(days=d.weekday())).isoformat()
        return weeks.setdefault(wk, {"week_of": wk, "visits": 0, "orders": 0})
    for r in rows:
        try:
            week(date.fromisoformat(r["_id"]))["visits"] += len(r["visits"])
        except (TypeError, ValueError):
            continue
    for o in orders:
        week(o["created_at"].date())["orders"] += 1
    return [weeks[k] for k in sorted(weeks)]


async def write(first: date, last: date) -> dict:
    """All the descriptions for a date range, worked out now from the figures."""
    from routes.events import _figures, _utc, recent_visits
    from routes.pickup_slots import get_slot_settings
    from routes.sales import _rows, _totals
    since, until = _utc(first), _utc(last + timedelta(days=1))
    p_last = first - timedelta(days=1)
    p_first = p_last - (last - first)
    now_fig = await _figures(first, last, since, until)
    before = await _figures(p_first, p_last, _utc(p_first), _utc(p_last + timedelta(days=1)))
    visits = await recent_visits(limit=1, start=first.isoformat(), end=last.isoformat(), _={})
    settings = await get_slot_settings()
    totals = _totals(await _rows(since, until, "all"))
    sales = {"sales": totals["orders"], "net_sales_gbp": round(totals["net"] / 100, 2),
             "by_channel": {c: {"sales": v["orders"]} for c, v in totals["by_channel"].items()}}
    shop = {"dabba_wala": "on sale" if settings.get("dabba_open") else "opening soon"}
    return {"status": "ready", "by": "rules", "written_at": datetime.utcnow(),
            "reading": {"notes": notes(now_fig, before, visits["summary"], await _history(last), shop, sales)}}
