"""The system's own nightly review: measure, notice, decide, act, log, undo."""
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import pytest

import intelligence as brain
from tests.conftest import run, token

NOW = datetime.utcnow()
LONDON = ZoneInfo("Europe/London")
URL = "/api/admin/system-log"
ADMIN = lambda: token("boss", "admin")   # noqa: E731


def dish(db, i, featured=False, category="breakfast", **extra):
    run(db.menu_items.insert_one({"id": f"m{i}", "name": f"Dish {i}", "category": category, "available": True,
                                  "featured": featured, "pairs_with": [], **extra}))


def order(db, n, items, days_ago=1, email="c@example.com"):
    run(db.orders.insert_one({"id": f"o{n}", "customer_email": email, "status": "delivered", "total": 20.0, "user_id": None,
                              "items": [{"menu_item_id": f"m{i}", "name": f"Dish {i}", "quantity": q} for i, q in items],
                              "created_at": NOW - timedelta(days=days_ago)}))


@pytest.fixture
def alerts(monkeypatch):
    out = []
    monkeypatch.setattr(brain, "notify_admin", lambda subject, html: out.append(subject))
    return out


def log(db, kind=None):
    q = {"kind": kind} if kind else {}
    return run(db.decision_log.find(q, {"_id": 0}).sort("at", 1).to_list(None))


# ── Nothing happens without enough data ───────────────────────────────────────

def test_with_too_little_data_it_changes_nothing_and_says_so(db, alerts):
    dish(db, 1, featured=True); dish(db, 2)
    order(db, 1, [(2, 3)])                                               # 3 portions: far below the minimum
    result = run(brain.run_review())
    assert result["did"] == [] and any("featured dishes follow sales from 30" in s for s in result["skipped"])
    assert run(db.menu_items.find_one({"id": "m1"}))["featured"] is True and run(db.menu_items.find_one({"id": "m2"}))["featured"] is False
    entry = log(db, "nightly review")[-1]
    assert "No action taken" in entry["did"] and "nothing needed deciding" in entry["decided"] and alerts == []


# ── Featured dishes follow sales ──────────────────────────────────────────────

def test_featured_dishes_follow_what_sells_and_can_be_undone(client, db, alerts):
    dish(db, 1, featured=True); dish(db, 2, featured=True); dish(db, 3); dish(db, 4)
    dish(db, 5, category="pickles"); dish(db, 6, sold_out_today=True)
    order(db, 1, [(3, 20), (4, 10), (5, 30), (6, 30), (1, 1)])           # 3 and 4 sell; 5 is not on sale; 6 is sold out
    result = run(brain.run_review())
    assert any("Featured dishes: updated" in d for d in result["did"])
    featured = {m["id"] for m in run(db.menu_items.find({"featured": True}).to_list(None))}
    assert featured == {"m3", "m4"}                                      # same number as before, best sellers only
    entry = log(db, "featured dishes")[0]
    assert "Dish 3" in entry["did"] and "Dish 1" in entry["did"] and entry["level"] == 1 and "portions sold" in entry["noticed"]

    listing = client.get(URL, headers=ADMIN()).json()
    shown = next(e for e in listing["entries"] if e["kind"] == "featured dishes")
    assert shown["can_undo"] is True
    assert client.post(f"{URL}/{shown['id']}/undo", headers=ADMIN()).status_code == 200
    assert {m["id"] for m in run(db.menu_items.find({"featured": True}).to_list(None))} == {"m1", "m2"}
    assert client.post(f"{URL}/{shown['id']}/undo", headers=ADMIN()).status_code == 400      # only once
    run(brain.run_review())                                                               # would re-apply; that is expected


def test_menu_decisions_can_be_switched_off(client, db, alerts):
    dish(db, 1, featured=True); dish(db, 3)
    order(db, 1, [(3, 40)])
    assert client.put(f"{URL}/settings", json={"menu_decisions": False}, headers=ADMIN()).json()["menu_decisions"] is False
    result = run(brain.run_review())
    assert "Menu decisions are switched off" in result["skipped"]
    assert run(db.menu_items.find_one({"id": "m1"}))["featured"] is True
    assert run(db.admin_audit.find_one({}))["after"] == {"menu_decisions": False}


# ── Goes well with ────────────────────────────────────────────────────────────

def test_pairings_are_filled_only_where_empty_and_only_from_real_baskets(db, alerts):
    dish(db, 1); dish(db, 2); dish(db, 3, pairs_with=["m9"])              # 3 was set by the owner
    for n in range(5):
        order(db, n, [(1, 1), (2, 1), (3, 1)])
    order(db, 99, [(1, 1)])
    run(brain.run_review())
    assert run(db.menu_items.find_one({"id": "m1"}))["pairs_with"] == ["m2", "m3"] or run(db.menu_items.find_one({"id": "m1"}))["pairs_with"] == ["m3", "m2"]
    assert run(db.menu_items.find_one({"id": "m3"}))["pairs_with"] == ["m9"]                  # untouched
    entry = log(db, "goes well with")[0]
    run(brain.undo(entry["id"], "Admin"))
    assert run(db.menu_items.find_one({"id": "m1"}))["pairs_with"] == []
    assert run(db.menu_items.find_one({"id": "m3"}))["pairs_with"] == ["m9"]


# ── An automation that drives people away is stopped ──────────────────────────

def test_automation_causing_unsubscribes_is_switched_off(db, alerts):
    run(db.automation_settings.insert_one({"id": "lapsed", "enabled": True}))
    run(db.automation_settings.insert_one({"id": "first_order", "enabled": True}))
    for n in range(12):
        at = NOW - timedelta(days=3)
        run(db.automation_sends.insert_one({"automation": "lapsed", "email": f"l{n}@example.com", "reason": "r", "at": at}))
        run(db.automation_sends.insert_one({"automation": "first_order", "email": f"f{n}@example.com", "reason": "r", "at": at}))
        if n < 3:                                                        # 3 of 12 = 25% left after the lapsed message
            run(db.email_optouts.insert_one({"email": f"l{n}@example.com", "at": at + timedelta(days=1)}))
    result = run(brain.run_review())
    assert run(db.automation_settings.find_one({"id": "lapsed"}))["enabled"] is False
    assert run(db.automation_settings.find_one({"id": "first_order"}))["enabled"] is True
    entry = log(db, "automation switched off")[0]
    assert "3 of the last 12" in entry["noticed"] and any("Switched off 1 automation" in d for d in result["did"])
    run(brain.undo(entry["id"], "Admin"))
    assert run(db.automation_settings.find_one({"id": "lapsed"}))["enabled"] is True


def test_customer_messages_stay_off_unless_the_owner_allows_the_system_to_manage_them(client, db, alerts):
    run(brain.run_review())
    assert run(db.automation_settings.count_documents({})) == 0
    run(db.automation_settings.insert_one({"id": "lapsed", "enabled": False}))            # switched off by hand once
    client.put(f"{URL}/settings", json={"customer_messages": True}, headers=ADMIN())
    run(brain.run_review())
    state = {a["id"]: a["enabled"] for a in run(db.automation_settings.find({}).to_list(None))}
    assert state["lapsed"] is False and all(v for k, v in state.items() if k != "lapsed") and len(state) == 11
    assert len(log(db, "customer message switched on")) == 10


# ── Noticing change ───────────────────────────────────────────────────────────

def day(n):
    return (datetime.now(LONDON) - timedelta(days=n)).strftime("%Y-%m-%d")


def test_a_sharp_fall_is_noticed_and_the_owner_is_emailed_once(db, alerts):
    for n in range(2, 16):
        run(db.daily_metrics.insert_one({"day": day(n), "visits": 100, "orders": 10, "income": 200.0, "basket_rate": 0.2,
                                         "checkout_done": 0.8, "failures": 0, "script_errors": 0, "unsubscribes": 0}))
    for n in range(20):                                                  # yesterday: 20 visits, no orders
        run(db.events.insert_one({"name": "page_view", "visit_id": f"v{n}", "day": day(1), "at": NOW - timedelta(days=1), "path": "/"}))
    result = run(brain.run_review())
    worse = {s["metric"] for s in result["signals"] if s["worse"]}
    assert {"visits", "orders", "income"} <= worse
    assert len(alerts) == 1 and "moved sharply" in alerts[0]
    assert "Visits down 80%" in log(db, "nightly review")[-1]["noticed"]


def test_normal_variation_is_not_an_alarm():
    history = [{"day": day(n), "visits": 100 + n, "orders": 10, "income": 200.0, "basket_rate": 0.2, "checkout_done": 0.8,
                "failures": 0, "script_errors": 1, "unsubscribes": 0} for n in range(2, 16)]
    today = {"day": day(1), "visits": 92, "orders": 9, "income": 185.0, "basket_rate": 0.19, "checkout_done": 0.75,
             "failures": 1, "script_errors": 2, "unsubscribes": 0}
    assert not any(s["material"] for s in brain.compare(today, history))
    assert all(s["note"] == "not enough history yet" for s in brain.compare(today, history[:2]))


def test_things_to_know_are_listed_and_emailed_without_any_action(db, alerts):
    yesterday_noon = datetime.strptime(day(1), "%Y-%m-%d") + timedelta(hours=12)
    run(db.delivery_reviews.insert_one({"id": "r1", "status": "submitted", "rating": 1, "submitted_at": yesterday_noon.isoformat()}))
    run(db.orders.insert_one({"id": "c1", "status": "cancelled", "total": 20.0, "items": [], "created_at": yesterday_noon, "updated_at": yesterday_noon}))
    for n in range(6):
        run(db.events.insert_one({"name": "coupon_failed", "visit_id": f"v{n}", "day": day(1), "at": yesterday_noon, "path": "/checkout"}))
    run(db.subscriptions.insert_one({"id": "p1", "status": "active", "end_date": day(-3), "customer_email": "t@example.com"}))
    result = run(brain.run_review())
    entry = log(db, "things to know")[0]
    for text in ("1 low review", "1 order was cancelled", "refused 6 times", "1 Dabba Wala plan ends"):
        assert text in entry["noticed"], text
    assert entry["level"] == 3 and len(alerts) == 1 and "4 things to know" in alerts[0]
    assert any("4 thing(s) to know" in d for d in result["did"])


# ── Recommendations and outcomes ──────────────────────────────────────────────

def test_menu_gaps_are_recommended_once_a_week_not_changed(db, alerts):
    dish(db, 1)
    for n in range(4):
        run(db.events.insert_one({"name": "search", "visit_id": f"v{n}", "day": day(1), "at": NOW - timedelta(days=1), "path": "/",
                                  "props": {"term": "Filter Coffee"}, "items": []}))
    run(brain.run_review()); run(brain.run_review())
    gaps = log(db, "menu gap")
    assert len(gaps) == 1 and '"filter coffee" (4 times)' in gaps[0]["noticed"] and gaps[0]["level"] == 3
    assert "for you to decide" in gaps[0]["did"]


def test_outcome_is_written_two_weeks_after_an_action(db, alerts):
    run(db.decision_log.insert_one({"id": "d1", "at": NOW - timedelta(days=15), "kind": "featured dishes", "by": "system", "level": 1,
                                    "noticed": "x", "decided": "y", "did": "z", "undo": None, "undone_at": None,
                                    "measure": {"type": "orders_per_day", "before": 1.0}, "outcome": None}))
    for n in range(28):
        order(db, n, [(1, 1)], days_ago=n % 14)                          # 2 a day afterwards
    run(brain.run_review())
    assert "1.0 in the two weeks before and 2.0 in the two weeks after — up" in run(db.decision_log.find_one({"id": "d1"}))["outcome"]


def test_log_is_admin_only_and_run_now_works(client, db, alerts):
    assert client.get(URL).status_code in (401, 403)
    assert client.get(URL, headers=token("u1")).status_code == 403
    assert client.post(f"{URL}/run", headers=ADMIN()).status_code == 200
    body = client.get(URL, headers=ADMIN()).json()
    assert body["settings"]["customer_messages"] is False and body["settings"]["menu_decisions"] is True
    assert body["entries"][0]["kind"] == "nightly review" and body["rules"]["featured_from_portions"] == 30


def test_going_quiet_uses_the_customers_own_rhythm(client, db):
    def o(n, email, days_ago):
        run(db.orders.insert_one({"id": f"x{n}", "customer_email": email, "customer_name": "C", "customer_phone": "", "items": [],
                                  "total": 20.0, "status": "delivered", "user_id": None, "created_at": NOW - timedelta(days=days_ago)}))
    for n, d in enumerate((40, 33, 26, 19)):                             # orders weekly, then 19 days of silence
        o(n, "weekly@example.com", d)
    for n, d in enumerate((80, 50, 19)):                                 # orders about monthly; 19 days is normal
        o(10 + n, "monthly@example.com", d)
    people = {c["email"]: c for c in client.get("/api/admin/customers", headers=ADMIN()).json()["customers"]}
    assert people["weekly@example.com"]["flags"] == ["at_risk"] and people["weekly@example.com"]["usual_gap_days"] == 7.0
    assert people["monthly@example.com"]["flags"] == []
