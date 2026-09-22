from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime
from database import db
from models import DailySpecial, DailySpecialCreate, DailySpecialUpdate
from auth import require_admin

router = APIRouter(prefix="/daily-specials", tags=["daily-specials"])


@router.get("", response_model=List[DailySpecial])
async def list_active_specials():
    docs = await db.daily_specials.find(
        {"active": True}, {"_id": 0}
    ).sort("display_order", 1).to_list(50)

    # Overlay live price + image from the linked menu item so edits always reflect.
    # Specials without menu_item_id fall back to an exact title match on the menu.
    item_ids = [d["menu_item_id"] for d in docs if d.get("menu_item_id")]
    titles = [d["title"] for d in docs if not d.get("menu_item_id") and d.get("title")]
    if item_ids or titles:
        live = await db.menu_items.find(
            {"$or": [{"id": {"$in": item_ids}}, {"name": {"$in": titles}}]},
            {"_id": 0, "id": 1, "name": 1, "price": 1, "image": 1},
        ).to_list(len(item_ids) + len(titles))
        by_id = {item["id"]: item for item in live}
        by_name = {item["name"]: item for item in live}
        for doc in docs:
            item = by_id.get(doc.get("menu_item_id")) or by_name.get(doc.get("title"))
            if not item:
                continue
            if item.get("price") is not None:
                doc["price"] = item["price"]
            if item.get("image"):
                doc["image"] = item["image"]

    return docs


@router.get("/all", response_model=List[DailySpecial])
async def list_all_specials(admin: dict = Depends(require_admin)):
    docs = await db.daily_specials.find({}, {"_id": 0}).sort("display_order", 1).to_list(100)
    return docs


@router.post("", response_model=DailySpecial)
async def create_special(payload: DailySpecialCreate, admin: dict = Depends(require_admin)):
    special = DailySpecial(**payload.model_dump())
    await db.daily_specials.insert_one(special.model_dump())
    return special


@router.put("/{special_id}", response_model=DailySpecial)
async def update_special(
    special_id: str,
    payload: DailySpecialUpdate,
    admin: dict = Depends(require_admin),
):
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None or k == "active"}
    updates["updated_at"] = datetime.utcnow()
    result = await db.daily_specials.update_one({"id": special_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Special not found")
    doc = await db.daily_specials.find_one({"id": special_id}, {"_id": 0})
    return doc


@router.delete("/{special_id}")
async def delete_special(special_id: str, admin: dict = Depends(require_admin)):
    result = await db.daily_specials.delete_one({"id": special_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Special not found")
    return {"ok": True}
