import re
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime
from database import db
from models import DailySpecial, DailySpecialCreate, DailySpecialUpdate
from auth import require_admin

router = APIRouter(prefix="/daily-specials", tags=["daily-specials"])


# Mirrors ssp-nextjs/src/lib/itemUrl.ts — the address of a dish's own page
_CATEGORY_TO_MENU = {
    "nonVeg": "svadista", "veg": "prasada", "breakfast": "breakfast", "pickles": "snacks",
    "podis": "snacks", "drinks": "drinks", "streetFood": "street-food", "ragiSpecials": "ragi-specials",
}
_DEFAULT_SUBSECTION = {
    "pickles": "pickles", "podis": "podis", "drinks": "beverages",
    "streetFood": "street-bites", "ragiSpecials": "specials",
}


def _slugify(text: str) -> str:
    text = re.sub(r"[^\w\s-]", "", text.lower()).strip()
    return re.sub(r"-+", "-", re.sub(r"[\s_]+", "-", text)).strip("-")


def _item_url(item: dict) -> str:
    category = item.get("category") or ""
    menu = _CATEGORY_TO_MENU.get(category, category)
    sub = _slugify(item["subcategory"]) if item.get("subcategory") else _DEFAULT_SUBSECTION.get(category, "general")
    return f"/{menu}/{sub}/{item.get('slug') or _slugify(item.get('name', ''))}"


def _base_name(name: str) -> str:
    """'Poori (3 pcs)' and 'Poori (2pcs)' are the same dish for matching purposes."""
    return re.sub(r"\s+", " ", re.sub(r"\(\s*\d[^)]*\)", " ", name or "")).strip().lower()


@router.get("", response_model=List[DailySpecial])
async def list_active_specials():
    """Today's specials as customers see them.

    A special is only shown if it can be ordered: it is matched to a dish that is on
    sale (by its link, then its exact title, then its title ignoring the portion size),
    and takes that dish's name, price, photo and page address. A special whose dish is
    hidden, or which matches nothing on the menu, is left out — otherwise the home page
    shows a price the checkout will not charge, or a link that goes nowhere.
    """
    docs = await db.daily_specials.find(
        {"active": True}, {"_id": 0}
    ).sort("display_order", 1).to_list(50)
    if not docs:
        return []

    menu = await db.menu_items.find(
        {}, {"_id": 0, "id": 1, "name": 1, "price": 1, "image": 1, "category": 1,
             "subcategory": 1, "slug": 1, "available": 1},
    ).to_list(1000)
    by_id = {m["id"]: m for m in menu}
    on_sale = [m for m in menu if m.get("available")]
    by_name = {m["name"]: m for m in on_sale}
    by_base: dict = {}
    for m in on_sale:
        by_base.setdefault(_base_name(m["name"]), m)

    shown = []
    for doc in docs:
        linked = by_id.get(doc.get("menu_item_id"))
        item = linked if linked and linked.get("available") else None
        if not item:
            title = (linked or {}).get("name") or doc.get("title") or ""
            item = by_name.get(title) or by_base.get(_base_name(title))
        if not item:
            continue
        doc["title"] = item["name"]
        doc["menu_item_id"] = item["id"]
        doc["link"] = _item_url(item)
        if item.get("price") is not None:
            doc["price"] = item["price"]
        if item.get("image"):
            doc["image"] = item["image"]
        shown.append(doc)
    return shown


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
