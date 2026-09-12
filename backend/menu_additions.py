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
        "name": "Onion Dosa",
        "description": "Crispy golden dosa layered with sweet caramelised onions and a scatter of green chilli — simple, sizzling and satisfying.",
        "price": 6.99,
        "category": "breakfast",
        "subcategory": "Dosas",
        "slug": "onion-dosa",
        "is_veg": True,
        "spice_level": 1,
        "image": "https://firebasestorage.googleapis.com/v0/b/sreesvadistaprasada.firebasestorage.app/o/Ghee%20Dosa.jpg?alt=media&token=ea574069-32db-42e4-ab90-f7f836f73fc5",
        "seo_meta_description": "Order crispy onion dosa in Milton Keynes — golden dosa with caramelised onions, served with sambar and chutney.",
    },
    {
        "name": "Zucchini Fritters",
        "description": "Grated zucchini bound with gram flour and Andhra spices, fried into crisp golden fritters — a lighter twist on the classic pakora.",
        "price": 6.99,
        "category": "veg",
        "subcategory": "Starters and Evening Delights",
        "slug": "zucchini-fritters",
        "is_veg": True,
        "spice_level": 2,
        "image": "https://firebasestorage.googleapis.com/v0/b/sreesvadistaprasada.firebasestorage.app/o/punugulu.jpeg?alt=media&token=8f4d5eb1-064c-4930-91b9-8577d70537eb",
        "seo_meta_description": "Order crispy zucchini fritters in Milton Keynes — golden gram-flour fritters with true Andhra spices.",
    },
    {
        "name": "Chicken Drumsticks (5 Pcs)",
        "description": "Five juicy drumsticks marinated overnight in Andhra spices and fried to a deep golden crunch — proper hands-on eating.",
        "price": 9.99,
        "category": "nonVeg",
        "subcategory": "Starters",
        "slug": "chicken-drumsticks-5-pcs",
        "is_veg": False,
        "spice_level": 2,
        "image": "https://firebasestorage.googleapis.com/v0/b/sreesvadistaprasada.firebasestorage.app/o/Chicken%20fry.jpg?alt=media&token=ef13c237-88d4-49a4-92dc-010e05e59ca4",
        "seo_meta_description": "Order Andhra-spiced fried chicken drumsticks in Milton Keynes — five pieces, marinated overnight and fried fresh.",
    },
    {
        "name": "Chicken Wings",
        "description": "Crispy wings tossed in our fiery house masala — sticky, spicy and impossible to stop at one.",
        "price": 8.99,
        "category": "nonVeg",
        "subcategory": "Starters",
        "slug": "chicken-wings",
        "is_veg": False,
        "spice_level": 2,
        "image": "https://firebasestorage.googleapis.com/v0/b/sreesvadistaprasada.firebasestorage.app/o/Chicken%2065.jpg?alt=media&token=6575b361-2f5e-449e-9cef-c460cacfacb5",
        "seo_meta_description": "Order Andhra-style chicken wings in Milton Keynes — crispy wings in a fiery house masala, fried to order.",
    },
    {
        "name": "Chicken Lollipop Dry (5 Pcs)",
        "description": "Five frenched winglets in a dry, deeply spiced coating — all crunch, all masala, no gravy to slow you down.",
        "price": 8.99,
        "category": "nonVeg",
        "subcategory": "Starters",
        "slug": "chicken-lollipop-dry-5-pcs",
        "is_veg": False,
        "spice_level": 3,
        "image": "https://firebasestorage.googleapis.com/v0/b/sreesvadistaprasada.firebasestorage.app/o/Chicken%20Lollipop.jpg?alt=media&token=e14756f3-9a91-4b85-85e2-3e64f649bc3f",
        "seo_meta_description": "Order dry chicken lollipops in Milton Keynes — five crispy frenched winglets in bold Andhra masala.",
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
    # Overnight Oats are made the night before — pre-order only (next-day collection)
    await db.menu_items.update_many(
        {"name": {"$regex": "^Overnight Oats"}},
        {"$set": {"preorder_only": True}},
    )

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
