"""One record of what admins change: who, when, what, before and after.

Started with automations (Phase 14); other admin actions are added to it in Phase 16.
"""
import logging
from datetime import datetime

from database import db

logger = logging.getLogger(__name__)


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
