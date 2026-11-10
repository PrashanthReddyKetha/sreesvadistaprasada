"""Visits with no tap, no scroll and under 3 seconds on screen are probably bots dressed as a browser: they are left out
of every figure, and can still be looked at on their own (owner, 10 Nov 2026)."""
from datetime import datetime

import visit_story
from routes.events import LONDON
from tests.conftest import REAL_BOT_RULE, token
from tests.test_events import send


def admin():
    return token("boss", "admin")


def test_a_page_load_with_nothing_done_is_left_out_of_the_figures(client, monkeypatch):
    monkeypatch.setattr(visit_story, "probably_bot", REAL_BOT_RULE)
    send(client, "visit-bot00001", ["page_view"])                                          # gone in a blink
    send(client, "visit-bot00002", ["page_view", "page_leave"], page_leave={"props": {"seconds": 1, "view": "a1"}})
    send(client, "visit-read0001", ["page_view", "page_leave"], page_leave={"props": {"seconds": 40, "view": "b1"}})   # read, no taps
    send(client, "visit-tap00001", ["page_view", "click"], click={"props": {"label": "Menu", "area": "header"}})      # tapped quickly
    today = datetime.now(LONDON).date().isoformat()
    params = {"start": today, "end": today}
    a = client.get("/api/admin/analytics", params=params, headers=admin()).json()
    assert a["totals"]["visits"] == 2 and a["totals"]["probable_bots"] == 2 and a["totals"]["page_views"] == 2

    v = client.get("/api/admin/analytics/visits", params=params, headers=admin()).json()
    assert v["total"] == 2 and {x["visit_id"] for x in v["visits"]} == {"visit-re", "visit-ta"}
    assert "2 more visits looked like bots" in v["summary"]["text"]
    assert {"outcome": "Probably a bot", "visits": 2} in v["summary"]["outcomes"]

    bots = client.get("/api/admin/analytics/visits", params={**params, "outcome": "Probably a bot"}, headers=admin()).json()
    assert bots["total"] == 2 and all(x["story"]["outcome"] == "Probably a bot" for x in bots["visits"])

    notes = client.get("/api/admin/analytics/analysis", params=params, headers=admin()).json()["reading"]["notes"]
    assert "2 more visits looked like bots and are left out of these figures" in notes["overall"]


def test_signed_in_or_long_enough_is_a_person():
    page = {"name": "page_view", "path": "/"}
    assert REAL_BOT_RULE([page])
    assert not REAL_BOT_RULE([{**page, "signed_in": True}])
    assert not REAL_BOT_RULE([page, {"name": "page_leave", "path": "/", "props": {"seconds": 2, "view": "a"}},
                              {"name": "page_view", "path": "/menu"}, {"name": "page_leave", "path": "/menu", "props": {"seconds": 2, "view": "b"}}])
    assert not REAL_BOT_RULE([page, {"name": "scroll_depth", "path": "/", "props": {"percent": 50}}])
