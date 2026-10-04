"""One person, one history.

A guest's earlier orders and plans are attached to their account — but only when
the email address is proven to be theirs (Google sign-in, which verifies it).
A password account's email is not verified at sign-up, so attaching on that alone
would let anyone who knows an email address read that person's past orders.
"""
import re

from database import db


async def claim_guest_history(user_id: str, email: str) -> dict:
    """Attach guest orders and plans placed with this (verified) email to the account."""
    key = (email or "").strip().lower()
    if not user_id or not key:
        return {"orders": 0, "plans": 0}
    same_email = {"$regex": f"^{re.escape(key)}$", "$options": "i"}
    orders = await db.orders.update_many(
        {"user_id": None, "customer_email": same_email},
        {"$set": {"user_id": user_id, "claimed_from_guest": True}},
    )
    plans = await db.subscriptions.update_many(
        {"user_id": None, "$or": [{"email_key": key}, {"customer_email": same_email}]},
        {"$set": {"user_id": user_id, "claimed_from_guest": True}},
    )
    return {"orders": orders.modified_count, "plans": plans.modified_count}
