"""The descriptions under every Analytics table, for any dates — written by rules, never by AI (owner, 10 Nov 2026)."""
from datetime import datetime

import ai_ops
import analyst
from routes.events import LONDON
from tests.conftest import run, token
from tests.test_events import send


def admin():
    return token("boss", "admin")


def test_every_table_gets_a_description_from_the_figures(client, monkeypatch):
    def no_ai(*a, **k):
        raise AssertionError("the AI must not be called")
    monkeypatch.setattr(ai_ops, "investigate", no_ai)
    send(client, "visit-notes001", ["page_view", "view_item", "add_to_cart"], {"referrer": "www.google.com"},
         view_item={"items": [{"name": "Masala Dosa"}], "props": {"value": 8.99}},
         add_to_cart={"props": {"value": 8.99}, "items": [{"name": "Masala Dosa"}]})
    send(client, "visit-notes002", ["page_view", "add_to_cart", "begin_checkout", "purchase"],
         purchase={"props": {"value": 20.0, "transaction_id": "SSP9"}})
    today = datetime.now(LONDON).date().isoformat()
    r = client.get("/api/admin/analytics/analysis", params={"start": today, "end": today}, headers=admin()).json()
    notes = r["reading"]["notes"]
    assert r["status"] == "ready" and r["by"] == "rules" and set(notes) == set(analyst.NOTES)
    assert all(notes[k] for k in analyst.NOTES)
    assert notes["overall"].startswith("2 visits") and "hint, not a trend" in notes["overall"]
    assert "Of 2 visits, 2 looked at the menu, 2 added food, 1 started checkout and 1 ordered" in notes["funnel"]
    assert "Masala Dosa" in notes["most_opened"]
    assert client.get("/api/admin/analytics/analysis").status_code in (401, 403)


def test_an_empty_period_still_reads_sensibly(client):
    r = client.get("/api/admin/analytics/analysis", params={"start": "2026-01-01", "end": "2026-01-07"}, headers=admin()).json()
    notes = r["reading"]["notes"]
    assert notes["overall"].startswith("No visits") and notes["checkout"] == "Nobody reached checkout in this period."


def test_ai_is_off_whatever_the_key(monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "a-real-looking-key")
    ok, why = run(ai_ops.allowed())
    assert ok is False and "Claude subscription" in why
