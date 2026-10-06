"""Server errors, recorded and noticed.

Any request that fails with an unhandled error is written to `error_log` (when, which route, what kind of error —
never request bodies or customer details) and the customer gets a plain apology instead of a stack trace. When
errors pile up (ERROR_BURST in an hour) the owner is emailed, at most once every ALERT_QUIET_HOURS, so a broken
checkout is noticed in minutes rather than days. Shown in Admin › System log and the health panel.
"""
import logging
from datetime import datetime, timedelta

from fastapi import Request
from fastapi.responses import JSONResponse

from database import db

logger = logging.getLogger(__name__)
ERROR_LOG_DAYS = 90
ERROR_BURST = 3            # this many in an hour is an alert
ALERT_QUIET_HOURS = 6


async def record_error(request: Request, exc: BaseException) -> None:
    """Never raises: a failure to record must not turn one error into two."""
    try:
        now = datetime.utcnow()
        await db.error_log.insert_one({"at": now, "method": request.method, "path": request.url.path,
                                       "kind": type(exc).__name__, "message": str(exc)[:300]})
        recent = await db.error_log.count_documents({"at": {"$gte": now - timedelta(hours=1)}})
        if recent >= ERROR_BURST:
            marker = await db.settings.find_one({"_id": "error_alerts"}, {"_id": 0, "last_at": 1}) or {}
            last = marker.get("last_at")
            if not last or datetime.fromisoformat(last) < now - timedelta(hours=ALERT_QUIET_HOURS):
                await db.settings.update_one({"_id": "error_alerts"}, {"$set": {"last_at": now.isoformat()}}, upsert=True)
                from notifications import notify_admin
                notify_admin(f"The website is throwing errors · {recent} in the last hour",
                             f"<p><b>{recent}</b> requests failed on the server in the last hour. The latest: "
                             f"<code>{request.method} {request.url.path}</code> — {type(exc).__name__}.</p>"
                             "<p>Customers see a short apology, not the error. Open Admin › System log › Site errors to see them, "
                             "and Admin › Overview › Is everything working? for the rest. If checkout is affected, pause ordering until it is fixed.</p>")
    except Exception as e:  # noqa: BLE001
        logger.error("error_log failed: %s", e)


async def unhandled(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    await record_error(request, exc)
    return JSONResponse(status_code=500, content={"detail": "Something went wrong on our side. Please try again in a moment."})
