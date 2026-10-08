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


# ── Server errors are recorded, shown, and the owner is told when they pile up ──

def test_a_server_error_is_recorded_shown_and_alerts_the_owner_once_per_burst(client, db, monkeypatch):
    import error_log
    from starlette.testclient import TestClient
    from tests.conftest import app
    alerts = []
    monkeypatch.setattr("notifications.notify_admin", lambda subject, html: alerts.append(subject))
    quiet = TestClient(app, raise_server_exceptions=False)
    for _ in range(4):
        r = quiet.get("/api/__boom", headers={"Origin": "https://sreesvadistaprasada.com"})
        assert r.status_code == 500 and r.json() == {"detail": "Something went wrong on our side. Please try again in a moment."}
        assert r.headers.get("access-control-allow-origin") == "https://sreesvadistaprasada.com"   # the browser can read the apology
    rows = run(db.error_log.find({}, {"_id": 0}).to_list(None))
    assert len(rows) == 4 and rows[0]["kind"] == "RuntimeError" and rows[0]["path"] == "/api/__boom"
    assert "asha@example.com" not in rows[0]["message"] and "900123" not in rows[0]["message"]   # no customer details kept
    assert "[email]" in rows[0]["message"] and "[phone]" in rows[0]["message"]
    assert len(alerts) == 1 and "4 in the last hour" in alerts[0] or len(alerts) == 1      # told once, not four times
    shown = client.get("/api/admin/system-log/errors", headers=ADMIN()).json()["errors"]
    assert len(shown) == 4 and shown[0]["kind"] == "RuntimeError"
    health = {c["name"]: c for c in client.get("/api/admin/health", headers=ADMIN()).json()["checks"]}
    assert health["Server errors"]["state"] == "down" and "4 in the last 24 hours, 4 in the last hour" == health["Server errors"]["note"]
    assert client.get("/api/admin/system-log/errors").status_code in (401, 403)


def test_the_launch_list_sees_keys_and_lets_the_owner_tick_the_rest(client, db, monkeypatch):
    monkeypatch.delenv("STRIPE_SECRET_KEY", raising=False)
    monkeypatch.setenv("RESEND_API_KEY", "re_x")
    r = client.get("/api/admin/health", headers=ADMIN()).json()
    by = {w["id"]: w for w in r["waiting"]}
    assert by["stripe_render"]["done"] is False and by["stripe_render"]["auto"] is True
    assert by["email"]["done"] is True
    assert by["backups"]["done"] is False and by["backups"]["auto"] is False and "ssp-backups" in by["backups"]["how"]
    assert client.put("/api/admin/health/waiting/backups", json={"done": True}, headers=ADMIN()).json() == {"id": "backups", "done": True}
    assert client.put("/api/admin/health/waiting/email", json={"done": True}, headers=ADMIN()).status_code == 404     # seen from here, not ticked
    r = client.get("/api/admin/health", headers=ADMIN()).json()
    assert {w["id"]: w["done"] for w in r["waiting"]}["backups"] is True
    assert run(db.admin_audit.find_one({"action": "ticked a launch item"}))["target"].startswith("Nightly database backup")


def test_menu_changes_are_recorded_and_customer_paths_are_not(client, db):
    """Audit A-0003 SEC-006: the exclusion for /api/me must not swallow /api/menu."""
    from audit_log import NOT_ADMIN_CHANGES, SELF_LOGGED
    for path in ("/api/menu", "/api/menu/abc", "/api/menu/ai/enhance", "/api/admin/coupons"):
        assert not NOT_ADMIN_CHANGES.search(path), path
    for path in ("/api/auth/me", "/api/me/preferences", "/api/orders", "/api/orders/calculate", "/api/loyalty/redeem",
                 "/api/enquiries/contact", "/api/menu/x/like", "/api/subscriptions/x/skip"):
        assert NOT_ADMIN_CHANGES.search(path), path
    for path in ("/api/orders/abc/status", "/api/subscriptions/x/status"):
        assert not NOT_ADMIN_CHANGES.search(path) and SELF_LOGGED.search(path), path


def test_stripe_webhook_refuses_an_unsigned_or_forged_event(client, monkeypatch):
    """A-0003 TEST-002: the webhook is signature-checked and fails closed."""
    from routes import payments
    monkeypatch.setattr(payments, "WEBHOOK_SECRET", "whsec_test")
    r = client.post("/api/payments/webhook", content=b'{"type":"payment_intent.succeeded"}', headers={"Content-Type": "application/json"})
    assert r.status_code == 400
    r = client.post("/api/payments/webhook", content=b'{"type":"payment_intent.succeeded"}',
                    headers={"Content-Type": "application/json", "Stripe-Signature": "t=1,v1=forged"})
    assert r.status_code == 400
    monkeypatch.setattr(payments, "WEBHOOK_SECRET", "")
    r = client.post("/api/payments/webhook", content=b'{}', headers={"Stripe-Signature": "t=1,v1=x"})
    assert r.status_code == 500 and "not configured" in r.json()["detail"]
