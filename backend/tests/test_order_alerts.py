"""New orders reach the owner's own devices at once, then every minute until accepted (owner request, 9 Nov 2026)."""
from datetime import datetime, timedelta

import order_alerts
from tests.conftest import order_body, run, token

PHONE = {"endpoint": "https://fcm.googleapis.com/fcm/send/owner-phone", "keys": {"p256dh": "k", "auth": "a"}, "label": "Phone"}


def pushes(monkeypatch):
    sent = []

    async def fake(title, body, url="/admin?tab=kitchen", tag="new-order"):
        sent.append((title, body, tag))
        return 1
    monkeypatch.setattr(order_alerts, "send_to_owner", fake)
    return sent


def test_placing_an_order_alerts_the_owner(client, menu, pay, monkeypatch):
    called = []

    async def fake(order):
        called.append(order["order_number"])
    monkeypatch.setattr(order_alerts, "alert_new_order", fake)
    o = client.post("/api/orders", json=order_body(menu, [("curry", 1), ("biryani", 1)], pay(18.88))).json()
    assert called == [o["order_number"]]


def test_a_waiting_order_is_repeated_each_minute_until_accepted(db, monkeypatch):
    sent = pushes(monkeypatch)
    now = datetime.utcnow()
    run(db.orders.insert_one({"id": "o1", "order_number": "SP1", "status": "pending", "total": 18.88,
                              "customer_name": "Asha Rao", "created_at": now - timedelta(minutes=3)}))
    run(db.orders.insert_one({"id": "old", "order_number": "SP0", "status": "pending", "created_at": now - timedelta(hours=3)}))
    assert run(order_alerts.nag_waiting_orders(now)) == 1
    assert "SP1" in sent[0][0] and "3 min" in sent[0][0] and "Asha" in sent[0][1]
    assert run(order_alerts.nag_waiting_orders(now + timedelta(seconds=20))) == 0          # not twice in a minute
    assert run(order_alerts.nag_waiting_orders(now + timedelta(seconds=60))) == 1
    run(db.orders.update_one({"id": "o1"}, {"$set": {"status": "confirmed"}}))
    assert run(order_alerts.nag_waiting_orders(now + timedelta(minutes=5))) == 0          # accepted: quiet


def test_the_first_alert_names_the_order_and_starts_the_clock(db, monkeypatch):
    sent = pushes(monkeypatch)
    run(db.orders.insert_one({"id": "o2", "order_number": "SP2", "status": "pending", "created_at": datetime.utcnow()}))
    run(order_alerts.alert_new_order({"id": "o2", "order_number": "SP2", "total": 9.5, "customer_name": "Ravi"}))
    assert sent[0][0] == "🔔 New order #SP2" and sent[0][2] == "order-o2"
    assert run(db.orders.find_one({"id": "o2"}))["owner_alerted_at"]


def test_only_the_admin_adds_alert_devices_and_they_stay_apart_from_customers(client, db, admin_headers):
    assert client.post("/api/admin/push/owner-device", json=PHONE, headers=token("u9")).status_code == 403
    r = client.post("/api/admin/push/owner-device", json=PHONE, headers=admin_headers)
    assert r.status_code == 200 and r.json()["devices"] == 1
    assert run(db.push_subs.count_documents({})) == 0                                   # never on the offers list
    assert client.get("/api/admin/push/owner-devices", headers=admin_headers).json()["devices"][0]["label"] == "Phone"
    bad = {**PHONE, "endpoint": "https://evil.example/collect"}
    assert client.post("/api/admin/push/owner-device", json=bad, headers=admin_headers).status_code == 400
    client.post("/api/admin/push/owner-device/remove", json={"endpoint": PHONE["endpoint"]}, headers=admin_headers)
    assert run(db.owner_push_subs.count_documents({})) == 0
