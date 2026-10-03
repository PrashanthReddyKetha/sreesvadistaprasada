from fastapi import APIRouter, HTTPException, Depends, Query, Request
from typing import Optional, List
from datetime import datetime, timedelta, time as dtime
from collections import defaultdict
from zoneinfo import ZoneInfo
import asyncio
import os
import time
import stripe
from pymongo.errors import DuplicateKeyError
from database import db

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")

from pydantic import BaseModel
from models import Subscription, SubscriptionCreate, SubscriptionStatusUpdate, SubscriptionStatus, Address
from auth import get_current_user, get_optional_user, require_admin
from notifications import (
    send_email, send_sms, notify_admin,
    email_subscription_confirmation, email_delivery_skipped,
    email_subscription_cancelled, email_subscription_expired,
)
from subscription_pricing import quote_subscription, email_key, PLAN_MEALS
from coupons import redeem as redeem_coupon
from whatsapp import notify_customer, whatsapp_enabled, tracking_link, first_name

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

LONDON = ZoneInfo("Europe/London")
MAX_START_DAYS_AHEAD = 35

# Who may move a plan between states. Customers cannot change status themselves —
# they contact the kitchen (no self-service pause/cancel, by the owner's decision).
STATUS_TRANSITIONS = {
    "active":    {"cancelled", "expired"},
    "cancelled": {"active"},
    "expired":   {"active"},
}


def london_today() -> str:
    return datetime.now(LONDON).strftime("%Y-%m-%d")


def validate_start_date(start_date: str, *, allow_today: bool = False) -> datetime:
    """Plans start on a Monday, not in the past and not absurdly far ahead."""
    try:
        start = datetime.strptime(start_date or "", "%Y-%m-%d")
    except ValueError:
        raise ValueError("Please choose a start date for your plan.")
    if start.weekday() != 0:
        raise ValueError("Dabba Wala plans start on a Monday — please pick a start week.")
    today = datetime.strptime(london_today(), "%Y-%m-%d")
    if start < today or (start == today and not allow_today):
        raise ValueError("That start week has already begun — please pick a later one.")
    if start > today + timedelta(days=MAX_START_DAYS_AHEAD):
        raise ValueError("That start date is too far ahead — please pick one within the next five weeks.")
    return start


def plan_delivery_dates(sub: dict) -> list:
    """Every weekday from the plan's start to its end date."""
    try:
        start = datetime.strptime(sub["start_date"], "%Y-%m-%d")
    except (KeyError, TypeError, ValueError):
        return []
    try:
        end = datetime.strptime(sub.get("end_date") or "", "%Y-%m-%d")
    except ValueError:
        end = start + timedelta(days=4)
    dates, d = [], start
    while d <= end:
        if d.weekday() < 5:
            dates.append(d.strftime("%Y-%m-%d"))
        d += timedelta(days=1)
    return dates


async def expire_finished_plans(extra: Optional[dict] = None) -> int:
    """Active plans whose last meal day has passed become 'expired' and get one email."""
    query = {"status": "active", "end_date": {"$lt": london_today()}}
    query.update(extra or {})
    expired = 0
    async for s in db.subscriptions.find(query, {"_id": 0}):
        claimed = await db.subscriptions.update_one(
            {"id": s["id"], "status": "active"},
            {"$set": {"status": "expired", "expired_notified_at": datetime.utcnow().isoformat()}},
        )
        if not claimed.modified_count:
            continue
        expired += 1
        if s.get("customer_email") and not s.get("expired_notified_at"):
            subj, html = email_subscription_expired(s.get("customer_name") or "there", s)
            send_email(s["customer_email"], subj, html)
    return expired


async def subscription_maintenance_loop():
    """Expiry used to happen only when a customer opened their dashboard."""
    while True:
        try:
            await expire_finished_plans()
        except asyncio.CancelledError:
            raise
        except Exception as e:
            print(f"subscription maintenance failed: {e}")
        await asyncio.sleep(900)


def plan_end_date(start: datetime, meals: int) -> datetime:
    """Date of the last paid meal: the Nth weekday counting from the start date.
    Weekly (5 meals) from a Monday ends that Friday; monthly (20) ends the 4th Friday."""
    d, counted = start, 0
    while True:
        if d.weekday() < 5:
            counted += 1
            if counted >= meals:
                return d
        d += timedelta(days=1)

# ── Rate limiter for public subscription creation ──────────────────────────────
_sub_rate_store: dict = defaultdict(list)
SUB_RATE_WINDOW = 3600   # 1 hour
SUB_RATE_MAX    = 5      # max 5 attempts per hour per IP

def _check_sub_rate(request: Request):
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    cutoff = now - SUB_RATE_WINDOW
    _sub_rate_store[ip] = [t for t in _sub_rate_store[ip] if t > cutoff]
    if len(_sub_rate_store[ip]) >= SUB_RATE_MAX:
        raise HTTPException(status_code=429, detail="Too many attempts. Please wait before trying again.")
    _sub_rate_store[ip].append(now)


_quote_rate_store: dict = defaultdict(list)
QUOTE_RATE_MAX = 40      # quotes per hour per IP — enough for typing, too few to probe emails

def _check_quote_rate(request: Request):
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    cutoff = now - SUB_RATE_WINDOW
    _quote_rate_store[ip] = [t for t in _quote_rate_store[ip] if t > cutoff]
    if len(_quote_rate_store[ip]) >= QUOTE_RATE_MAX:
        raise HTTPException(status_code=429, detail="Too many attempts. Please wait before trying again.")
    _quote_rate_store[ip].append(now)


class SubscriptionQuoteRequest(BaseModel):
    plan: str
    customer_email: str = ""
    delivery_address: Address
    coupon_code: Optional[str] = None
    box_type: Optional[str] = None
    start_date: Optional[str] = None


@router.post("/quote")
async def quote(
    payload: SubscriptionQuoteRequest,
    current_user: Optional[dict] = Depends(get_optional_user),
    _: None = Depends(_check_quote_rate),
):
    """
    Price preview for the wizard: plan + delivery, with the free-delivery
    welcome applied or not. Same function create_subscription charges against.
    """
    try:
        if payload.start_date is not None:
            validate_start_date(payload.start_date)
        result = await quote_subscription(
            payload.plan, payload.customer_email, payload.delivery_address.postcode,
            current_user["sub"] if current_user else None,
            coupon_code=payload.coupon_code, box_type=payload.box_type,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return result


@router.post("", response_model=Subscription)
async def create_subscription(
    request: Request,
    payload: SubscriptionCreate,
    current_user: Optional[dict] = Depends(get_optional_user),
    _: None = Depends(_check_sub_rate),
):
    user_id = current_user["sub"] if current_user else None

    # Same payment submitted twice — return the plan that already exists
    if payload.payment_intent_id:
        existing = await db.subscriptions.find_one({"payment_intent_id": payload.payment_intent_id}, {"_id": 0})
        if existing:
            if existing.get("user_id") != user_id:
                raise HTTPException(400, "This payment has already been used")
            return Subscription(**existing)

    try:
        # The quote step already refused a bad start week before payment; today is
        # tolerated here so a payment that lands just after midnight is not rejected.
        start = validate_start_date(payload.start_date, allow_today=True)
        pricing = await quote_subscription(
            payload.plan, payload.customer_email, payload.delivery_address.postcode, user_id,
            coupon_code=payload.coupon_code, box_type=payload.box_type,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    plan = pricing["plan"]
    price = pricing["total"]

    # Verify payment with Stripe before creating the subscription — same rule as orders.
    # Never trust the client for price; an unverified subscription is a free one.
    if not payload.payment_intent_id:
        raise HTTPException(400, "Payment is required to start a subscription")
    try:
        loop = asyncio.get_event_loop()
        pi = await loop.run_in_executor(None, lambda: stripe.PaymentIntent.retrieve(payload.payment_intent_id))
    except stripe.StripeError:
        raise HTTPException(400, "Invalid payment — please try again")
    if pi.status != "succeeded":
        raise HTTPException(400, "Payment was not completed — please try again")
    from routes.payments import intent_purpose
    if intent_purpose(pi) != "subscription":
        raise HTTPException(400, "This payment can't be used for a subscription")
    if pi.amount != pricing["total_pence"]:
        raise HTTPException(400, "Payment amount does not match plan price")

    end_date_str = plan_end_date(start, PLAN_MEALS[plan]).strftime("%Y-%m-%d")

    cancellation_window = (datetime.utcnow() + timedelta(hours=48)).isoformat()

    subscription = Subscription(
        **payload.model_dump(exclude={'user_id', 'plan'}),
        plan=plan,
        price=price,
        plan_price=pricing["plan_price"],
        delivery_zone=pricing["zone"],
        delivery_fee_per_meal=pricing["delivery_fee_per_meal"],
        free_delivery_meals=pricing["free_delivery_meals"],
        charged_delivery_meals=pricing["charged_delivery_meals"],
        delivery_fee_total=pricing["delivery_fee_total"],
        coupon_discount=pricing["coupon_discount"],
        email_key=email_key(payload.customer_email),
        user_id=user_id,
        end_date=end_date_str,
        cancellation_window_expires=cancellation_window,
    )
    subscription.coupon_code = pricing["coupon_code"]
    try:
        await db.subscriptions.insert_one(subscription.model_dump())
    except DuplicateKeyError:
        existing = await db.subscriptions.find_one({"payment_intent_id": payload.payment_intent_id}, {"_id": 0})
        if existing and existing.get("user_id") == user_id:
            return Subscription(**existing)
        raise HTTPException(400, "This payment has already been used")
    if pricing["coupon"]:
        ok = await redeem_coupon(
            pricing["coupon"], scope="subscriptions", ref_id=subscription.id, user_id=user_id,
            email=payload.customer_email, customer_name=payload.customer_name,
        )
        if not ok:
            notify_admin(
                f"Coupon over-redeemed · {pricing['coupon_code']} · Dabba Wala",
                f"<p>Two customers used <b>{pricing['coupon_code']}</b> at the same moment; the cap was "
                f"exceeded by one. {payload.customer_name}'s plan was honoured at the discounted price.</p>",
            )
    subj, html = email_subscription_confirmation(subscription.model_dump(), payload.customer_name)
    send_email(payload.customer_email, subj, html)
    notify_customer(
        "sub_confirmed", payload.customer_phone,
        [first_name(payload.customer_name), plan, payload.start_date, f"{price:.2f}",
         tracking_link("subscriptions")],
        dedupe_key=f"sub_confirmed:{subscription.id}",
        sms_fallback=(
            f"Sree Svadista Prasada: your {plan} Dabba Wala subscription is confirmed. "
            f"Starts {payload.start_date}. Manage it: {tracking_link('subscriptions')}"
        ),
    )
    notify_admin(
        f"New subscription · {plan} · {payload.customer_name}",
        f"<p>{payload.customer_name} ({payload.customer_email}) started a <b>{plan}</b> "
        f"{payload.box_type} plan from {payload.start_date}.</p>"
        f"<p>Plan £{pricing['plan_price']:.2f} + delivery £{pricing['delivery_fee_total']:.2f} "
        f"({pricing['charged_delivery_meals']} × £{pricing['delivery_fee_per_meal']:.2f}, "
        f"{pricing['free_delivery_meals']} free)"
        + (f" − coupon {pricing['coupon_code']} £{pricing['coupon_discount']:.2f}" if pricing['coupon_code'] else "")
        + f" = <b>£{price:.2f}</b></p>",
    )
    return subscription


@router.get("", response_model=List[Subscription])
async def get_subscriptions(
    status: Optional[SubscriptionStatus] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    query = {}
    if current_user.get("role") != "admin":
        query["user_id"] = current_user["sub"]
    if status:
        query["status"] = status.value

    await expire_finished_plans({"user_id": query["user_id"]} if "user_id" in query else None)
    subs = await db.subscriptions.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return subs


@router.get("/{sub_id}", response_model=Subscription)
async def get_subscription(sub_id: str, current_user: dict = Depends(get_current_user)):
    doc = await db.subscriptions.find_one({"id": sub_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Subscription not found")

    if current_user.get("role") != "admin" and doc.get("user_id") != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Access denied")

    return doc


@router.get("/{sub_id}/deliveries")
async def get_sub_deliveries(sub_id: str, current_user: dict = Depends(get_current_user)):
    """Return per-day delivery statuses for a subscription's active week range."""
    sub = await db.subscriptions.find_one({"id": sub_id}, {"_id": 0})
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    if current_user.get("role") != "admin" and sub.get("user_id") != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Access denied")

    dates = plan_delivery_dates(sub)
    # Days after a plan was cancelled were never delivered
    cancelled_from = (sub.get("cancelled_at") or "")[:10] if sub.get("status") == "cancelled" else ""

    tracking = {
        t["delivery_id"]: t
        async for t in db.delivery_tracking.find({"delivery_id": {"$in": [f"{sub_id}_{dt}" for dt in dates]}}, {"_id": 0})
    }

    today_str = london_today()
    from routes.reviews import ensure_meal_day_review_stub
    result = []
    for dt in dates:
        t = tracking.get(f"{sub_id}_{dt}")
        status = (t or {}).get("status")
        if not status:
            if cancelled_from and dt > cancelled_from:
                status = "cancelled"
            else:
                status = "upcoming" if dt >= today_str else "delivered"
        result.append({
            "date": dt,
            "status": status,
            "skipped_at": (t or {}).get("skipped_at"),
            "issue_description": (t or {}).get("issue_description"),
            "makeup_date": (t or {}).get("makeup_date"),
        })
        # Any delivered past meal should have a review stub — catches days that
        # were auto-marked delivered without an admin patch.
        if status == "delivered" and sub.get("user_id"):
            menu_doc = await db.weekly_menu_days.find_one(
                {"date": dt, "box_type": sub.get("box_type", "prasada")}, {"_id": 0}
            )
            await ensure_meal_day_review_stub(sub, dt, menu_doc, notify=False)
    return result


@router.post("/{sub_id}/deliveries/{date}/skip")
async def skip_delivery(sub_id: str, date: str, current_user: dict = Depends(get_current_user)):
    """Customer marks a specific day as skipped."""
    sub = await db.subscriptions.find_one({"id": sub_id}, {"_id": 0})
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    if current_user.get("role") != "admin" and sub.get("user_id") != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        delivery_day = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date")
    if sub.get("status") != "active":
        raise HTTPException(status_code=400, detail="This plan isn't active, so there is nothing to skip.")
    if date not in plan_delivery_dates(sub):
        raise HTTPException(status_code=400, detail="That isn't one of your delivery days.")

    # Cut-off is midday UK time on the day itself
    cutoff = datetime.combine(delivery_day.date(), dtime(12, 0), tzinfo=LONDON)
    hours_until = (cutoff - datetime.now(LONDON)).total_seconds() / 3600
    if hours_until < 0:
        raise HTTPException(status_code=400, detail="Cannot skip a past delivery")

    existing = await db.delivery_tracking.find_one({"delivery_id": f"{sub_id}_{date}"}, {"_id": 0})
    if existing and existing.get("status") == "skipped":
        return {"ok": True, "short_notice": bool(existing.get("short_notice")), "already_skipped": True}
    if existing and existing.get("status") in ("out_for_delivery", "delivered"):
        raise HTTPException(status_code=400, detail="That meal is already on its way or delivered.")

    now = datetime.utcnow()
    short_notice = hours_until < 12
    await db.delivery_tracking.update_one(
        {"delivery_id": f"{sub_id}_{date}"},
        {"$set": {
            "delivery_id": f"{sub_id}_{date}",
            "sub_id": sub_id,
            "status": "skipped",
            "skipped_at": now.isoformat(),
            "short_notice": short_notice,
            "updated_at": now.isoformat(),
        }},
        upsert=True,
    )

    name = sub.get("customer_name") or "there"
    if sub.get("customer_email"):
        subj, html = email_delivery_skipped(name, date, short_notice)
        send_email(sub["customer_email"], subj, html)
    # Customer just did this themselves in the dashboard — email is enough once WhatsApp is live
    if sub.get("customer_phone") and not whatsapp_enabled():
        send_sms(
            sub["customer_phone"],
            f"Sree Svadista Prasada: your Dabba Wala on {date} is skipped. Plan resumes after that day.",
        )
    if short_notice:
        notify_admin(
            f"Short-notice skip · {name} · {date}",
            f"<p><b>{name}</b> ({sub.get('customer_email','—')}) skipped <b>{date}</b> "
            f"with less than 12 hours notice. Kitchen may have already started prep.</p>",
        )
    return {"ok": True, "short_notice": short_notice}


@router.put("/{sub_id}/status", response_model=Subscription)
async def update_subscription_status(
    sub_id: str,
    payload: SubscriptionStatusUpdate,
    current_user: dict = Depends(get_current_user),
):
    doc = await db.subscriptions.find_one({"id": sub_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Subscription not found")

    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="To change or cancel your plan, please get in touch — we're flexible and will sort it out with you.",
        )

    old_status = doc.get("status")
    new_status = payload.status.value
    if new_status == old_status:
        return doc
    if new_status not in STATUS_TRANSITIONS.get(old_status, set()):
        raise HTTPException(status_code=400, detail=f"A plan that is {old_status} can't be changed to {new_status}.")
    update = {"status": new_status}
    if new_status == "cancelled":
        update["cancelled_at"] = datetime.utcnow().isoformat()
    ops = {"$set": update}
    if new_status == "active":
        ops["$unset"] = {"cancelled_at": ""}
    await db.subscriptions.update_one({"id": sub_id}, ops)
    doc.update(update)

    if old_status != new_status and new_status == "cancelled":
        name = doc.get("customer_name") or "there"
        if doc.get("customer_email"):
            subj, html = email_subscription_cancelled(name, doc)
            send_email(doc["customer_email"], subj, html)
        notify_admin(
            f"Subscription cancelled · {name}",
            f"<p><b>{name}</b> ({doc.get('customer_email','—')}) cancelled their "
            f"<b>{doc.get('plan','')}</b> plan.</p>",
        )
    return doc
