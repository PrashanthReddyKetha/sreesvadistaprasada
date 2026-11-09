"""New-order alerts on the owner's own devices (Admin › Kitchen › "Order alerts on this device").

A push goes out the moment an order is placed, then once a minute while it is still waiting to be accepted, so an
order is not missed because an email was buried or the admin page was in another tab. The repeats stop when the
order moves on from "pending" (accepted or cancelled), or after NAG_FOR_MINUTES.
"""
import asyncio
import logging
from datetime import datetime, timedelta

from database import db
from heartbeat import beat
from web_push import send_to_owner

logger = logging.getLogger(__name__)

NAG_EVERY_SECONDS = 60
NAG_FOR_MINUTES = 60


def _who(order: dict) -> str:
    first = (order.get("customer_name") or "").split(" ")[0]
    return f"£{float(order.get('total') or 0):.2f}" + (f" · {first}" if first else "")


async def alert_new_order(order: dict) -> None:
    """Never raises: an alert that fails must not touch the order."""
    try:
        await send_to_owner(f"🔔 New order #{order.get('order_number')}", f"{_who(order)} — tap to accept",
                            tag=f"order-{order.get('id')}")
        await db.orders.update_one({"id": order.get("id")}, {"$set": {"owner_alerted_at": datetime.utcnow()}})
    except Exception as e:  # noqa: BLE001
        logger.warning("New-order alert failed: %s", e)


async def nag_waiting_orders(now: datetime | None = None) -> int:
    """One more alert for each order still waiting to be accepted; returns how many were sent."""
    now = now or datetime.utcnow()
    due = now - timedelta(seconds=NAG_EVERY_SECONDS - 5)
    waiting = await db.orders.find({
        "status": "pending",
        "created_at": {"$gte": now - timedelta(minutes=NAG_FOR_MINUTES), "$lte": due},
        "$or": [{"owner_alerted_at": {"$exists": False}}, {"owner_alerted_at": {"$lte": due}}],
    }, {"_id": 0, "id": 1, "order_number": 1, "total": 1, "customer_name": 1, "created_at": 1}).to_list(20)
    for o in waiting:
        mins = max(1, int((now - o["created_at"]).total_seconds() // 60))
        await send_to_owner(f"⏰ Order #{o.get('order_number')} waiting {mins} min", f"{_who(o)} — not accepted yet. Tap to accept",
                            tag=f"order-{o['id']}")
        await db.orders.update_one({"id": o["id"]}, {"$set": {"owner_alerted_at": now}})
    return len(waiting)


async def order_alert_loop():
    while True:
        try:
            await nag_waiting_orders()
            await beat("order alerts")
        except Exception as e:  # noqa: BLE001
            logger.warning("Order alert loop failed: %s", e)
        await asyncio.sleep(30)
