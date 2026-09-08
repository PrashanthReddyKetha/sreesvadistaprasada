"""Idempotent menu additions — run at startup from server lifespan.

Adds the chicken-curry breakfast combos and the Veg Thali, and renames the
veg "Rice Bowls" subcategory to "Thalis & Rice Bowls". Safe to run on every
boot: items are matched by name and only inserted when missing; the rename
only touches docs still carrying the old subcategory.

Images are placeholders reused from related dishes — swap them from the
admin Menu tab when real photos are ready.
"""
import uuid
from datetime import datetime

from database import db

NEW_ITEMS = [
    {
        "name": "Idli (3 pcs) + Chicken Curry",
        "description": "Three fluffy steamed idlis with a bowl of our spicy Andhra chicken curry — the combination every Andhra breakfast table swears by.",
        "price": 12.99,
        "category": "breakfast",
        "subcategory": "Chicken Curry Combos",
        "slug": "idli-3-pcs-chicken-curry",
        "is_veg": False,
        "spice_level": 2,
        "image": "https://firebasestorage.googleapis.com/v0/b/sreesvadistaprasada.firebasestorage.app/o/Idli%203pcs.jpg?alt=media&token=cb47ca0a-07de-4328-94ce-ed732a414177",
        "seo_meta_description": "Order soft idlis with spicy Andhra chicken curry in Milton Keynes — a classic Andhra breakfast combo, freshly made to order.",
    },
    {
        "name": "Vada (2 pcs) + Chicken Curry",
        "description": "Two crispy golden urad dal vadas served with our spicy Andhra chicken curry — crunchy, fiery and deeply satisfying.",
        "price": 12.99,
        "category": "breakfast",
        "subcategory": "Chicken Curry Combos",
        "slug": "vada-2-pcs-chicken-curry",
        "is_veg": False,
        "spice_level": 2,
        "image": "https://imglink.cc/cdn/v0DGoCMJ52.jpg",
        "seo_meta_description": "Order crispy vadas with spicy Andhra chicken curry in Milton Keynes — fried fresh and paired the traditional way.",
    },
    {
        "name": "Dosa (2 pcs) + Chicken Curry",
        "description": "Two paper-thin crispy dosas with a bowl of spicy Andhra chicken curry for dunking — the non-veg answer to a classic breakfast.",
        "price": 12.99,
        "category": "breakfast",
        "subcategory": "Chicken Curry Combos",
        "slug": "dosa-2-pcs-chicken-curry",
        "is_veg": False,
        "spice_level": 2,
        "image": "https://imglink.cc/cdn/6fld5-7VaP.jpg",
        "seo_meta_description": "Order crispy dosas with spicy Andhra chicken curry in Milton Keynes — freshly made dosas with a fiery curry on the side.",
    },
    {
        "name": "Veg Thali",
        "description": "A complete vegetarian plate: rice, pappu, seasonal curry, roti pachadi, pappadam, yogurt and a sweet — the full comfort of a home-cooked Andhra meal.",
        "price": 14.99,
        "category": "veg",
        "subcategory": "Thalis & Rice Bowls",
        "slug": "veg-thali",
        "is_veg": True,
        "spice_level": 1,
        "image": "https://firebasestorage.googleapis.com/v0/b/sreesvadistaprasada.firebasestorage.app/o/Veg%20Rice%20bowl%20New.jpg?alt=media&token=5052807d-bcda-48bf-8474-a4078e5128bd",
        "seo_meta_description": "Order a full vegetarian thali in Milton Keynes — rice, dal, curry, pachadi, pappadam and yogurt, cooked fresh the Andhra way.",
    },
]

COMMON_DEFAULTS = {
    "extra_categories": [],
    "available": True,
    "featured": False,
    "allergens": [],
    "tag": "",
    "faqs": [],
    "pairs_with": [],
}


async def apply_menu_additions():
    # Rename veg "Rice Bowls" → "Thalis & Rice Bowls" so the thali sits with them
    await db.menu_items.update_many(
        {"category": "veg", "subcategory": "Rice Bowls"},
        {"$set": {"subcategory": "Thalis & Rice Bowls"}},
    )

    added = 0
    for item in NEW_ITEMS:
        existing = await db.menu_items.find_one({"name": item["name"]}, {"_id": 1})
        if existing:
            continue
        doc = {
            **COMMON_DEFAULTS,
            **item,
            "id": str(uuid.uuid4()),
            "created_at": datetime.utcnow().isoformat(),
        }
        await db.menu_items.insert_one(doc)
        added += 1
    if added:
        print(f"menu_additions: inserted {added} new items")
