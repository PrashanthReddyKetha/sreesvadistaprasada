from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List
import os
import json
import logging
import time
from collections import defaultdict
from database import db
from models import (
    UserCreate, UserLogin, UserUpdate, User, UserInDB, TokenResponse,
    GoogleAuthRequest, GoogleCompleteRequest,
    PushTokenUpdate, SavedAddress, SavedAddressCreate,
)
from auth import hash_password, verify_password, create_access_token, get_current_user, require_admin
from notifications import send_email, email_welcome, create_notification

logger = logging.getLogger(__name__)

# ── Simple in-memory rate limiter ─────────────────────────────────────────────
# Tracks failed attempts per IP. Resets after RATE_WINDOW seconds.
RATE_WINDOW   = 60   # 1 minute
RATE_MAX      = 10   # max attempts per window
_rate_store: dict = defaultdict(list)  # ip -> [timestamp, ...]

def _check_rate_limit(request: Request):
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    window_start = now - RATE_WINDOW
    _rate_store[ip] = [t for t in _rate_store[ip] if t > window_start]
    if len(_rate_store[ip]) >= RATE_MAX:
        raise HTTPException(status_code=429, detail="Too many attempts. Please wait a minute and try again.")
    _rate_store[ip].append(now)
router = APIRouter(prefix="/auth", tags=["auth"])

# ── Firebase Admin ─────────────────────────────────────────────────────────────

_firebase_app = None

def _get_firebase_app():
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app
    service_account_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
    if not service_account_json:
        return None
    try:
        import firebase_admin
        from firebase_admin import credentials
        cred = credentials.Certificate(json.loads(service_account_json))
        try:
            _firebase_app = firebase_admin.initialize_app(cred)
        except ValueError:
            _firebase_app = firebase_admin.get_app()
        return _firebase_app
    except Exception as e:
        logger.error(f"Firebase init error: {e}")
        return None


def verify_firebase_phone_token(token: str) -> str | None:
    """
    Verify a Firebase ID token from phone auth.
    Returns the verified phone number, or None in dev mode (Firebase not configured).
    Raises HTTPException if token is invalid or Firebase is missing in production.
    """
    app = _get_firebase_app()
    if not app:
        is_production = bool(os.environ.get("JWT_SECRET")) and bool(os.environ.get("STRIPE_SECRET_KEY"))
        if is_production:
            raise HTTPException(
                status_code=503,
                detail="Phone verification service is not configured. Contact support."
            )
        logger.warning("[DEV] FIREBASE_SERVICE_ACCOUNT_JSON not set — skipping phone token verification.")
        return None   # Dev mode: trust the phone number the client sent
    try:
        from firebase_admin import auth as firebase_auth
        decoded = firebase_auth.verify_id_token(token, app=app)
        phone = decoded.get("phone_number")
        if not phone:
            raise HTTPException(status_code=400, detail="Token does not contain a verified phone number.")
        return phone
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Firebase token verification error: {e}")
        raise HTTPException(status_code=401, detail="Phone verification failed. Please try again.")


# ── Register ───────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse)
async def register(request: Request, payload: UserCreate):
    _check_rate_limit(request)
    existing = await db.users.find_one({"email": payload.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    if not payload.phone:
        raise HTTPException(status_code=400, detail="Phone number is required")
    if not payload.firebase_token:
        raise HTTPException(status_code=400, detail="Phone verification is required")

    # Verify Firebase phone token
    verified_phone = verify_firebase_phone_token(payload.firebase_token)

    # In production, confirm the verified phone matches what the user claimed
    if verified_phone and verified_phone != payload.phone:
        raise HTTPException(status_code=400, detail="Phone number does not match the verified number.")

    # Check phone not already taken
    phone_exists = await db.users.find_one({"phone": payload.phone}, {"_id": 0, "id": 1})
    if phone_exists:
        raise HTTPException(status_code=400, detail="Phone number is already registered.")

    user = UserInDB(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        phone_verified=True,
        password_hash=hash_password(payload.password),
    )
    await db.users.insert_one(user.model_dump())
    subj, html = email_welcome(user.name)
    send_email(user.email, subj, html)
    await create_notification(
        user_id=user.id,
        title="Welcome to Sree Svadista Prasada",
        body=(
            "Your account is ready. "
            "Every 5 orders earns you a free dish from our entire menu — "
            "any item, no minimum order, only the delivery fee. "
            "Your journey starts with your very first order."
        ),
        notif_type="welcome",
        action_url="/dashboard?tab=loyalty",
    )
    token = create_access_token(user.id, user.role.value)
    return TokenResponse(access_token=token, user=User(**user.model_dump()))


# ── Login ──────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
async def login(request: Request, payload: UserLogin):
    _check_rate_limit(request)
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


# ── Register (mobile — no phone/Firebase required) ────────────────────────────

@router.post("/register/simple", response_model=TokenResponse)
async def register_simple(request: Request, payload: UserCreate):
    """Mobile-only registration without phone/Firebase verification."""
    mobile_key = os.environ.get("MOBILE_API_KEY", "")
    if mobile_key and request.headers.get("X-Mobile-Key") != mobile_key:
        raise HTTPException(status_code=403, detail="Not authorised")
    existing = await db.users.find_one({"email": payload.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = UserInDB(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    await db.users.insert_one(user.model_dump())
    subj, html = email_welcome(user.name)
    send_email(user.email, subj, html)
    await create_notification(
        user_id=user.id,
        title="Welcome to Sree Svadista Prasada",
        body="Your account is ready. Every 5 orders earns you a free dish from our entire menu.",
        notif_type="welcome",
        action_url="/dashboard?tab=loyalty",
    )
    token = create_access_token(user.id, user.role.value)
    return TokenResponse(access_token=token, user=User(**user.model_dump()))


# ── Google OAuth ───────────────────────────────────────────────────────────────

async def _verify_google_token(credential: str) -> dict:
    """
    Verify Google credential via userinfo endpoint (access token from implicit flow)
    or ID token verification as fallback.
    """
    import httpx
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


@router.post("/google", response_model=TokenResponse)
async def google_auth(payload: GoogleAuthRequest):
    """
    Verify Google access token and sign in or create account.
    - Existing user → return JWT.
    - New user → create account immediately (no phone gate; user adds phone at checkout).
    """
    google_payload = await _verify_google_token(payload.credential)

    google_id = google_payload["sub"]
    email     = google_payload["email"]
    name      = google_payload.get("name", email.split("@")[0])
    photo_url = google_payload.get("picture")

    doc = await db.users.find_one(
        {"$or": [{"google_id": google_id}, {"email": email}]}, {"_id": 0}
    )
    if doc:
        updates = {}
        if not doc.get("google_id"):
            updates["google_id"] = google_id
        if not doc.get("photo_url") and photo_url:
            updates["photo_url"] = photo_url
        if updates:
            await db.users.update_one({"email": email}, {"$set": updates})
            doc.update(updates)
        user = User(**doc)
        token = create_access_token(user.id, user.role.value)
        return TokenResponse(access_token=token, user=user)

    # New user — create without requiring phone upfront
    user = UserInDB(
        name=name,
        email=email,
        google_id=google_id,
        photo_url=photo_url,
        password_hash=None,
    )
    await db.users.insert_one(user.model_dump())
    subj, html = email_welcome(user.name)
    send_email(user.email, subj, html)
    await create_notification(
        user_id=user.id,
        title="Welcome to Sree Svadista Prasada",
        body=(
            "Your account is ready. "
            "Every 5 orders earns you a free dish — "
            "any item, no minimum order, only the delivery fee. "
            "Your journey starts with your very first order."
        ),
        notif_type="welcome",
        action_url="/dashboard?tab=loyalty",
    )
    token = create_access_token(user.id, user.role.value)
    return TokenResponse(access_token=token, user=User(**user.model_dump()))


@router.post("/google/complete", response_model=TokenResponse)
async def google_complete(payload: GoogleCompleteRequest):
    """
    Called after a new Google user verifies their phone via Firebase OTP.
    Creates the account and returns a JWT.
    """
    google_payload = await _verify_google_token(payload.credential)
    google_id = google_payload["sub"]
    email     = google_payload["email"]
    name      = google_payload.get("name", email.split("@")[0])

    # If already registered (race condition), just log them in
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user = User(**existing)
        token = create_access_token(user.id, user.role.value)
        return TokenResponse(access_token=token, user=user)

    # Verify Firebase phone token
    verified_phone = verify_firebase_phone_token(payload.firebase_token)
    if verified_phone and verified_phone != payload.phone:
        raise HTTPException(status_code=400, detail="Phone number does not match the verified number.")

    # Check phone not already taken
    phone_exists = await db.users.find_one({"phone": payload.phone}, {"_id": 0, "id": 1})
    if phone_exists:
        raise HTTPException(status_code=400, detail="Phone number is already registered to another account.")

    user = UserInDB(
        name=name,
        email=email,
        phone=payload.phone,
        phone_verified=True,
        google_id=google_id,
        password_hash=None,
    )
    await db.users.insert_one(user.model_dump())
    subj, html = email_welcome(user.name)
    send_email(user.email, subj, html)
    await create_notification(
        user_id=user.id,
        title="Welcome to Sree Svadista Prasada",
        body=(
            "Your account is ready. "
            "Every 5 orders earns you a free dish from our entire menu — "
            "any item, no minimum order, only the delivery fee. "
            "Your journey starts with your very first order."
        ),
        notif_type="welcome",
        action_url="/dashboard?tab=loyalty",
    )
    token = create_access_token(user.id, user.role.value)
    return TokenResponse(access_token=token, user=User(**user.model_dump()))


# ── Google OAuth (mobile — no phone required) ──────────────────────────────────

@router.post("/google/mobile")
async def google_auth_mobile(payload: GoogleAuthRequest):
    """
    Mobile-only Google Sign In. Verifies the Google access token,
    creates account from Google profile if new (no phone required).
    """
    google_payload = await _verify_google_token(payload.credential)

    google_id = google_payload.get("sub", "")
    email     = google_payload.get("email", "")
    name      = google_payload.get("name", email.split("@")[0])

    if not email:
        raise HTTPException(status_code=400, detail="Could not retrieve email from Google.")

    doc = await db.users.find_one(
        {"$or": [{"google_id": google_id}, {"email": email}]}, {"_id": 0}
    )
    if doc:
        if not doc.get("google_id"):
            await db.users.update_one({"email": email}, {"$set": {"google_id": google_id}})
        user = User(**doc)
        token = create_access_token(user.id, user.role.value)
        return TokenResponse(access_token=token, user=user)

    # New user — create without phone
    user = UserInDB(
        name=name,
        email=email,
        google_id=google_id,
        password_hash=None,
    )
    await db.users.insert_one(user.model_dump())
    subj, html = email_welcome(user.name)
    send_email(user.email, subj, html)
    await create_notification(
        user_id=user.id,
        title="Welcome to Sree Svadista Prasada",
        body="Your account is ready. Every 5 orders earns you a free dish from our entire menu.",
        notif_type="welcome",
        action_url="/dashboard?tab=loyalty",
    )
    token = create_access_token(user.id, user.role.value)
    return TokenResponse(access_token=token, user=User(**user.model_dump()))


# ── Email / Phone availability checks ─────────────────────────────────────────

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


# ── Push notifications ────────────────────────────────────────────────────────

@router.post("/push-token")
async def save_push_token(payload: PushTokenUpdate, current_user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"id": current_user["sub"]},
        {"$set": {"push_token": payload.push_token}},
    )
    return {"ok": True}


# ── Saved addresses ───────────────────────────────────────────────────────────

@router.get("/addresses", response_model=List[SavedAddress])
async def get_saved_addresses(current_user: dict = Depends(get_current_user)):
    doc = await db.users.find_one({"id": current_user["sub"]}, {"_id": 0, "saved_addresses": 1})
    return doc.get("saved_addresses", []) if doc else []


@router.post("/addresses", response_model=SavedAddress)
async def add_saved_address(payload: SavedAddressCreate, current_user: dict = Depends(get_current_user)):
    doc = await db.users.find_one({"id": current_user["sub"]}, {"_id": 0, "saved_addresses": 1})
    existing = doc.get("saved_addresses", []) if doc else []
    if len(existing) >= 5:
        raise HTTPException(status_code=400, detail="Maximum 5 saved addresses")
    addr = SavedAddress(**payload.model_dump())
    await db.users.update_one(
        {"id": current_user["sub"]},
        {"$push": {"saved_addresses": addr.model_dump()}},
    )
    return addr


@router.delete("/addresses/{address_id}")
async def delete_saved_address(address_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.users.update_one(
        {"id": current_user["sub"]},
        {"$pull": {"saved_addresses": {"id": address_id}}},
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Address not found")
    return {"ok": True}
