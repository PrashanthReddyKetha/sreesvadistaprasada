"""Our own visit and event record — Phase 13."""
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
