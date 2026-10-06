"""Dabba Wala plan rules — Phase 05."""
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from tests.conftest import run, token

SUBS = "/api/subscriptions"
LONDON = ZoneInfo("Europe/London")
ADDRESS = {"line1": "1 Test Street", "city": "Milton Keynes", "postcode": "MK12 5AA"}   # zone 1


def next_monday(weeks_ahead=0):
    today = datetime.now(LONDON).date()
    days = (7 - today.weekday()) % 7 or 7
    return (today + timedelta(days=days + 7 * weeks_ahead)).strftime("%Y-%m-%d")


def quote(client, plan="weekly", headers=None, **kw):
    body = {"plan": plan, "customer_email": "u1@example.com", "delivery_address": ADDRESS, **kw}
    return client.post(f"{SUBS}/quote", json=body, headers=headers or {})


WEEKLY_NEW = 80.22   # £75 + 3 charged deliveries at £1.74 (zone 1)


def sub_body(pi_id, plan="weekly", **kw):
    body = {
        "customer_name": "Test User", "customer_email": "u1@example.com", "customer_phone": "+447000000001",
        "plan": plan, "box_type": "prasada", "start_date": next_monday(),
        "delivery_address": ADDRESS, "payment_intent_id": pi_id,
    }
    body.update(kw)
    return body


def subscribe(client, pay, headers, plan="weekly", **kw):
    total = quote(client, plan, headers, customer_email=kw.get("customer_email", "u1@example.com")).json()["total"]
    r = client.post(SUBS, json=sub_body(pay(total, purpose="subscription"), plan, **kw), headers=headers)
    assert r.status_code == 200, r.text
    return r.json()


# ── Pricing ───────────────────────────────────────────────────────────────────

def test_weekly_and_monthly_quotes_for_a_new_customer(client):
    weekly = quote(client).json()
    assert weekly["plan_price"] == 75.00
    assert weekly["free_delivery_meals"] == 2 and weekly["charged_delivery_meals"] == 3   # welcome: 2 free deliveries
    assert weekly["delivery_fee_per_meal"] == 1.74                                        # zone 1 fee £2.49 less 30%
    assert weekly["total"] == 80.22
    monthly = quote(client, "monthly").json()
    assert monthly["plan_price"] == 275.00
    assert monthly["free_delivery_meals"] == 5 and monthly["charged_delivery_meals"] == 15
    assert monthly["total"] == 301.10


def test_returning_customer_pays_delivery_on_every_meal(client, pay, user_headers):
    subscribe(client, pay, user_headers)
    again = quote(client, headers=user_headers).json()
    assert again["free_delivery_meals"] == 0
    assert again["total"] == round(75 + 5 * again["delivery_fee_per_meal"], 2)


def test_outside_milton_keynes_is_refused(client):
    r = quote(client, delivery_address={**ADDRESS, "postcode": "EH1 1AA"})
    assert r.status_code == 400


# ── Start date ────────────────────────────────────────────────────────────────

def test_start_week_is_checked_before_payment(client):
    monday = datetime.strptime(next_monday(), "%Y-%m-%d")
    assert quote(client, start_date=next_monday()).status_code == 200
    bad = {
        "a Wednesday": (monday + timedelta(days=2)).strftime("%Y-%m-%d"),
        "a past Monday": (monday - timedelta(days=14)).strftime("%Y-%m-%d"),
        "too far ahead": (monday + timedelta(days=70)).strftime("%Y-%m-%d"),
        "not a date": "soon",
    }
    for why, value in bad.items():
        assert quote(client, start_date=value).status_code == 400, why


def test_plan_cannot_be_created_with_a_bad_start_date(client, pay, db):
    for value in ("garbage", (datetime.strptime(next_monday(), "%Y-%m-%d") + timedelta(days=1)).strftime("%Y-%m-%d")):
        r = client.post(SUBS, json=sub_body(pay(WEEKLY_NEW, purpose="subscription"), start_date=value))
        assert r.status_code == 400, value
    assert run(db.subscriptions.count_documents({})) == 0


def test_end_date_is_the_last_paid_meal(client, pay, user_headers):
    weekly = subscribe(client, pay, user_headers)
    start = datetime.strptime(weekly["start_date"], "%Y-%m-%d")
    assert weekly["end_date"] == (start + timedelta(days=4)).strftime("%Y-%m-%d")       # Friday
    monthly = subscribe(client, pay, token("u2"), plan="monthly", customer_email="u2@example.com")
    assert monthly["end_date"] == (start + timedelta(days=25)).strftime("%Y-%m-%d")     # 4th Friday, 20 weekdays
    days = client.get(f"{SUBS}/{monthly['id']}/deliveries", headers=token("u2")).json()
    assert len(days) == 20


# ── Payment ───────────────────────────────────────────────────────────────────

def test_plan_needs_its_own_payment_of_the_right_amount(client, pay, db):
    assert client.post(SUBS, json=sub_body(None)).status_code == 400
    assert client.post(SUBS, json=sub_body(pay(WEEKLY_NEW, purpose="order"))).status_code == 400       # an order payment
    assert client.post(SUBS, json=sub_body(pay(10.00, purpose="subscription"))).status_code == 400
    assert client.post(SUBS, json=sub_body(pay(WEEKLY_NEW, purpose="subscription", status="processing"))).status_code == 400
    assert run(db.subscriptions.count_documents({})) == 0


def test_double_submit_returns_the_same_plan(client, pay, db, user_headers):
    body = sub_body(pay(WEEKLY_NEW, purpose="subscription"))
    first = client.post(SUBS, json=body, headers=user_headers).json()
    again = client.post(SUBS, json=body, headers=user_headers)
    assert again.status_code == 200 and again.json()["id"] == first["id"]
    assert run(db.subscriptions.count_documents({})) == 1
    assert client.post(SUBS, json=body, headers=token("someone-else")).status_code == 400


def test_new_plan_is_active_and_confirmed(client, pay, user_headers, state):
    sub = subscribe(client, pay, user_headers)
    assert sub["status"] == "active" and sub["user_id"] == "u1" and sub["price"] == WEEKLY_NEW
    assert len(state.outbox.email) == 1 and len(state.outbox.admin) == 1


# ── Who can see and change a plan ─────────────────────────────────────────────

def test_plans_are_private_to_their_owner(client, pay, user_headers):
    sub = subscribe(client, pay, user_headers)
    other = token("u2")
    day = sub["start_date"]
    assert client.get(f"{SUBS}/{sub['id']}", headers=other).status_code == 403
    assert client.get(f"{SUBS}/{sub['id']}/deliveries", headers=other).status_code == 403
    assert client.post(f"{SUBS}/{sub['id']}/deliveries/{day}/skip", headers=other).status_code == 403
    assert client.get(SUBS, headers=other).json() == []
    assert client.get(f"{SUBS}/{sub['id']}").status_code == 401


def test_customer_cannot_change_plan_status(client, pay, user_headers, db):
    sub = subscribe(client, pay, user_headers)
    for status in ("cancelled", "expired", "active"):
        r = client.put(f"{SUBS}/{sub['id']}/status", json={"status": status}, headers=user_headers)
        assert r.status_code == 403 and "get in touch" in r.json()["detail"]
    assert run(db.subscriptions.find_one({"id": sub["id"]}))["status"] == "active"


def test_admin_status_changes_follow_the_state_machine(client, pay, user_headers, admin_headers, db, state):
    sub = subscribe(client, pay, user_headers)
    url = f"{SUBS}/{sub['id']}/status"
    state.outbox.email.clear()
    assert client.put(url, json={"status": "cancelled"}, headers=admin_headers).status_code == 200
    doc = run(db.subscriptions.find_one({"id": sub["id"]}))
    assert doc["status"] == "cancelled" and doc["cancelled_at"]
    assert len(state.outbox.email) == 1                                                  # cancellation email
    assert client.put(url, json={"status": "expired"}, headers=admin_headers).status_code == 400   # cancelled → expired
    assert client.put(url, json={"status": "active"}, headers=admin_headers).status_code == 200    # reinstated
    assert "cancelled_at" not in run(db.subscriptions.find_one({"id": sub["id"]}))
    assert client.put(url, json={"status": "paused"}, headers=admin_headers).status_code == 422    # not a real state
    force = f"/api/admin/subscriptions/{sub['id']}/status"
    assert client.patch(force, json={"status": "paused"}, headers=admin_headers).status_code == 400
    assert client.patch(force, json={"status": "cancelled", "reason": "moved away"}, headers=admin_headers).status_code == 200
    assert client.patch(force, json={"status": "cancelled"}, headers=user_headers).status_code == 403


# ── Skipping a meal ───────────────────────────────────────────────────────────

def test_skip_rules(client, pay, user_headers, admin_headers, state):
    sub = subscribe(client, pay, user_headers)
    start = datetime.strptime(sub["start_date"], "%Y-%m-%d")
    wed = (start + timedelta(days=2)).strftime("%Y-%m-%d")
    skip = lambda d: client.post(f"{SUBS}/{sub['id']}/deliveries/{d}/skip", headers=user_headers)

    state.outbox.email.clear()
    assert skip(wed).status_code == 200
    again = skip(wed)
    assert again.status_code == 200 and again.json()["already_skipped"] is True
    assert len(state.outbox.email) == 1                                           # one email, not two

    days = {d["date"]: d["status"] for d in client.get(f"{SUBS}/{sub['id']}/deliveries", headers=user_headers).json()}
    assert len(days) == 5 and days[wed] == "skipped"

    assert skip((start + timedelta(days=5)).strftime("%Y-%m-%d")).status_code == 400    # Saturday
    assert skip((start + timedelta(days=7)).strftime("%Y-%m-%d")).status_code == 400    # after the plan ends
    assert skip((start - timedelta(days=30)).strftime("%Y-%m-%d")).status_code == 400   # before it starts
    assert skip("not-a-date").status_code == 400

    client.put(f"{SUBS}/{sub['id']}/status", json={"status": "cancelled"}, headers=admin_headers)
    assert skip((start + timedelta(days=3)).strftime("%Y-%m-%d")).status_code == 400    # plan no longer active


def test_meal_already_out_for_delivery_cannot_be_skipped(client, pay, user_headers, db):
    sub = subscribe(client, pay, user_headers)
    day = sub["start_date"]
    run(db.delivery_tracking.insert_one({"delivery_id": f"{sub['id']}_{day}", "sub_id": sub["id"], "status": "out_for_delivery"}))
    assert client.post(f"{SUBS}/{sub['id']}/deliveries/{day}/skip", headers=user_headers).status_code == 400


# ── Expiry ────────────────────────────────────────────────────────────────────

def test_finished_plans_expire_once_without_anyone_opening_the_dashboard(client, db, state):
    from routes.subscriptions import expire_finished_plans
    past = (datetime.now(LONDON) - timedelta(days=3)).strftime("%Y-%m-%d")
    future = (datetime.now(LONDON) + timedelta(days=3)).strftime("%Y-%m-%d")
    run(db.subscriptions.insert_many([
        {"id": "done", "status": "active", "end_date": past, "customer_email": "a@example.com", "customer_name": "A"},
        {"id": "running", "status": "active", "end_date": future, "customer_email": "b@example.com"},
        {"id": "gone", "status": "cancelled", "end_date": past, "customer_email": "c@example.com"},
    ]))
    assert run(expire_finished_plans()) == 1
    assert run(expire_finished_plans()) == 0
    statuses = {s["id"]: s["status"] for s in run(db.subscriptions.find({}).to_list(10))}
    assert statuses == {"done": "expired", "running": "active", "gone": "cancelled"}
    assert [to for to, _ in state.outbox.email] == ["a@example.com"]


def test_cancelled_plan_days_are_not_shown_as_delivered(client, db, user_headers):
    start = datetime.now(LONDON) - timedelta(days=datetime.now(LONDON).weekday() + 7)        # Monday last week
    run(db.subscriptions.insert_one({
        "id": "s1", "user_id": "u1", "status": "cancelled", "plan": "weekly", "box_type": "prasada",
        "start_date": start.strftime("%Y-%m-%d"), "end_date": (start + timedelta(days=4)).strftime("%Y-%m-%d"),
        "cancelled_at": (start + timedelta(days=1)).strftime("%Y-%m-%d") + "T09:00:00",
    }))
    days = [d["status"] for d in client.get(f"{SUBS}/s1/deliveries", headers=user_headers).json()]
    assert days == ["delivered", "delivered", "cancelled", "cancelled", "cancelled"]
    assert run(db.delivery_reviews.count_documents({"type": "meal_day"})) == 2


# ── Make-up meals for skipped days (admin) ────────────────────────────────────

def _skip(client, sub, offset, headers):
    day = (datetime.strptime(sub["start_date"], "%Y-%m-%d") + timedelta(days=offset)).strftime("%Y-%m-%d")
    assert client.post(f"{SUBS}/{sub['id']}/deliveries/{day}/skip", headers=headers).status_code == 200
    return day


def test_skipping_gives_nothing_by_itself(client, pay, user_headers, db):
    sub = subscribe(client, pay, user_headers)
    _skip(client, sub, 1, user_headers)
    doc = run(db.subscriptions.find_one({"id": sub["id"]}))
    assert doc["end_date"] == sub["end_date"] and not doc.get("makeup_meals_given")


def test_weekly_plan_gets_one_makeup_meal(client, pay, user_headers, admin_headers, db, state):
    sub = subscribe(client, pay, user_headers)
    tue, wed = _skip(client, sub, 1, user_headers), _skip(client, sub, 2, user_headers)
    base = f"/api/admin/subscriptions/{sub['id']}/skips"
    info = client.get(base, headers=admin_headers).json()
    assert info["limit"] == 1 and info["remaining"] == 1 and [s["date"] for s in info["skips"]] == [tue, wed]

    state.outbox.email.clear()
    r = client.post(f"{base}/{tue}/make-up", headers=admin_headers)
    assert r.status_code == 200, r.text
    following_monday = (datetime.strptime(sub["start_date"], "%Y-%m-%d") + timedelta(days=7)).strftime("%Y-%m-%d")
    assert r.json()["end_date"] == following_monday and r.json()["remaining"] == 0     # Friday → next Monday
    assert len(state.outbox.email) == 1                                                # customer told about the extra day
    doc = run(db.subscriptions.find_one({"id": sub["id"]}))
    assert doc["makeup_meals_given"] == 1 and doc["audit_trail"][-1]["field"] == "makeup_meal"
    days = client.get(f"{SUBS}/{sub['id']}/deliveries", headers=user_headers).json()
    assert len(days) == 6 and days[-1]["date"] == following_monday
    assert [d["makeup_date"] for d in days if d["date"] == tue] == [following_monday]

    assert client.post(f"{base}/{tue}/make-up", headers=admin_headers).status_code == 400   # same day twice
    over = client.post(f"{base}/{wed}/make-up", headers=admin_headers)                      # allowance used
    assert over.status_code == 400 and "already had" in over.json()["detail"]
    assert run(db.subscriptions.find_one({"id": sub["id"]}))["end_date"] == following_monday
    assert run(db.delivery_tracking.find_one({"delivery_id": f"{sub['id']}_{wed}"})).get("made_up") is False


def test_monthly_plan_gets_up_to_four_makeup_meals(client, pay, user_headers, admin_headers, db):
    sub = subscribe(client, pay, user_headers, plan="monthly")
    days = [_skip(client, sub, o, user_headers) for o in (0, 1, 2, 3, 4)]
    base = f"/api/admin/subscriptions/{sub['id']}/skips"
    codes = [client.post(f"{base}/{d}/make-up", headers=admin_headers).status_code for d in days]
    assert codes == [200, 200, 200, 200, 400]
    doc = run(db.subscriptions.find_one({"id": sub["id"]}))
    assert doc["makeup_meals_given"] == 4
    original_end = datetime.strptime(sub["end_date"], "%Y-%m-%d")                      # a Friday
    assert doc["end_date"] == (original_end + timedelta(days=6)).strftime("%Y-%m-%d")  # Mon–Thu of the next week
    assert len(client.get(f"{SUBS}/{sub['id']}/deliveries", headers=user_headers).json()) == 24


def test_makeup_meal_rules(client, pay, user_headers, admin_headers):
    sub = subscribe(client, pay, user_headers)
    base = f"/api/admin/subscriptions/{sub['id']}/skips"
    not_skipped = sub["start_date"]
    assert client.post(f"{base}/{not_skipped}/make-up", headers=admin_headers).status_code == 400   # day wasn't skipped
    day = _skip(client, sub, 1, user_headers)
    assert client.post(f"{base}/{day}/make-up", headers=user_headers).status_code == 403            # customers can't
    assert client.get(base, headers=user_headers).status_code == 403
    client.put(f"{SUBS}/{sub['id']}/status", json={"status": "cancelled"}, headers=admin_headers)
    assert client.post(f"{base}/{day}/make-up", headers=admin_headers).status_code == 400           # cancelled plan


# ── Owner decisions 2026-10-07 (audit A-0003) ─────────────────────────────────

def test_no_new_plan_while_deliveries_are_paused(client, monkeypatch, db):
    """DAB-006: Dabba Wala is delivered, so the delivery switch covers it."""
    from routes import subscriptions
    import importlib.util, pathlib
    spec = importlib.util.spec_from_file_location("subs_fresh", pathlib.Path(subscriptions.__file__))
    fresh = importlib.util.module_from_spec(spec); spec.loader.exec_module(fresh)
    monkeypatch.setattr(subscriptions, "refuse_if_deliveries_paused", fresh.refuse_if_deliveries_paused)
    body = {"customer_name": "A", "customer_email": "a@example.com", "customer_phone": "+447000000001", "plan": "weekly",
            "box_type": "svadista", "delivery_address": {"line1": "1 St", "city": "MK", "postcode": "MK9 1AA"}}
    r = client.post("/api/subscriptions/quote", json=body)
    assert r.status_code == 400 and "paused" in r.json()["detail"]
    run(db.settings.update_one({"_id": "pickup_slots"}, {"$set": {"delivery_enabled": True}}, upsert=True))
    assert client.post("/api/subscriptions/quote", json=body).status_code == 200


def test_the_next_plan_can_be_bought_while_one_runs_but_starts_after_it(client, db, user_headers, pay, state):
    """DAB-001: the renewal reminder must lead somewhere that sells."""
    from datetime import datetime, timedelta
    from routes import subscriptions
    today = datetime.strptime(subscriptions.london_today(), "%Y-%m-%d")
    next_monday = today + timedelta(days=(7 - today.weekday()) % 7 or 7)
    run(db.subscriptions.insert_one({"id": "s-live", "user_id": "u1", "customer_email": "u1@example.com", "status": "active",
                                     "plan": "weekly", "start_date": today.strftime("%Y-%m-%d"), "end_date": (next_monday + timedelta(days=4)).strftime("%Y-%m-%d")}))
    body = {"customer_name": "Test User", "customer_email": "u1@example.com", "customer_phone": "+447000000001", "plan": "weekly",
            "box_type": "svadista", "delivery_address": {"line1": "1 St", "city": "MK", "postcode": "MK9 1AA"}}
    r = client.post("/api/subscriptions/quote", json={**body, "start_date": next_monday.strftime("%Y-%m-%d")}, headers=user_headers)
    assert r.status_code == 400 and "current plan runs until" in r.json()["detail"]
    r = client.post("/api/subscriptions/quote", json={**body, "start_date": (next_monday + timedelta(days=7)).strftime("%Y-%m-%d")}, headers=user_headers)
    assert r.status_code == 200, r.text


def test_an_ended_plan_cannot_be_set_back_to_active(client, db, admin_headers):
    """DAB-003: the loop would expire it again within minutes; the dialog must not promise otherwise."""
    run(db.subscriptions.insert_one({"id": "s-old", "user_id": "u9", "customer_email": "o@example.com", "status": "cancelled",
                                     "plan": "weekly", "start_date": "2026-01-05", "end_date": "2026-01-09", "status_history": []}))
    r = client.put("/api/subscriptions/s-old/status", json={"status": "active"}, headers=admin_headers)
    assert r.status_code == 400 and "ended on 2026-01-09" in r.json()["detail"]
