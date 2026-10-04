"""Customer timeline, Dabba stages, flags and insight reports — Phase 13."""
from datetime import datetime, timedelta

from tests.conftest import run, token

NOW = datetime.utcnow()
ADMIN = lambda: token("boss", "admin")   # noqa: E731


def order(db, email, total, days_ago, n, status="delivered", user_id=None, **extra):
    run(db.orders.insert_one({
        "id": f"o{n}", "customer_email": email, "customer_name": "A Customer", "customer_phone": "+447000000001",
        "items": [{"menu_item_id": "m1", "name": "Masala Dosa", "price": total, "quantity": 2}], "total": total, "status": status,
        "user_id": user_id, "order_number": f"SP{n}", "delivery_type": "takeaway",
        "created_at": NOW - timedelta(days=days_ago), "updated_at": NOW - timedelta(days=days_ago), **extra}))


def plan(db, email, kind, started_days_ago, ends_in_days, status="active", n=1, **extra):
    run(db.subscriptions.insert_one({
        "id": f"p{n}", "customer_email": email, "email_key": email, "customer_name": "A Customer", "plan": kind, "box_type": "prasada",
        "price": 75.0 if kind == "weekly" else 275.0, "status": status, "user_id": None,
        "start_date": (NOW - timedelta(days=started_days_ago)).strftime("%Y-%m-%d"),
        "end_date": (NOW + timedelta(days=ends_in_days)).strftime("%Y-%m-%d"),
        "created_at": NOW - timedelta(days=started_days_ago), **extra}))


def people(client):
    body = client.get("/api/admin/customers", headers=ADMIN()).json()
    return {c["email"]: c for c in body["customers"]}, body["summary"]


def test_dabba_stages(client, db):
    order(db, "prospect@example.com", 20, 2, 1)
    plan(db, "trial@example.com", "weekly", 2, 5, n=1)
    plan(db, "expiring@example.com", "weekly", 5, 1, n=2)
    plan(db, "active@example.com", "monthly", 10, 20, n=3)
    plan(db, "expired@example.com", "weekly", 40, -30, n=4)
    plan(db, "cancelled@example.com", "weekly", 40, -30, status="cancelled", n=5)
    plan(db, "second@example.com", "weekly", 40, -30, status="expired", n=6)
    plan(db, "second@example.com", "weekly", 2, 10, n=7)                 # a second weekly plan is not a trial
    run(db.newsletter.insert_one({"id": "n1", "email": "nobody@example.com", "active": True}))
    c, summary = people(client)
    assert {e: p["dabba_stage"] for e, p in c.items()} == {
        "prospect@example.com": "prospect", "trial@example.com": "trial", "expiring@example.com": "expiring",
        "active@example.com": "active", "expired@example.com": "expired", "cancelled@example.com": "cancelled",
        "second@example.com": "active", "nobody@example.com": "none"}
    assert summary["dabba_stages"]["trial"] == 1 and summary["definitions"]["expiring_within_days"] == 3


def test_high_value_and_at_risk_flags(client, db):
    for n in range(8):
        order(db, "big@example.com", 25, n + 1, n)                        # £200 in total
    order(db, "quiet@example.com", 20, 45, 20)
    order(db, "quiet@example.com", 20, 50, 21)                           # two orders, last one 45 days ago
    order(db, "recent@example.com", 20, 3, 30)
    c, summary = people(client)
    assert c["big@example.com"]["flags"] == ["high_value"]
    assert c["quiet@example.com"]["flags"] == ["at_risk"] and c["quiet@example.com"]["segment"] == "repeat"
    assert c["recent@example.com"]["flags"] == []
    assert summary["flags"] == {"high_value": 1, "at_risk": 1}


def test_timeline_puts_everything_in_date_order(client, db):
    run(db.users.insert_one({"id": "u5", "name": "Asha", "email": "asha@example.com", "role": "customer", "password_hash": "x",
                             "created_at": NOW - timedelta(days=30)}))
    order(db, "asha@example.com", 21.5, 20, 1, user_id="u5", coupon_code="WELCOME10", coupon_discount=2.0)
    order(db, "other@example.com", 99, 5, 2)
    plan(db, "asha@example.com", "weekly", 10, -3, status="expired", n=1, status_history=[
        {"at": (NOW - timedelta(days=10)).isoformat(), "from": None, "to": "active", "by": "customer", "reason": "Bought a weekly plan"},
        {"at": (NOW - timedelta(days=3)).isoformat(), "from": "active", "to": "expired", "by": "system", "reason": "Last meal day passed"}])
    run(db.delivery_tracking.insert_one({"delivery_id": "p1_2026-09-28", "sub_id": "p1", "status": "skipped",
                                         "skipped_at": (NOW - timedelta(days=8)).isoformat(), "short_notice": True}))
    run(db.delivery_reviews.insert_one({"id": "r1", "user_id": "u5", "type": "order", "status": "submitted", "rating": 5, "text": "Lovely",
                                        "submitted_at": (NOW - timedelta(days=19)).isoformat()}))
    run(db.contact_messages.insert_one({"id": "c1", "email": "asha@example.com", "subject": "Party order?", "created_at": NOW - timedelta(days=1)}))

    assert client.get("/api/admin/customers/timeline?email=asha@example.com").status_code in (401, 403)
    r = client.get("/api/admin/customers/timeline?email=ASHA@example.com", headers=ADMIN()).json()
    titles = [e["title"] for e in r["timeline"]]
    assert titles == ["Sent a message", "Weekly prasada plan finished", "Skipped the meal on 2026-09-28", "Bought a weekly prasada plan",
                      "Reviewed an order: 5 of 5", "Ordered (SP1, collection)", "Used coupon WELCOME10", "Opened an account"]
    assert r["timeline"][5]["amount"] == 21.5 and "2 x Masala Dosa" in r["timeline"][5]["detail"]
    assert "short notice" in r["timeline"][2]["detail"]
    assert r["customer"]["orders"] == 1 and "password_hash" not in str(r)
    assert "SP2" not in str(r)                                           # another customer's order never appears


def test_insights_repeat_rate_cohorts_and_dabba(client, db):
    order(db, "a@example.com", 20, 100, 1); order(db, "a@example.com", 20, 90, 2)      # back after 10 days
    order(db, "b@example.com", 20, 100, 3)                                              # never back
    order(db, "c@example.com", 20, 5, 4)                                                # too recent to judge
    plan(db, "a@example.com", "weekly", 60, -53, status="expired", n=1)
    plan(db, "a@example.com", "monthly", 50, -20, status="expired", n=2)                # weekly, then monthly
    plan(db, "d@example.com", "weekly", 40, -33, status="expired", n=3)                 # did not come back
    plan(db, "e@example.com", "weekly", 2, 5, n=4)                                      # running
    run(db.delivery_tracking.insert_one({"delivery_id": "p1_x", "sub_id": "p1", "status": "skipped", "made_up": True}))
    assert client.get("/api/admin/customers/insights", headers=token("u1")).status_code == 403
    r = client.get("/api/admin/customers/insights", headers=ADMIN()).json()
    assert r["orders"] == {"buyers": 3, "ordered_more_than_once": 1, "repeat_rate": 0.333, "median_days_to_second_order": 10,
                           "buyers_who_also_took_a_plan": 1}
    old = sum(c["old_enough_30"] for c in r["cohorts"]); back = sum(c["back_within_30"] for c in r["cohorts"])
    assert (sum(c["new_customers"] for c in r["cohorts"]), old, back) == (3, 2, 1)
    d = r["dabba"]
    assert (d["plans_sold"], d["weekly"], d["monthly"], d["running"], d["finished"]) == (4, 3, 1, 1, 3)
    assert (d["subscribers_ever"], d["first_plan_finished"], d["bought_again_after_first_plan"], d["renewal_rate"]) == (3, 2, 1, 0.5)
    assert (d["moved_from_weekly_to_monthly"], d["meals_sold"], d["meals_skipped"], d["makeup_meals"], d["skip_rate"]) == (1, 35, 1, 1, 0.029)


def test_event_report_shows_exits_interest_and_checkout_steps(client):
    def send(visit, names, **kw):
        client.post("/api/events", json={"visit_id": visit, "events": [{"name": n, "path": kw.get("paths", {}).get(n, "/order"), **kw.get(n, {})} for n in names]})
    dosa = {"items": [{"id": "m1", "name": "Masala Dosa", "quantity": 1}]}
    thali = {"items": [{"id": "m2", "name": "Veg Thali", "quantity": 1}]}
    send("visit-aaaaaaaa", ["page_view", "view_item", "begin_checkout", "payment_started", "purchase"], view_item=dosa, purchase=dosa)
    send("visit-bbbbbbbb", ["page_view", "view_item", "begin_checkout", "order_placed_failed"], view_item=thali, paths={"page_view": "/checkout"})
    send("visit-cccccccc", ["view_item"], view_item=thali)
    r = client.get("/api/admin/analytics?days=7", headers=ADMIN()).json()
    assert r["checkout"] == [{"step": "Started checkout", "visits": 2}, {"step": "Started paying", "visits": 1},
                             {"step": "Order placed", "visits": 1}, {"step": "Payment or order failed", "visits": 1}]
    assert r["exit_pages"] == [{"name": "/checkout", "count": 1}]            # the visit that ordered is not an exit
    assert r["interest_without_orders"][0] == {"name": "Veg Thali", "opened": 2, "added": 0, "ordered": 0}
    assert r["interest_without_orders"][1] == {"name": "Masala Dosa", "opened": 1, "added": 0, "ordered": 1}
