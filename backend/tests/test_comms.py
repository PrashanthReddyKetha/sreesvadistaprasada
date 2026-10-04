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
