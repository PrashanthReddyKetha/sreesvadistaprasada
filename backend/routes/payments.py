import os
import uuid
import stripe
from fastapi import APIRouter, HTTPException, Request, Depends
from collections import defaultdict
import time
from pydantic import BaseModel
from database import db
from datetime import datetime

router = APIRouter(prefix="/payments", tags=["payments"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")

# ── Rate limiter ──────────────────────────────────────────────────────────────
_pi_rate_store: dict = defaultdict(list)
PI_RATE_WINDOW = 60
PI_RATE_MAX    = 10   # max 10 PaymentIntents per minute per IP

def _check_pi_rate(request: Request):
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    cutoff = now - PI_RATE_WINDOW
    _pi_rate_store[ip] = [t for t in _pi_rate_store[ip] if t > cutoff]
    if len(_pi_rate_store[ip]) >= PI_RATE_MAX:
        raise HTTPException(status_code=429, detail="Too many requests. Please wait a moment.")
    _pi_rate_store[ip].append(now)


class PaymentIntentRequest(BaseModel):
    amount: float  # in GBP


@router.post("/create-intent")
async def create_payment_intent(request: Request, payload: PaymentIntentRequest, _: None = Depends(_check_pi_rate)):
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Payment not configured")
    amount_pence = round(payload.amount * 100)
    if amount_pence < 50:
        raise HTTPException(status_code=400, detail="Amount too small")
    try:
        intent = stripe.PaymentIntent.create(
            amount=amount_pence,
            currency="gbp",
            automatic_payment_methods={"enabled": True},
            idempotency_key=str(uuid.uuid4()),
        )
        return {"client_secret": intent.client_secret, "payment_intent_id": intent.id}
    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e.user_message))


@router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        if not WEBHOOK_SECRET:
            raise HTTPException(status_code=500, detail="Webhook secret not configured")
        event = stripe.Webhook.construct_event(payload, sig_header, WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook")

    if event["type"] == "payment_intent.succeeded":
        pi_id = event["data"]["object"]["id"]
        await db.orders.update_one(
            {"payment_intent_id": pi_id},
            {"$set": {"payment_status": "paid", "updated_at": datetime.utcnow().isoformat()}},
        )
    elif event["type"] == "payment_intent.payment_failed":
        pi_id = event["data"]["object"]["id"]
        await db.orders.update_one(
            {"payment_intent_id": pi_id},
            {"$set": {"payment_status": "failed", "updated_at": datetime.utcnow().isoformat()}},
        )

    return {"ok": True}
