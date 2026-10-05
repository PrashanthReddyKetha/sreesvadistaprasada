"""Admin customer view — Phase 13."""
from datetime import datetime, timedelta

from tests.conftest import run, token

URL = "/api/admin/customers"
NOW = datetime.utcnow()


def order(db, email, total, days_ago=1, status="delivered", user_id=None, number="SP1", delivery_type="takeaway"):
    run(db.orders.insert_one({
        "id": f"{email}-{number}-{days_ago}", "customer_email": email, "customer_name": "Guest Name",
        "customer_phone": "07000000000", "total": total, "status": status, "user_id": user_id,
        "order_number": number, "delivery_type": delivery_type, "created_at": NOW - timedelta(days=days_ago),
    }))


def plan(db, email, price, end_in_days, status="active", user_id=None):
    run(db.subscriptions.insert_one({
        "id": f"sub-{email}-{end_in_days}", "customer_email": email, "customer_name": "Plan Name",
        "customer_phone": "07111111111", "price": price, "status": status, "plan": "weekly", "box_type": "prasada",
        "user_id": user_id, "end_date": (NOW + timedelta(days=end_in_days)).strftime("%Y-%m-%d"),
        "created_at": NOW - timedelta(days=30),
    }))


def by_email(client):
    body = client.get(URL, headers=token("boss", "admin")).json()
    return {c["email"]: c for c in body["customers"]}, body["summary"]


def test_only_an_admin_can_see_customers(client):
    assert client.get(URL).status_code in (401, 403)
    assert client.get(URL, headers=token("u1")).status_code == 403
    assert client.get(URL, headers=token("boss", "admin")).status_code == 200


def test_guest_orders_with_the_same_email_are_one_customer(client, db):
    order(db, "Asha@Example.com", 20.0, days_ago=3, number="SP1")
    order(db, "asha@example.com", 30.0, days_ago=1, number="SP2")
    people, summary = by_email(client)
    c = people["asha@example.com"]
    assert (c["orders"], c["order_spend"], c["average_order"], c["last_order_number"]) == (2, 50.0, 25.0, "SP2")
    assert c["segment"] == "repeat" and c["has_account"] is False
    assert summary["buyers"] == 1 and summary["repeat_buyers"] == 1


def test_cancelled_orders_do_not_count_as_spend(client, db):
    order(db, "b@example.com", 25.0, number="SP1")
    order(db, "b@example.com", 40.0, status="cancelled", number="SP2")
    c = by_email(client)[0]["b@example.com"]
    assert (c["orders"], c["cancelled_orders"], c["total_spend"], c["segment"]) == (1, 1, 25.0, "new")


def test_account_orders_follow_the_account_even_if_the_order_email_differs(client, db):
    run(db.users.insert_one({"id": "u7", "name": "Ravi", "email": "ravi@example.com", "role": "customer", "loyalty_order_count": 3}))
    order(db, "work-address@example.com", 18.0, user_id="u7")
    people, _ = by_email(client)
    assert "work-address@example.com" not in people
    assert (people["ravi@example.com"]["orders"], people["ravi@example.com"]["loyalty_orders"]) == (1, 3)


def test_segments(client, db):
    for n in range(5):
        order(db, "regular@example.com", 20.0, days_ago=n + 1, number=f"SP{n}")
    order(db, "lapsed@example.com", 20.0, days_ago=90)
    plan(db, "sub@example.com", 75.0, end_in_days=3)
    plan(db, "ended@example.com", 75.0, end_in_days=-100)          # still "active" in the database, but over
    run(db.users.insert_one({"id": "u8", "name": "Lead", "email": "lead@example.com", "role": "customer"}))
    run(db.newsletter.insert_one({"id": "n1", "email": "news@example.com", "active": True}))
    people, summary = by_email(client)
    assert {e: c["segment"] for e, c in people.items()} == {
        "regular@example.com": "regular", "lapsed@example.com": "lapsed", "sub@example.com": "subscriber",
        "ended@example.com": "lapsed", "lead@example.com": "lead", "news@example.com": "lead",
    }
    assert people["ended@example.com"]["active_plan"] is None
    assert people["sub@example.com"]["total_spend"] == 75.0
    assert people["news@example.com"]["newsletter"] is True
    assert summary["segments"]["lead"] == 2 and summary["plan_revenue"] == 150.0


def test_admin_accounts_and_passwords_are_not_listed(client, db):
    run(db.users.insert_one({"id": "u9", "name": "C", "email": "c@example.com", "role": "customer", "password_hash": "secret-hash"}))
    order(db, "boss@example.com", 99.0, user_id="boss")
    token("boss", "admin")
    raw = client.get(URL, headers=token("boss", "admin")).text
    assert "secret-hash" not in raw and "password_hash" not in raw
    assert "boss@example.com" not in by_email(client)[0]


def test_test_accounts_are_hidden_from_lists_figures_and_messages(client, db):
    order(db, "real@gmail.com", 20.0, number="SP1")
    order(db, "test@test.com", 99.0, number="SP2")
    order(db, "e2e_user_1@gmail.com", 50.0, number="SP3")
    run(db.newsletter.insert_one({"id": "n9", "email": "testlaunch@example.com", "active": True}))
    body = client.get(URL, headers=token("boss", "admin")).json()
    assert [c["email"] for c in body["customers"]] == ["real@gmail.com"]
    assert body["summary"]["order_revenue"] == 20.0 and body["summary"]["test_accounts_hidden"] == 3
    with_test = client.get(URL + "?include_test=true", headers=token("boss", "admin")).json()
    assert len(with_test["customers"]) == 4 and with_test["summary"]["test_accounts_hidden"] == 0
    insights = client.get(URL + "/insights", headers=token("boss", "admin")).json()
    assert insights["orders"]["buyers"] == 1
    import automations
    people = run(automations.audience("first_order"))
    assert all(p["email"] == "real@gmail.com" for p in people)
