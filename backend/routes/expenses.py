"""The owner's expense book (the separate Svadista Prasada Expenses app at expenses.sreesvadistaprasada.com).

The app keeps everything on the phone first and works offline; these routes are its copy on the server, so nothing is
lost with the phone and the profit and loss tracker can read the same records later (D-049).

Sync: every saved expense gets the next number from a counter (`seq`). The app asks for everything after the last
number it has seen, so it never misses a change and never needs the clocks to agree. Two devices editing the same
expense: the later `updatedAt` (the device's own time of the edit) wins. A delete is kept as a tombstone so other
devices learn about it.

Admin only. Receipts are stored as they arrive (photos already shrunk on the phone), up to 8 MB each.
"""
import re
from datetime import datetime
from typing import List, Literal, Optional

from bson import Binary
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, Field, field_validator
from pymongo import ReturnDocument

from auth import require_admin
from database import db

router = APIRouter(prefix="/expenses", tags=["expenses"])

CATEGORIES = ("ingredients", "packaging", "equipment", "utilities", "cleaning", "licences", "insurance", "software",
              "fees", "marketing", "transport", "phone", "professional", "other")
METHODS = ("card", "bank", "cash", "personal")
UNITS = ("kg", "g", "L", "ml", "each", "dozen", "pack", "bunch")
RECEIPT_TYPES = ("image/jpeg", "image/png", "image/webp", "application/pdf")
MAX_RECEIPT_BYTES = 8 * 1024 * 1024
ID = r"^[A-Za-z0-9_-]{8,64}$"
PAGE = 500


class Item(BaseModel):
    name: str = Field("", max_length=120)
    standard: str = Field("", max_length=80)
    qty: float = Field(1, gt=0, le=100000)
    unit: Literal[UNITS] = "each"
    pricePence: int = Field(0, ge=-10_000_000, le=10_000_000)


class ExpenseIn(BaseModel):
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    amountPence: int = Field(0, ge=0, le=100_000_000)
    category: Literal[CATEGORIES] = "other"
    method: Literal[METHODS] = "card"
    supplier: str = Field("", max_length=120)
    note: str = Field("", max_length=1000)
    items: List[Item] = Field(default_factory=list, max_length=200)
    receiptId: Optional[str] = Field(None, pattern=ID)
    receiptType: Optional[Literal[RECEIPT_TYPES]] = None
    createdAt: str = Field(..., max_length=40)
    updatedAt: str = Field(..., max_length=40)
    deleted: bool = False

    @field_validator("date")
    @classmethod
    def real_date(cls, v):
        datetime.strptime(v, "%Y-%m-%d")
        return v


class AppState(BaseModel):
    """Small things the app keeps alongside the expenses: the shopping list, the names the owner taught it, her own
    suppliers. One document; the later `updatedAt` wins."""
    shopping: list = Field(default_factory=list, max_length=300)
    names: dict = Field(default_factory=dict)
    suppliers: List[str] = Field(default_factory=list, max_length=200)
    updatedAt: str = Field(..., max_length=40)

    @field_validator("names")
    @classmethod
    def small_names(cls, v):
        if len(v) > 3000:
            raise ValueError("too many names")
        return {str(k)[:120]: str(x)[:80] for k, x in v.items()}


async def _next_seq() -> int:
    doc = await db.counters.find_one_and_update({"_id": "expenses"}, {"$inc": {"seq": 1}}, upsert=True,
                                                return_document=ReturnDocument.AFTER)
    return int(doc["seq"])


def _check_id(expense_id: str):
    if not re.match(ID, expense_id):
        raise HTTPException(status_code=400, detail="Bad expense id")


@router.get("/changes")
async def changes(after: int = 0, _: dict = Depends(require_admin)):
    """Everything saved after `after`, oldest first, a page at a time. `more` says whether to ask again."""
    rows = await db.expenses.find({"seq": {"$gt": after}}, {"_id": 0}).sort("seq", 1).to_list(PAGE + 1)
    more = len(rows) > PAGE
    rows = rows[:PAGE]
    return {"expenses": rows, "cursor": rows[-1]["seq"] if rows else after, "more": more}


@router.put("/receipts/{receipt_id}")
async def put_receipt(receipt_id: str, request: Request, _: dict = Depends(require_admin)):
    """The receipt file as the raw body. The id comes from the phone, so a retried upload is harmless."""
    _check_id(receipt_id)
    kind = (request.headers.get("content-type") or "").split(";")[0].strip().lower()
    if kind not in RECEIPT_TYPES:
        raise HTTPException(status_code=415, detail="Receipts must be JPG, PNG, WebP or PDF")
    body = await request.body()
    if not body:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(body) > MAX_RECEIPT_BYTES:
        raise HTTPException(status_code=413, detail="Receipt is over 8 MB")
    await db.expense_receipts.update_one(
        {"id": receipt_id},
        {"$set": {"id": receipt_id, "type": kind, "size": len(body), "data": Binary(body), "at": datetime.utcnow()}},
        upsert=True)
    return {"id": receipt_id, "type": kind, "size": len(body)}


@router.get("/receipts/{receipt_id}")
async def get_receipt(receipt_id: str, _: dict = Depends(require_admin)):
    _check_id(receipt_id)
    doc = await db.expense_receipts.find_one({"id": receipt_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return Response(content=bytes(doc["data"]), media_type=doc["type"], headers={"Cache-Control": "private, max-age=86400"})


@router.get("/state")
async def get_state(_: dict = Depends(require_admin)):
    doc = await db.expense_state.find_one({"_id": "state"}, {"_id": 0})
    return doc or {"shopping": [], "names": {}, "suppliers": [], "updatedAt": ""}


@router.put("/state")
async def put_state(payload: AppState, _: dict = Depends(require_admin)):
    current = await db.expense_state.find_one({"_id": "state"}, {"_id": 0})
    if current and str(current.get("updatedAt", "")) > payload.updatedAt:
        return {"applied": False, "state": current}
    doc = payload.model_dump()
    await db.expense_state.replace_one({"_id": "state"}, doc, upsert=True)
    return {"applied": True, "state": doc}


# Last, so /state and /receipts/... are matched first.
@router.put("/{expense_id}")
async def save(expense_id: str, payload: ExpenseIn, _: dict = Depends(require_admin)):
    _check_id(expense_id)
    current = await db.expenses.find_one({"id": expense_id}, {"_id": 0})
    if current and str(current.get("updatedAt", "")) > payload.updatedAt:
        return {"applied": False, "expense": current}       # a newer edit from another device stands
    doc = {**payload.model_dump(), "id": expense_id, "seq": await _next_seq(), "saved_at": datetime.utcnow()}
    if payload.deleted:
        doc["items"] = []
    await db.expenses.replace_one({"id": expense_id}, doc, upsert=True)
    if payload.deleted and current and current.get("receiptId"):
        await db.expense_receipts.delete_one({"id": current["receiptId"]})
    if current and current.get("receiptId") and current.get("receiptId") != payload.receiptId and not payload.deleted:
        await db.expense_receipts.delete_one({"id": current["receiptId"]})   # replaced or removed
    doc.pop("_id", None)
    return {"applied": True, "expense": doc}
