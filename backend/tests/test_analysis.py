"""The analyst's reading of Analytics for any dates, and the monthly AI limits (owner, 10 Nov 2026). No real AI is called."""
import json
from datetime import datetime, timedelta

import ai_ops
import analyst
from routes.events import LONDON
from tests.conftest import run, token
from tests.test_events import send

READING = {"headline": "Quiet week.", "overview": "a\n\nb", "outlook": "more of the same", "focus": [], "lacking": [],
           "sections": {s: {"headline": s, "reading": "r", "do_next": ["x"]} for s in analyst.SECTIONS},
           "confidence": "low", "caveats": "few visits"}


def admin():
    return token("boss", "admin")


def test_the_figures_sent_hold_every_section_and_no_personal_details(client, db):
    send(client, "visit-analyse1", ["page_view", "search", "add_to_cart"], add_to_cart={"props": {"value": 9.0}, "items": [{"name": "Masala Dosa"}]},
         search={"props": {"term": "secretword"}})
    today = datetime.now(LONDON).date()
    ctx = run(analyst._context(today - timedelta(days=6), today))
    text = json.dumps(ctx, default=str)
    assert ctx["this_period"]["totals"]["visits"] == 1 and ctx["period_before"]["totals"]["visits"] == 0
    assert ctx["how_visits_ended"]["outcomes"] and ctx["example_visits"][0]["ended"] == "Left with food in the basket"
    assert "weekly_history" in ctx and "sales_book" in ctx and ctx["shop"]["dabba_wala"].startswith("opening soon")
    assert "@" not in text and "secretword" not in text and ctx["this_period"]["searches"] == 1


def test_a_reading_is_written_once_per_range_and_opened_again_free(client, db, monkeypatch):
    calls = []

    async def fake(context):
        calls.append(context["period"])
        return {"ok": True, "reading": READING, "model": ai_ops.MODEL, "cost_usd": 0.21}
    monkeypatch.setattr(analyst, "_ask", fake)
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test")
    body = {"start": "2026-11-01", "end": "2026-11-07"}
    first = client.post("/api/admin/analytics/analysis", json=body, headers=admin()).json()
    assert first["status"] in ("working", "ready")
    run(analyst._write(datetime(2026, 11, 1).date(), datetime(2026, 11, 7).date()))
    got = client.get("/api/admin/analytics/analysis", params=body, headers=admin()).json()
    assert got["status"] == "ready" and got["reading"]["headline"] == "Quiet week." and got["fresh"] is True
    again = client.post("/api/admin/analytics/analysis", json=body, headers=admin()).json()
    assert again["status"] == "ready" and len(calls) <= 2                    # the background task and the direct run; no third
    assert client.get("/api/admin/analytics/analysis", params=body).status_code in (401, 403)


def test_the_owner_sets_the_monthly_limit_and_it_is_kept(client, db, monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test")
    r = client.put("/api/admin/ai/limits", json={"cost_cap_usd": 0, "call_cap": 40}, headers=admin()).json()
    assert r["cost_cap_usd"] == 0
    out = client.post("/api/admin/analytics/analysis", json={"start": "2026-10-01", "end": "2026-10-07"}, headers=admin()).json()
    assert out["status"] == "skipped" and out["limit_reached"] and "$0.00" in out["why"]
    assert client.put("/api/admin/ai/limits", json={"cost_cap_usd": 30, "call_cap": 200}, headers=admin()).json()["cost_cap_usd"] == 30
    assert run(ai_ops.allowed())[0] is True
