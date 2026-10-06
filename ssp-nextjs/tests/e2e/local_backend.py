"""The whole backend, locally, for the browser tests: the real FastAPI app on an in-memory database.

The menu, settings and an admin account are seeded by the app's own start-up code. No key for Stripe, email,
text, WhatsApp or AI is set, so nothing leaves this machine: payments cannot be made, messages are logged as
"not set up". A few helper routes (prefixed __) let the tests read and shape the data.

  python local_backend.py            -> http://127.0.0.1:8765
  Admin sign-in: owner@test.example / Test-Admin-Pass-1
"""
import os
import re
import sys
from datetime import timedelta

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "..", "backend"))
os.environ.update(
    MONGO_URL="mongodb://localhost:27017", DB_NAME="ssp_e2e", JWT_SECRET="e2e-test-secret",
    ADMIN_EMAIL="owner@test.example", ADMIN_PASSWORD="Test-Admin-Pass-1",
    SITE_URL=os.environ.get("SITE_URL", "http://localhost:3001"), PUBLIC_API_URL="http://127.0.0.1:8765",
)
for secret in ("STRIPE_SECRET_KEY", "RESEND_API_KEY", "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER",
               "TWILIO_WHATSAPP_FROM", "ANTHROPIC_API_KEY", "GOOGLE_CLIENT_ID"):
    os.environ.pop(secret, None)

from mongomock_motor import AsyncMongoMockClient  # noqa: E402
import database  # noqa: E402

database.db = AsyncMongoMockClient()["ssp_e2e"]      # before any route module binds `db`

import server  # noqa: E402
from fastapi import Request  # noqa: E402
from routes import events  # noqa: E402

app = server.app
app.state.cors = [o for o in server.ALLOWED_ORIGINS]
# the built site runs on localhost:3001, which the live settings already allow
db = database.db

# Every test visitor really comes from this machine, so each one names its own address in its browser name
_real_ip = events.client_ip


def _ip(request: Request) -> str:
    m = re.search(r"AuditIP/([\d.]+)", request.headers.get("user-agent", ""))
    return m.group(1) if m else _real_ip(request)


events.client_ip = _ip


@app.get("/__report")
async def report(days: int = 1):
    return await events.analytics(days, None)


@app.get("/__dump")
async def dump():
    docs = await db.events.find({}, {"_id": 0}).sort("at", 1).to_list(None)
    for d in docs:
        d["at"] = d["at"].isoformat()
        d.pop("day_code", None)
    return docs


@app.post("/__reset")
async def reset():
    """Empty the visit record and forget rate limits (the tests send more than one visitor ever would from one address)."""
    from routes import enquiries, auth as auth_routes
    await db.events.delete_many({})
    events._rate.store.clear()
    enquiries._enquiry_rate_store.clear()
    auth_routes._rate_store.clear()
    return {"ok": True}


@app.post("/__age")
async def age(minutes: int = 45):
    """Push every stored event back in time, to stand in for a pause."""
    n = 0
    async for d in db.events.find({}):
        await db.events.update_one({"_id": d["_id"]}, {"$set": {"at": d["at"] - timedelta(minutes=minutes)}})
        n += 1
    return {"aged": n}


@app.post("/__seed_customer")
async def seed_customer(request: Request):
    """A customer account with a password, as the sign-up flow would make (sign-up itself needs a phone code)."""
    import uuid
    from datetime import datetime
    from auth import hash_password
    body = await request.json()
    email = body["email"].strip().lower()
    await db.users.delete_many({"email": email})
    await db.users.insert_one({"id": str(uuid.uuid4()), "name": body.get("name", "Test Customer"), "email": email,
                               "phone": body.get("phone", "+447700900123"), "role": "customer",
                               "password_hash": hash_password(body["password"]), "created_at": datetime.utcnow()})
    return {"ok": True}


@app.get("/__messages")
async def messages():
    """What the site tried to send (nothing actually leaves this machine)."""
    rows = await db.message_log.find({}, {"_id": 0}).sort("at", -1).to_list(50)
    return [{**r, "at": r["at"].isoformat()} for r in rows]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8765, log_level="warning")
