"""
Coupons — public lookup for the checkout panel, admin CRUD + redemption log.
Pricing itself happens in routes/orders.py and subscription_pricing.py via coupons.resolve_coupon.
"""
from datetime import datetime, timezone
import uuid
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, field_validator

from database import db
from auth import get_optional_user, require_admin
from coupons import (
    SCOPES, KINDS, DISCOUNT_TYPES, normalize_code, generate_code, status_of, describe, public_view,
)

router = APIRouter(tags=["coupons"])


# ── Public ────────────────────────────────────────────────────────────────────

@router.get("/coupons/available")
async def available(
    scope: str = Query(...),
    email: str = Query(""),
    current_user: Optional[dict] = Depends(get_optional_user),
):
    """Offers to show in the 'Apply coupon' panel: listed public codes + this customer's exclusive ones."""
    if scope not in SCOPES:
        raise HTTPException(400, "scope must be orders or subscriptions")
    from coupons import available_for
    # A typed email proves nothing, so it never unlocks someone's exclusive codes here.
    # (A guest can still enter a code they were given; it is checked at pricing.)
    if current_user:
        return await available_for(scope, current_user["sub"], current_user.get("email"))
    return await available_for(scope, None, None)


# ── Admin ─────────────────────────────────────────────────────────────────────

class CouponIn(BaseModel):
    code: Optional[str] = None                  # blank → generated
    name: str = Field(min_length=1, max_length=80)
    description: str = ""
    scope: str                                  # orders | subscriptions — never both
    kind: str = "multi"                         # single | multi
    discount_type: str                          # percent | fixed | free_delivery
    discount_value: Optional[float] = None
    max_discount: Optional[float] = None
    min_subtotal: Optional[float] = None
    starts_at: Optional[str] = None             # ISO datetime (UTC)
    expires_at: Optional[str] = None
    max_redemptions: Optional[int] = None       # multi only; None = unlimited
    per_customer_limit: Optional[int] = 1       # multi only; None = unlimited
    first_order_only: bool = False
    order_type: str = "any"                     # orders: any | delivery | takeaway
    plan: str = "any"                           # subscriptions: any | weekly | monthly
    box_type: str = "any"                       # subscriptions: any | prasada | svadista
    assigned_email: Optional[str] = None        # exclusive to one customer
    assigned_user_id: Optional[str] = None
    listed: bool = True                         # show in the checkout offers panel
    status: str = "active"                      # active | paused
    internal_note: str = ""

    @field_validator("scope")
    @classmethod
    def _scope(cls, v):
        if v not in SCOPES:
            raise ValueError("scope must be 'orders' or 'subscriptions'")
        return v

    @field_validator("kind")
    @classmethod
    def _kind(cls, v):
        if v not in KINDS:
            raise ValueError("kind must be 'single' or 'multi'")
        return v

    @field_validator("discount_type")
    @classmethod
    def _dt(cls, v):
        if v not in DISCOUNT_TYPES:
            raise ValueError("discount_type must be percent, fixed or free_delivery")
        return v

    @field_validator("order_type")
    @classmethod
    def _ot(cls, v):
        if v not in ("any", "delivery", "takeaway"):
            raise ValueError("order_type must be any, delivery or takeaway")
        return v

    @field_validator("plan")
    @classmethod
    def _plan(cls, v):
        if v not in ("any", "weekly", "monthly"):
            raise ValueError("plan must be any, weekly or monthly")
        return v

    @field_validator("box_type")
    @classmethod
    def _box(cls, v):
        if v not in ("any", "prasada", "svadista"):
            raise ValueError("box_type must be any, prasada or svadista")
        return v

    @field_validator("status")
    @classmethod
    def _status(cls, v):
        if v not in ("active", "paused"):
            raise ValueError("status must be active or paused")
        return v


def _check_rules(p: CouponIn):
    if p.discount_type == "percent":
        if not p.discount_value or not (0 < p.discount_value <= 100):
            raise HTTPException(400, "Percentage must be between 1 and 100")
    elif p.discount_type == "fixed":
        if not p.discount_value or p.discount_value <= 0:
            raise HTTPException(400, "Fixed discount must be more than £0")
    if p.starts_at and p.expires_at and p.expires_at <= p.starts_at:
        raise HTTPException(400, "Expiry must be after the start")
    if p.kind == "single":
        p.max_redemptions = 1
        p.per_customer_limit = 1
        p.listed = False   # a one-shot code in a public list would go to whoever taps first
    if p.scope == "orders":
        p.plan, p.box_type = "any", "any"
    else:
        p.order_type = "any"
    if p.assigned_email:
        p.assigned_email = p.assigned_email.strip().lower()


def _doc(p: CouponIn, admin: dict, code: str) -> dict:
    d = p.model_dump()
    d.update({
        "id": str(uuid.uuid4()),
        "code": code,
        "redemptions_count": 0,
        "total_discount_pence": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": admin.get("name") or admin.get("email") or "Admin",
    })
    return d


def _admin_view(c: dict) -> dict:
    return {**c, "state": status_of(c), "label": describe(c), "total_discount": c.get("total_discount_pence", 0) / 100}


@router.get("/admin/coupons")
async def list_coupons(_: dict = Depends(require_admin)):
    docs = await db.coupons.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [_admin_view(c) for c in docs]


@router.post("/admin/coupons")
async def create_coupon(payload: CouponIn, admin: dict = Depends(require_admin)):
    _check_rules(payload)
    code = normalize_code(payload.code) if payload.code else generate_code()
    if len(code) < 3:
        raise HTTPException(400, "Code must be at least 3 letters or numbers")
    if await db.coupons.find_one({"code": code}, {"_id": 1}):
        raise HTTPException(400, f"Code {code} already exists")
    doc = _doc(payload, admin, code)
    await db.coupons.insert_one(doc)
    doc.pop("_id", None)
    return _admin_view(doc)


class BatchIn(CouponIn):
    count: int = Field(ge=1, le=500)
    prefix: str = ""


@router.post("/admin/coupons/batch")
async def create_batch(payload: BatchIn, admin: dict = Depends(require_admin)):
    """N unique single-use codes sharing one rule set — flyers, giveaways, goodwill."""
    payload.kind = "single"
    _check_rules(payload)
    prefix = normalize_code(payload.prefix)
    batch_id = str(uuid.uuid4())
    docs, codes = [], set()
    existing = {c["code"] async for c in db.coupons.find({"code": {"$regex": f"^{prefix}"}}, {"_id": 0, "code": 1})}
    while len(docs) < payload.count:
        code = generate_code(prefix)
        if code in codes or code in existing:
            continue
        codes.add(code)
        base = CouponIn(**{k: v for k, v in payload.model_dump().items() if k not in ("count", "prefix")})
        d = _doc(base, admin, code)
        d["batch_id"] = batch_id
        docs.append(d)
    await db.coupons.insert_many(docs)
    return {"batch_id": batch_id, "codes": sorted(codes), "count": len(docs)}


@router.patch("/admin/coupons/{coupon_id}")
async def update_coupon(coupon_id: str, payload: dict, _: dict = Depends(require_admin)):
    """Edit rules, pause/resume, rename. The code itself and redemption counters can't be changed."""
    existing = await db.coupons.find_one({"id": coupon_id}, {"_id": 0})
    if not existing:
        raise HTTPException(404, "Coupon not found")
    merged = {**existing, **{k: v for k, v in payload.items() if k in CouponIn.model_fields}}
    try:
        p = CouponIn(**{k: merged.get(k) for k in CouponIn.model_fields})
    except Exception as e:
        raise HTTPException(400, str(e))
    _check_rules(p)
    data = p.model_dump()
    data.pop("code", None)
    await db.coupons.update_one({"id": coupon_id}, {"$set": {**data, "updated_at": datetime.now(timezone.utc).isoformat()}})
    doc = await db.coupons.find_one({"id": coupon_id}, {"_id": 0})
    return _admin_view(doc)


@router.delete("/admin/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str, _: dict = Depends(require_admin)):
    res = await db.coupons.delete_one({"id": coupon_id})
    if not res.deleted_count:
        raise HTTPException(404, "Coupon not found")
    return {"ok": True}


@router.get("/admin/coupons/{coupon_id}/redemptions")
async def redemptions(coupon_id: str, _: dict = Depends(require_admin)):
    rows = await db.coupon_redemptions.find({"coupon_id": coupon_id}, {"_id": 0}).sort("created_at", -1).to_list(2000)
    for r in rows:
        r["discount"] = r.get("discount_pence", 0) / 100
    return rows
