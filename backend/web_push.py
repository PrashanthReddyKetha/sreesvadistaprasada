"""Web Push (VAPID) — key provisioning, sending, and the campaign scheduler.

Keys are self-provisioned on first boot and stored in db.settings
(_id="web_push"), so no Render env vars are needed. The public key is served
to browsers via GET /api/push/public-key; the private key never leaves the DB.

Subscriptions live in db.push_subs keyed by endpoint. Campaigns live in
db.push_campaigns with per-campaign analytics counters that the service
worker increments via POST /api/push/track (received / clicked).

pywebpush is synchronous (requests under the hood), so each send runs in a
worker thread via asyncio.to_thread — fine at this scale.
"""
import asyncio
import base64
import json
import logging
import uuid
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from pywebpush import webpush, WebPushException

from database import db

logger = logging.getLogger(__name__)

LONDON = ZoneInfo("Europe/London")
SETTINGS_ID = "web_push"
VAPID_SUB = "mailto:hello@sreesvadistaprasada.com"

_keys_cache = None


def _b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


async def ensure_vapid_keys() -> dict:
    """Load (or generate once) the VAPID key pair. Cached per process."""
    global _keys_cache
    if _keys_cache:
        return _keys_cache
    doc = await db.settings.find_one({"_id": SETTINGS_ID})
    if not doc:
        key = ec.generate_private_key(ec.SECP256R1())
        private_b64 = _b64url(
            key.private_numbers().private_value.to_bytes(32, "big")
        )
        public_b64 = _b64url(
            key.public_key().public_bytes(
                serialization.Encoding.X962,
                serialization.PublicFormat.UncompressedPoint,
            )
        )
        doc = {"_id": SETTINGS_ID, "public_key": public_b64, "private_key": private_b64,
               "created_at": datetime.now(timezone.utc).isoformat()}
        # Race-safe: if another worker inserted first, read theirs back
        try:
            await db.settings.insert_one(doc)
            logger.info("Web push: generated new VAPID key pair")
        except Exception:
            doc = await db.settings.find_one({"_id": SETTINGS_ID})
    _keys_cache = doc
    return doc


def _send_one_sync(sub_info: dict, payload: str, private_key: str):
    webpush(
        subscription_info=sub_info,
        data=payload,
        vapid_private_key=private_key,
        vapid_claims={"sub": VAPID_SUB},
        ttl=24 * 3600,
    )


async def send_to_all(campaign: dict) -> dict:
    """Push a campaign to every stored subscription; prune dead endpoints."""
    keys = await ensure_vapid_keys()
    payload = json.dumps({
        "title": campaign.get("title") or "Sree Svadista Prasada",
        "body": campaign.get("body") or "",
        "url": campaign.get("url") or "/order",
        "campaign_id": campaign.get("id"),
    })
    stats = {"targeted": 0, "sent": 0, "failed": 0, "pruned": 0}
    async for sub in db.push_subs.find({}):
        stats["targeted"] += 1
        sub_info = {"endpoint": sub["endpoint"], "keys": sub["keys"]}
        try:
            await asyncio.to_thread(_send_one_sync, sub_info, payload, keys["private_key"])
            stats["sent"] += 1
        except WebPushException as e:
            status = getattr(getattr(e, "response", None), "status_code", None)
            if status in (404, 410):
                # Subscription expired or unsubscribed — remove it
                await db.push_subs.delete_one({"endpoint": sub["endpoint"]})
                stats["pruned"] += 1
            else:
                stats["failed"] += 1
                logger.warning("Web push send failed (%s): %s", status, e)
        except Exception as e:
            stats["failed"] += 1
            logger.warning("Web push send error: %s", e)
    return stats


async def dispatch_campaign(campaign_id: str):
    """Atomically claim a campaign and send it. Safe against double-fire."""
    doc = await db.push_campaigns.find_one_and_update(
        {"id": campaign_id, "status": {"$in": ["scheduled", "queued"]}},
        {"$set": {"status": "sending"}},
    )
    if not doc:
        return
    stats = await send_to_all(doc)
    await db.push_campaigns.update_one(
        {"id": campaign_id},
        {"$set": {
            "status": "sent",
            "sent_at": datetime.now(timezone.utc).isoformat(),
            "stats.targeted": stats["targeted"],
            "stats.sent": stats["sent"],
            "stats.failed": stats["failed"],
            "stats.pruned": stats["pruned"],
        }},
    )
    logger.info("Web push campaign %s sent: %s", campaign_id, stats)


async def scheduler_loop():
    """Every 60s, fire any scheduled campaign whose time has come (UTC)."""
    while True:
        try:
            now_iso = datetime.now(timezone.utc).isoformat()
            due = db.push_campaigns.find(
                {"status": "scheduled", "send_at_utc": {"$lte": now_iso}}
            )
            async for c in due:
                await dispatch_campaign(c["id"])
        except asyncio.CancelledError:
            raise
        except Exception as e:
            logger.error("Push scheduler tick failed: %s", e)
        await asyncio.sleep(60)


def new_campaign(title: str, body: str, url: str, send_at_utc: str | None) -> dict:
    return {
        "id": str(uuid.uuid4()),
        "title": title.strip(),
        "body": body.strip(),
        "url": url.strip() or "/order",
        "status": "scheduled" if send_at_utc else "queued",
        "send_at_utc": send_at_utc,  # None = send now
        "created_at": datetime.now(timezone.utc).isoformat(),
        "sent_at": None,
        "stats": {"targeted": 0, "sent": 0, "failed": 0, "pruned": 0,
                  "received": 0, "clicked": 0},
    }
