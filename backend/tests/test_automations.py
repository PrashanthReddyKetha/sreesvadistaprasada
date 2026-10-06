"""Marketing automations — Phase 14."""
from datetime import datetime, timedelta

import pytest

import automations as engine
from tests.conftest import run, token

NOW = datetime.utcnow()
URL = "/api/admin/automations"
ADMIN = lambda: token("boss", "admin")   # noqa: E731


def order(db, email, days_ago, n, total=20.0, status="delivered", consent=True):
    # Customers in these tests ticked "send me offers" at checkout unless a test says otherwise (consent-based since 2026-10-07)
    run(db.orders.insert_one({"id": f"o{n}", "customer_email": email, "customer_name": "Asha Rao", "customer_phone": "+447000000001",
                              "items": [], "total": total, "status": status, "user_id": None, "order_number": f"SP{n}",
                              "delivery_type": "takeaway", "created_at": NOW - timedelta(days=days_ago), "marketing_consent": consent}))


@pytest.fixture
def sent(db, monkeypatch):
    out = []
    monkeypatch.setattr(engine, "send_email", lambda to, subject, html, **k: out.append({"to": to, "subject": subject, "html": html, **k}))
    run(db.automation_sends.create_index([("automation", 1), ("email", 1), ("reason", 1)], unique=True))
    return out


def switch_on(client, automation="first_order", **body):
    r = client.put(f"{URL}/{automation}", json={"enabled": True, **body}, headers=ADMIN())
    assert r.status_code == 200, r.text


def test_everything_is_off_until_an_admin_switches_it_on(client, db, sent):
    order(db, "new@example.com", 5, 1)
    assert run(engine.run("first_order")) == {"sent": 0, "skipped": 0, "reason": "switched off"}
    listing = client.get(URL, headers=ADMIN()).json()
    first = next(a for a in listing["automations"] if a["id"] == "first_order")
    assert first["enabled"] is False and first["would_send_now"] == 1 and sent == []
    assert [u["id"] for u in listing["unavailable"]] == ["abandoned_basket"]


def test_only_admins_can_see_or_change_automations(client):
    assert client.get(URL).status_code in (401, 403)
    assert client.get(URL, headers=token("u1")).status_code == 403
    assert client.put(f"{URL}/first_order", json={"enabled": True}, headers=token("u1")).status_code == 403


def test_first_order_message_goes_once_to_the_right_people(client, db, sent):
    order(db, "new@example.com", 5, 1)                                  # qualifies
    order(db, "today@example.com", 0, 2)                                # too soon
    order(db, "old@example.com", 40, 3)                                 # too late
    order(db, "twice@example.com", 5, 4); order(db, "twice@example.com", 6, 5)   # not a first order
    order(db, "cancelled@example.com", 5, 6, status="cancelled")        # never actually ordered
    switch_on(client)
    assert run(engine.run("first_order"))["sent"] == 1
    assert [(m["to"], m["kind"]) for m in sent] == [("new@example.com", "marketing")]
    assert "Asha" in sent[0]["html"] and "utm_campaign=first_order" in sent[0]["html"]
    assert run(engine.run("first_order"))["sent"] == 0 and len(sent) == 1          # never twice


def test_unsubscribed_and_recently_messaged_customers_are_held_back(client, db, sent):
    order(db, "gone@example.com", 5, 1)
    order(db, "busy@example.com", 5, 2)
    run(db.email_optouts.insert_one({"email": "gone@example.com"}))
    run(db.automation_sends.insert_one({"automation": "lapsed", "email": "busy@example.com", "reason": "x", "at": NOW - timedelta(days=2)}))
    switch_on(client)
    p = client.get(f"{URL}/first_order/preview", headers=ADMIN()).json()
    assert p["would_send"] == [] and {h["email"]: h["why"] for h in p["held_back"]} == {
        "gone@example.com": "unsubscribed", "busy@example.com": "had another message in the last 7 days"}
    assert run(engine.run("first_order"))["sent"] == 0 and sent == []


def test_daily_cap_stops_a_mass_send(client, db, sent, monkeypatch):
    monkeypatch.setattr(engine, "DAILY_CAP", 2)
    for n in range(5):
        order(db, f"c{n}@example.com", 5, n)
    switch_on(client)
    assert run(engine.run("first_order"))["sent"] == 2
    assert run(engine.run("first_order"))["sent"] == 0 and len(sent) == 2


def test_going_quiet_lapsed_and_plan_finished_pick_the_right_customers(client, db, sent):
    order(db, "quiet@example.com", 45, 1); order(db, "quiet@example.com", 50, 2)
    order(db, "lapsed@example.com", 90, 3)
    run(db.subscriptions.insert_one({"id": "p1", "customer_email": "tiffin@example.com", "email_key": "tiffin@example.com", "customer_name": "T",
                                     "plan": "weekly", "box_type": "prasada", "price": 75.0, "status": "expired", "user_id": None, "marketing_consent": True,
                                     "end_date": (NOW - timedelta(days=10)).strftime("%Y-%m-%d"), "created_at": NOW - timedelta(days=17)}))
    listing = {a["id"]: a["would_send_now"] for a in client.get(URL, headers=ADMIN()).json()["automations"]}
    assert {k: listing[k] for k in ("first_order", "going_quiet", "lapsed", "plan_finished")} == {
        "first_order": 0, "going_quiet": 1, "lapsed": 1, "plan_finished": 1}
    assert len(listing) == 11
    for a in ("going_quiet", "lapsed", "plan_finished"):
        switch_on(client, a)
    assert run(engine.run("going_quiet"))["sent"] == 1 and sent[-1]["to"] == "quiet@example.com"
    assert run(engine.run("plan_finished"))["sent"] == 1 and "subscriptions" in sent[-1]["html"]
    assert run(engine.run("lapsed"))["sent"] == 1 and sent[-1]["to"] == "lapsed@example.com"


def test_the_seven_further_automations_pick_the_right_customers(client, db, sent):
    def acct(uid, email, days_ago, **extra):
        run(db.users.insert_one({"id": uid, "name": "Mira Rao", "email": email, "role": "customer", "marketing_consent": True,
                                 "created_at": NOW - timedelta(days=days_ago), **extra}))
    order(db, "two@example.com", 4, 1); order(db, "two@example.com", 12, 2)                    # second order 4 days ago
    acct("u1", "reward@example.com", 60, loyalty_order_count=5, loyalty_pending_reward=True)
    order(db, "reward@example.com", 9, 3)
    acct("u2", "almost@example.com", 60, loyalty_order_count=4)
    order(db, "almost@example.com", 5, 4)
    for n in range(8):
        order(db, "big@example.com", 1 + n, 10 + n, total=25.0)                               # £200, and 8 orders, never a plan
    run(db.newsletter.insert_one({"id": "n1", "email": "news@example.com", "active": True, "created_at": NOW - timedelta(days=1)}))
    acct("u3", "empty@example.com", 5)
    listing = {a["id"]: a["would_send_now"] for a in client.get(URL, headers=ADMIN()).json()["automations"]}
    assert {k: listing[k] for k in ("second_order", "reward_waiting", "one_away", "high_spender", "tiffin_intro",
                                    "newsletter_welcome", "account_no_order")} == {
        "second_order": 1, "reward_waiting": 1, "one_away": 1, "high_spender": 1, "tiffin_intro": 1,
        "newsletter_welcome": 1, "account_no_order": 1}
    for a, who in (("reward_waiting", "reward@example.com"), ("one_away", "almost@example.com"), ("account_no_order", "empty@example.com")):
        switch_on(client, a)
        assert run(engine.run(a))["sent"] == 1 and sent[-1]["to"] == who
    switch_on(client, "high_spender")
    assert run(engine.run("high_spender"))["sent"] == 1 and sent[-1]["to"] == "big@example.com"
    switch_on(client, "tiffin_intro")                                                          # same person, same week: held back
    assert run(engine.run("tiffin_intro"))["sent"] == 0


def test_coupon_must_exist_and_appears_in_the_message(client, db, sent):
    order(db, "new@example.com", 5, 1)
    bad = client.put(f"{URL}/first_order", json={"coupon_code": "nope"}, headers=ADMIN())
    assert bad.status_code == 400 and "NOPE" in bad.json()["detail"]
    run(db.coupons.insert_one({"id": "c1", "code": "THANKS10"}))
    switch_on(client, coupon_code="thanks10")
    run(engine.run("first_order"))
    assert "THANKS10" in sent[0]["html"]
    assert "THANKS10" in client.get(f"{URL}/first_order/preview", headers=ADMIN()).json()["html"]


def test_results_count_orders_that_followed_a_message(client, db, sent):
    run(db.automation_sends.insert_many([
        {"automation": "first_order", "email": "a@example.com", "reason": "first-order", "at": NOW - timedelta(days=10)},
        {"automation": "first_order", "email": "b@example.com", "reason": "first-order", "at": NOW - timedelta(days=10)}]))
    order(db, "a@example.com", 4, 1, total=31.5)                         # 6 days after the message
    order(db, "b@example.com", 20, 2)                                    # before the message — does not count
    r = next(a for a in client.get(URL, headers=ADMIN()).json()["automations"] if a["id"] == "first_order")["results"]
    assert (r["sent"], r["ordered_after"], r["income_after"]) == (2, 1, 31.5)


def test_switching_on_is_recorded_and_test_send_goes_only_to_the_admin(client, db, sent, monkeypatch):
    from routes import automations as routes
    tests_sent = []
    monkeypatch.setattr(routes, "send_email", lambda to, subject, html, **k: tests_sent.append((to, subject)))
    order(db, "new@example.com", 5, 1)
    switch_on(client)
    entry = run(db.admin_audit.find_one({}))
    assert entry["action"] == "automation changed" and entry["before"]["on"] is False and entry["after"]["on"] is True
    assert client.post(f"{URL}/first_order/test", headers=ADMIN()).json()["sent_to"] == "boss@example.com"
    assert tests_sent == [("boss@example.com", "[Test] How was your first order?")] and sent == []


# ── The owner can change the words of a message ──────────────────────────────

def test_the_owner_can_change_the_words_try_them_out_and_put_them_back(client, db, sent, monkeypatch):
    monkeypatch.setattr(engine, "LONDON", __import__("zoneinfo").ZoneInfo("UTC"))
    order(db, "new@example.com", 5, 1)
    words = {"subject": "Hello {first_name}, how was it?", "heading": "From Lakshmi's kitchen",
             "body": "Hi {first_name}, thank you!\n\n<b>Bold?</b> Not allowed.  \n\n\nCome again soon.", "button": "Order again"}
    # try before saving: nothing stored, the name filled in, HTML from the owner shown as text
    p = client.post(f"{URL}/first_order/text/preview", json=words, headers=ADMIN()).json()
    assert p["subject"] == "Hello Asha, how was it?" and "&lt;b&gt;Bold?&lt;/b&gt;" in p["html"] and "<p>Come again soon.</p>" in p["html"]
    assert run(db.settings.find_one({"_id": "message_texts"})) is None
    # save: the next send uses the new words and the audit log has before and after
    r = client.put(f"{URL}/first_order/text", json=words, headers=ADMIN()).json()
    assert r["current"]["body"] == "Hi {first_name}, thank you!\n\n<b>Bold?</b> Not allowed.\n\nCome again soon."
    got = client.get(f"{URL}/first_order/text", headers=ADMIN()).json()
    assert got["is_custom"] is True and got["original"]["subject"] == "How was your first order?" and got["link"].endswith("utm_campaign=first_order")
    switch_on(client)
    run(engine.run("first_order", NOW, local_hour=12))
    assert sent and sent[0]["subject"] == "Hello Asha, how was it?" and "From Lakshmi" in sent[0]["html"] and "Order again" in sent[0]["html"]
    assert "utm_campaign=first_order" in sent[0]["html"]                                     # the link cannot be changed
    entry = run(db.admin_audit.find_one({"action": "message words changed"}))
    assert entry["before"]["subject"] == "How was your first order?" and entry["after"]["subject"] == words["subject"]
    # an empty field is refused; put back to the original
    assert client.put(f"{URL}/first_order/text", json={**words, "button": "  "}, headers=ADMIN()).status_code == 400
    assert client.delete(f"{URL}/first_order/text", headers=ADMIN()).json()["current"]["subject"] == "How was your first order?"
    assert client.get(f"{URL}/first_order/text", headers=ADMIN()).json()["is_custom"] is False
    assert client.get(f"{URL}/first_order/text").status_code in (401, 403)


def test_nobody_is_messaged_without_having_asked_for_offers(client, db, sent):
    """Owner decision 2026-10-07 (A-0003, MKT-001): marketing goes only to people who ticked the box or joined the newsletter."""
    order(db, "silent@example.com", 5, 1, consent=False)
    order(db, "keen@example.com", 5, 2, consent=False)
    run(db.newsletter.insert_one({"email": "keen@example.com", "active": True}))
    switch_on(client)
    p = client.get(f"{URL}/first_order/preview", headers=ADMIN()).json()
    assert [h["email"] for h in p["would_send"]] == ["keen@example.com"]
    assert {h["email"]: h["why"] for h in p["held_back"]} == {"silent@example.com": "has not asked for offers"}


def test_pause_all_stops_every_automation_until_resumed(client, db, sent):
    order(db, "a@example.com", 5, 1)
    switch_on(client)
    r = client.put(f"{URL}/pause-all", json={"paused": True}, headers=ADMIN())
    assert r.status_code == 200 and r.json()["all_paused"] is True
    assert run(engine.run("first_order")) == {"sent": 0, "skipped": 0, "reason": "all messages paused"} and sent == []
    assert client.get(URL, headers=ADMIN()).json()["all_paused"] is True
    client.put(f"{URL}/pause-all", json={"paused": False}, headers=ADMIN())
    assert run(engine.run("first_order"))["sent"] == 1
