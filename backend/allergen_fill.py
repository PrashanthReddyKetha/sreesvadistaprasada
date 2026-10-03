"""One-time allergen fill for menu items that had no allergen data.

Labels were inferred from each dish's description and the usual recipe, erring
towards including an allergen where it is commonly present. They are a starting
point for the kitchen to confirm against the real recipes, not a substitute.
Only items whose allergen list is EMPTY are touched, and the fill runs once
(settings._id == "allergen_fill"), so anything set in the admin panel wins.

Dishes whose allergens depend on the house recipe (most chicken and mutton
curries and fries, a few rice dishes and fritters) are deliberately left empty;
the site shows "ask us before ordering" for those until the kitchen fills them.
"""
from datetime import datetime
from database import db

FILL_VERSION = 1

ALLERGEN_FILL = {
    # Breakfast — sambar and chutney tempering use mustard; mixed chutneys may include peanut
    "Beetroot Dosa (2 pcs)": ["mustard"],
    "Carrot Dosa (2 pcs)": ["mustard"],
    "Onion Dosa": ["mustard"],
    "Plain Dosa (2 pcs)": ["mustard"],
    "Masala Dosa (2 pcs)": ["mustard", "nuts"],
    "Nellore Ghee Karam Dosa (2 pcs)": ["dairy", "mustard"],
    "Upma Dosa": ["gluten", "mustard"],
    "Button Idli": ["mustard", "nuts"],
    "Idli (3 pcs)": ["mustard", "nuts"],
    "Sambar Idli (2 pcs)": ["mustard"],
    "Sambar Vada (2 pcs)": ["mustard"],
    "Vada (3 pcs)": ["mustard"],
    "Perugu Vada (2 pcs)": ["dairy", "mustard"],
    "Poha": ["mustard", "nuts"],
    "Upma": ["gluten", "mustard", "nuts"],
    # Non-veg
    "Fish Pulusu": ["fish", "mustard"],
    "Whole Grilled Chicken": ["dairy"],
    "Chicken Lollipop": ["gluten", "soy", "eggs"],
    "Chicken Lollipop (5 Pcs)": ["gluten", "soy", "eggs"],
    "Chicken Lollipop Dry (5 Pcs)": ["gluten", "soy", "eggs"],
    # Pickles
    "Allam Pachadi": ["mustard"],
    "Gongura Pickle": ["mustard", "sesame"],
    "Lemon Pickle": ["mustard"],
    "Mango Avakaya": ["mustard", "sesame"],
    "Tomato Pickle": ["mustard"],
    "Velluli Pachadi": ["mustard"],
    # Podis — compounded asafoetida usually contains wheat
    "Kandi Podi": ["gluten"],
    "Kobbari Podi": ["nuts"],
    # Ragi
    "Ragi Sangati with Pappu and Pachi Pulusu": ["dairy", "mustard"],
    # Street food — puris are wheat/semolina
    "Pani Puri (6 pcs)": ["gluten"],
    "Pani Puri (8 pcs)": ["gluten"],
    "Panipuri": ["gluten"],
    # Veg
    "Aloo Kurma": ["nuts"],
    "Bhindi Pulusu": ["mustard"],
    "Fry of the Day": ["mustard"],
    "Gongura Rice": ["mustard"],
    "Mulakkada Tomato Curry": ["mustard"],
    "Potato Fry": ["mustard"],
    "Rasam": ["mustard"],
    "Sambar": ["mustard"],
    "Vankaya Tomato Curry": ["mustard"],
    "Veg Thali": ["dairy", "nuts", "mustard"],
}

# Fresh juices and lemon water: none of the major allergens
NO_KNOWN_ALLERGENS = [
    "ABC Juice", "Apple Juice", "Carrot Juice", "Orange Juice", "Pineapple Juice",
    "Lemon Water (Salt)", "Lemon Water (Sweet)",
]

_EMPTY = {"$or": [{"allergens": []}, {"allergens": None}, {"allergens": {"$exists": False}}]}


async def apply_allergen_fill():
    marker = await db.settings.find_one({"_id": "allergen_fill"})
    if marker and marker.get("version") == FILL_VERSION:
        return
    filled = 0
    for name, allergens in ALLERGEN_FILL.items():
        res = await db.menu_items.update_many({"name": name, **_EMPTY}, {"$set": {"allergens": allergens}})
        filled += res.modified_count
    res = await db.menu_items.update_many(
        {"name": {"$in": NO_KNOWN_ALLERGENS}, **_EMPTY}, {"$set": {"no_known_allergens": True}}
    )
    await db.settings.update_one(
        {"_id": "allergen_fill"},
        {"$set": {"version": FILL_VERSION, "applied_at": datetime.utcnow().isoformat()}},
        upsert=True,
    )
    print(f"allergen_fill: labelled {filled} items, {res.modified_count} marked as no known allergens")
