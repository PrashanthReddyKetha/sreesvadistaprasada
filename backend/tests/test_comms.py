"""Customer communications: send log, unsubscribe, opt-outs, escaping, send-once — Phase 15."""
from datetime import datetime, timedelta

import pytest

import notifications
import whatsapp
from tests.conftest import run, token
from tests.test_dabba import subscribe

EMAIL = "asha@example.com"


def log(db):
    return run(db.message_log.find({}, {"_id": 0}).to_list(None))


# ── Unsubscribe ───────────────────────────────────────────────────────────────

def test_unsubscribe_link_works_only_with_its_own_token(client, db):
    run(db.newsletter.insert_one({"id": "n1", "email": "Asha@example.com", "active": True}))
    good = notifications.unsubscribe_token(EMAIL)
    assert client.get(f"/api/unsubscribe?e={EMAIL}&t=wrong").status_code == 400
    assert client.get(f"/api/unsubscribe?e=someone-else@example.com&t={good}").status_code == 400
    assert run(db.email_optouts.count_documents({})) == 0
    r = client.get(f"/api/unsubscribe?e={EMAIL}&t={good}")
    assert r.status_code == 200 and "unsubscribed" in r.text
    assert run(db.email_optouts.find_one({"email": EMAIL}))
    assert run(db.newsletter.find_one({"id": "n1"}))["active"] is False
    assert client.post(f"/api/unsubscribe?e={EMAIL}&t={good}").json() == {"ok": True}      # mail-app button; safe to repeat
    assert run(db.email_optouts.count_documents({})) == 1


def test_marketing_email_carries_an_unsubscribe_link(db):
    html = notifications._with_unsubscribe("<html><body><p>Hi</p></body></html>", EMAIL)
    assert notifications.unsubscribe_url(EMAIL) in html and html.index("Unsubscribe") < html.index("</body>")


def test_marketing_email_is_not_sent_to_someone_who_unsubscribed_but_service_email_is(db, monkeypatch):
    monkeypatch.setattr(notifications, "RESEND_API_KEY", "")
    run(db.email_optouts.insert_one({"email": EMAIL}))
    run(notifications._send_email_now(EMAIL, "Come back", "<p>x</p>", "marketing"))
    run(notifications._send_email_now(EMAIL, "Your order", "<p>x</p>", "service"))
    rows = {r["subject"]: r for r in log(db)}
    assert rows["Come back"]["status"] == "skipped: unsubscribed" and rows["Come back"]["kind"] == "marketing"
    assert rows["Your order"]["status"] == "skipped: email not set up"      # not blocked by the opt-out
    assert rows["Your order"]["to"] == EMAIL and rows["Your order"]["channel"] == "email"


def test_text_messages_are_logged_too(db, monkeypatch):
    monkeypatch.setattr(notifications, "TWILIO_ACCOUNT_SID", "")
    run(notifications._send_sms_now("+447700900123", "Your order is ready", "service"))
    assert [(r["channel"], r["to"], r["status"]) for r in log(db)] == [("sms", "+447700900123", "skipped: text messages not set up")]


# ── Names typed by customers cannot inject HTML ───────────────────────────────

@pytest.mark.parametrize("build", [
    lambda n: notifications.email_welcome(n),
    lambda n: notifications.email_order_status({"id": "abcdef12", "order_number": "SP1"}, n, "ready"),
    lambda n: notifications.email_renewal_reminder(n, {"plan": "weekly", "end_date": "2026-10-09"}),
    lambda n: notifications.email_review_prompt(n, "your order"),
])
def test_customer_names_are_escaped_in_emails(build):
    _, html = build('<img src=x onerror=alert(1)>')
    assert "<img src=x" not in html and "&lt;img" in html


# ── WhatsApp opt-out and fallbacks ────────────────────────────────────────────

def _wa(event, db, monkeypatch, sent):
    monkeypatch.setattr(whatsapp, "whatsapp_enabled", lambda *_: True)
    monkeypatch.setattr(whatsapp, "template_sid", lambda *_: "HX1")
    monkeypatch.setattr(whatsapp, "send_sms", lambda to, body, *a, **k: sent.append(body))
    run(db.wa_optouts.insert_one({"phone": "+447700900123"}))
    run(whatsapp._notify_customer_now(event, "07700 900123", ["Asha"], f"{event}:1", "text fallback"))
    return run(db.wa_messages.find_one({"dedupe_key": f"{event}:1"}))["status"]


def test_opted_out_customer_gets_no_marketing_by_text_instead(db, monkeypatch):
    sent = []
    assert _wa("sub_renewal", db, monkeypatch, sent) == "skipped:opted_out" and sent == []


def test_opted_out_customer_still_gets_order_updates_by_text(db, monkeypatch):
    sent = []
    assert _wa("order_ready", db, monkeypatch, sent).startswith("sms:") and sent == ["text fallback"]


# ── Send once ─────────────────────────────────────────────────────────────────

def test_restock_alert_goes_out_once_per_request(db, state, monkeypatch):
    import restock
    emails, texts = [], []
    monkeypatch.setattr(restock, "send_email", lambda to, *a, **k: emails.append((to, k.get("kind"))))
    monkeypatch.setattr(restock, "send_sms", lambda to, *a, **k: texts.append(to))
    run(db.restock_subs.insert_many([{"item_id": "m1", "email": "a@example.com", "name": "A"},
                                     {"item_id": "m1", "phone": "+447700900123"}, {"item_id": "m2", "email": "other@example.com"}]))
    item = {"id": "m1", "name": "Masala Dosa", "slug": "masala-dosa"}
    run(restock.notify_restock(item)); run(restock.notify_restock(item))
    assert emails == [("a@example.com", "marketing")] and texts == ["+447700900123"]
    assert run(db.restock_subs.count_documents({})) == 1                    # the other dish's request is untouched


def test_manual_renewal_reminder_cannot_be_sent_twice(client, pay, user_headers, admin_headers, state):
    sub = subscribe(client, pay, user_headers)
    url = f"/api/admin/subscriptions/{sub['id']}/send-renewal-reminder"
    before = len(state.outbox.email)
    assert client.post(url, headers=admin_headers).status_code == 200
    second = client.post(url, headers=admin_headers)
    assert second.status_code == 409 and "already" in second.json()["detail"]
    assert len(state.outbox.email) == before + 1


# ── Admin view of the send log ────────────────────────────────────────────────

def test_admin_can_see_what_was_sent(client, db):
    run(db.message_log.insert_many([
        {"at": datetime.utcnow(), "channel": "email", "to": EMAIL, "kind": "service", "status": "sent", "subject": "Your order"},
        {"at": datetime.utcnow(), "channel": "email", "to": EMAIL, "kind": "marketing", "status": "skipped: unsubscribed", "subject": "Come back"},
        {"at": datetime.utcnow() - timedelta(days=90), "channel": "sms", "to": "+447700900123", "kind": "service", "status": "sent", "subject": "old"}]))
    run(db.email_optouts.insert_one({"email": EMAIL}))
    assert client.get("/api/admin/messages").status_code in (401, 403)
    assert client.get("/api/admin/messages", headers=token("u1")).status_code == 403
    r = client.get("/api/admin/messages?days=30", headers=token("boss", "admin")).json()
    assert len(r["messages"]) == 2 and r["unsubscribed"] == 1
    assert {(s["channel"], s["kind"], s["outcome"], s["count"]) for s in r["summary"]} == {
        ("email", "service", "sent", 1), ("email", "marketing", "skipped", 1)}


# ── A provider that is down is tried again; a message the customer is owed raises an alert ──

class _Reply:
    def __init__(self, status):
        self.status_code, self.text = status, "x"

    def json(self):
        return {"id": "re_1"}


def _provider(monkeypatch, answers):
    """Fake httpx client: each call takes the next answer — a status code, or an exception to raise."""
    calls, pauses, alerts = [], [], []

    class Client:
        def __init__(self, *a, **k):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *a):
            return False

        async def post(self, url, **kw):
            calls.append(url)
            answer = answers.pop(0)
            if isinstance(answer, Exception):
                raise answer
            return _Reply(answer)

    async def sleep(seconds):
        pauses.append(seconds)
    monkeypatch.setattr(notifications.httpx, "AsyncClient", Client)
    monkeypatch.setattr(notifications.asyncio, "sleep", sleep)
    monkeypatch.setattr(notifications, "RESEND_API_KEY", "re_test")
    monkeypatch.setattr(notifications, "notify_admin", lambda subject, html: alerts.append(subject))
    for name in ("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER"):
        monkeypatch.setattr(notifications, name, "x")
    return calls, pauses, alerts


def test_an_email_is_tried_again_when_the_provider_is_down_then_sent(db, monkeypatch):
    calls, pauses, alerts = _provider(monkeypatch, [ConnectionError("boom"), 503, 200])
    run(notifications._send_email_now(EMAIL, "Your order", "<p>x</p>", "service"))
    assert len(calls) == 3 and pauses == [20, 120]
    assert [r["status"] for r in log(db)] == ["sent after 3 tries"] and alerts == []


def test_a_service_email_that_keeps_failing_alerts_the_owner_a_marketing_one_does_not(db, monkeypatch):
    calls, pauses, alerts = _provider(monkeypatch, [500, 500, 500, 500, 500, 500, 500, 500])
    run(notifications._send_email_now(EMAIL, "Your order", "<p>x</p>", "service"))
    run(notifications._send_email_now(EMAIL, "Come back", "<p>x</p>", "marketing"))
    assert len(calls) == 8 and pauses == [20, 120, 600, 20, 120, 600]
    assert [r["status"] for r in log(db)] == ["failed: provider 500 after 4 tries"] * 2
    assert alerts == ["A email to a customer could not be sent"]


def test_a_refused_address_is_not_tried_again(db, monkeypatch):
    calls, pauses, alerts = _provider(monkeypatch, [422, 400])
    run(notifications._send_email_now("nobody@nowhere", "Your order", "<p>x</p>", "service"))
    run(notifications._send_sms_now("+447700900123", "Your order is ready", "service"))      # texts: same rule
    assert len(calls) == 2 and pauses == [] and alerts == []
    assert sorted(r["status"] for r in log(db)) == ["failed: provider 400", "failed: provider 422"]


def test_a_text_is_tried_again_too(db, monkeypatch):
    calls, pauses, alerts = _provider(monkeypatch, [429, 201])
    run(notifications._send_sms_now("+447700900123", "Your order is ready", "service"))
    assert len(calls) == 2 and pauses == [20] and [r["status"] for r in log(db)] == ["sent after 2 tries"]


# ── "We're open" goes to everyone at most once in 12 hours, and not for a slip of the switch ──

def test_kitchen_reopened_message_is_held_back_for_a_quick_flick_and_for_a_repeat(db, monkeypatch):
    from routes import pickup_slots
    sent = []

    async def no_push(campaign):
        sent.append("push")
        return {}
    monkeypatch.setattr("web_push.send_to_all", no_push)
    monkeypatch.setattr("web_push.new_campaign", lambda *a, **k: {"stats": {}})
    monkeypatch.setattr(notifications, "send_email", lambda to, subject, html, kind="service": sent.append(to))
    run(db.reopen_subs.insert_one({"id": "r1", "email": EMAIL, "name": "Asha"}))
    now = datetime.utcnow()
    run(pickup_slots.broadcast_kitchen_reopened(closed_at=now - timedelta(minutes=5)))          # flicked off and on
    assert sent == [] and run(db.reopen_subs.count_documents({})) == 1
    run(pickup_slots.broadcast_kitchen_reopened(closed_at=now - timedelta(hours=3)))            # a real reopening
    assert sent == ["push", EMAIL] and run(db.reopen_subs.count_documents({})) == 0
    run(db.reopen_subs.insert_one({"id": "r2", "email": "ravi@example.com"}))
    run(pickup_slots.broadcast_kitchen_reopened(closed_at=now - timedelta(hours=3)))            # closed and reopened again the same evening
    assert sent == ["push", EMAIL]
    statuses = [r["status"] for r in log(db)]
    assert any("under 30 minutes" in s for s in statuses) and any("within the last 12 hours" in s for s in statuses)


def test_whatsapp_records_carry_a_real_date_for_automatic_deletion(db, monkeypatch):
    monkeypatch.setattr(whatsapp, "whatsapp_enabled", lambda event=None: False)
    monkeypatch.setattr(notifications, "send_sms", lambda *a, **k: None)
    run(whatsapp._notify_customer_now("order_confirmed", "+447700900123", ["Asha"], "wa-test-1", "fallback text"))
    rec = run(db.wa_messages.find_one({"dedupe_key": "wa-test-1"}))
    assert rec is not None and isinstance(rec["at"], datetime)


# ── A signed-in customer's own switch for marketing email ────────────────────

def test_a_customer_can_turn_marketing_email_off_and_on_in_their_account(client, db, user_headers):
    run(db.newsletter.insert_one({"id": "n1", "email": "U1@example.com", "active": True}))
    assert client.get("/api/me/preferences").status_code in (401, 403)
    assert client.get("/api/me/preferences", headers=user_headers).json() == {"marketing_email": True}
    assert client.put("/api/me/preferences", json={"marketing_email": False}, headers=user_headers).json() == {"marketing_email": False}
    assert run(db.email_optouts.find_one({"email": "u1@example.com"}))["source"] == "my account"
    assert run(db.newsletter.find_one({"id": "n1"}))["active"] is False
    assert client.get("/api/me/preferences", headers=user_headers).json() == {"marketing_email": False}
    assert client.put("/api/me/preferences", json={"marketing_email": True}, headers=user_headers).json() == {"marketing_email": True}
    assert run(db.email_optouts.count_documents({})) == 0


# ── The owner writes to the newsletter list ───────────────────────────────────

def test_a_newsletter_goes_once_to_the_active_list_minus_opt_outs(client, db, monkeypatch):
    from routes import comms
    sent = []
    monkeypatch.setattr(comms, "send_email", lambda to, subject, html, kind="service": sent.append((to, subject, kind, html)))
    run(db.newsletter.insert_many([{"id": "1", "email": "A@example.com", "active": True}, {"id": "2", "email": "a@example.com", "active": True},
                                   {"id": "3", "email": "gone@example.com", "active": False}, {"id": "4", "email": "out@example.com", "active": True}]))
    run(db.email_optouts.insert_one({"email": "out@example.com"}))
    letter = {"subject": "Diwali sweets this week", "body": "Hello from the kitchen.\n\n<script>x</script> is only text.", "link": "/menu?cat=sweets"}
    p = client.post("/api/admin/newsletter/preview", json=letter, headers=token("boss", "admin")).json()
    assert p["recipients"] == 1 and "&lt;script&gt;" in p["html"] and "utm_medium=newsletter" in p["html"] and "cat=sweets" in p["html"]
    assert client.post("/api/admin/newsletter/send", json=letter, headers=token("boss", "admin")).status_code == 400          # not confirmed
    r = client.post("/api/admin/newsletter/send", json={**letter, "confirm": True}, headers=token("boss", "admin")).json()
    assert r == {"ok": True, "recipients": 1} and [(s[0], s[2]) for s in sent] == [("a@example.com", "marketing")]
    assert client.post("/api/admin/newsletter/send", json={**letter, "confirm": True}, headers=token("boss", "admin")).status_code == 409   # not twice in a day
    assert run(db.admin_audit.find_one({"action": "newsletter sent"}))["after"] == {"recipients": 1}
    assert client.post("/api/admin/newsletter/send", json={**letter, "confirm": True}, headers=token("u1")).status_code == 403


def test_marketing_texts_respect_stop_and_say_how_to_opt_out(db, state, monkeypatch):
    """D-041: the review text stays, as marketing — never to a number that said STOP, and always with the way out."""
    import asyncio
    import notifications
    monkeypatch.setenv("TWILIO_ACCOUNT_SID", "AC"); monkeypatch.setenv("TWILIO_AUTH_TOKEN", "t"); monkeypatch.setenv("TWILIO_FROM_NUMBER", "+440000")
    monkeypatch.setattr(notifications, "TWILIO_ACCOUNT_SID", "AC"); monkeypatch.setattr(notifications, "TWILIO_AUTH_TOKEN", "t"); monkeypatch.setattr(notifications, "TWILIO_FROM_NUMBER", "+440000")
    sent = []

    class FakeResp:
        status_code = 201
        text = ""
        def json(self): return {"sid": "SM1"}

    class FakeClient:
        def __init__(self, *a, **k): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *a): return False
        async def post(self, url, **kw): sent.append(kw.get("data") or kw.get("json") or {}); return FakeResp()

    monkeypatch.setattr(notifications.httpx, "AsyncClient", FakeClient)
    run(db.wa_optouts.insert_one({"phone": "+447000000009"}))
    run(notifications._send_sms_now("+447000000009", "How was your order?", kind="marketing"))
    run(notifications._send_sms_now("+447000000001", "How was your order?", kind="marketing"))
    run(notifications._send_sms_now("+447000000009", "Your order is ready", kind="service"))
    bodies = [str(d.get("Body") or d.get("body") or d) for d in sent]
    assert len(sent) == 2                                      # the opted-out number got the service text only
    assert any("Reply STOP to opt out" in b for b in bodies) and any("ready" in b for b in bodies)
    logged = run(db.message_log.find({"channel": "sms"}, {"_id": 0, "status": 1}).to_list(None))
    assert any(l["status"] == "skipped: opted out" for l in logged)


def test_a_retry_stranded_by_a_restart_is_sent_once_and_then_forgotten(db, state, monkeypatch):
    """A-0003 MKT-004: the note written before a wait survives the process; the drain sends it once."""
    import asyncio
    import notifications
    from datetime import datetime, timedelta
    monkeypatch.setattr(notifications, "RESEND_API_KEY", "re_test")
    sent = []

    class FakeResp:
        status_code = 200
        text = ""
        def json(self): return {"id": "em_1"}

    class FakeClient:
        def __init__(self, *a, **k): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *a): return False
        async def post(self, url, **kw): sent.append(kw["json"]); return FakeResp()

    monkeypatch.setattr(notifications.httpx, "AsyncClient", FakeClient)
    run(db.message_retries.insert_one({"_id": "k1", "channel": "email", "attempt": 2, "noted_at": datetime.utcnow() - timedelta(hours=1),
                                       "due_at": datetime.utcnow() - timedelta(minutes=50),
                                       "payload": {"to": "a@example.com", "subject": "Your order", "html": "<p>hi</p>", "kind": "service"}}))
    assert run(notifications.drain_retries()) == 1
    assert len(sent) == 1 and sent[0]["to"] == ["a@example.com"]
    assert run(db.message_retries.count_documents({})) == 0
    assert run(notifications.drain_retries()) == 0                 # nothing left; never sent twice
