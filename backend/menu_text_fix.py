"""One-time corrections to menu text held in the database (confirmed by the owner, 2026-10-04).

Each fix swaps one exact phrase in one field of one dish, and only where that phrase
is still present — anything already rewritten in the admin panel is left alone. Runs
once per FIX_VERSION (settings._id == "menu_text_fix").
"""
from datetime import datetime
from database import db

FIX_VERSION = 1

# (dish name, field, phrase to replace, replacement)
FIXES = [
    # Ragi is millet, not pearl millet
    ("Ragi Sangati with Chicken Curry", "description", "pearl millet", "ragi millet"),
    # The plate is three vadas
    ("Vada (3 pcs) + Chicken Curry", "description",
     "Two crispy golden urad dal vadas", "Three crispy golden urad dal vadas"),
    # The banana leaf is in the photograph, not in the box
    ("Veg Thali", "description", "A full banana-leaf feast:", "A full feast:"),
    # Not vegan-friendly
    ("Aloo Kurma", "seo_meta_description",
     "Vegan-friendly South Indian comfort food.", "South Indian comfort food."),
]


async def apply_menu_text_fix():
    marker = await db.settings.find_one({"_id": "menu_text_fix"})
    if marker and marker.get("version") == FIX_VERSION:
        return
    changed = 0
    for name, field, old, new in FIXES:
        docs = await db.menu_items.find({"name": name}, {"_id": 0, "id": 1, field: 1}).to_list(20)
        for doc in docs:
            text = doc.get(field) or ""
            if old in text:
                await db.menu_items.update_one({"id": doc["id"]}, {"$set": {field: text.replace(old, new)}})
                changed += 1
    await db.settings.update_one(
        {"_id": "menu_text_fix"},
        {"$set": {"version": FIX_VERSION, "applied_at": datetime.utcnow().isoformat()}},
        upsert=True,
    )
    print(f"menu_text_fix: corrected {changed} texts")
