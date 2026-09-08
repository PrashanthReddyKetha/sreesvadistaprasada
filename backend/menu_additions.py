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

VEG_THALI_IMAGE = "https://firebasestorage.googleapis.com/v0/b/sreesvadistaprasada.firebasestorage.app/o/Veg%20Thali.jpeg?alt=media&token=ddfae728-e153-4fcf-b07a-3cb5402f2276"
VEG_THALI_DESC = (
    "A full banana-leaf feast: steamed rice and lemon rice with pappu, sambar and "
    "majjiga pulusu, crispy vepudu fries, aloo and drumstick fry, carrot pachadi, "
    "podi, pickles and chutneys, pappadam and a mirchi bajji — with a little sweet to finish."
)
VEG_THALI_SEO = (
    "Order a full Andhra veg thali in Milton Keynes — rice, lemon rice, pappu, sambar, "
    "majjiga pulusu, vepudu fries, pachadi, podi, pickles, pappadam and mirchi bajji on one leaf."
)

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
        "description": VEG_THALI_DESC,
        "price": 14.99,
        "category": "veg",
        "subcategory": "Thalis & Rice Bowls",
        "slug": "veg-thali",
        "is_veg": True,
        "spice_level": 2,
        "image": VEG_THALI_IMAGE,
        "seo_meta_description": VEG_THALI_SEO,
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
    # One-time fix-up: the thali initially shipped with a borrowed rice-bowl
    # photo and a generic description. Keyed on the placeholder image so this
    # never overwrites later admin edits.
    await db.menu_items.update_one(
        {
            "name": "Veg Thali",
            "image": "https://firebasestorage.googleapis.com/v0/b/sreesvadistaprasada.firebasestorage.app/o/Veg%20Rice%20bowl%20New.jpg?alt=media&token=5052807d-bcda-48bf-8474-a4078e5128bd",
        },
        {"$set": {
            "image": VEG_THALI_IMAGE,
            "description": VEG_THALI_DESC,
            "seo_meta_description": VEG_THALI_SEO,
            "spice_level": 2,
        }},
    )
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
