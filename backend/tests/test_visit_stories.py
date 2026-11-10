"""Every visit told in plain English, any date range, and this period against the one before (owner, 10 Nov 2026)."""
from datetime import datetime, timedelta

from routes import events
from tests.conftest import run, token
from tests.test_events import send



def visits(client, **params):
    return client.get("/api/admin/analytics/visits", params=params, headers=token("boss", "admin")).json()


def test_each_visit_says_what_they_did_and_why_they_likely_left(client):
    send(client, "visit-basket01", ["page_view", "view_item", "add_to_cart"], {"referrer": "www.google.com"},
         view_item={"items": [{"name": "Masala Dosa"}]}, add_to_cart={"props": {"value": 8.99}, "items": [{"name": "Masala Dosa"}]})
    send(client, "visit-checkout", ["page_view", "add_to_cart", "begin_checkout", "field_focus"],
         add_to_cart={"props": {"value": 24.0}, "items": [{"name": "Chicken Biryani"}]},
         begin_checkout={"props": {"value": 24.0}}, field_focus={"props": {"label": "Phone number", "area": "checkout"}})
    send(client, "visit-ordered1", ["page_view", "add_to_cart", "begin_checkout", "purchase"],
         purchase={"props": {"value": 31.5, "transaction_id": "SSP1"}})
    send(client, "visit-bounced1", ["page_view"])
    out = visits(client)
    by = {v["visit_id"]: v["story"] for v in out["visits"]}
    basket = by["visit-ba"]
    assert basket["outcome"] == "Left with food in the basket" and "£8.99" in basket["why"] and "minimum" in basket["why"]
    assert "from Google search" in basket["who"] and "opened Masala Dosa" in basket["did"]
    assert by["visit-ch"]["outcome"] == "Left at checkout" and '"Phone number"' in by["visit-ch"]["why"]
    assert by["visit-or"]["outcome"] == "Ordered" and "£31.50" in by["visit-or"]["why"]
    assert by["visit-bo"]["outcome"] == "Left straight away"
    s = out["summary"]
    assert s["ordered"] == 1 and s["lost_visits"] == 2 and "4 visits" in s["text"] and "1 ordered (25% of visits)" in s["text"]
    only = visits(client, outcome="Left at checkout")
    assert [v["visit_id"] for v in only["visits"]] == ["visit-ch"] and only["total"] == 4


def test_any_date_range_and_the_period_before_it(client, db):
    send(client, "visit-today001", ["page_view"])
    send(client, "visit-older001", ["page_view", "page_view"])
    run(db.events.update_many({"visit_id": "visit-older001"}, {"$set": {"at": datetime.utcnow() - timedelta(days=3)}}))
    today = events.datetime.now(events.LONDON).date()
    r = client.get("/api/admin/analytics", params={"start": today.isoformat(), "end": today.isoformat()}, headers=token("boss", "admin"))
    r = r.json()
    assert (r["days"], r["totals"]["visits"], r["totals"]["page_views"]) == (1, 1, 1)
    assert [d["day"] for d in r["by_day"]] == [today.isoformat()]
    wide = client.get("/api/admin/analytics", params={"start": (today - timedelta(days=6)).isoformat(), "end": today.isoformat()}, headers=token("boss", "admin")).json()
    assert wide["totals"]["visits"] == 2 and len(wide["by_day"]) == 7 and sum(d["page_views"] for d in wide["by_day"]) == 3
    two = client.get("/api/admin/analytics", params={"start": (today - timedelta(days=1)).isoformat(), "end": today.isoformat()}, headers=token("boss", "admin")).json()
    assert two["previous"]["days"] == 2 and two["previous"]["totals"]["visits"] == 1          # the older visit, 3 days ago
    assert client.get("/api/admin/analytics", params={"start": "10/11/2026"}, headers=token("boss", "admin")).status_code == 400
