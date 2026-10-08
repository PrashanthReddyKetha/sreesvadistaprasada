import os
import uuid
import asyncio
import logging
import stripe
from fastapi import APIRouter, HTTPException, Request, Depends
from collections import defaultdict
from typing import Literal
import time
from pydantic import BaseModel
from database import db
from heartbeat import beat
from security import client_ip
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["payments"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")

# ── Rate limiter ──────────────────────────────────────────────────────────────
_pi_rate_store: dict = defaultdict(list)
PI_RATE_WINDOW = 60
PI_RATE_MAX    = 10   # max 10 PaymentIntents per minute per IP

def _check_pi_rate(request: Request):
    ip = client_ip(request)
    now = time.time()
    cutoff = now - PI_RATE_WINDOW
    _pi_rate_store[ip] = [t for t in _pi_rate_store[ip] if t > cutoff]
    if len(_pi_rate_store[ip]) >= PI_RATE_MAX:
        raise HTTPException(status_code=429, detail="Too many requests. Please wait a moment.")
    _pi_rate_store[ip].append(now)


MAX_INTENT_PENCE = 50000   # £500 — a monthly plan with delivery is about £320; nothing legitimate comes near it (audit A-0003, SEC-005; owner approved)


class PaymentIntentRequest(BaseModel):
    amount: float  # in GBP
    # What the payment is for. Stamped on the intent so an order payment can
    # never be reused to start a subscription (or the other way round).
    purpose: Literal["order", "subscription"]


def intent_purpose(pi) -> str | None:
    md = getattr(pi, "metadata", None) or {}
    try:
        return md["purpose"]
    except (KeyError, TypeError):
        return None


@router.post("/create-intent")
async def create_payment_intent(request: Request, payload: PaymentIntentRequest, _: None = Depends(_check_pi_rate)):
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Payment not configured")
    amount_pence = round(payload.amount * 100)
    if amount_pence < 50:
        raise HTTPException(status_code=400, detail="Amount too small")
    if amount_pence > MAX_INTENT_PENCE:
        raise HTTPException(status_code=400, detail="That total is above what we can take online — please get in touch and we'll arrange it.")
    try:
        loop = asyncio.get_event_loop()
        intent = await loop.run_in_executor(None, lambda: stripe.PaymentIntent.create(
            amount=amount_pence,
            currency="gbp",
            automatic_payment_methods={"enabled": True},
            metadata={"purpose": payload.purpose},
            idempotency_key=str(uuid.uuid4()),
        ))
        return {"client_secret": intent.client_secret, "payment_intent_id": intent.id}
    except stripe.StripeError as e:
        logger.error("create-intent failed: %s", e)
        raise HTTPException(status_code=400, detail="The card service did not answer — please try again in a moment.")


@router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    if not WEBHOOK_SECRET:
        logger.error("Stripe webhook received but STRIPE_WEBHOOK_SECRET is not set — payments cannot be matched to orders")
        raise HTTPException(status_code=500, detail="Webhook secret not configured")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook")

    if event["type"] == "payment_intent.succeeded":
        obj = event["data"]["object"]
        pi_id = obj["id"]
        await db.orders.update_one(
            {"payment_intent_id": pi_id},
            {"$set": {"payment_status": "paid", "updated_at": datetime.utcnow()}},
        )
        # Ledger of money actually taken — orphan_payment_loop checks each row
        # ends up attached to an order or subscription.
        await db.payments.update_one(
            {"pi_id": pi_id},
            {"$setOnInsert": {
                "pi_id": pi_id,
                "amount_pence": obj.get("amount"),
                "purpose": (obj.get("metadata") or {}).get("purpose"),
                "receipt_email": obj.get("receipt_email"),
                "received_at": datetime.utcnow().isoformat(),
                "reconciled": False,
                "alerted": False,
            }},
            upsert=True,
        )
    elif event["type"] == "payment_intent.payment_failed":
        pi_id = event["data"]["object"]["id"]
        await db.orders.update_one(
            {"payment_intent_id": pi_id},
            {"$set": {"payment_status": "failed", "updated_at": datetime.utcnow()}},
        )

    return {"ok": True}


# ── Paid-but-nothing-created watchdog ─────────────────────────────────────────
ORPHAN_GRACE_MINUTES = 10

async def check_orphan_payments():
    """Any succeeded payment with no order/subscription after the grace period
    is emailed to the admin once, so a charged customer is never left unnoticed."""
    from notifications import notify_admin
    cutoff = (datetime.utcnow() - timedelta(minutes=ORPHAN_GRACE_MINUTES)).isoformat()
    rows = await db.payments.find(
        {"reconciled": False, "alerted": False, "received_at": {"$lt": cutoff}}, {"_id": 0}
    ).to_list(100)
    for row in rows:
        pi_id = row["pi_id"]
        matched = (
            await db.orders.find_one({"payment_intent_id": pi_id}, {"_id": 1})
            or await db.subscriptions.find_one({"payment_intent_id": pi_id}, {"_id": 1})
        )
        if matched:
            await db.payments.update_one({"pi_id": pi_id}, {"$set": {"reconciled": True}})
            continue
        claimed = await db.payments.update_one(
            {"pi_id": pi_id, "alerted": False}, {"$set": {"alerted": True, "alerted_at": datetime.utcnow().isoformat()}}
        )
        if claimed.modified_count == 0:
            continue
        amount = (row.get("amount_pence") or 0) / 100
        logger.error("Orphan payment %s (£%.2f, %s)", pi_id, amount, row.get("purpose"))
        notify_admin(
            f"ACTION NEEDED · payment taken with no {row.get('purpose') or 'order'} · £{amount:.2f}",
            f"<p>A card payment of <b>£{amount:.2f}</b> succeeded at {row.get('received_at')} UTC but no "
            f"{row.get('purpose') or 'order'} was created for it.</p>"
            f"<p><b>Stripe reference:</b> {pi_id}</p>"
            "<p>Open this payment in the Stripe dashboard to see the customer's details, then contact "
            "them to either place the order by hand or refund the payment.</p>",
        )


async def orphan_payment_loop():
    while True:
        try:
            await check_orphan_payments()
            await beat("orphan payments")
        except Exception as e:
            logger.warning("Orphan payment check failed: %s", e)
        await asyncio.sleep(300)
