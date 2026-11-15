"""Instagram feed for the Catering page (owner, 14–15 Nov 2026).

Reads the business's own posts and reels through the Instagram Graph API with the token the owner generated in the
Meta app ("SSP website", Unified login). Nothing is written to Instagram and no visitor data goes to Meta: the
browser only ever talks to our /api/instagram/feed, which serves a cached copy.

Environment (Render): INSTAGRAM_ACCESS_TOKEN (required), INSTAGRAM_USER_ID (the account's 1784… id, required for
Facebook-issued tokens), INSTAGRAM_APP_ID + INSTAGRAM_APP_SECRET (token refresh).

Cache: one hour in memory, and the last good feed is kept in settings/_id=instagram_feed so a Meta outage or an
expired token shows the last posts instead of an empty page. Token refresh: Instagram-issued tokens ("IG…") are
refreshed every 14 days; Facebook-issued ones ("EAA…") are exchanged for a long-lived token the same way. A refreshed
token is kept in settings/_id=instagram_token and wins over the environment value.
"""
import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx

from database import db

logger = logging.getLogger(__name__)

GRAPH_VERSION = "v21.0"
FEED_TTL = timedelta(hours=1)
REFRESH_EVERY = timedelta(days=14)
POST_LIMIT = 12
MEDIA_FIELDS = "id,caption,media_type,media_product_type,media_url,permalink,thumbnail_url,timestamp"
PROFILE_FIELDS = "id,username,name,profile_picture_url,followers_count,media_count,biography"

_cache: dict = {"at": None, "data": None}


def _env(name: str) -> str:
    return (os.getenv(name) or "").strip()


def configured() -> bool:
    return bool(_env("INSTAGRAM_ACCESS_TOKEN"))


def reset_cache():
    _cache["at"] = None
    _cache["data"] = None


async def _token() -> str:
    doc = await db.settings.find_one({"_id": "instagram_token"}, {"_id": 0, "token": 1})
    return (doc or {}).get("token") or _env("INSTAGRAM_ACCESS_TOKEN")


def _hosts(token: str) -> list:
    """Where to ask. Instagram-issued tokens live on graph.instagram.com and use /me; Facebook-issued ones on
    graph.facebook.com and need the account id. Both are tried, the likely one first."""
    user = _env("INSTAGRAM_USER_ID") or "me"
    ig = ("https://graph.instagram.com", "me")
    fb = ("https://graph.facebook.com", user)
    return [ig, fb] if token.startswith("IG") else [fb, ig]


def _normalise(raw: dict) -> Optional[dict]:
    kind = (raw.get("media_type") or "").upper()
    product = (raw.get("media_product_type") or "").upper()
    url = raw.get("media_url")
    poster = raw.get("thumbnail_url") or url
    if not url or not raw.get("permalink"):
        return None
    if kind == "VIDEO":
        type_ = "reel" if product == "REELS" else "video"
    elif kind == "CAROUSEL_ALBUM":
        type_ = "carousel"
    else:
        type_ = "image"
    caption = (raw.get("caption") or "").strip()
    return {
        "id": raw.get("id"),
        "type": type_,
        "url": url,
        "poster": poster,
        "permalink": raw["permalink"],
        "caption": caption[:200] + ("…" if len(caption) > 200 else ""),
        "timestamp": raw.get("timestamp"),
    }


async def _fetch(token: str) -> dict:
    last_error = None
    async with httpx.AsyncClient(timeout=15) as client:
        for host, user in _hosts(token):
            try:
                base = f"{host}/{GRAPH_VERSION}/{user}"
                prof = await client.get(base, params={"fields": PROFILE_FIELDS, "access_token": token})
                if prof.status_code != 200:
                    last_error = f"{host} profile {prof.status_code}: {prof.text[:160]}"
                    continue
                media = await client.get(f"{base}/media", params={"fields": MEDIA_FIELDS, "limit": POST_LIMIT, "access_token": token})
                if media.status_code != 200:
                    last_error = f"{host} media {media.status_code}: {media.text[:160]}"
                    continue
                p = prof.json()
                posts = [x for x in (_normalise(m) for m in media.json().get("data", [])) if x]
                return {
                    "profile": {
                        "username": p.get("username"), "name": p.get("name"), "avatar": p.get("profile_picture_url"),
                        "followers": p.get("followers_count"), "posts": p.get("media_count"), "bio": p.get("biography"),
                        "url": f"https://www.instagram.com/{p.get('username')}/" if p.get("username") else "https://www.instagram.com/",
                    },
                    "posts": posts,
                }
            except httpx.HTTPError as e:
                last_error = f"{host}: {e}"
    raise RuntimeError(last_error or "no host answered")


async def _maybe_refresh(token: str):
    """Keep the token alive. Quietly skipped when it is not due or the app keys are missing."""
    doc = await db.settings.find_one({"_id": "instagram_token"}, {"_id": 0, "refreshed_at": 1}) or {}
    last = doc.get("refreshed_at")
    if last and datetime.fromisoformat(last) > datetime.now(timezone.utc) - REFRESH_EVERY:
        return
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            if token.startswith("IG"):
                r = await client.get(f"https://graph.instagram.com/refresh_access_token",
                                     params={"grant_type": "ig_refresh_token", "access_token": token})
            else:
                app_id, secret = _env("INSTAGRAM_APP_ID"), _env("INSTAGRAM_APP_SECRET")
                if not (app_id and secret):
                    return
                r = await client.get(f"https://graph.facebook.com/{GRAPH_VERSION}/oauth/access_token",
                                     params={"grant_type": "fb_exchange_token", "client_id": app_id, "client_secret": secret, "fb_exchange_token": token})
        new = r.json().get("access_token") if r.status_code == 200 else None
        stamp = datetime.now(timezone.utc).isoformat()
        if new:
            await db.settings.update_one({"_id": "instagram_token"}, {"$set": {"token": new, "refreshed_at": stamp}}, upsert=True)
        else:
            # Not refreshable (a never-expiring system-user token answers like this) — note the attempt so we don't retry hourly
            await db.settings.update_one({"_id": "instagram_token"}, {"$set": {"refreshed_at": stamp, "last_refresh_error": r.text[:200]}}, upsert=True)
            logger.info("instagram token refresh skipped: %s %s", r.status_code, r.text[:120])
    except Exception as e:   # noqa: BLE001 — a refresh failure must never break the feed
        logger.warning("instagram token refresh failed: %s", e)


async def feed() -> dict:
    """The cached feed for the website: {configured, profile, posts, fetched_at, stale}."""
    if not configured():
        return {"configured": False, "profile": None, "posts": [], "fetched_at": None, "stale": False}
    now = datetime.now(timezone.utc)
    if _cache["data"] and _cache["at"] and now - _cache["at"] < FEED_TTL:
        return _cache["data"]
    token = await _token()
    try:
        data = await _fetch(token)
        out = {"configured": True, **data, "fetched_at": now.replace(tzinfo=None).isoformat(), "stale": False}
        await db.settings.update_one({"_id": "instagram_feed"}, {"$set": {"data": out, "error": None}}, upsert=True)
        await _maybe_refresh(token)
    except Exception as e:   # noqa: BLE001
        logger.warning("instagram feed fetch failed: %s", e)
        saved = await db.settings.find_one({"_id": "instagram_feed"}, {"_id": 0, "data": 1}) or {}
        await db.settings.update_one({"_id": "instagram_feed"}, {"$set": {"error": str(e)[:300], "error_at": now.replace(tzinfo=None).isoformat()}}, upsert=True)
        out = {**(saved.get("data") or {"configured": True, "profile": None, "posts": [], "fetched_at": None}), "stale": True}
    _cache["at"], _cache["data"] = now, out
    return out


async def status() -> dict:
    """For Admin › Overview: configured, when the feed was last fetched, and the last error (never the token)."""
    doc = await db.settings.find_one({"_id": "instagram_feed"}, {"_id": 0}) or {}
    data = doc.get("data") or {}
    return {"configured": configured(), "fetched_at": data.get("fetched_at"), "posts": len(data.get("posts") or []),
            "error": doc.get("error"), "error_at": doc.get("error_at")}
