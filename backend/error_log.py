"""Server errors, recorded and noticed.

Any request that fails with an unhandled error is written to `error_log` (when, which route, what kind of error —
never request bodies or customer details) and the customer gets a plain apology instead of a stack trace. When
errors pile up (ERROR_BURST in an hour) the owner is emailed, at most once every ALERT_QUIET_HOURS, so a broken
checkout is noticed in minutes rather than days. Shown in Admin › System log and the health panel.
"""
import logging
import re
from datetime import datetime, timedelta

from fastapi import Request
from fastapi.responses import JSONResponse

from database import db

logger = logging.getLogger(__name__)
_EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
_PHONE = re.compile(r"(?<!\d)(?:\+?\d[\d\s-]{8,}\d)")


def describe(exc: BaseException) -> str:
    """The error in words safe to keep: addresses and phone numbers masked (audit A-0003, SEC-019)."""
    text = _EMAIL.sub("[email]", str(exc))
    return _PHONE.sub("[phone]", text)[:300]


ERROR_LOG_DAYS = 90
ERROR_BURST = 3            # this many in an hour is an alert
ALERT_QUIET_HOURS = 6


async def record_error(request: Request, exc: BaseException) -> None:
    """Never raises: a failure to record must not turn one error into two."""
    try:
        now = datetime.utcnow()
        await db.error_log.insert_one({"at": now, "method": request.method, "path": request.url.path,
                                       "kind": type(exc).__name__, "message": describe(exc)})
        recent = await db.error_log.count_documents({"at": {"$gte": now - timedelta(hours=1)}})
        if recent >= ERROR_BURST:
            marker = await db.settings.find_one({"_id": "error_alerts"}, {"_id": 0, "last_at": 1}) or {}
            last = marker.get("last_at")
            if not last or datetime.fromisoformat(last) < now - timedelta(hours=ALERT_QUIET_HOURS):
                await db.settings.update_one({"_id": "error_alerts"}, {"$set": {"last_at": now.isoformat()}}, upsert=True)
                from notifications import notify_admin
                notify_admin(critical=True, subject=f"The website is throwing errors · {recent} in the last hour", html=
                             f"<p><b>{recent}</b> requests failed on the server in the last hour. The latest: "
                             f"<code>{request.method} {request.url.path}</code> — {type(exc).__name__}.</p>"
                             "<p>Customers see a short apology, not the error. Open Admin › System log › Site errors to see them, "
                             "and Admin › Overview › Is everything working? for the rest. If checkout is affected, pause ordering until it is fixed.</p>")
    except Exception as e:  # noqa: BLE001
        logger.error("error_log failed: %s", e)


APOLOGY = {"detail": "Something went wrong on our side. Please try again in a moment."}


async def unhandled(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    await record_error(request, exc)
    return JSONResponse(status_code=500, content=APOLOGY)


class CatchErrors:
    """ASGI middleware placed INSIDE the CORS layer, so the browser receives the apology with CORS headers
    instead of an opaque network error (audit A-0003, BE-008). The outer exception handler stays as a last resort."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        started = False

        async def send_wrapper(message):
            nonlocal started
            if message["type"] == "http.response.start":
                started = True
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        except Exception as exc:  # noqa: BLE001
            if started:
                raise
            request = Request(scope, receive)
            response = await unhandled(request, exc)
            await response(scope, receive, send)
