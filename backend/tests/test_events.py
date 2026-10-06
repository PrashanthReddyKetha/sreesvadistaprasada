"""Our own visit and event record — Phase 13."""
import json
from datetime import datetime, timedelta

from routes import events
from tests.conftest import run, token

VISIT_A, VISIT_B = "visit-aaaaaaaa", "visit-bbbbbbbb"


def send(client, visit, names, attribution=None, visitor=None, device="phone", **kw):
    events = [{"name": n, "path": "/breakfast/dosas?x=1", **kw.get(n, {})} for n in names]
    return client.post("/api/events", json={"visit_id": visit, "visitor_id": visitor, "device": device,
                                           "attribution": attribution or {}, "events": events})


def test_events_are_stored_without_personal_details(client, db):
    r = send(client, VISIT_A, ["page_view", "add_to_cart"],
             add_to_cart={"props": {"value": 6.99, "email": "a@example.com", "phone": "07000"},
                          "items": [{"id": "m1", "name": "Masala Dosa", "quantity": 2, "secret": "x"}]})
    assert r.status_code == 202 and r.json() == {"stored": 2}
    docs = run(db.events.find({}, {"_id": 0}).to_list(None))
    cart = next(d for d in docs if d["name"] == "add_to_cart")
    assert cart["props"] == {"value": 6.99}                                   # unknown keys dropped
    assert cart["items"] == [{"id": "m1", "name": "Masala Dosa", "quantity": 2}]
    assert cart["path"] == "/breakfast/dosas"                                 # query string dropped
    assert all("ip" not in d and "email" not in str(d) for d in docs)


def test_badly_formed_names_and_ids_are_ignored(client, db):
    assert send(client, VISIT_A, ["page_view", "Drop Table", "UPPER", "9lives", "new_action"]).json() == {"stored": 2}
    assert send(client, "short", ["page_view"]).json() == {"stored": 0}
    assert send(client, VISIT_A, ["page_view"], visitor="<script>").json() == {"stored": 0}
    assert run(db.events.count_documents({})) == 2


def test_contact_details_typed_into_a_label_or_search_are_removed(client, db):
    send(client, VISIT_A, ["click", "search"], click={"props": {"label": "Call 07700 900123 or a.b@example.com", "area": "page"}},
         search={"props": {"term": "dosa me@example.com"}})
    docs = {d["name"]: d for d in run(db.events.find({}, {"_id": 0}).to_list(None))}
    assert docs["click"]["props"]["label"] == "Call [number] or [email]"
    assert docs["search"]["props"]["term"] == "dosa [email]"


def test_report_lists_every_action_clicks_searches_and_problems(client):
    send(client, VISIT_A, ["page_view", "click", "click", "search", "login_failed", "page_leave", "coupon_applied"],
         click={"props": {"label": "Order Now", "area": "header"}}, search={"props": {"term": "Dosa"}},
         login_failed={"props": {"reason": "Incorrect password", "status": 401}}, page_leave={"props": {"seconds": 40, "percent": 80}})
    send(client, VISIT_B, ["page_view", "click"], click={"props": {"label": "Order Now", "area": "header"}})
    r = client.get("/api/admin/analytics?days=7", headers=token("boss", "admin")).json()
    actions = {a["name"]: a for a in r["actions"]}
    assert actions["click"] == {"name": "click", "count": 3, "visits": 2}
    assert set(actions) == {"page_view", "click", "search", "login_failed", "page_leave", "coupon_applied"}
    assert r["top_clicks"][0] == {"label": "Order Now", "area": "header", "page": "/breakfast/dosas", "count": 3}
    assert r["searches"] == [{"name": "dosa", "count": 1}]
    assert r["problems"] == [{"name": "login_failed", "detail": "Incorrect password", "page": "/breakfast/dosas", "count": 1}]
    assert r["time_on_page"] == [{"page": "/breakfast/dosas", "views": 1, "average_seconds": 40, "average_scroll": 80}]
    assert sum(h["page_views"] for h in r["by_hour"]) == 2 and len(r["by_hour"]) == 24


def test_recent_visits_show_each_journey_in_order(client):
    send(client, VISIT_A, ["page_view", "view_item", "add_to_cart"], {"referrer": "www.google.com", "landing": "/"},
         view_item={"items": [{"id": "m1", "name": "Masala Dosa"}]})
    send(client, VISIT_B, ["page_view"])
    assert client.get("/api/admin/analytics/visits").status_code in (401, 403)
    visits = client.get("/api/admin/analytics/visits", headers=token("boss", "admin")).json()["visits"]
    a = next(v for v in visits if v["visit_id"] == VISIT_A[:8])
    assert [e["name"] for e in a["events"]] == ["page_view", "view_item", "add_to_cart"]
    assert (a["source"], a["added_to_basket"], a["ordered"], a["events"][1]["items"]) == ("Google search", True, False, ["Masala Dosa"])
    assert len(visits) == 2


def test_a_batch_cannot_be_oversized(client):
    assert send(client, VISIT_A, ["page_view"] * 26).status_code == 422


def test_report_is_admin_only(client):
    assert client.get("/api/admin/analytics").status_code in (401, 403)
    assert client.get("/api/admin/analytics", headers=token("u1")).status_code == 403


def test_report_counts_visits_funnel_sources_and_dishes(client):
    google = {"referrer": "www.google.com", "landing": "/breakfast/dosas"}
    leaflet = {"source": "leaflet", "medium": "print", "campaign": "wolverton"}
    send(client, VISIT_A, ["page_view", "view_item", "add_to_cart", "begin_checkout", "purchase"], google,
         view_item={"items": [{"id": "m1", "name": "Masala Dosa"}]},
         add_to_cart={"items": [{"id": "m1", "name": "Masala Dosa", "quantity": 2}]},
         purchase={"props": {"value": 21.5, "transaction_id": "SP1001"}})
    send(client, VISIT_B, ["page_view", "page_view", "view_item"], leaflet, device="desktop",
         view_item={"items": [{"id": "m1", "name": "Masala Dosa"}]})
    r = client.get("/api/admin/analytics?days=7", headers=token("boss", "admin")).json()
    assert r["totals"] == {"visits": 2, "returning_visitors_known": 0, "page_views": 3, "orders": 1, "income": 21.5, "plans_sold": 0}
    assert [f["visits"] for f in r["funnel"]] == [2, 2, 1, 1, 1]
    sources = {s["source"]: s for s in r["sources"]}
    assert sources["Google search"]["orders"] == 1 and sources["Google search"]["income"] == 21.5
    assert sources["leaflet (print)"]["visits"] == 1 and sources["leaflet (print)"]["orders"] == 0
    assert r["most_viewed_dishes"] == [{"name": "Masala Dosa", "count": 2}]
    assert r["most_added_dishes"] == [{"name": "Masala Dosa", "count": 2}]
    assert r["devices"] == {"phone": 1, "desktop": 1}
    assert r["top_pages"][0] == {"name": "/breakfast/dosas", "count": 3}


# ── Collection faults found in the audit of 2026-10-06 ────────────────────────

ADMIN = lambda: token("boss", "admin")   # noqa: E731
S = 1_800_000_000_000                    # a browser clock reading, in milliseconds


def post(client, body, ua="Phone Browser"):
    return client.post("/api/events", json=body, headers={"user-agent": ua})


def test_plain_text_batches_are_stored_like_json_ones(client, db):
    body = json.dumps({"visit_id": VISIT_A, "events": [{"name": "page_view", "path": "/"}]})
    r = client.post("/api/events", content=body, headers={"content-type": "text/plain;charset=UTF-8"})
    assert r.status_code == 202 and r.json() == {"stored": 1}
    assert client.post("/api/events", content="not json", headers={"content-type": "text/plain"}).status_code == 422
    assert client.post("/api/events", content="x" * 250_000, headers={"content-type": "text/plain"}).status_code == 413
    assert run(db.events.count_documents({})) == 1


def test_crawlers_and_scripts_are_not_visitors(client, db):
    crawlers = ["Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", "Mozilla/5.0 (compatible; bingbot/2.0)",
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/140.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Linux; Android 11; moto g power) Chrome/140.0.0.0 Mobile Safari/537.36 Chrome-Lighthouse",
                "python-requests/2.32", "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)", "GPTBot/1.2"]
    for n, ua in enumerate(crawlers):
        assert post(client, {"visit_id": f"visit-robot{n:03d}", "events": [{"name": "page_view", "path": "/"}]}, ua=ua).json() == {"stored": 0}
    people = ["Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
              "Mozilla/5.0 (Linux; Android 11; CUBOT NOTE 20 PRO) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36"]
    for n, ua in enumerate(people):
        assert post(client, {"visit_id": f"visit-human{n:03d}", "events": [{"name": "page_view", "path": "/"}]}, ua=ua).json() == {"stored": 1}
    assert run(db.events.count_documents({})) == 2


def test_each_event_is_stamped_with_when_it_happened_and_a_late_batch_keeps_its_place(client, db):
    # the second batch is sent first: the first one waited for the server to wake
    post(client, {"visit_id": VISIT_A, "sent": S + 8000, "events": [{"name": "click", "path": "/order", "ts": S + 5000},
                                                                   {"name": "add_to_cart", "path": "/order", "ts": S + 7000}]})
    post(client, {"visit_id": VISIT_A, "sent": S + 500, "events": [{"name": "page_view", "path": "/order", "ts": S + 100}]})
    click, added = (run(db.events.find_one({"name": n})) for n in ("click", "add_to_cart"))
    assert 1.9 < (added["at"] - click["at"]).total_seconds() < 2.1                   # two seconds apart, not one arrival time
    visit = client.get("/api/admin/analytics/visits", headers=ADMIN()).json()["visits"][0]
    assert [e["name"] for e in visit["events"]] == ["page_view", "click", "add_to_cart"]
    assert visit["minutes"] == 0.1                                                    # 6.9 seconds from first to last
    r = client.get("/api/admin/analytics?days=2", headers=ADMIN()).json()
    assert r["step_times"][0] == {"between": "Arriving to first dish added", "median_minutes": 0.1, "visits": 1}


def test_a_visit_is_one_sitting_for_a_visitor_with_cookies_too(client, db, monkeypatch):
    monkeypatch.setattr(events, "JOIN_PAGE_LOADS", True)
    who = "visitor-aaaa1111"

    def load(visit, path="/"):
        return post(client, {"visit_id": visit, "visitor_id": who, "events": [{"name": "page_view", "path": path}]}).json()
    assert load("visit-tab00001") == {"stored": 1}
    assert load("visit-tab00002", "/order") == {"stored": 1, "visit": "visit-tab00001"}      # a second tab: same sitting, and the browser is told
    assert run(db.events.distinct("visit_id")) == ["visit-tab00001"]
    assert all(d["day_code"] is None for d in run(db.events.find({}).to_list(None)))         # the daily code is only for visitors without cookies
    # 45 minutes later the same tab is used again, still holding its old number
    run(db.events.update_many({}, {"$set": {"at": datetime.utcnow() - timedelta(minutes=45)}}))
    second = load("visit-tab00001", "/menu")["visit"]
    assert second != "visit-tab00001" and load("visit-tab00001", "/faq")["visit"] == second
    # and again after another long pause: a third visit, not a return to the second
    run(db.events.update_many({}, {"$set": {"at": datetime.utcnow() - timedelta(minutes=90)}}))
    third = load("visit-tab00001", "/story")["visit"]
    assert len({"visit-tab00001", second, third}) == 3
    r = client.get("/api/admin/analytics?days=2", headers=ADMIN()).json()
    assert r["totals"]["visits"] == 3 and r["totals"]["returning_visitors_known"] == 1


def test_accepting_cookies_part_way_through_does_not_split_the_visit(client, db, monkeypatch):
    monkeypatch.setattr(events, "JOIN_PAGE_LOADS", True)
    post(client, {"visit_id": VISIT_A, "attribution": {"referrer": "www.google.com", "landing": "/"}, "events": [{"name": "page_view", "path": "/"}]})
    post(client, {"visit_id": VISIT_A, "visitor_id": "visitor-bbbb2222", "events": [{"name": "click", "path": "/"}, {"name": "page_view", "path": "/order"}]})
    post(client, {"visit_id": "visit-newtab01", "visitor_id": "visitor-bbbb2222", "events": [{"name": "page_view", "path": "/menu"}]})
    r = client.get("/api/admin/analytics?days=2", headers=ADMIN()).json()
    assert r["totals"]["visits"] == 1 and r["sources"][0]["source"] == "Google search"
    assert [(f["name"], f["visits"]) for f in r["visitor_funnels"]] == [("First visit", 1)]   # not "cookies not accepted", not "returning"
    assert client.get("/api/admin/analytics/visits", headers=ADMIN()).json()["visits"][0]["returning"] is False


def test_returning_is_judged_on_the_whole_record_not_only_the_period_shown(client, db):
    send(client, "old00001-visit", ["page_view"], visitor="visitor-cccc3333")
    run(db.events.update_many({}, {"$set": {"at": datetime.utcnow() - timedelta(days=40), "day": "2026-08-27"}}))
    send(client, "back0001-visit", ["page_view"], visitor="visitor-cccc3333")
    send(client, "new00001-visit", ["page_view"], visitor="visitor-dddd4444")
    send(client, "anon0001-visit", ["page_view"])
    r = client.get("/api/admin/analytics?days=7", headers=ADMIN()).json()
    assert {f["name"]: f["visits"] for f in r["visitor_funnels"]} == {"First visit": 1, "Returning visitor": 1, "Cookies not accepted": 1}
    back = {v["visit_id"]: v["returning"] for v in client.get("/api/admin/analytics/visits", headers=ADMIN()).json()["visits"]}
    assert back == {"back0001": True, "new00001": False, "anon0001": False}                 # the old visit is outside the 30 days listed


def test_sources_are_named_from_the_host_not_from_letters_that_happen_to_appear():
    name = lambda ref, **kw: events.channel({"referrer": ref, **kw})   # noqa: E731
    assert [name(h) for h in ("www.google.com", "www.google.co.uk", "google.com", "com.google.android.googlequicksearchbox")] == ["Google search"] * 4
    assert [name(h) for h in ("mail.google.com", "com.google.android.gm")] == ["Gmail"] * 2          # an email, not a search
    assert name("accounts.google.com") == "Google (other)" and name("business.google.com") == "Google (other)"
    assert (name("www.pinterest.com"), name("www.pinterest.co.uk"), name("www.reddit.com"), name("out.reddit.com")) == ("Pinterest", "Pinterest", "Reddit", "Reddit")
    assert (name("uk.trustpilot.com"), name("www.just-eat.co.uk"), name("www.microsoft.com")) == ("uk.trustpilot.com", "www.just-eat.co.uk", "www.microsoft.com")
    assert (name("t.co"), name("x.com"), name("l.instagram.com"), name("lm.facebook.com"), name("wa.me"), name("youtu.be")) == \
        ("X / Twitter", "X / Twitter", "Instagram", "Facebook", "WhatsApp", "YouTube")
    assert (name("www.bing.com"), name("duckduckgo.com"), name("uk.search.yahoo.com"), name("mail.yahoo.com")) == ("Bing search", "DuckDuckGo search", "Yahoo search", "Yahoo Mail")
    assert name("sreesvadistaprasada.vercel.app") == "Direct or unknown" and name("checkout.stripe.com") == "Direct or unknown" and name("") == "Direct or unknown"
    assert name("www.pinterest.com", source="leaflet", medium="print") == "leaflet (print)"            # a campaign tag always wins


def test_paying_for_a_meal_plan_is_not_a_step_in_the_food_order_funnel(client):
    send(client, VISIT_A, ["page_view", "subscription_step_view", "payment_started", "subscription_purchase"],
         payment_started={"props": {"method": "subscription", "value": 60}})
    send(client, VISIT_B, ["page_view", "payment_started_failed"], payment_started_failed={"props": {"method": "subscription", "status": 400}})
    send(client, "visit-cccccccc", ["page_view", "add_to_cart", "begin_checkout", "payment_started"], payment_started={"props": {"method": "order", "value": 20}})
    r = client.get("/api/admin/analytics?days=2", headers=ADMIN()).json()
    assert r["checkout"] == [{"step": "Started checkout", "visits": 1}, {"step": "Started paying", "visits": 1},
                             {"step": "Order placed", "visits": 0}, {"step": "Payment or order failed", "visits": 0}]
    stopped = {s["step"]: s["visits"] for s in r["stopped_at"]}
    assert (stopped["Arrived"], stopped["Looked at the menu"], stopped["Started paying"]) == (0, 2, 1)
    assert [a["count"] for a in r["actions"] if a["name"] == "payment_started"] == [2]      # still listed as an action in its own right


def test_later_steps_count_for_earlier_ones_and_only_baskets_with_food_in_them_are_left_behind(client):
    dosa = lambda q, v: {"items": [{"id": "m1", "name": "Masala Dosa", "quantity": q}], "props": {"value": v}}   # noqa: E731
    # the basket was filled on an earlier visit: this one goes straight to checkout and leaves
    post(client, {"visit_id": VISIT_A, "events": [{"name": "page_view", "path": "/"}, {"name": "begin_checkout", "path": "/checkout", "props": {"value": 23.5}}]})
    # three added, one taken back out, then left
    post(client, {"visit_id": VISIT_B, "events": [{"name": "page_view", "path": "/order"}, {"name": "add_to_cart", "path": "/order", **dosa(3, 20.97)},
                                                  {"name": "remove_from_cart", "path": "/order", **dosa(1, 6.99)}]})
    # added and taken straight back out
    post(client, {"visit_id": "visit-cccccccc", "events": [{"name": "page_view", "path": "/order"}, {"name": "add_to_cart", "path": "/order", **dosa(1, 6.99)},
                                                           {"name": "remove_from_cart", "path": "/order", **dosa(1, 6.99)}]})
    # ordered from a reloaded checkout page: no "started checkout" was seen
    post(client, {"visit_id": "visit-dddddddd", "events": [{"name": "page_view", "path": "/checkout"},
                                                           {"name": "purchase", "path": "/checkout", "props": {"value": 18.0, "transaction_id": "SP2001"}}]})
    r = client.get("/api/admin/analytics?days=2", headers=ADMIN()).json()
    assert [(f["step"], f["visits"]) for f in r["funnel"]] == [("page_view", 4), ("looked_at_menu", 4), ("add_to_cart", 4), ("begin_checkout", 2), ("purchase", 1)]
    assert r["abandoned"] == {"visits": 2, "basket_value": 37.48}                           # 23.50 at checkout + two dosas at 6.99
    assert r["removals"] == [{"name": "Masala Dosa", "removed": 2, "added": 4, "removal_rate": 0.5}]


def test_time_on_page_counts_each_page_view_once(client):
    leave = lambda s, pct, view=None: {"name": "page_leave", "path": "/menu", "props": {"seconds": s, "percent": pct, **({"view": view} if view else {})}}   # noqa: E731
    # one page view reported twice (tab hidden, then left for good), one reported once, one from before page views had numbers
    post(client, {"visit_id": VISIT_A, "events": [{"name": "page_view", "path": "/menu"}, leave(5, 20, "aaaa1111"), leave(12, 60, "aaaa1111"),
                                                  leave(4, 100, "bbbb2222"), leave(8, 40)]})
    r = client.get("/api/admin/analytics?days=2", headers=ADMIN()).json()
    assert r["time_on_page"] == [{"page": "/menu", "views": 3, "average_seconds": 8, "average_scroll": 67}]
    assert [a["count"] for a in r["actions"] if a["name"] == "page_leave"] == [3]
    shown = client.get("/api/admin/analytics/visits", headers=ADMIN()).json()["visits"][0]["events"]
    assert [e["props"]["seconds"] for e in shown if e["name"] == "page_leave"] == [12, 4, 8]


def test_dishes_added_straight_from_a_list_do_not_count_as_opened_then_added(client):
    thali = {"items": [{"id": "m2", "name": "Veg Thali", "quantity": 1}], "props": {"value": 14.99}}
    upma = {"items": [{"id": "m1", "name": "Upma", "quantity": 1}], "props": {"value": 3.99}}
    send(client, VISIT_A, ["page_view", "add_to_cart", "view_item"], add_to_cart=upma, view_item=thali)      # upma added from the list; thali only looked at
    send(client, VISIT_B, ["page_view", "view_item", "add_to_cart"], view_item=thali, add_to_cart=thali)     # thali opened, then added
    r = client.get("/api/admin/analytics?days=2", headers=ADMIN()).json()
    assert r["price_bands"] == [{"band": "£11 and over", "opened": 2, "added": 1, "add_rate": 0.5}]


def test_search_boxes_and_quantity_buttons_are_not_reported_as_problems(client):
    send(client, VISIT_A, ["page_view", "field_focus", "repeated_taps"], field_focus={"props": {"label": "Search dishes…", "area": "Order Now"}},
         repeated_taps={"props": {"label": "Increase quantity", "area": "page"}})
    send(client, VISIT_B, ["page_view", "field_focus", "repeated_taps"], field_focus={"props": {"label": "Phone number", "area": "Your details"}},
         repeated_taps={"props": {"label": "Pay now", "area": "page"}})
    r = client.get("/api/admin/analytics?days=2", headers=ADMIN()).json()
    assert [f["last_field"] for f in r["field_drop_off"]] == ["Phone number"]
    assert [t["label"] for t in r["repeated_taps"]] == ["Pay now"]


def test_orders_and_income_are_also_given_as_the_order_book_has_them(client, db):
    now = datetime.utcnow()
    run(db.users.insert_many([{"id": "boss2", "email": "owner@example.com", "role": "admin"}, {"id": "t1", "email": "test1@example.com", "role": "customer"}]))
    order = lambda n, total, **kw: {"id": f"order-{n}", "order_number": f"SP{n}", "total": total, "status": "confirmed", "created_at": now,   # noqa: E731
                                    "customer_email": "asha@example.com", "user_id": None, **kw}
    run(db.orders.insert_many([order(3001, 21.5), order(3002, 18.0),                       # two real orders; only the first was seen being placed
                               order(3003, 30.0, status="cancelled"), order(3004, 12.0, user_id="boss2"),
                               order(3005, 9.0, customer_email="test1@example.com"), order(2999, 40.0, created_at=now - timedelta(days=30))]))
    run(db.subscriptions.insert_many([{"id": "s1", "price": 60.0, "status": "active", "created_at": now, "customer_email": "asha@example.com"},
                                      {"id": "s2", "price": 60.0, "status": "active", "created_at": now, "customer_email": "qa-plan@example.com"}]))
    send(client, VISIT_A, ["page_view", "purchase"], purchase={"props": {"value": 21.5, "transaction_id": "SP3001"}})
    r = client.get("/api/admin/analytics?days=7", headers=ADMIN()).json()
    assert r["order_book"] == {"orders": 2, "income": 39.5, "orders_seen_in_a_visit": 1, "plans_sold": 1, "plan_income": 60.0}
    assert (r["totals"]["orders"], r["totals"]["income"]) == (1, 21.5)                      # what the visit record itself saw
