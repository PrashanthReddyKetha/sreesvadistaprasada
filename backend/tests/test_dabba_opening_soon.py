"""Dabba Wala "opening soon" — plans wait for the admin switch; the page takes names meanwhile (owner, 10 Nov 2026)."""
from routes import subscriptions
from tests.conftest import run, REAL_DABBA_GATE
from tests.test_dabba import ADDRESS, sub_body


def _real_gate(monkeypatch):
    monkeypatch.setattr(subscriptions, "refuse_if_dabba_not_open", REAL_DABBA_GATE)   # conftest opens Dabba for every other test


def _quote(client):
    return client.post("/api/subscriptions/quote", json={"plan": "weekly", "customer_email": "u1@example.com", "delivery_address": ADDRESS})


def test_plans_wait_for_the_switch(client, admin_headers, monkeypatch):
    _real_gate(monkeypatch)
    assert client.get("/api/kitchen-status").json()["dabba_open"] is False
    r = _quote(client)
    assert r.status_code == 400 and "opening soon" in r.json()["detail"]
    assert client.post("/api/subscriptions", json=sub_body(None)).status_code == 400

    assert client.put("/api/admin/settings/pickup-slots", json={"dabba_open": True}, headers=admin_headers).status_code == 200
    assert client.get("/api/kitchen-status").json()["dabba_open"] is True
    assert _quote(client).status_code == 200


def test_a_paid_plan_is_never_refused_by_the_switch(client, pay, monkeypatch):
    _real_gate(monkeypatch)
    r = client.post("/api/subscriptions", json=sub_body(pay(80.22, purpose="subscription")))
    assert "opening soon" not in r.text


def test_notify_me_keeps_one_row_per_email(client, db, admin_headers):
    assert client.post("/api/subscriptions/notify-me", json={"email": "Asha@Example.com", "name": "Asha", "where": "work"}).status_code == 200
    assert client.post("/api/subscriptions/notify-me", json={"email": "asha@example.com", "where": "both"}).status_code == 200
    rows = run(db.dabba_interest.find({}, {"_id": 0}).to_list(10))
    assert len(rows) == 1 and rows[0]["where"] == "both" and rows[0]["name"] == "Asha" and rows[0]["email"] == "asha@example.com"

    assert client.post("/api/subscriptions/notify-me", json={"email": "x@example.com", "where": "moon"}).status_code == 422
    assert client.get("/api/admin/dabba-wala/interest").status_code in (401, 403)
    listed = client.get("/api/admin/dabba-wala/interest", headers=admin_headers).json()
    assert [r["email"] for r in listed] == ["asha@example.com"]
