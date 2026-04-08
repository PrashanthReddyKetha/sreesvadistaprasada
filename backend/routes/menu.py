from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from database import db
from models import MenuItem, MenuItemCreate, MenuItemUpdate, MenuCategory
from auth import require_admin

router = APIRouter(prefix="/menu", tags=["menu"])


@router.get("", response_model=List[MenuItem])
async def get_menu(
    category: Optional[MenuCategory] = Query(None),
    featured: Optional[bool] = Query(None),
    available: Optional[bool] = Query(True),
    search: Optional[str] = Query(None),
):
    query = {}
    if category:
        query["category"] = category.value
    if available is not None:
        query["available"] = available
    if featured is not None:
        query["featured"] = featured
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]

    items = await db.menu_items.find(query, {"_id": 0}).to_list(500)
    return items


@router.get("/featured", response_model=List[MenuItem])
async def get_featured():
    items = await db.menu_items.find(
        {"featured": True, "available": True}, {"_id": 0}
    ).to_list(20)
    return items


@router.get("/{item_id}", response_model=MenuItem)
async def get_menu_item(item_id: str):
    doc = await db.menu_items.find_one({"id": item_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return doc


@router.post("", response_model=MenuItem)
async def create_menu_item(payload: MenuItemCreate, _: dict = Depends(require_admin)):
    item = MenuItem(**payload.model_dump())
    await db.menu_items.insert_one(item.model_dump())
    return item


@router.put("/{item_id}", response_model=MenuItem)
async def update_menu_item(item_id: str, payload: MenuItemUpdate, _: dict = Depends(require_admin)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db.menu_items.update_one({"id": item_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")

    doc = await db.menu_items.find_one({"id": item_id}, {"_id": 0})
    return doc


@router.delete("/{item_id}")
async def delete_menu_item(item_id: str, _: dict = Depends(require_admin)):
    result = await db.menu_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return {"message": "Menu item deleted"}
