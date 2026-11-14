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
    {
        "name": "Perugu Vada (2 pcs)",
        "description": "Medu vada soaked in thick whisked perugu (curd) with a mustard-and-curry-leaf tadka, ginger and a hint of green chilli — cool, tangy and impossible to stop at one.",
        "price": 4.99,
        "category": "breakfast",
        "subcategory": "Idli & Vada",
        "slug": "perugu-vada-2-pcs",
        "is_veg": True,
        "spice_level": 1,
        # Placeholder — reuses the vada photo until a real perugu vada shot is uploaded
        "image": "https://sreesvadistaprasada.com/dishes/vada.jpg",
        "seo_meta_description": "Order perugu vada (curd vada / dahi vada) in Milton Keynes — soft medu vada soaked in seasoned yogurt with a curry-leaf tadka.",
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


MENU_ADDITIONS_VERSION = 1   # bump when the additions below change; between bumps the admin's menu is left alone


async def apply_menu_additions():
    """Runs once per version (audit A-0003, BE-004): a restart must never re-insert a dish the admin deleted."""
    marker = await db.settings.find_one({"_id": "menu_additions"}, {"_id": 0, "version": 1})
    if marker and marker.get("version") == MENU_ADDITIONS_VERSION:
        return
    await _apply_menu_additions()
    await db.settings.update_one({"_id": "menu_additions"}, {"$set": {"version": MENU_ADDITIONS_VERSION}}, upsert=True)


async def _apply_menu_additions():
    # preorder_only is set per dish from Admin › Stock levels ("Pre-order only"); the boot no longer forces it
    # off (it did for the Overnight Oats until 14 Nov 2026 — docs/PREORDER.md).

    # Image host migration — keyed on exact old URLs so admin edits are never
    # overwritten. imglink.cc/vecteezy images now live in the frontend's
    # public/dishes; the edgeone URL was already returning 404 in production,
    # so that item gets the Dum Biryani photo as a placeholder until a real
    # photo is uploaded.
    IMAGE_MIGRATIONS = {
        "https://imglink.cc/cdn/6fld5-7VaP.jpg":
            "https://sreesvadistaprasada.com/dishes/masala-dosa.jpg",
        "https://imglink.cc/cdn/v0DGoCMJ52.jpg":
            "https://sreesvadistaprasada.com/dishes/vada.jpg",
        "https://static.vecteezy.com/system/resources/thumbnails/040/986/112/small_2x/ai-generated-indian-biryani-rice-professional-advertising-foodgraphy-photo.jpg":
            "https://sreesvadistaprasada.com/dishes/veg-fried-rice.jpg",
        "https://yearling-green-hgf3gqzard.edgeone.app/spl%20chicken%20biryani.jpeg":
            "https://firebasestorage.googleapis.com/v0/b/sreesvadistaprasada.firebasestorage.app/o/Dum%20Biriyani.jpg?alt=media&token=19f4b7d8-bd4c-4408-8972-06969a1b94ee",
    }
    for old_url, new_url in IMAGE_MIGRATIONS.items():
        await db.menu_items.update_many({"image": old_url}, {"$set": {"image": new_url}})

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


# Later additions run under their own marker, so adding a dish never re-runs the list above
# (which would bring back dishes the admin has since deleted).
PROTEIN_EGG_BOWL = {
    "name": "Protein Egg Bowl",
    # Built like the Protein Non-Veg Bowl with eggs in place of chicken, and priced the same — the owner can change either in admin
    "description": (
        "Fuel your day with our protein-packed egg bowl. Boiled eggs, lightly spiced, on a hearty base of "
        "protein-rich quinoa, tossed with wholesome chickpeas, creamy fresh avocado, roasted sweet potatoes, "
        "earthy beetroot, crisp cucumbers and juicy cherry tomatoes. Finished with a light, flavourful dressing."
    ),
    "price": 10.99,
    "category": "nonVeg",
    "subcategory": "Protein & Healthy Bowls",
    "extra_categories": [{"category": "nonVeg", "subcategory": "Egg Specials"}],
    "slug": "protein-egg-bowl",
    "is_veg": False,
    "spice_level": 1,
    "tag": "Healthy",
    # Placeholder: the veg bowl's photo (no chicken in it) until a photo of this bowl is uploaded in admin
    "image": "https://firebasestorage.googleapis.com/v0/b/sreesvadistaprasada.firebasestorage.app/o/protien%20veg%20bowl.jpeg?alt=media&token=af052d4d-d031-4838-9c56-0815d415e323",
    # Left empty like the other bowls: the dish page then says "please ask us" rather than implying eggs is the only allergen
    "allergens": [],
    "seo_meta_description": "Protein Egg Bowl in Milton Keynes: boiled eggs on quinoa with chickpeas, avocado, sweet potato and fresh vegetables. A healthy high-protein bowl.",
}

EGG_BOWL_VERSION = 1


async def apply_protein_egg_bowl():
    """Inserts the Protein Egg Bowl once (settings._id == "menu_additions_egg_bowl"); a restart never re-adds it if deleted."""
    marker = await db.settings.find_one({"_id": "menu_additions_egg_bowl"}, {"_id": 0, "version": 1})
    if marker and marker.get("version") == EGG_BOWL_VERSION:
        return
    if not await db.menu_items.find_one({"$or": [{"name": PROTEIN_EGG_BOWL["name"]}, {"slug": PROTEIN_EGG_BOWL["slug"]}]}, {"_id": 1}):
        await db.menu_items.insert_one({
            **COMMON_DEFAULTS,
            **PROTEIN_EGG_BOWL,
            "id": str(uuid.uuid4()),
            "created_at": datetime.utcnow().isoformat(),
        })
        print("menu_additions: inserted Protein Egg Bowl")
    await db.settings.update_one(
        {"_id": "menu_additions_egg_bowl"},
        {"$set": {"version": EGG_BOWL_VERSION, "applied_at": datetime.utcnow().isoformat()}},
        upsert=True,
    )


# The three protein bowls also sit in Breakfast › English Breakfast (owner request, 2026-10-28)
BOWLS_AT_BREAKFAST = ["protein-veg-bowl", "protein-non-veg-bowl", "protein-egg-bowl"]
BOWLS_AT_BREAKFAST_VERSION = 1


async def apply_bowls_at_breakfast():
    """Adds the English Breakfast placement once (settings._id == "menu_bowls_breakfast"); removing it in admin sticks."""
    marker = await db.settings.find_one({"_id": "menu_bowls_breakfast"}, {"_id": 0, "version": 1})
    if marker and marker.get("version") == BOWLS_AT_BREAKFAST_VERSION:
        return
    res = await db.menu_items.update_many(
        {"slug": {"$in": BOWLS_AT_BREAKFAST}},
        {"$addToSet": {"extra_categories": {"category": "breakfast", "subcategory": "English Breakfast"}}},
    )
    print(f"menu_additions: {res.modified_count} protein bowls added to English Breakfast")
    await db.settings.update_one(
        {"_id": "menu_bowls_breakfast"},
        {"$set": {"version": BOWLS_AT_BREAKFAST_VERSION, "applied_at": datetime.utcnow().isoformat()}},
        upsert=True,
    )


# Gongura Prawns (Svadista › Curries) and Joint Chicken Biryani (Svadista › Biryani) — owner request and prices, 2026-11-03
GONGURA_PRAWNS_AND_JOINT_BIRYANI = [
    {
        "name": "Gongura Prawns",
        "description": "Prawns cooked down with tangy gongura (sorrel) leaves and Andhra spices into a rich, sour-hot masala — the coastal cousin of our gongura chicken.",
        "price": 12.99,
        "category": "nonVeg",
        "subcategory": "Curries",
        "slug": "gongura-prawns",
        "is_veg": False,
        "spice_level": 3,
        "image": "https://firebasestorage.googleapis.com/v0/b/sreesvadistaprasada.firebasestorage.app/o/SreeSvadistaPrasada_Gongora%20Prawns.jpg?alt=media&token=3b12b58d-9357-4dac-af3c-b91b6e4a5999",
        "seo_meta_description": "Gongura prawns in Milton Keynes: prawns cooked with tangy sorrel leaves and Andhra spices. Order online for collection or delivery.",
    },
    {
        "name": "Joint Chicken Biryani",
        "description": "A whole chicken leg joint cooked in a rich, spiced masala and served on fragrant biryani rice, finished with cashews and curry leaves.",
        "price": 12.99,
        "category": "nonVeg",
        "subcategory": "Biryani",
        "slug": "joint-chicken-biryani",
        "is_veg": False,
        "spice_level": 2,
        "image": "https://firebasestorage.googleapis.com/v0/b/sreesvadistaprasada.firebasestorage.app/o/SreeSvadistaPrasada_ChickenJointBiryani.jpg?alt=media&token=a866e167-37a4-4d81-a445-ce2c55ee702c",
        "seo_meta_description": "Joint chicken biryani in Milton Keynes: a whole chicken leg in rich masala on fragrant biryani rice. Order online for collection or delivery.",
    },
]
# Allergens are left empty like the other new dishes, so the dish page says "please ask us" until the owner confirms them in admin

GONGURA_PRAWNS_AND_JOINT_BIRYANI_VERSION = 1


async def apply_gongura_prawns_and_joint_biryani():
    """Inserts both dishes once (settings._id == "menu_additions_2026_11"); a restart never re-adds one the admin deleted."""
    marker = await db.settings.find_one({"_id": "menu_additions_2026_11"}, {"_id": 0, "version": 1})
    if marker and marker.get("version") == GONGURA_PRAWNS_AND_JOINT_BIRYANI_VERSION:
        return
    for item in GONGURA_PRAWNS_AND_JOINT_BIRYANI:
        if await db.menu_items.find_one({"$or": [{"name": item["name"]}, {"slug": item["slug"]}]}, {"_id": 1}):
            continue
        await db.menu_items.insert_one({
            **COMMON_DEFAULTS,
            **item,
            "id": str(uuid.uuid4()),
            "created_at": datetime.utcnow().isoformat(),
        })
        print(f"menu_additions: inserted {item['name']}")
    await db.settings.update_one(
        {"_id": "menu_additions_2026_11"},
        {"$set": {"version": GONGURA_PRAWNS_AND_JOINT_BIRYANI_VERSION, "applied_at": datetime.utcnow().isoformat()}},
        upsert=True,
    )


# ── "Biryani", the spelling people search for, in place of "Biriyani" (owner, 13 Nov 2026) ─────────────────
# The tab labels and addresses on the site changed with it; a tab lists the dishes whose subcategory is its
# name, so the data moves too. Runs on every boot and touches only documents still carrying the old spelling.
BIRYANI_SUBCATEGORIES = {"Biriyani": "Biryani", "Biriyanis & Rice": "Biryanis & Rice"}


async def apply_biryani_spelling():
    for old, new in BIRYANI_SUBCATEGORIES.items():
        r = await db.menu_items.update_many({"subcategory": old}, {"$set": {"subcategory": new}})
        if r.modified_count:
            print(f"menu_additions: {r.modified_count} dish(es) moved from '{old}' to '{new}'")
    async for doc in db.menu_items.find({"extra_categories.subcategory": {"$in": list(BIRYANI_SUBCATEGORIES)}}, {"_id": 0, "id": 1, "extra_categories": 1}):
        fixed = [{**ec, "subcategory": BIRYANI_SUBCATEGORIES.get(ec.get("subcategory"), ec.get("subcategory"))} for ec in doc.get("extra_categories") or []]
        await db.menu_items.update_one({"id": doc["id"]}, {"$set": {"extra_categories": fixed}})
    # the one dish named with the old spelling; its address follows (next.config.js redirects the old one)
    if not await db.menu_items.find_one({"slug": "mutton-biryani"}, {"_id": 1}):
        r = await db.menu_items.update_one({"name": "Mutton Biriyani"}, {"$set": {"name": "Mutton Biryani", "slug": "mutton-biryani"}})
        if r.modified_count:
            print("menu_additions: Mutton Biriyani is now Mutton Biryani (/svadista/biryani/mutton-biryani)")


# Chicken 65 Biryani (Svadista › Biryani) — owner request and price, 14 Nov 2026. Photo: the kitchen's own, served from the site.
CHICKEN_65_BIRYANI = {
    "name": "Chicken 65 Biryani",
    "description": "Crisp Chicken 65 — chicken marinated in yoghurt, red chillies and curry leaves and fried — layered over fragrant biryani rice, with boiled egg, mint and raita on the side.",
    "price": 10.99,
    "category": "nonVeg",
    "subcategory": "Biryani",
    "slug": "chicken-65-biryani",
    "is_veg": False,
    "spice_level": 3,
    "image": "https://sreesvadistaprasada.com/dishes/chicken-65-biryani.jpg",
    "seo_meta_description": "Chicken 65 biryani in Milton Keynes: crisp Chicken 65 over fragrant biryani rice with egg and raita. Order online for collection or delivery.",
}
# Allergens are left empty like the other new dishes, so the dish page says "please ask us" until the owner confirms them in admin

CHICKEN_65_BIRYANI_VERSION = 1


async def apply_chicken_65_biryani():
    """Inserts the dish once (settings._id == "menu_chicken_65_biryani"); a restart never re-adds it if the admin deletes it."""
    marker = await db.settings.find_one({"_id": "menu_chicken_65_biryani"}, {"_id": 0, "version": 1})
    if marker and marker.get("version") == CHICKEN_65_BIRYANI_VERSION:
        return
    item = CHICKEN_65_BIRYANI
    if not await db.menu_items.find_one({"$or": [{"name": item["name"]}, {"slug": item["slug"]}]}, {"_id": 1}):
        await db.menu_items.insert_one({
            **COMMON_DEFAULTS,
            **item,
            "id": str(uuid.uuid4()),
            "created_at": datetime.utcnow().isoformat(),
        })
        print(f"menu_additions: inserted {item['name']}")
    await db.settings.update_one(
        {"_id": "menu_chicken_65_biryani"},
        {"$set": {"version": CHICKEN_65_BIRYANI_VERSION, "applied_at": datetime.utcnow().isoformat()}},
        upsert=True,
    )
