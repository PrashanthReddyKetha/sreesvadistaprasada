"""Test harness: the real FastAPI routers against an in-memory MongoDB, with
Stripe and all outbound messaging faked. Nothing here touches a real service.

Run from backend/:  python -m pytest tests -q
"""
import asyncio
import os
import sys
import types

import pytest

os.environ.update(
    MONGO_URL="mongodb://localhost:27017", DB_NAME="ssp_test",
    JWT_SECRET="test-secret", STRIPE_SECRET_KEY="sk_test_fake",
)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mongomock_motor import AsyncMongoMockClient  # noqa: E402
import database  # noqa: E402

# Route modules bind `db` at import time, so the swap must happen first
database.db = AsyncMongoMockClient()["ssp_test"]

import stripe  # noqa: E402
from fastapi import FastAPI  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
import auth  # noqa: E402
import notifications  # noqa: E402
from routes import (  # noqa: E402
    orders, payments, pickup_slots, reviews, subscriptions, coupons as coupon_routes, loyalty, admin_dabba_wala,
    auth as auth_routes, enquiries,
)

_loop = asyncio.new_event_loop()


def run(coro):
    return _loop.run_until_complete(coro)


app = FastAPI()
for r in (orders, payments, pickup_slots, reviews, subscriptions, coupon_routes, loyalty, admin_dabba_wala, auth_routes, enquiries):
    app.include_router(r.router, prefix="/api")


class Outbox:
    def __init__(self):
        self.email, self.sms, self.admin, self.whatsapp = [], [], [], []


@pytest.fixture(autouse=True)
def fresh_state(monkeypatch):
    """Empty database, empty outbox and a clean Stripe fake for every test."""
    db = database.db
    for name in run(db.list_collection_names()):
        run(db[name].delete_many({}))
    for limiter in (payments._pi_rate_store, getattr(subscriptions, "_sub_rate_store", None),
                    getattr(subscriptions, "_quote_rate_store", None), auth_routes._rate_store,
                    enquiries._enquiry_rate_store):
        if limiter is not None:
            limiter.clear()

    box = Outbox()
    fakes = {
        "send_email": lambda to, subject, html, *a, **k: box.email.append((to, subject)),
        "send_sms": lambda to, body, *a, **k: box.sms.append((to, body)),
        "notify_admin": lambda subject, html, *a, **k: box.admin.append(subject),
        "notify_customer": lambda event, phone, *a, **k: box.whatsapp.append((event, phone)),
    }
    for mod in (orders, reviews, subscriptions, payments, notifications, pickup_slots, admin_dabba_wala, auth_routes, enquiries):
        for fn, fake in fakes.items():
            if hasattr(mod, fn):
                monkeypatch.setattr(mod, fn, fake)

    intents = {}

    def retrieve(pi_id):
        if pi_id not in intents:
            raise stripe.StripeError("No such payment_intent")
        return intents[pi_id]

    def create(**kw):
        pi_id = f"pi_{len(intents) + 1}"
        intents[pi_id] = types.SimpleNamespace(
            id=pi_id, client_secret=pi_id + "_secret", status="requires_payment_method",
            amount=kw["amount"], metadata=dict(kw.get("metadata") or {}))
        return intents[pi_id]

    monkeypatch.setattr(stripe.PaymentIntent, "retrieve", retrieve)
    monkeypatch.setattr(stripe.PaymentIntent, "create", create)
    monkeypatch.setattr(stripe, "api_key", "sk_test_fake")
    yield types.SimpleNamespace(outbox=box, intents=intents)


@pytest.fixture
def state(fresh_state):
    return fresh_state


@pytest.fixture
def db():
    return database.db


@pytest.fixture
def client():
    return TestClient(app)


def token(user_id="u1", role="customer"):
    """Auth header for an account. Tokens are checked against the database, so the account is created if missing."""
    if not run(database.db.users.find_one({"id": user_id})):
        run(database.db.users.insert_one({"id": user_id, "name": user_id, "email": f"{user_id}@example.com", "role": role}))
    return {"Authorization": "Bearer " + auth.create_access_token(user_id, role)}


@pytest.fixture
def user_headers(db):
    run(db.users.insert_one({"id": "u1", "name": "Test User", "email": "u1@example.com", "phone": "+447000000001"}))
    return token("u1")


@pytest.fixture
def admin_headers():
    return token("admin1", "admin")


MENU = [
    {"id": "dosa", "name": "Masala Dosa", "price": 6.99, "available": True},
    {"id": "curry", "name": "Chicken Curry", "price": 9.99, "available": True},
    {"id": "biryani", "name": "Chicken Dum Biryani", "price": 10.99, "available": True},
    {"id": "lassi", "name": "Mango Lassi", "price": 5.99, "available": True},
    {"id": "hidden", "name": "Hidden Dish", "price": 8.00, "available": False},
    {"id": "oats", "name": "Overnight Oats Bowl", "price": 6.00, "available": True, "preorder_only": True},
]


@pytest.fixture
def menu(db):
    run(db.menu_items.insert_many([dict(m) for m in MENU]))
    return {m["id"]: m for m in MENU}


@pytest.fixture
def pay(state, client):
    """Create a PaymentIntent through the API and mark it succeeded, like a real card payment."""
    def _pay(amount, purpose="order", status="succeeded"):
        r = client.post("/api/payments/create-intent", json={"amount": amount, "purpose": purpose})
        assert r.status_code == 200, r.text
        pi_id = r.json()["payment_intent_id"]
        state.intents[pi_id].status = status
        return pi_id
    return _pay


def basket(*pairs):
    return [{"menu_item_id": i, "quantity": q} for i, q in pairs]


def order_body(menu, pairs, pi_id, **extra):
    body = {
        "customer_name": "Test User", "customer_email": "u1@example.com", "customer_phone": "+447000000001",
        "delivery_type": "takeaway", "payment_intent_id": pi_id,
        "items": [{"menu_item_id": i, "name": menu[i]["name"], "price": menu[i]["price"], "quantity": q} for i, q in pairs],
    }
    body.update(extra)
    return body
