"""One book of every sale, whichever way it came in: the website (orders and Dabba plans, read live from their own
collections), WhatsApp (typed in by the owner) and Deliveroo (uploaded from the Partner Hub export; the listing has no
API connection, so there is no live feed).

Every row comes back in the same shape, money in pence:
  gross    food at full price
  discount everything taken off the food (coupons, offers, loyalty, collection discount)
  net      gross - discount: the sale
  charges  delivery and small-order fees the customer paid on top
  paid     net + charges: what the customer paid
  fees     what a platform kept (Deliveroo commission and its VAT)
  payout   paid - fees: what reaches the business

Cancelled and refunded sales stay in the list but are left out of the totals. Admin only.
"""
import csv
import io
import uuid
from datetime import datetime, timezone
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, model_validator
from pymongo.errors import DuplicateKeyError

from auth import require_admin
from database import db

router = APIRouter(prefix="/sales", tags=["sales"])

CHANNELS = ("whatsapp", "deliveroo", "phone", "walk_in", "other")
FULFILMENT = ("collection", "delivery")
METHODS = ("cash", "bank", "card", "deliveroo", "unpaid")
STATUSES = ("completed", "cancelled", "refunded")
MONEY = Field(0, ge=0, le=10_000_000)
MAX_ROWS = 5000


class Item(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    qty: float = Field(1, gt=0, le=1000)
    price: int = Field(0, ge=0, le=1_000_000)          # pence each, at full price


class SaleIn(BaseModel):
    channel: Literal[CHANNELS] = "whatsapp"
    ref: str = Field("", max_length=60)                  # Deliveroo order number, or the owner's own reference
    at: datetime
    customer_name: str = Field("", max_length=120)
    customer_phone: str = Field("", max_length=40)
    customer_email: str = Field("", max_length=160)
    address: str = Field("", max_length=300)
    fulfilment: Literal[FULFILMENT] = "collection"
    items: List[Item] = Field(default_factory=list, max_length=100)
    items_text: str = Field("", max_length=1000)         # when a platform export only gives the items as one line
    gross: int = MONEY                                   # used only when there are no items to add up
    discount: int = MONEY
    charges: int = MONEY
    fees: int = MONEY
    payment_method: Literal[METHODS] = "cash"
    status: Literal[STATUSES] = "completed"
    notes: str = Field("", max_length=1000)

    @model_validator(mode="after")
    def add_up(self):
        if self.at.tzinfo:
            self.at = self.at.astimezone(timezone.utc).replace(tzinfo=None)
        if self.items:
            self.gross = round(sum(i.qty * i.price for i in self.items))
        if self.discount > self.gross:
            raise ValueError("The discount is more than the food total")
        return self


class ImportIn(BaseModel):
    channel: Literal[CHANNELS] = "deliveroo"
    rows: List[SaleIn] = Field(..., min_length=1, max_length=2000)


def _figures(gross: int, discount: int, charges: int, fees: int) -> dict:
    net = gross - discount
    paid = net + charges
    return {"gross": gross, "discount": discount, "net": net, "charges": charges, "paid": paid, "fees": fees,
            "payout": paid - fees}


def _pence(x) -> int:
    return round(float(x or 0) * 100)


def _when(v) -> Optional[datetime]:
    if isinstance(v, datetime):
        return v
    try:
        return datetime.fromisoformat(str(v).replace("Z", "+00:00")).replace(tzinfo=None)
    except ValueError:
        return None


def _address(a) -> str:
    if not isinstance(a, dict):
        return ""
    return ", ".join(str(a[k]) for k in ("line1", "line2", "street", "city", "postcode") if a.get(k))


def _from_order(o: dict) -> dict:
    gross = _pence(o.get("subtotal"))
    charges = _pence(o.get("delivery_fee")) + _pence(o.get("small_order_fee"))
    # Worked back from what was charged, so a free-delivery coupon (which zeroes the delivery fee) is not counted twice
    discount = max(0, min(gross, gross + charges - _pence(o.get("total"))))
    status = "refunded" if o.get("payment_status") == "refunded" else "cancelled" if o.get("status") == "cancelled" else \
        "completed" if o.get("status") == "delivered" else "open"
    return {
        "id": f"order:{o['id']}", "channel": "website", "kind": "order", "editable": False,
        "ref": o.get("order_number") or o["id"][:8].upper(), "at": _when(o.get("created_at")),
        "customer_name": o.get("customer_name") or "", "customer_phone": o.get("customer_phone") or "",
        "customer_email": o.get("customer_email") or "", "address": _address(o.get("delivery_address")),
        "fulfilment": "collection" if o.get("delivery_type") == "takeaway" else "delivery",
        "items": [{"name": i.get("name", ""), "qty": i.get("quantity", 1), "price": _pence(i.get("price"))} for i in o.get("items") or []],
        "items_text": "", "payment_method": "card", "status": status, "order_status": o.get("status"),
        "coupon_code": o.get("coupon_code") or "", "notes": o.get("notes") or "",
        **_figures(gross, discount, charges, 0),
    }


def _from_plan(s: dict) -> dict:
    charges = _pence(s.get("delivery_fee_total"))
    paid = _pence(s.get("price"))
    gross = _pence(s.get("plan_price")) if s.get("plan_price") is not None else paid - charges + _pence(s.get("coupon_discount"))
    discount = max(0, min(gross, gross + charges - paid))
    return {
        "id": f"plan:{s['id']}", "channel": "website", "kind": "dabba", "editable": False,
        "ref": "DW-" + s["id"][:6].upper(), "at": _when(s.get("created_at")),
        "customer_name": s.get("customer_name") or "", "customer_phone": s.get("customer_phone") or "",
        "customer_email": s.get("customer_email") or "", "address": _address(s.get("delivery_address")),
        "fulfilment": "delivery",
        "items": [{"name": f"Dabba Wala {s.get('plan', '')} plan · {s.get('box_type', '')}".strip(), "qty": 1, "price": gross}],
        "items_text": "", "payment_method": "card",
        "status": "cancelled" if s.get("status") == "cancelled" else "completed", "order_status": s.get("status"),
        "coupon_code": s.get("coupon_code") or "", "notes": s.get("custom_request") or "",
        **_figures(gross, discount, charges, 0),
    }


def _from_entry(e: dict) -> dict:
    return {**e, "kind": "entry", "editable": True,
            **_figures(e.get("gross", 0), e.get("discount", 0), e.get("charges", 0), e.get("fees", 0))}


def _entry_doc(p: SaleIn, sale_id: str) -> dict:
    doc = p.model_dump()
    doc.update({"id": sale_id, "ref": p.ref.strip(), "key": f"{p.channel}:{p.ref.strip()}" if p.ref.strip() else None,
                "updated_at": datetime.utcnow()})
    if doc["key"] is None:
        doc.pop("key")
    return doc


async def _rows(start: Optional[datetime], end: Optional[datetime], channel: str) -> list:
    when = {k: v for k, v in (("$gte", start), ("$lt", end)) if v}
    rows = []
    if channel in ("all", "website"):
        rows += [_from_order(o) for o in await db.orders.find({"created_at": when} if when else {}, {"_id": 0}).to_list(MAX_ROWS)]
        plans = await db.subscriptions.find({"payment_intent_id": {"$nin": [None, ""]}, **({"created_at": when} if when else {})},
                                            {"_id": 0}).to_list(MAX_ROWS)
        rows += [_from_plan(s) for s in plans]
    if channel != "website":
        q = {"at": when} if when else {}
        if channel != "all":
            q["channel"] = channel
        rows += [_from_entry(e) for e in await db.sales.find(q, {"_id": 0}).to_list(MAX_ROWS)]
    rows.sort(key=lambda r: r["at"] or datetime.min, reverse=True)
    return rows


def _totals(rows: list) -> dict:
    keys = ("gross", "discount", "net", "charges", "paid", "fees", "payout")
    counted = [r for r in rows if r["status"] not in ("cancelled", "refunded")]
    out = {"orders": len(counted), **{k: sum(r[k] for r in counted) for k in keys}}
    out["by_channel"] = {}
    for r in counted:
        c = out["by_channel"].setdefault(r["channel"], {"orders": 0, **{k: 0 for k in keys}})
        c["orders"] += 1
        for k in keys:
            c[k] += r[k]
    return out


def _range(start: Optional[str], end: Optional[str]):
    try:
        return (datetime.fromisoformat(start.replace("Z", "+00:00")).replace(tzinfo=None) if start else None,
                datetime.fromisoformat(end.replace("Z", "+00:00")).replace(tzinfo=None) if end else None)
    except ValueError:
        raise HTTPException(status_code=400, detail="Dates must be ISO, e.g. 2026-11-01T00:00:00Z")


@router.get("")
async def list_sales(start: Optional[str] = None, end: Optional[str] = None,
                     channel: Literal[("all", "website") + CHANNELS] = "all", _: dict = Depends(require_admin)):
    """`start` and `end` are instants (the screen turns the owner's London days into them); `end` is exclusive."""
    s, e = _range(start, end)
    rows = await _rows(s, e, channel)
    return {"sales": rows, "totals": _totals(rows)}


@router.get("/export.csv")
async def export_csv(start: Optional[str] = None, end: Optional[str] = None,
                     channel: Literal[("all", "website") + CHANNELS] = "all", _: dict = Depends(require_admin)):
    s, e = _range(start, end)
    rows = await _rows(s, e, channel)
    buf = io.StringIO()
    w = csv.writer(buf)
    money = ("gross", "discount", "net", "charges", "paid", "fees", "payout")
    w.writerow(["Date", "Channel", "Reference", "Status", "Customer", "Phone", "Email", "Address", "Collection/Delivery",
                "Items", "Gross £", "Discount £", "Net sale £", "Delivery & fees £", "Customer paid £", "Platform fees £",
                "Payout £", "Payment", "Coupon", "Notes"])
    for r in rows:
        items = "; ".join(f"{i['qty']:g} x {i['name']}" for i in r.get("items") or []) or r.get("items_text", "")
        w.writerow([r["at"].strftime("%Y-%m-%d %H:%M") if r["at"] else "", r["channel"], r["ref"], r["status"],
                    *[_safe(r.get(k, "")) for k in ("customer_name", "customer_phone", "customer_email", "address")],
                    r["fulfilment"], _safe(items), *[f"{r[k] / 100:.2f}" for k in money], r["payment_method"],
                    _safe(r.get("coupon_code", "")), _safe(r.get("notes", ""))])
    name = f"sales-{(s or datetime.utcnow()).strftime('%Y-%m-%d')}.csv"
    return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv",
                             headers={"Content-Disposition": f'attachment; filename="{name}"'})


def _safe(v) -> str:
    """A cell starting with = + - @ would run as a formula when the file is opened in a spreadsheet."""
    v = str(v or "")
    return "'" + v if v[:1] in ("=", "+", "-", "@") else v


@router.post("")
async def add_sale(payload: SaleIn, _: dict = Depends(require_admin)):
    doc = {**_entry_doc(payload, str(uuid.uuid4())), "created_at": datetime.utcnow()}
    try:
        await db.sales.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail=f"{payload.channel} order {payload.ref} is already in the book")
    doc.pop("_id", None)
    return _from_entry(doc)


@router.post("/import")
async def import_sales(payload: ImportIn, _: dict = Depends(require_admin)):
    """Rows from a platform export. A row whose order number is already in the book replaces it, so uploading the
    same export twice (or a later one that overlaps) never counts a sale twice."""
    added = updated = 0
    for row in payload.rows:
        row.channel = payload.channel
        if not row.ref.strip():
            raise HTTPException(status_code=400, detail="Every imported row needs its order number")
        key = f"{row.channel}:{row.ref.strip()}"
        current = await db.sales.find_one({"key": key}, {"_id": 0, "id": 1, "created_at": 1})
        doc = _entry_doc(row, current["id"] if current else str(uuid.uuid4()))
        doc["created_at"] = current["created_at"] if current else datetime.utcnow()
        doc["imported"] = True
        await db.sales.replace_one({"key": key}, doc, upsert=True)
        updated += bool(current)
        added += not current
    return {"added": added, "updated": updated}


@router.put("/{sale_id}")
async def edit_sale(sale_id: str, payload: SaleIn, _: dict = Depends(require_admin)):
    current = await db.sales.find_one({"id": sale_id}, {"_id": 0, "created_at": 1})
    if not current:
        raise HTTPException(status_code=404, detail="Sale not found (website sales are changed from Orders)")
    doc = {**_entry_doc(payload, sale_id), "created_at": current.get("created_at")}
    try:
        await db.sales.replace_one({"id": sale_id}, doc)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail=f"{payload.channel} order {payload.ref} is already in the book")
    return _from_entry(doc)


@router.delete("/{sale_id}")
async def delete_sale(sale_id: str, _: dict = Depends(require_admin)):
    r = await db.sales.delete_one({"id": sale_id})
    if not r.deleted_count:
        raise HTTPException(status_code=404, detail="Sale not found")
    return {"ok": True}
