"""Each background loop records when it last ran, so the health panel can say which job has gone quiet
(audit A-0003, REL-003). Never raises."""
import logging
from datetime import datetime

from database import db

logger = logging.getLogger(__name__)

# name → (interval the loop sleeps, in seconds)
LOOPS = {
    "push scheduler": 60,
    "plan expiry": 900,
    "renewal reminders": 900,
    "orphan payments": 300,
    "automations": 1800,
    "nightly review": 1800,
    "message retries": 300,
}


async def beat(name: str, note: str = "") -> None:
    try:
        await db.settings.update_one({"_id": "loops"}, {"$set": {f"beats.{name}": {"at": datetime.utcnow(), "note": note[:120]}}}, upsert=True)
    except Exception as e:  # noqa: BLE001
        logger.debug("heartbeat %s failed: %s", name, e)


async def quiet_loops(now: datetime) -> list:
    """Loops that have not beaten in three of their intervals (or never). While the instance sleeps, all of them."""
    doc = await db.settings.find_one({"_id": "loops"}, {"_id": 0, "beats": 1}) or {}
    beats = doc.get("beats", {})
    out = []
    for name, every in LOOPS.items():
        last = (beats.get(name) or {}).get("at")
        if not last or (now - last).total_seconds() > 3 * every + 60:
            out.append({"name": name, "last": last.isoformat() if last else None})
    return out
