"""Customer identity, Dabba status history and log hygiene — Phase 13."""
import asyncio
from datetime import datetime, timedelta

from tests.conftest import run, token
from tests.test_dabba import subscribe

ADMIN_DABBA = "/api/admin"


# ── Every Dabba status change leaves a record ─────────────────────────────────

def history(db, sub_id):
    return run(db.subscriptions.find_one({"id": sub_id}))["status_history"]


def test_buying_a_plan_starts_its_history(client, pay, user_headers, db):
    sub = subscribe(client, pay, user_headers)
    h = history(db, sub["id"])
    assert [(e["from"], e["to"], e["by"]) for e in h] == [(None, "active", "customer")]
    assert h[0]["at"] and "weekly" in h[0]["reason"]


def test_admin_cancel_and_reactivate_are_recorded_with_who(client, pay, user_headers, admin_headers, db):
    sub = subscribe(client, pay, user_headers)
    for status in ("cancelled", "active"):
        assert client.put(f"/api/subscriptions/{sub['id']}/status", json={"status": status}, headers=admin_headers).status_code == 200
    h = history(db, sub["id"])
    assert [(e["from"], e["to"]) for e in h] == [(None, "active"), ("active", "cancelled"), ("cancelled", "active")]
    assert all(e["by"].startswith("admin") for e in h[1:])


def test_automatic_expiry_is_recorded_as_the_system(client, pay, user_headers, db):
    from routes.subscriptions import expire_finished_plans
    sub = subscribe(client, pay, user_headers)
    run(db.subscriptions.update_one({"id": sub["id"]}, {"$set": {"end_date": "2020-01-03"}}))
    assert run(expire_finished_plans()) == 1
    last = history(db, sub["id"])[-1]
    assert (last["from"], last["to"], last["by"]) == ("active", "expired", "system")


def test_override_route_needs_a_reason_for_a_change_the_rules_refuse(client, pay, user_headers, admin_headers, db):
    sub = subscribe(client, pay, user_headers)
    url = f"{ADMIN_DABBA}/subscriptions/{sub['id']}/status"
    assert client.patch(url, json={"status": "cancelled"}, headers=admin_headers).status_code == 200      # allowed step
    refused = client.patch(url, json={"status": "expired"}, headers=admin_headers)                       # cancelled -> expired is not
    assert refused.status_code == 400 and "reason" in refused.json()["detail"]
    ok = client.patch(url, json={"status": "expired", "reason": "Customer moved away"}, headers=admin_headers)
    assert ok.status_code == 200
    h = history(db, sub["id"])
    assert (h[-1]["from"], h[-1]["to"], h[-1]["reason"]) == ("cancelled", "expired", "Customer moved away")
    # reactivating clears the old cancellation date
    client.patch(url, json={"status": "active"}, headers=admin_headers)
    assert "cancelled_at" not in run(db.subscriptions.find_one({"id": sub["id"]}))


# ── A guest's history joins the account only when the email is proven ─────────

def guest_order(db, email, n):
    run(db.orders.insert_one({"id": f"g{n}", "customer_email": email, "customer_name": "Guest", "customer_phone": "+447000000009",
                              "items": [], "user_id": None, "total": 20.0, "status": "delivered",
                              "created_at": datetime.utcnow() - timedelta(days=n)}))


def test_google_sign_in_attaches_earlier_guest_orders_and_plans(client, db, monkeypatch):
    from routes import auth as auth_routes
    guest_order(db, "Asha@Example.com", 1)
    guest_order(db, "someone-else@example.com", 2)
    run(db.subscriptions.insert_one({"id": "s1", "customer_email": "asha@example.com", "email_key": "asha@example.com",
                                     "user_id": None, "status": "expired", "price": 75.0}))

    async def fake_google(_credential):
        return {"sub": "g-123", "email": "asha@example.com", "name": "Asha", "email_verified": True}
    monkeypatch.setattr(auth_routes, "_verify_google_token", fake_google)

    r = client.post("/api/auth/google", json={"credential": "x"})
    assert r.status_code == 200
    uid = r.json()["user"]["id"]
    assert run(db.orders.find_one({"id": "g1"}))["user_id"] == uid
    assert run(db.subscriptions.find_one({"id": "s1"}))["user_id"] == uid
    assert run(db.orders.find_one({"id": "g2"}))["user_id"] is None            # another person's order is untouched
    mine = client.get("/api/orders", headers={"Authorization": f"Bearer {r.json()['access_token']}"}).json()
    assert [o["id"] for o in mine] == ["g1"]


def test_password_sign_up_does_not_attach_guest_orders(client, db):
    """An unverified email must not open someone else's order history."""
    guest_order(db, "victim@example.com", 1)
    r = client.post("/api/auth/register", json={"name": "Not Them", "email": "victim@example.com", "password": "long-enough-pw"})
    if r.status_code == 200:
        assert run(db.orders.find_one({"id": "g1"}))["user_id"] is None


# ── Logs ──────────────────────────────────────────────────────────────────────

def test_contact_details_are_masked_for_logs():
    from security import mask
    assert mask("asha@example.com") == "a***@example.com"
    assert mask("+44 7700 900123") == "***123"
    assert mask("") == "(none)" and mask(None) == "(none)"


def test_send_functions_do_not_log_full_addresses(caplog, monkeypatch):
    import notifications
    monkeypatch.setattr(notifications, "RESEND_API_KEY", "")
    monkeypatch.setattr(notifications, "TWILIO_ACCOUNT_SID", "")
    with caplog.at_level("WARNING"):
        asyncio.new_event_loop().run_until_complete(notifications._send_email_now("asha@example.com", "Hello", "<p>x</p>"))
        asyncio.new_event_loop().run_until_complete(notifications._send_sms_now("+447700900123", "x"))
    text = caplog.text
    assert "asha@example.com" not in text and "+447700900123" not in text
    assert "a***@example.com" in text and "***123" in text


# ── Event record: UK days, signed-in flag ─────────────────────────────────────

def test_events_carry_a_signed_in_flag_and_a_uk_day(client, db):
    from zoneinfo import ZoneInfo
    r = client.post("/api/events", json={"visit_id": "visit-cccccccc", "signed_in": True, "events": [{"name": "page_view", "path": "/"}]})
    assert r.json() == {"stored": 1}
    e = run(db.events.find_one({}))
    now = datetime.now(ZoneInfo("Europe/London"))
    assert e["signed_in"] is True and e["day"] == now.strftime("%Y-%m-%d") and e["hour"] in (now.hour, (now.hour - 1) % 24)
    assert "user_id" not in e and "email" not in e
