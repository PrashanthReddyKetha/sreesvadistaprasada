from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from datetime import datetime
from database import db
from models import Order, OrderCreate, OrderStatusUpdate, OrderStatus
from auth import get_current_user, get_optional_user, require_admin

router = APIRouter(prefix="/orders", tags=["orders"])

# Delivery fee logic
def calculate_delivery(postcode: str, subtotal: float):
    prefix = postcode.upper().replace(" ", "")
    if prefix.startswith("MK") or prefix.startswith("EH") or (
        prefix[0] == "G" and len(prefix) > 1 and prefix[1].isdigit()
    ):
        fee = 0.0 if subtotal >= 30 else 3.99
    else:
        fee = 0.0 if subtotal >= 25 else 4.99
    return round(fee, 2)


@router.post("", response_model=Order)
async def create_order(payload: OrderCreate, current_user: Optional[dict] = Depends(get_optional_user)):
    subtotal = round(sum(item.price * item.quantity for item in payload.items), 2)
    delivery_fee = calculate_delivery(payload.delivery_address.postcode, subtotal)
    total = round(subtotal + delivery_fee, 2)

    user_id = current_user["sub"] if current_user else payload.user_id

    order = Order(
        **payload.model_dump(exclude={'user_id'}),
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        total=total,
        user_id=user_id,
    )
    await db.orders.insert_one(order.model_dump())
    return order


@router.get("", response_model=List[Order])
async def get_orders(
    status: Optional[OrderStatus] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    query = {}
    if current_user.get("role") != "admin":
        query["user_id"] = current_user["sub"]
    if status:
        query["status"] = status.value

    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return orders


@router.get("/{order_id}", response_model=Order)
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")

    if current_user.get("role") != "admin" and doc.get("user_id") != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Access denied")

    return doc


@router.put("/{order_id}/status", response_model=Order)
async def update_order_status(
    order_id: str,
    payload: OrderStatusUpdate,
    _: dict = Depends(require_admin),
):
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": payload.status.value, "updated_at": datetime.utcnow().isoformat()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")

    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if doc and payload.status.value == "delivered":
        from routes.reviews import ensure_order_review_stub
        await ensure_order_review_stub(doc)
    return doc


@router.delete("/{order_id}")
async def cancel_order(order_id: str, current_user: dict = Depends(get_current_user)):
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")

    if current_user.get("role") != "admin" and doc.get("user_id") != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Access denied")

    if doc["status"] not in ("pending", "confirmed"):
        raise HTTPException(status_code=400, detail="Order cannot be cancelled at this stage")

    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": OrderStatus.cancelled.value, "updated_at": datetime.utcnow().isoformat()}},
    )
    return {"message": "Order cancelled"}
