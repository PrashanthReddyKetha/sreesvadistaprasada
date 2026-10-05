"""Dish order, send time, more reports and recommendations, accept/decline, AI investigation, email reports."""
import base64
import hashlib
import hmac
import json
import time
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import pytest

import ai_ops
import automations as engine
import intelligence as brain
from tests.conftest import run, token

NOW = datetime.utcnow()
LONDON = ZoneInfo("Europe/London")
ADMIN = lambda: token("boss", "admin")   # noqa: E731
LOG = "/api/admin/system-log"


def dish(db, i, sub="Dosas", days_old=100, **extra):
    run(db.menu_items.insert_one({"id": f"m{i}", "name": f"Dish {i}", "category": "breakfast", "subcategory": sub, "available": True,
                                  "featured": False, "pairs_with": ["x"], "price": 6.99, "created_at": NOW - timedelta(days=days_old), **extra}))


def order(db, n, items, days_ago=1, email="c@example.com", hour=None, **extra):
    at = NOW - timedelta(days=days_ago)
    if hour is not None:
        at = at.replace(hour=hour, minute=0)
    run(db.orders.insert_one({"id": f"o{n}", "customer_email": email, "customer_name": "C", "customer_phone": "", "status": "delivered",
                              "total": 20.0, "user_id": None, "delivery_type": "takeaway",
                              "items": [{"menu_item_id": f"m{i}", "name": f"Dish {i}", "quantity": q} for i, q in items],
                              "created_at": at, **extra}))


@pytest.fixture
def quiet(monkeypatch):
    monkeypatch.setattr(brain, "notify_admin", lambda *a, **k: None)


def entries(db, kind):
    return run(db.decision_log.find({"kind": kind}, {"_id": 0}).to_list(None))


# ── Dish order within a section ───────────────────────────────────────────────

def test_dish_order_follows_sales_only_in_sections_that_have_sold_enough(db, quiet):
    dish(db, 1); dish(db, 2); dish(db, 3, days_old=3)                     # 3 is new and unsold
    dish(db, 7, sub="Idli & Vada"); dish(db, 8, sub="Idli & Vada")
    order(db, 1, [(2, 40), (1, 15), (7, 5)])                              # Dosas: 55 portions; Idli & Vada: 5
    result = run(brain.run_review())
    ranks = {m["id"]: m.get("sort_rank") for m in run(db.menu_items.find({}).to_list(None))}
    assert (ranks["m2"], ranks["m3"], ranks["m1"]) == (1, 2, 3)           # best seller, then the new dish, then the rest
    assert ranks["m7"] is None and ranks["m8"] is None                    # too few sales: stays alphabetical
    assert any("1 section(s) put in sales order" in d for d in result["did"])
    entry = entries(db, "dish order")[0]
    assert "now led by Dish 2" in entry["did"]
    run(brain.undo(entry["id"], "Admin"))
    assert all(m.get("sort_rank") is None for m in run(db.menu_items.find({}).to_list(None)))


# ── Send time ─────────────────────────────────────────────────────────────────

def test_message_waits_for_the_hour_the_customer_usually_orders(client, db, monkeypatch):
    sent = []
    monkeypatch.setattr(engine, "send_email", lambda to, *a, **k: sent.append(to))
    run(db.automation_sends.create_index([("automation", 1), ("email", 1), ("reason", 1)], unique=True))
    evening = (datetime.now(LONDON).replace(hour=17, minute=0)).astimezone(ZoneInfo("UTC")).replace(tzinfo=None)
    for n, d in enumerate((45, 52)):
        run(db.orders.insert_one({"id": f"e{n}", "customer_email": "evening@example.com", "customer_name": "E", "customer_phone": "", "items": [],
                                  "total": 20.0, "status": "delivered", "user_id": None, "created_at": evening - timedelta(days=d)}))
    client.put("/api/admin/automations/going_quiet", json={"enabled": True}, headers=ADMIN())
    assert run(engine.run("going_quiet", local_hour=10))["sent"] == 0 and sent == []      # 10:00 is too early for a 17:00 customer
    assert run(engine.run("going_quiet", local_hour=16))["sent"] == 1 and sent == ["evening@example.com"]


# ── More reports ──────────────────────────────────────────────────────────────

def test_insight_tables_sells_together_times_postcodes_loyalty_and_expected_spend(client, db):
    run(db.users.insert_one({"id": "u1", "name": "M", "email": "m@example.com", "role": "customer", "loyalty_order_count": 5}))
    for n in range(4):
        order(db, n, [(1, 1), (2, 2)], days_ago=7 * n + 1, email="m@example.com", user_id="u1",
              delivery_address={"line1": "x", "city": "MK", "postcode": "MK12 5AA"})
    order(db, 9, [(1, 1)], email="m@example.com", user_id="u1", is_loyalty_redemption=True, free_item_discount=6.99)
    r = client.get("/api/admin/customers/insights", headers=ADMIN()).json()
    assert r["sells_together"][0] == {"dishes": "Dish 1 + Dish 2", "baskets": 4}
    assert sum(d["orders"] for d in r["time_patterns"]["by_weekday"]) == 5 and len(r["time_patterns"]["by_hour"]) == 24
    assert any("Dish 2 (8)" in d for part in r["time_patterns"]["top_by_time_of_day"] for d in part["dishes"])
    assert r["postcodes"] == [{"district": "MK12", "orders": 4, "income": 80.0}]
    assert r["loyalty"] == {"free_dishes_given": 1, "value_given": 6.99, "member_orders": 5, "member_income": 100.0, "income_per_pound_given": 14.3}
    assert "meals" in r["next_week_meals"]
    me = next(c for c in client.get("/api/admin/customers", headers=ADMIN()).json()["customers"] if c["email"] == "m@example.com")
    assert me["expected_90_day_spend"] > 0 and me["usual_order_hour"] is not None


# ── More recommendations, and answering them ──────────────────────────────────

def test_recommendations_for_idle_dishes_prices_and_hours_and_the_owners_answer(client, db, quiet):
    dish(db, 1); dish(db, 2)                                              # dish 2 never sells
    for n in range(70):
        order(db, n, [(1, 1)], days_ago=1 + n % 20, hour=12 + n % 3)
    for n in range(45):
        run(db.events.insert_one({"name": "view_item", "visit_id": f"v{n}", "day": "2026-10-01", "at": NOW - timedelta(days=2), "path": "/",
                                  "props": {}, "items": [{"name": "Dish 2"}]}))
    run(brain.run_review())
    assert "Dish 2" in entries(db, "dishes not selling")[0]["noticed"]
    assert any("almost nobody adds" in e["noticed"] and "Dish 2" in e["noticed"] for e in entries(db, "price worth a look"))
    hours = entries(db, "opening hours")[0]
    assert "busiest around" in hours["noticed"] and hours["level"] == 3
    assert run(db.menu_items.find_one({"id": "m2"}))["price"] == 6.99     # nothing was changed

    listing = client.get(LOG, headers=ADMIN()).json()["entries"]
    rec = next(e for e in listing if e["kind"] == "opening hours")
    assert rec["can_respond"] is True
    assert client.post(f"{LOG}/{rec['id']}/respond", json={"answer": "maybe"}, headers=ADMIN()).status_code == 400
    assert client.post(f"{LOG}/{rec['id']}/respond", json={"answer": "not now"}, headers=ADMIN()).status_code == 200
    assert client.post(f"{LOG}/{rec['id']}/respond", json={"answer": "agreed"}, headers=ADMIN()).status_code == 400     # already answered
    after = next(e for e in client.get(LOG, headers=ADMIN()).json()["entries"] if e["id"] == rec["id"])
    assert after["response"] == "not now" and after["can_respond"] is False


def test_a_dish_that_stops_selling_is_pointed_out(db, quiet):
    dish(db, 1); dish(db, 2)
    for n in range(10):
        order(db, n, [(2, 1)], days_ago=10 + n % 5)                       # sold two weeks ago
    for n in range(25):
        order(db, 100 + n, [(1, 1)], days_ago=1 + n % 5)                  # this week only dish 1 sells
    run(brain.run_review())
    assert "Dish 2" in entries(db, "dish gone quiet")[0]["noticed"]


# ── Claude as investigator ────────────────────────────────────────────────────

def sharp_fall(db):
    def day(n):
        return (datetime.now(LONDON) - timedelta(days=n)).strftime("%Y-%m-%d")
    for n in range(2, 16):
        run(db.daily_metrics.insert_one({"day": day(n), "visits": 100, "orders": 10, "income": 200.0, "basket_rate": 0.2,
                                         "checkout_done": 0.8, "failures": 0, "script_errors": 0, "unsubscribes": 0}))
    for n in range(20):
        run(db.events.insert_one({"name": "page_view", "visit_id": f"v{n}", "day": day(1), "at": NOW - timedelta(days=1), "path": "/"}))


def test_claude_is_asked_once_when_figures_fall_and_sees_only_summary_figures(db, quiet, monkeypatch):
    seen = []

    async def fake(figures):
        seen.append(figures)
        return {"ok": True, "cost_usd": 0.021, "finding": {"summary": "Visits fell sharply.", "likely_causes": ["Search traffic dropped"],
                                                         "what_to_check": ["Search Console"], "recommendation": "Check the site loads.", "confidence": "low"}}
    monkeypatch.setattr(ai_ops, "investigate", fake)
    run(db.orders.insert_one({"id": "secret", "customer_email": "private@example.com", "customer_name": "Private Person", "status": "delivered",
                              "total": 5.0, "items": [], "created_at": NOW - timedelta(days=30)}))
    sharp_fall(db)
    result = run(brain.run_review())
    run(brain.run_review())                                               # a second run the same day must not ask again
    assert len(seen) == 1 and any("Asked Claude" in d for d in result["did"])
    sent = json.dumps(seen[0], default=str)
    assert "private@example.com" not in sent and "Private Person" not in sent and "sharply_worse" in sent
    entry = entries(db, "investigation")[0]
    assert entry["by"] == "Claude" and entry["level"] == 3 and "Confidence: low" in entry["did"] and "Search traffic dropped" in entry["decided"]


def test_no_ai_call_when_nothing_moved_or_when_switched_off(client, db, quiet, monkeypatch):
    calls = []

    async def fake(figures):
        calls.append(1)
        return {"ok": False, "why": "x"}
    monkeypatch.setattr(ai_ops, "investigate", fake)
    run(brain.run_review())                                               # nothing moved
    assert calls == []
    client.put(f"{LOG}/settings", json={"ai_investigation": False}, headers=ADMIN())
    sharp_fall(db)
    run(brain.run_review())
    assert calls == []


def test_ai_caps_and_cost_log(db, monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    assert run(ai_ops.allowed()) == (False, "AI is not set up on the server (no API key)")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")
    assert run(ai_ops.allowed())[0] is True
    run(ai_ops.record_usage("investigation", ai_ops.MODEL, 2000, 500, "answered"))
    used = run(ai_ops.month_to_date())
    assert used["calls"] == 1 and used["cost_usd"] == round(2000 / 1e6 * 4 + 500 / 1e6 * 20, 4)
    run(db.ai_usage.insert_one({"at": datetime.utcnow(), "purpose": "x", "model": ai_ops.MODEL, "cost_usd": ai_ops.MONTHLY_COST_CAP_USD}))
    ok, why = run(ai_ops.allowed())
    assert ok is False and "spending limit" in why


def test_system_log_shows_ai_use(client, db):
    run(ai_ops.record_usage("dish auto-fill", "claude-haiku-4-5-20251001", 300, 400, "answered"))
    ai = client.get(LOG, headers=ADMIN()).json()["ai"]
    assert ai["calls"] == 1 and ai["call_cap"] == ai_ops.MONTHLY_CALL_CAP and ai["recent"][0]["purpose"] == "dish auto-fill"


# ── Email delivery, opens and clicks ──────────────────────────────────────────

def signed(secret_raw: bytes, body: bytes, msg_id="msg_1"):
    ts = str(int(time.time()))
    sig = base64.b64encode(hmac.new(secret_raw, f"{msg_id}.{ts}.".encode() + body, hashlib.sha256).digest()).decode()
    return {"svix-id": msg_id, "svix-timestamp": ts, "svix-signature": f"v1,{sig}", "content-type": "application/json"}


def test_email_reports_need_a_valid_signature_and_update_the_send_log(client, db, monkeypatch):
    body = json.dumps({"type": "email.opened", "data": {"email_id": "re_123"}}).encode()
    assert client.post("/api/webhooks/resend", content=body).status_code == 503        # not set up: inert
    raw = b"super-secret-key-bytes"
    monkeypatch.setenv("RESEND_WEBHOOK_SECRET", "whsec_" + base64.b64encode(raw).decode())
    run(db.message_log.insert_one({"at": datetime.utcnow(), "channel": "email", "to": "a@example.com", "kind": "marketing", "status": "sent",
                                   "subject": "How was your first order?", "provider_id": "re_123", "delivered_at": None, "opened_at": None, "clicked_at": None}))
    assert client.post("/api/webhooks/resend", content=body, headers=signed(b"wrong-key", body)).status_code == 401
    assert client.post("/api/webhooks/resend", content=body, headers=signed(raw, body)).status_code == 200
    assert run(db.message_log.find_one({"provider_id": "re_123"}))["opened_at"] is not None
    spam = json.dumps({"type": "email.complained", "data": {"email_id": "re_123"}}).encode()
    client.post("/api/webhooks/resend", content=spam, headers=signed(raw, spam, "msg_2"))
    assert run(db.email_optouts.find_one({"email": "a@example.com"}))["source"] == "spam report"
    report = client.get("/api/admin/messages", headers=ADMIN()).json()["email_reports"]
    assert report["connected"] is True and report["by_subject"] == []                  # the bounced/complained one is no longer "sent"
