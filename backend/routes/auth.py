from fastapi import APIRouter, HTTPException, Depends
from typing import List
import random
import os
import logging
from datetime import datetime, timedelta
from database import db
from models import (
    UserCreate, UserLogin, UserUpdate, User, UserInDB, TokenResponse,
    OTPRecord, GoogleAuthRequest, GoogleCompleteRequest,
)
from auth import hash_password, verify_password, create_access_token, get_current_user, require_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])

OTP_EXPIRY_MINUTES = 5
MAX_OTP_ATTEMPTS = 3


# ── SMS helper ─────────────────────────────────────────────────────────────────

def send_sms_otp(phone: str, otp: str) -> bool:
    """Send OTP via Twilio. Returns True on success, False if not configured."""
    sid   = os.environ.get("TWILIO_ACCOUNT_SID")
    token = os.environ.get("TWILIO_AUTH_TOKEN")
    from_ = os.environ.get("TWILIO_PHONE_NUMBER")
    if not all([sid, token, from_]):
        logger.warning(f"[DEV] OTP for {phone}: {otp}  (Twilio not configured)")
        return True   # treat as success in dev
    try:
        from twilio.rest import Client
        Client(sid, token).messages.create(
            body=f"Your Sree Svadista Prasada verification code is: {otp}. Valid for {OTP_EXPIRY_MINUTES} minutes.",
            from_=from_,
            to=phone,
        )
        return True
    except Exception as e:
        logger.error(f"Twilio error: {e}")
        return False


# ── OTP endpoints ──────────────────────────────────────────────────────────────

@router.post("/send-otp")
async def send_otp(phone: str):
    """Generate and send a 6-digit OTP to the given phone number."""
    # Rate-limit: max 3 OTPs per phone in the last 5 minutes
    recent = await db.otp_records.count_documents({
        "phone": phone,
        "created_at": {"$gte": datetime.utcnow() - timedelta(minutes=5)},
    })
    if recent >= 3:
        raise HTTPException(status_code=429, detail="Too many OTP requests. Please wait a few minutes.")

    otp = str(random.randint(100000, 999999))
    record = OTPRecord(
        phone=phone,
        otp=otp,
        expires_at=datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES),
    )
    await db.otp_records.insert_one(record.model_dump())

    if not send_sms_otp(phone, otp):
        raise HTTPException(status_code=500, detail="Failed to send OTP. Please try again.")

    return {"message": "OTP sent successfully"}


@router.post("/verify-otp")
async def verify_otp_endpoint(phone: str, otp: str):
    """Verify OTP without registering (used for phone-only check)."""
    record = await db.otp_records.find_one(
        {"phone": phone, "expires_at": {"$gt": datetime.utcnow()}},
        sort=[("created_at", -1)],
    )
    if not record:
        raise HTTPException(status_code=400, detail="OTP expired or not found. Please request a new one.")
    if record["attempts"] >= MAX_OTP_ATTEMPTS:
        raise HTTPException(status_code=400, detail="Too many wrong attempts. Please request a new OTP.")
    if record["otp"] != otp:
        await db.otp_records.update_one({"_id": record["_id"]}, {"$inc": {"attempts": 1}})
        remaining = MAX_OTP_ATTEMPTS - record["attempts"] - 1
        raise HTTPException(status_code=400, detail=f"Incorrect OTP. {remaining} attempt(s) remaining.")

    # Delete used OTP
    await db.otp_records.delete_one({"_id": record["_id"]})
    return {"verified": True}


# ── Register (with OTP verification) ──────────────────────────────────────────

@router.post("/register", response_model=TokenResponse)
async def register(payload: UserCreate, otp: str):
    existing = await db.users.find_one({"email": payload.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Verify OTP before creating account
    if not payload.phone:
        raise HTTPException(status_code=400, detail="Phone number is required")

    record = await db.otp_records.find_one(
        {"phone": payload.phone, "expires_at": {"$gt": datetime.utcnow()}},
        sort=[("created_at", -1)],
    )
    if not record:
        raise HTTPException(status_code=400, detail="OTP expired or not found. Please request a new one.")
    if record["attempts"] >= MAX_OTP_ATTEMPTS:
        raise HTTPException(status_code=400, detail="Too many wrong attempts. Request a new OTP.")
    if record["otp"] != otp:
        await db.otp_records.update_one({"_id": record["_id"]}, {"$inc": {"attempts": 1}})
        raise HTTPException(status_code=400, detail="Incorrect OTP.")

    await db.otp_records.delete_one({"_id": record["_id"]})

    user = UserInDB(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        phone_verified=True,
        password_hash=hash_password(payload.password),
    )
    await db.users.insert_one(user.model_dump())
    token = create_access_token(user.id, user.role.value)
    return TokenResponse(access_token=token, user=User(**user.model_dump()))


# ── Login ──────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    doc = await db.users.find_one({"email": payload.email}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = UserInDB(**doc)
    if not user.password_hash:
        raise HTTPException(status_code=401, detail="This account uses Google sign-in. Please use 'Continue with Google'.")
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id, user.role.value)
    return TokenResponse(access_token=token, user=User(**user.model_dump()))


# ── Google OAuth ───────────────────────────────────────────────────────────────

async def _verify_google_token(credential: str) -> dict:
    """
    Verify Google credential. Supports both:
    - Access token: fetch userinfo from Google API
    - ID token: verify locally (requires GOOGLE_CLIENT_ID)
    Returns dict with at least: sub, email, name
    """
    import httpx
    # Try userinfo endpoint first (works with access token from implicit flow)
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {credential}"},
                timeout=10,
            )
            if r.status_code == 200:
                return r.json()
    except Exception:
        pass

    # Fall back to ID token verification
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    if not client_id:
        raise HTTPException(status_code=500, detail="Google sign-in is not configured.")
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        return id_token.verify_oauth2_token(credential, google_requests.Request(), client_id)
    except Exception as e:
        logger.error(f"Google token error: {e}")
        raise HTTPException(status_code=401, detail="Invalid Google credentials.")


@router.post("/google")
async def google_auth(payload: GoogleAuthRequest):
    """
    Verify Google ID token.
    - Existing user → return JWT (log in).
    - New user → return needs_phone=True so frontend collects phone + OTP.
    """
    google_payload = await _verify_google_token(payload.credential)

    google_id = google_payload["sub"]
    email     = google_payload["email"]
    name      = google_payload.get("name", email.split("@")[0])

    # Check if user exists (by google_id or email)
    doc = await db.users.find_one(
        {"$or": [{"google_id": google_id}, {"email": email}]}, {"_id": 0}
    )
    if doc:
        # Link google_id if not already linked
        if not doc.get("google_id"):
            await db.users.update_one({"email": email}, {"$set": {"google_id": google_id}})
            doc["google_id"] = google_id
        user = User(**doc)
        token = create_access_token(user.id, user.role.value)
        return TokenResponse(access_token=token, user=user)

    # New user — need phone verification before creating account
    return {
        "needs_phone": True,
        "google_name": name,
        "google_email": email,
    }


@router.post("/google/complete", response_model=TokenResponse)
async def google_complete(payload: GoogleCompleteRequest):
    """
    Called after a new Google user verifies their phone via OTP.
    Creates the account and returns a JWT.
    """
    google_payload = await _verify_google_token(payload.credential)
    google_id = google_payload["sub"]
    email     = google_payload["email"]
    name      = google_payload.get("name", email.split("@")[0])

    # Check not already registered
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user = User(**existing)
        token = create_access_token(user.id, user.role.value)
        return TokenResponse(access_token=token, user=user)

    # Verify OTP
    record = await db.otp_records.find_one(
        {"phone": payload.phone, "expires_at": {"$gt": datetime.utcnow()}},
        sort=[("created_at", -1)],
    )
    if not record:
        raise HTTPException(status_code=400, detail="OTP expired or not found. Please request a new one.")
    if record["attempts"] >= MAX_OTP_ATTEMPTS:
        raise HTTPException(status_code=400, detail="Too many wrong attempts. Request a new OTP.")
    if record["otp"] != payload.otp:
        await db.otp_records.update_one({"_id": record["_id"]}, {"$inc": {"attempts": 1}})
        raise HTTPException(status_code=400, detail="Incorrect OTP.")

    await db.otp_records.delete_one({"_id": record["_id"]})

    user = UserInDB(
        name=name,
        email=email,
        phone=payload.phone,
        phone_verified=True,
        google_id=google_id,
        password_hash=None,
    )
    await db.users.insert_one(user.model_dump())
    token = create_access_token(user.id, user.role.value)
    return TokenResponse(access_token=token, user=User(**user.model_dump()))


# ── Email / Phone availability checks ────────────────────────────────────────

@router.get("/check-email")
async def check_email(email: str):
    doc = await db.users.find_one({"email": email.lower().strip()}, {"_id": 0, "google_id": 1, "password_hash": 1})
    if not doc:
        return {"exists": False}
    return {
        "exists": True,
        "has_password": bool(doc.get("password_hash")),
        "has_google": bool(doc.get("google_id")),
    }

@router.get("/check-phone")
async def check_phone(phone: str):
    doc = await db.users.find_one({"phone": phone.strip()}, {"_id": 0, "id": 1})
    return {"exists": bool(doc)}


# ── Me / Users ─────────────────────────────────────────────────────────────────

@router.get("/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    doc = await db.users.find_one({"id": current_user["sub"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**doc)


@router.get("/users", response_model=List[User])
async def get_all_users(_: dict = Depends(require_admin)):
    docs = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(1000)
    return docs


@router.put("/me", response_model=User)
async def update_me(payload: UserUpdate, current_user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    await db.users.update_one({"id": current_user["sub"]}, {"$set": updates})
    doc = await db.users.find_one({"id": current_user["sub"]}, {"_id": 0})
    return User(**doc)
