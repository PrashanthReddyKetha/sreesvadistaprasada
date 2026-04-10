from fastapi import APIRouter, HTTPException, Depends
from typing import List
from database import db
from models import UserCreate, UserLogin, UserUpdate, User, UserInDB, TokenResponse
from auth import hash_password, verify_password, create_access_token, get_current_user, require_admin

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(payload: UserCreate):
    existing = await db.users.find_one({"email": payload.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = UserInDB(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
    )
    doc = user.model_dump()
    await db.users.insert_one(doc)

    token = create_access_token(user.id, user.role.value)
    return TokenResponse(access_token=token, user=User(**user.model_dump()))


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    doc = await db.users.find_one({"email": payload.email}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = UserInDB(**doc)
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id, user.role.value)
    return TokenResponse(access_token=token, user=User(**user.model_dump()))


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
