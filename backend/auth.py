from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import time

SECRET_KEY = os.environ.get("JWT_SECRET")
if not SECRET_KEY:
    import sys
    # In production, refuse to start without a secret.
    # In local dev (no env var set), use a warning fallback so dev still works.
    if os.environ.get("ENVIRONMENT") == "production":
        print("FATAL: JWT_SECRET environment variable is required in production.", file=sys.stderr)
        sys.exit(1)
    SECRET_KEY = "svadista-dev-only-secret-DO-NOT-USE-IN-PRODUCTION"
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: str, role: str) -> str:
    # Real epoch seconds — a naive utcnow().timestamp() is shifted by the server's UTC offset
    issued = int(time.time())
    payload = {
        "sub": user_id,
        "role": role,
        "iat": issued,
        "exp": issued + TOKEN_EXPIRE_HOURS * 3600,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def _authenticate(token: str) -> dict:
    """
    A token is only as good as the account behind it: the account must still
    exist, the role comes from the database (so a demotion takes effect at once),
    and a token issued before the last password change is refused.
    """
    from database import db
    payload = decode_token(token)
    user = await db.users.find_one(
        {"id": payload.get("sub")},
        {"_id": 0, "id": 1, "role": 1, "name": 1, "email": 1, "password_changed_at": 1},
    )
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    changed = user.get("password_changed_at")
    if changed and int(payload.get("iat") or 0) < int(changed):
        raise HTTPException(status_code=401, detail="Please sign in again")
    return {
        "sub": user["id"],
        "id": user["id"],
        "role": user.get("role") or "customer",
        "name": user.get("name"),
        "email": user.get("email"),
    }


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return await _authenticate(credentials.credentials)


async def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict | None:
    if not credentials:
        return None
    try:
        return await _authenticate(credentials.credentials)
    except HTTPException:
        return None


async def require_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = await _authenticate(credentials.credentials)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
