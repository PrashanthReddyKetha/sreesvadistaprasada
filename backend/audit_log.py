"""Who changed what in admin, and when.

Two sources write to `admin_audit`:
- routes that know the before and after call record_admin_action() themselves;
- AdminActionLog, an ASGI middleware, records every other successful admin write (POST/PUT/PATCH/DELETE made with
  an admin token) in plain words, with what was sent, so no change made from the admin screens goes unrecorded.
"""
import asyncio
import json
import logging
import re
from datetime import datetime

from database import db

logger = logging.getLogger(__name__)
WRITES = {"POST", "PUT", "PATCH", "DELETE"}
MAX_BODY = 4000


async def record_admin_action(admin: dict, action: str, target: str, before=None, after=None) -> None:
    """Never raises: failing to write the log must not undo the admin's action."""
    try:
        me = await db.users.find_one({"id": admin.get("sub")}, {"_id": 0, "name": 1})
        await db.admin_audit.insert_one({
            "at": datetime.utcnow(), "admin_id": admin.get("sub"), "admin_name": (me or {}).get("name") or "Admin",
            "action": action, "target": target, "before": before, "after": after,
        })
    except Exception as e:
        logger.error("admin_audit insert failed: %s", e)


# Plain words for each kind of admin write, matched against "METHOD /api/path". First match wins.
WORDING = [
    (r"^PUT /api/orders/[^/]+/status$", "changed an order's status"),
    (r"^PUT /api/subscriptions/[^/]+/status$", "changed a plan's status"),
    (r"^PUT /api/admin/settings/pickup-slots$", "changed ordering settings (hours, slots, pause, delivery)"),
    (r"^POST /api/admin/push/send$", "sent or scheduled a notification to everyone"),
    (r"^DELETE /api/admin/push/campaigns/", "cancelled a scheduled notification"),
    (r"^POST /api/admin/loyalty/backfill$", "recounted loyalty stamps for every customer"),
    (r"^POST /api/admin/loyalty/adjust$", "adjusted a customer's loyalty stamps"),
    (r"^POST /api/menu$", "added a dish"), (r"^PUT /api/menu/", "changed a dish"), (r"^DELETE /api/menu/", "removed a dish"),
    (r"^POST /api/menu/ai/enhance$", "asked the AI to fill in a dish"),
    (r"^POST /api/admin/coupons/batch$", "created a batch of coupons"), (r"^POST /api/admin/coupons$", "created a coupon"),
    (r"^PUT /api/admin/coupons/", "changed a coupon"), (r"^DELETE /api/admin/coupons/", "deleted a coupon"),
    (r"^POST /api/daily-specials", "added a daily special"), (r"^PUT /api/daily-specials/", "changed a daily special"),
    (r"^DELETE /api/daily-specials/", "removed a daily special"),
    (r"^POST /api/admin/subscriptions/[^/]+/skips/[^/]+/make-up$", "gave a make-up meal"),
    (r"^POST /api/admin/subscriptions/[^/]+/notes$", "added a note to a plan"),
    (r"^POST /api/admin/subscriptions/[^/]+/send-renewal-reminder$", "sent a renewal reminder"),
    (r"^(POST|PUT) /api/admin/menu", "changed the Dabba Wala menu"),
    (r"^PUT /api/enquiries/[^/]+/[^/]+/status", "changed an enquiry's status"),
    (r"^POST /api/enquiries/[^/]+/[^/]+/(reply|messages)$", "replied to an enquiry"),
    (r"^DELETE /api/enquiries/newsletter/", "removed someone from the newsletter"),
    (r"^PUT /api/enquiries/newsletter/", "changed a newsletter sign-up"),
    (r"^POST /api/whatsapp/", "sent a WhatsApp message"),
    (r"^PUT /api/admin/settings", "changed settings"),
]
# Written by the route itself, with before and after — not again here. And customer actions that an admin
# might make while signed in (ordering, paying, a review) are not admin changes.
SELF_LOGGED = re.compile(r"^/api/(admin/(automations|system-log|newsletter/send|analytics/reset|settings/pickup-slots)|events"
                         r"|orders/[^/]+/status$|subscriptions/[^/]+/status$)")
# Every alternative ends at a path boundary: "me" must not swallow "menu" (audit A-0003, SEC-006).
NOT_ADMIN_CHANGES = re.compile(r"^/api/(?:(?:auth|payments|push/(?:subscribe|unsubscribe|track)|me|loyalty|reviews|delivery|kitchen-status/notify-me|enquiries/notifications)(?:/|$)"
                               r"|(?:orders|orders/calculate|subscriptions|subscriptions/quote|subscriptions/[^/]+/skip|enquiries/(?:contact|catering|newsletter|waitlist)"
                               r"|menu/[^/]+/(?:like|reviews|notify-restock))$)")


def wording(method: str, path: str) -> str:
    key = f"{method} {path}"
    for pattern, words in WORDING:
        if re.search(pattern, key):
            return words
    verb = {"POST": "added or sent", "PUT": "changed", "PATCH": "changed", "DELETE": "removed"}[method]
    return f"{verb}: {path.replace('/api/', '').replace('/', ' › ')}"


def _admin_from(scope) -> dict:
    """The admin behind the request, from its token — or {} for anyone else."""
    try:
        for name, value in scope.get("headers") or []:
            if name == b"authorization" and value[:7].lower() == b"bearer ":
                from auth import decode_token
                claims = decode_token(value[7:].decode())
                return claims if claims.get("role") == "admin" else {}
    except Exception:
        return {}
    return {}


SECRET_KEYS = ("password", "token", "secret", "card", "cvc", "api_key", "authorization")
PERSONAL_KEYS = ("phone", "customer_phone", "email", "customer_email", "line1", "line2", "postcode", "address", "delivery_address")


def _redact(value):
    """What the log keeps of a request body: never a secret, personal details masked (A-0003, SEC-021/AUD-002)."""
    if isinstance(value, dict):
        out = {}
        for k, v in value.items():
            kl = str(k).lower()
            if any(w in kl for w in SECRET_KEYS):
                out[k] = "[hidden]"
            elif kl in PERSONAL_KEYS:
                from security import mask
                out[k] = mask(v) if isinstance(v, str) else "[hidden]"
            else:
                out[k] = _redact(v)
        return out
    if isinstance(value, list):
        return [_redact(v) for v in value[:20]]
    return value


def _summary(body: bytes):
    if not body:
        return None
    try:
        data = json.loads(body[:MAX_BODY * 4])
    except Exception:
        return "[body not kept]"
    data = _redact(data)
    text = json.dumps(data)
    return data if len(text) <= MAX_BODY else {"note": f"{len(text)} characters sent"}


class AdminActionLog:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope["method"] not in WRITES or not scope["path"].startswith("/api/") \
                or SELF_LOGGED.match(scope["path"]) or NOT_ADMIN_CHANGES.match(scope["path"]):
            await self.app(scope, receive, send)
            return
        admin = _admin_from(scope)
        if not admin:
            await self.app(scope, receive, send)
            return
        chunks, status = [], {}

        async def receive_and_keep():
            message = await receive()
            if message["type"] == "http.request":
                chunks.append(message.get("body", b""))
            return message

        async def send_and_watch(message):
            if message["type"] == "http.response.start":
                status["code"] = message["status"]
            await send(message)

        await self.app(scope, receive_and_keep, send_and_watch)
        if 200 <= status.get("code", 500) < 300:
            asyncio.create_task(record_admin_action(admin, wording(scope["method"], scope["path"]), scope["path"].replace("/api/", ""),
                                                    None, _summary(b"".join(chunks))))
