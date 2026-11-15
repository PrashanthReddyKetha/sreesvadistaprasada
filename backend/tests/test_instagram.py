"""Instagram feed for the Catering page: normalised posts, one-hour cache, last-good copy on failure, token refresh."""
import pytest

import instagram
from tests.conftest import run


class _Reply:
    def __init__(self, status, body):
        self.status_code, self._body = status, body
        self.text = str(body)

    def json(self):
        return self._body


def _graph(monkeypatch, answers):
    """Fake httpx client: answers keyed by a substring of the URL (+ query), in order of first match."""
    calls = []

    class Client:
        def __init__(self, *a, **k): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *a): return False

        async def get(self, url, params=None, **kw):
            calls.append((url, dict(params or {})))
            for key, reply in answers:
                if key in url:
                    return reply() if callable(reply) else _Reply(*reply)
            return _Reply(404, {"error": "no fake for " + url})

    monkeypatch.setattr(instagram.httpx, "AsyncClient", Client)
    return calls


PROFILE = {"id": "17841474998556404", "username": "sreesvadistaprasada", "name": "Sree Svadista Prasada",
           "profile_picture_url": "https://scontent.example/avatar.jpg", "followers_count": 412, "media_count": 38}
MEDIA = {"data": [
    {"id": "1", "media_type": "VIDEO", "media_product_type": "REELS", "media_url": "https://scontent.example/reel.mp4",
     "thumbnail_url": "https://scontent.example/reel.jpg", "permalink": "https://www.instagram.com/reel/abc/", "caption": "Gongura chicken, Sunday special " * 10, "timestamp": "2026-11-10T10:00:00+0000"},
    {"id": "2", "media_type": "IMAGE", "media_url": "https://scontent.example/dosa.jpg", "permalink": "https://www.instagram.com/p/def/", "caption": "Ghee dosa", "timestamp": "2026-11-09T10:00:00+0000"},
    {"id": "3", "media_type": "CAROUSEL_ALBUM", "media_url": "https://scontent.example/thali.jpg", "permalink": "https://www.instagram.com/p/ghi/", "timestamp": "2026-11-08T10:00:00+0000"},
    {"id": "4", "media_type": "IMAGE", "permalink": "https://www.instagram.com/p/broken/"},   # no media_url → dropped
]}


@pytest.fixture(autouse=True)
def _fresh(monkeypatch, db):
    instagram.reset_cache()
    monkeypatch.delenv("INSTAGRAM_USER_ID", raising=False)
    monkeypatch.delenv("INSTAGRAM_APP_ID", raising=False)
    monkeypatch.delenv("INSTAGRAM_APP_SECRET", raising=False)
    yield
    instagram.reset_cache()


def test_feed_is_empty_and_honest_when_no_token(client, monkeypatch):
    monkeypatch.delenv("INSTAGRAM_ACCESS_TOKEN", raising=False)
    r = client.get("/api/instagram/feed")
    assert r.status_code == 200 and r.json() == {"configured": False, "profile": None, "posts": [], "fetched_at": None, "stale": False}


def test_instagram_token_reads_graph_instagram_first_and_normalises_posts(client, monkeypatch):
    monkeypatch.setenv("INSTAGRAM_ACCESS_TOKEN", "IGAAtoken")
    calls = _graph(monkeypatch, [("graph.instagram.com/v21.0/me/media", (200, MEDIA)), ("graph.instagram.com/v21.0/me", (200, PROFILE))])
    body = client.get("/api/instagram/feed").json()
    assert [u.split("/v21.0/")[0] for u, _ in calls if "/v21.0/" in u] == ["https://graph.instagram.com"] * 2
    assert body["configured"] is True and body["stale"] is False
    assert body["profile"]["username"] == "sreesvadistaprasada" and body["profile"]["url"] == "https://www.instagram.com/sreesvadistaprasada/"
    assert body["profile"]["followers"] == 412
    assert [p["type"] for p in body["posts"]] == ["reel", "image", "carousel"]        # the post with no media_url is dropped
    reel = body["posts"][0]
    assert reel["url"].endswith(".mp4") and reel["poster"].endswith("reel.jpg") and reel["permalink"].endswith("/reel/abc/")
    assert len(reel["caption"]) == 201 and reel["caption"].endswith("…")
    assert "access_token" not in str(body)


def test_facebook_token_uses_graph_facebook_with_the_account_id(client, monkeypatch):
    monkeypatch.setenv("INSTAGRAM_ACCESS_TOKEN", "EAAfbtoken")
    monkeypatch.setenv("INSTAGRAM_USER_ID", "17841474998556404")
    calls = _graph(monkeypatch, [("graph.facebook.com/v21.0/17841474998556404/media", (200, MEDIA)), ("graph.facebook.com/v21.0/17841474998556404", (200, PROFILE))])
    body = client.get("/api/instagram/feed").json()
    assert calls[0][0] == "https://graph.facebook.com/v21.0/17841474998556404"
    assert len(body["posts"]) == 3


def test_falls_through_to_the_other_host_when_the_first_refuses(client, monkeypatch):
    monkeypatch.setenv("INSTAGRAM_ACCESS_TOKEN", "IGAAtoken")
    calls = _graph(monkeypatch, [("graph.instagram.com", (400, {"error": {"message": "Unsupported"}})),
                                 ("graph.facebook.com/v21.0/me/media", (200, MEDIA)), ("graph.facebook.com/v21.0/me", (200, PROFILE))])
    body = client.get("/api/instagram/feed").json()
    assert body["stale"] is False and len(body["posts"]) == 3
    assert [u.split("/v21.0/")[0] for u, _ in calls if "/v21.0/" in u] == ["https://graph.instagram.com", "https://graph.facebook.com", "https://graph.facebook.com"]


def test_feed_is_cached_for_an_hour(client, monkeypatch):
    monkeypatch.setenv("INSTAGRAM_ACCESS_TOKEN", "IGAAtoken")
    calls = _graph(monkeypatch, [("me/media", (200, MEDIA)), ("/me", (200, PROFILE))])
    client.get("/api/instagram/feed"); client.get("/api/instagram/feed"); client.get("/api/instagram/feed")
    assert len([c for c in calls if "/media" in c[0]]) == 1


def test_outage_serves_the_last_good_copy_and_health_says_so(client, admin_headers, monkeypatch, db):
    monkeypatch.setenv("INSTAGRAM_ACCESS_TOKEN", "IGAAtoken")
    _graph(monkeypatch, [("me/media", (200, MEDIA)), ("/me", (200, PROFILE))])
    first = client.get("/api/instagram/feed").json()
    assert len(first["posts"]) == 3
    instagram.reset_cache()
    _graph(monkeypatch, [("graph", (190, {"error": {"message": "Error validating access token"}}))])
    second = client.get("/api/instagram/feed").json()
    assert second["stale"] is True and [p["id"] for p in second["posts"]] == ["1", "2", "3"]
    saved = run(db.settings.find_one({"_id": "instagram_feed"}))
    assert "Error validating access token" in saved["error"]
    health = client.get("/api/admin/health", headers=admin_headers).json()
    row = next(c for c in health["checks"] if c["name"] == "Instagram feed")
    assert row["state"] == "watch" and "last good copy" in row["note"]


def test_instagram_token_is_refreshed_every_fortnight_and_the_new_one_is_used(client, monkeypatch, db):
    monkeypatch.setenv("INSTAGRAM_ACCESS_TOKEN", "IGAAold")
    calls = _graph(monkeypatch, [("refresh_access_token", (200, {"access_token": "IGAAnew", "expires_in": 5183944})),
                                 ("me/media", (200, MEDIA)), ("/me", (200, PROFILE))])
    client.get("/api/instagram/feed")
    assert any("refresh_access_token" in u and p["access_token"] == "IGAAold" for u, p in calls)
    assert run(db.settings.find_one({"_id": "instagram_token"}))["token"] == "IGAAnew"
    instagram.reset_cache(); calls.clear()
    client.get("/api/instagram/feed")
    assert all(p.get("access_token") == "IGAAnew" for u, p in calls if "/v21.0/" in u)
    assert not any("refresh_access_token" in u for u, _ in calls)                     # not due again


def test_facebook_token_refresh_needs_the_app_keys_and_skips_quietly_without_them(client, monkeypatch, db):
    monkeypatch.setenv("INSTAGRAM_ACCESS_TOKEN", "EAAsystemuser")
    calls = _graph(monkeypatch, [("/me/media", (200, MEDIA)), ("/me", (200, PROFILE))])
    assert len(client.get("/api/instagram/feed").json()["posts"]) == 3
    assert not any("oauth/access_token" in u for u, _ in calls)
    instagram.reset_cache()
    monkeypatch.setenv("INSTAGRAM_APP_ID", "195"); monkeypatch.setenv("INSTAGRAM_APP_SECRET", "s")
    calls = _graph(monkeypatch, [("oauth/access_token", (400, {"error": "not exchangeable"})), ("/me/media", (200, MEDIA)), ("/me", (200, PROFILE))])
    assert len(client.get("/api/instagram/feed").json()["posts"]) == 3
    assert run(db.settings.find_one({"_id": "instagram_token"})).get("token") is None   # kept the env token, noted the attempt
