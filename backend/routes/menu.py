from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from datetime import datetime
import os, json
from database import db
from models import MenuItem, MenuItemCreate, MenuItemUpdate, MenuCategory, Review, ReviewCreate
from auth import require_admin, get_current_user, get_optional_user

router = APIRouter(prefix="/menu", tags=["menu"])


@router.get("", response_model=List[MenuItem])
async def get_menu(
    category: Optional[MenuCategory] = Query(None),
    featured: Optional[bool] = Query(None),
    available: Optional[bool] = Query(None),
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


# ── AI Enhance ───────────────────────────────────────────────────────────────

@router.post("/ai/enhance", dependencies=[Depends(require_admin)])
async def ai_enhance_item(payload: dict):
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="AI features not configured. Set ANTHROPIC_API_KEY in Render environment.")

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)

        name     = payload.get("name", "")
        category = payload.get("category", "")
        is_veg   = payload.get("is_veg", True)
        spice    = payload.get("spice_level", 0)

        prompt = f"""You are helping manage "Sree Svadista Prasada", an authentic South Indian restaurant in the UK.

Generate content for this menu item:
- Name: {name}
- Category: {category} ({'Vegetarian' if is_veg else 'Non-Vegetarian'})
- Spice Level: {spice}/5

Return ONLY valid JSON with exactly these keys:
{{
  "description": "2-3 sentence authentic, appetizing description that highlights origin, cooking method and taste",
  "allergens": ["list only applicable ones from: gluten, dairy, eggs, nuts, sesame, mustard, soy, celery"],
  "tag": "short marketing label e.g. Chef's Special, Best Seller, Village Recipe, New (pick most fitting or empty string)",
  "faqs": [
    {{"q": "customer question specific to this dish", "a": "helpful answer"}},
    {{"q": "another relevant question", "a": "helpful answer"}},
    {{"q": "third question about ingredients/preparation", "a": "helpful answer"}}
  ]
}}"""

        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=800,
            messages=[{"role": "user", "content": prompt}]
        )
        raw = message.content[0].text.strip()
        # Strip markdown fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        result = json.loads(raw.strip())
        return result
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned invalid response. Try again.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")


# ── Reviews ───────────────────────────────────────────────────────────────────

@router.get("/{item_id}/reviews")
async def get_reviews(item_id: str):
    reviews = await db.reviews.find({"menu_item_id": item_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return reviews


@router.post("/{item_id}/reviews", response_model=Review)
async def add_review(item_id: str, payload: ReviewCreate, current_user: dict = Depends(get_current_user)):
    item = await db.menu_items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    existing = await db.reviews.find_one({"menu_item_id": item_id, "user_id": current_user["sub"]})
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this item")
    user_doc = await db.users.find_one({"id": current_user["sub"]}, {"name": 1})
    user_name = user_doc["name"] if user_doc else "Customer"
    review = Review(
        menu_item_id=item_id,
        user_id=current_user["sub"],
        user_name=user_name,
        rating=payload.rating,
        comment=payload.comment,
    )
    await db.reviews.insert_one(review.model_dump())
    return review


# ── Likes & Social ────────────────────────────────────────────────────────────

@router.post("/{item_id}/like")
async def toggle_like(item_id: str, current_user: dict = Depends(get_current_user)):
    existing = await db.menu_likes.find_one({"menu_item_id": item_id, "user_id": current_user["sub"]})
    if existing:
        await db.menu_likes.delete_one({"menu_item_id": item_id, "user_id": current_user["sub"]})
        return {"liked": False}
    await db.menu_likes.insert_one({
        "menu_item_id": item_id,
        "user_id": current_user["sub"],
        "created_at": datetime.utcnow().isoformat(),
    })
    return {"liked": True}


@router.get("/{item_id}/social")
async def get_item_social(item_id: str, current_user: Optional[dict] = Depends(get_optional_user)):
    likes = await db.menu_likes.count_documents({"menu_item_id": item_id})
    # Count how many orders contain this item
    order_count = await db.orders.count_documents({"items.menu_item_id": item_id})
    user_liked = False
    user_reviewed = False
    if current_user:
        user_liked = bool(await db.menu_likes.find_one({"menu_item_id": item_id, "user_id": current_user["sub"]}))
        user_reviewed = bool(await db.reviews.find_one({"menu_item_id": item_id, "user_id": current_user["sub"]}))
    return {
        "likes": likes,
        "order_count": order_count,
        "user_liked": user_liked,
        "user_reviewed": user_reviewed,
    }
