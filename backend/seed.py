"""
Seed the database with initial menu items.
Called on startup if the menu_items collection is empty.
"""
from database import db

MENU_ITEMS = [
    # --- Non-Veg ---
    {"name": "Andhra Kodi Pulusu", "description": "Traditional chicken curry with tamarind, slow-cooked in earthen pots", "price": 12.99, "category": "nonVeg", "subcategory": "Curries", "spice_level": 3, "is_veg": False, "featured": True, "tag": "Bestseller", "allergens": [], "image": "https://images.unsplash.com/photo-1773209927959-b2959be5e684?crop=entropy&cs=srgb&fm=jpg&q=85&w=400", "available": True},
    {"name": "Chettinad Chicken", "description": "Spicy Tamil Nadu style chicken with roasted spices and fresh curry leaves", "price": 13.99, "category": "nonVeg", "subcategory": "Curries", "spice_level": 4, "is_veg": False, "featured": False, "tag": "", "allergens": [], "image": "https://images.unsplash.com/photo-1680529672551-16132239d69b?crop=entropy&cs=srgb&fm=jpg&q=85&w=400", "available": True},
    {"name": "Natu Kodi Biriyani", "description": "Country chicken biriyani with aromatic basmati rice, the village way", "price": 15.99, "category": "nonVeg", "subcategory": "Biriyanis", "spice_level": 3, "is_veg": False, "featured": True, "tag": "Popular", "allergens": ["dairy"], "image": "https://images.unsplash.com/photo-1599043513900-ed6fe01d3833?crop=entropy&cs=srgb&fm=jpg&q=85&w=400", "available": True},
    {"name": "Mutton Ghee Roast", "description": "Slow-cooked mutton in clarified butter with aromatic Mangalorean spices", "price": 16.99, "category": "nonVeg", "subcategory": "Starters", "spice_level": 3, "is_veg": False, "featured": False, "tag": "", "allergens": ["dairy"], "image": "https://images.unsplash.com/photo-1628690570327-14e16dca1518?crop=entropy&cs=srgb&fm=jpg&q=85&w=400", "available": True},
    # --- Veg ---
    {"name": "Gutti Vankaya", "description": "Stuffed brinjal curry with peanut and sesame paste, a treasured Andhra recipe", "price": 9.99, "category": "veg", "subcategory": "Curries", "spice_level": 2, "is_veg": True, "featured": True, "tag": "", "allergens": ["nuts", "sesame"], "image": "https://images.unsplash.com/photo-1680529672551-16132239d69b?crop=entropy&cs=srgb&fm=jpg&q=85&w=400", "available": True},
    {"name": "Bendakaya Pulusu", "description": "Okra in tangy tamarind gravy, a comfort dish for every Telugu household", "price": 8.99, "category": "veg", "subcategory": "Curries", "spice_level": 2, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": "https://images.unsplash.com/photo-1752673508949-f4aeeaef75f0?crop=entropy&cs=srgb&fm=jpg&q=85&w=400", "available": True},
    {"name": "Veg Biriyani", "description": "Fragrant vegetable biriyani with seasonal vegetables and raita", "price": 11.99, "category": "veg", "subcategory": "Biriyanis", "spice_level": 2, "is_veg": True, "featured": False, "tag": "", "allergens": ["dairy"], "image": "https://images.unsplash.com/photo-1727404746799-253aa9a8ace6?crop=entropy&cs=srgb&fm=jpg&q=85&w=400", "available": True},
    # --- Prasada ---
    {"name": "Pulihora", "description": "Temple-style tamarind rice prepared with devotion and hand-pounded spices", "price": 8.99, "category": "prasada", "subcategory": "Rice", "spice_level": 1, "is_veg": True, "featured": True, "tag": "Chef's Pick", "allergens": ["nuts"], "image": "https://images.unsplash.com/photo-1752673508949-f4aeeaef75f0?crop=entropy&cs=srgb&fm=jpg&q=85&w=400", "available": True},
    {"name": "Sakkarai Pongal", "description": "Sweet rice with jaggery, ghee and cashews — the divine temple offering", "price": 7.99, "category": "prasada", "subcategory": "Rice", "spice_level": 0, "is_veg": True, "featured": True, "tag": "Divine", "allergens": ["dairy", "nuts"], "image": "https://images.unsplash.com/photo-1666251214695-405f673b396a?crop=entropy&cs=srgb&fm=jpg&q=85&w=400", "available": True},
    {"name": "Sundal", "description": "Steamed chickpea with coconut and curry leaves, a beloved temple prasadam", "price": 5.99, "category": "prasada", "subcategory": "Prasadam Specials", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": "https://images.unsplash.com/photo-1708963993351-e30633c102ce?crop=entropy&cs=srgb&fm=jpg&q=85&w=400", "available": True},
    # --- Breakfast ---
    {"name": "Idli (4 pcs)", "description": "Soft steamed rice cakes with sambar and chutneys, the perfect start to your day", "price": 6.99, "category": "breakfast", "subcategory": "Tiffins", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": "https://images.unsplash.com/photo-1736239093051-508a8472a934?crop=entropy&cs=srgb&fm=jpg&q=85&w=400", "available": True},
    {"name": "Masala Dosa", "description": "Crispy rice crepe with spiced potato filling on a banana leaf", "price": 8.99, "category": "breakfast", "subcategory": "Tiffins", "spice_level": 2, "is_veg": True, "featured": True, "tag": "Morning Favourite", "allergens": [], "image": "https://images.unsplash.com/photo-1743615467363-250466982515?crop=entropy&cs=srgb&fm=jpg&q=85&w=400", "available": True},
    {"name": "Upma", "description": "Semolina porridge with vegetables and spices, a nostalgic village morning", "price": 6.99, "category": "breakfast", "subcategory": "Tiffins", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": "https://images.unsplash.com/photo-1694849789325-914b71ab4075?crop=entropy&cs=srgb&fm=jpg&q=85&w=400", "available": True},
    {"name": "Punugulu", "description": "Crispy idli batter fritters, perfect with coconut chutney", "price": 5.99, "category": "breakfast", "subcategory": "Snacks", "spice_level": 2, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": "https://images.unsplash.com/photo-1572442568216-e4a31af30b69?crop=entropy&cs=srgb&fm=jpg&q=85&w=400", "available": True},
    # --- Pickles ---
    {"name": "Gongura Pickle", "description": "Tangy sorrel leaves pickle — grandmother's treasured recipe", "price": 4.99, "category": "pickles", "subcategory": None, "spice_level": 3, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": "https://images.unsplash.com/photo-1621427017774-f0e7ebbda11f?crop=entropy&cs=srgb&fm=jpg&q=85&w=400", "available": True},
    {"name": "Mango Avakaya", "description": "Spicy raw mango pickle with mustard — the king of Telugu pickles", "price": 4.99, "category": "pickles", "subcategory": None, "spice_level": 4, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": "https://images.unsplash.com/photo-1621427017774-f0e7ebbda11f?crop=entropy&cs=srgb&fm=jpg&q=85&w=400", "available": True},
    {"name": "Lemon Pickle", "description": "Traditional lemon pickle aged in ceramic jars", "price": 4.49, "category": "pickles", "subcategory": None, "spice_level": 2, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": "https://images.unsplash.com/photo-1621427017774-f0e7ebbda11f?crop=entropy&cs=srgb&fm=jpg&q=85&w=400", "available": True},
    # --- Podis ---
    {"name": "Kandi Podi", "description": "Roasted dal powder with spices — magic on hot rice with ghee", "price": 3.99, "category": "podis", "subcategory": None, "spice_level": 2, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": "https://images.unsplash.com/photo-1660541880621-2c37ce3a88b4?crop=entropy&cs=srgb&fm=jpg&q=85&w=400", "available": True},
    {"name": "Nalla Karam", "description": "Sesame seed chutney powder, a Telugu kitchen essential", "price": 3.99, "category": "podis", "subcategory": None, "spice_level": 3, "is_veg": True, "featured": False, "tag": "", "allergens": ["sesame"], "image": "https://images.unsplash.com/photo-1660541880621-2c37ce3a88b4?crop=entropy&cs=srgb&fm=jpg&q=85&w=400", "available": True},
    {"name": "Karivepaku Podi", "description": "Curry leaves gun powder, aromatic and soul-warming", "price": 3.99, "category": "podis", "subcategory": None, "spice_level": 2, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": "https://images.unsplash.com/photo-1660541880621-2c37ce3a88b4?crop=entropy&cs=srgb&fm=jpg&q=85&w=400", "available": True},
]


async def seed_menu():
    count = await db.menu_items.count_documents({})
    if count == 0:
        import uuid
        from datetime import datetime
        docs = []
        for item in MENU_ITEMS:
            docs.append({
                "id": str(uuid.uuid4()),
                "created_at": datetime.utcnow().isoformat(),
                **item,
            })
        await db.menu_items.insert_many(docs)
        print(f"Seeded {len(docs)} menu items.")
    else:
        print(f"Menu already has {count} items — skipping seed.")


async def create_indexes():
    await db.menu_items.create_index("id", unique=True)
    await db.menu_items.create_index("category")
    await db.users.create_index("id", unique=True)
    await db.users.create_index("email", unique=True)
    await db.orders.create_index("id", unique=True)
    await db.orders.create_index("user_id")
    await db.subscriptions.create_index("id", unique=True)
    await db.subscriptions.create_index("user_id")
    await db.contact_messages.create_index("id", unique=True)
    await db.catering_enquiries.create_index("id", unique=True)
    await db.newsletter.create_index("email", unique=True)
    print("Indexes created.")


async def create_admin_user():
    import os
    from auth import hash_password
    import uuid
    from datetime import datetime

    email = os.environ.get("ADMIN_EMAIL")
    password = os.environ.get("ADMIN_PASSWORD")
    if not email or not password:
        return

    existing = await db.users.find_one({"email": email})
    if existing:
        return

    admin = {
        "id": str(uuid.uuid4()),
        "name": "Admin",
        "email": email,
        "phone": None,
        "address": None,
        "role": "admin",
        "password_hash": hash_password(password),
        "created_at": datetime.utcnow().isoformat(),
    }
    await db.users.insert_one(admin)
    print(f"Admin user created: {email}")
