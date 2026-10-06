"""Every change made from admin is recorded: who, when, what, before and after — Phase 16."""
from datetime import datetime

from tests.conftest import basket, order_body, run, token

ADMIN = lambda: token("boss", "admin")   # noqa: E731


def entries(db):
    return run(db.admin_audit.find({}, {"_id": 0}).sort("at", 1).to_list(None))


def test_an_admin_write_is_recorded_in_plain_words_a_customer_write_is_not(client, db):
    run(db.coupons.create_index("code", unique=True)); run(db.coupons.create_index("id", unique=True))
    r = client.post("/api/admin/coupons", json={"code": "WELCOME10", "name": "Welcome", "scope": "orders", "discount_type": "percent", "discount_value": 10}, headers=ADMIN())
    assert r.status_code in (200, 201), r.text
    client.post("/api/delivery/check", json={"postcode": "MK12 6LF"}, headers=ADMIN())           # a customer-style call, even by an admin
    client.post("/api/delivery/check", json={"postcode": "MK12 6LF"}, headers=token("u1"))
    import time; time.sleep(0.1)
    rows = entries(db)
    assert [(e["action"], e["target"]) for e in rows] == [("created a coupon", "admin/coupons")]
    assert rows[0]["admin_name"] == "boss" and rows[0]["after"]["code"] == "WELCOME10" and rows[0]["before"] is None


def test_an_order_status_change_records_before_and_after_once(client, db, menu, pay, user_headers):
    o = client.post("/api/orders", json=order_body(menu, [("curry", 1), ("biryani", 1)], pay(18.88)), headers=user_headers).json()
    assert client.put(f"/api/orders/{o['id']}/status", json={"status": "confirmed"}, headers=ADMIN()).status_code == 200
    import time; time.sleep(0.1)
    rows = [e for e in entries(db) if e["action"] == "changed an order's status"]
    assert len(rows) == 1 and rows[0]["target"] == f"order {o['order_number']} for Test User"
    assert rows[0]["before"] == {"status": "pending"} and rows[0]["after"]["status"] == "confirmed" and rows[0]["after"]["total"] == o["total"]


def test_pausing_orders_is_recorded_with_what_changed(client, db):
    assert client.put("/api/admin/settings/pickup-slots", json={"paused": True, "paused_message": "Back tomorrow"}, headers=ADMIN()).status_code == 200
    import time; time.sleep(0.1)
    rows = entries(db)
    assert len(rows) == 1 and rows[0]["action"] == "paused ordering"
    assert rows[0]["after"] == {"paused": True, "paused_message": "Back tomorrow"} and rows[0]["before"]["paused"] is False


def test_the_log_is_shown_to_admins_only_newest_first(client, db):
    run(db.admin_audit.insert_many([{"at": datetime(2026, 10, 1), "admin_id": "boss", "admin_name": "boss", "action": "a", "target": "t", "before": None, "after": None},
                                    {"at": datetime(2026, 10, 2), "admin_id": "boss", "admin_name": "boss", "action": "b", "target": "t", "before": None, "after": None}]))
    assert client.get("/api/admin/system-log/actions").status_code in (401, 403)
    assert client.get("/api/admin/system-log/actions", headers=token("u1")).status_code == 403
    r = client.get("/api/admin/system-log/actions?days=400", headers=ADMIN()).json()
    assert [a["action"] for a in r["actions"]] == ["b", "a"] and r["actions"][0]["at"].startswith("2026-10-02")


# ── Health: is everything working, in plain words ─────────────────────────────

def test_health_screen_says_what_is_wrong_and_what_to_do(client, db, monkeypatch):
    from datetime import timedelta
    monkeypatch.delenv("RESEND_API_KEY", raising=False)
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_fake")
    run(db.payments.insert_one({"pi_id": "pi_x", "received_at": datetime.utcnow().isoformat(), "reconciled": False, "alerted": True, "amount_pence": 2150}))
    run(db.orders.insert_one({"id": "o1", "status": "pending", "created_at": datetime.utcnow() - timedelta(hours=2), "items": [], "total": 10.0}))
    run(db.settings.insert_one({"_id": "pickup_slots", "paused": True, "paused_at": (datetime.utcnow() - timedelta(hours=3)).isoformat()}))
    assert client.get("/api/admin/health").status_code in (401, 403)
    r = client.get("/api/admin/health", headers=ADMIN()).json()
    by = {c["name"]: c for c in r["checks"]}
    assert r["overall"] == "down" and by["Database"]["state"] == "ok"
    assert by["Email"]["state"] == "down" and "RESEND_API_KEY" in by["Email"]["fix"]
    assert by["Card payments"]["state"] == "watch" and "1 payment taken with no order" in by["Card payments"]["note"]
    assert by["Taking orders"]["state"] == "watch" and "paused since 3 h ago" in by["Taking orders"]["note"]
    assert by["Orders waiting"]["state"] == "watch" and "1 waiting over 45 minutes" in by["Orders waiting"]["note"]
    assert by["Nightly review"]["state"] == "watch" and by["Nightly review"]["note"] == "last ran never"
