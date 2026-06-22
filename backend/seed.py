"""
Seed the database with initial menu items.
Called on startup — uses upsert-by-name so new items are added without
duplicating existing ones. Also runs category/subcategory migrations.
"""
from database import db

IMG = {
    "curry":        "https://images.unsplash.com/photo-1565557623262-b51c2513a641?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "biryani":      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "dosa":         "https://images.unsplash.com/photo-1630383249896-424e482df921?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "idli":         "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "noodles":      "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "rice":         "https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "fried_rice":   "https://images.unsplash.com/photo-1512058564366-18510be2db19?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "veg_starter":  "https://images.unsplash.com/photo-1606491956689-2ea866880c84?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "paneer":       "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "dal":          "https://images.unsplash.com/photo-1546833999-b9f581a1996d?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "chicken_dry":  "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "tikka":        "https://images.unsplash.com/photo-1527477396000-e27163b481c2?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "egg":          "https://images.unsplash.com/photo-1510693206972-df098062cb71?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "pickle":       "https://images.unsplash.com/photo-1621427017774-f0e7ebbda11f?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "podi":         "https://images.unsplash.com/photo-1660541880621-2c37ce3a88b4?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "burger":       "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "wrap":         "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "juice":        "https://images.unsplash.com/photo-1534353473418-4cfa0958f5e6?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "lassi":        "https://images.unsplash.com/photo-1553909489-cd47e0907980?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "buttermilk":   "https://images.unsplash.com/photo-1544145945-f90425340c7e?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "pulihora":     "https://images.unsplash.com/photo-1596797038530-2c107229654b?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "pongal":       "https://images.unsplash.com/photo-1694849789325-914b71ab4075?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "ragi":         "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "momos":        "https://images.unsplash.com/photo-1534422298391-e4f8c172789a?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "protein":      "https://images.unsplash.com/photo-1607013251379-e6eecfffe234?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
    "misc":         "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
}

# Shared extra_categories entry for veg starters that also appear on Street Food page
_SF = [{"category": "streetFood", "subcategory": None}]

MENU_ITEMS = [

    # ── SVADISTA / STARTERS ──────────────────────────────────────────────────
    {"name": "Chicken Manchurian", "price": 7.99, "category": "nonVeg", "subcategory": "Starters", "spice_level": 3, "is_veg": False, "featured": False, "tag": "", "allergens": ["soy"], "image": IMG["chicken_dry"], "available": True, "extra_categories": [],
     "description": "Crispy chicken pieces tossed in a tangy, spicy Manchurian sauce with garlic, ginger and spring onions. Indo-Chinese at its finest."},
    {"name": "Chilli Chicken", "price": 7.99, "category": "nonVeg", "subcategory": "Starters", "spice_level": 3, "is_veg": False, "featured": False, "tag": "", "allergens": ["soy"], "image": IMG["chicken_dry"], "available": True, "extra_categories": [],
     "description": "Crispy fried chicken tossed in a bold Indo-Chinese sauce of soy, garlic, green chilli and spring onions."},
    {"name": "Chicken 65", "price": 8.99, "category": "nonVeg", "subcategory": "Starters", "spice_level": 3, "is_veg": False, "featured": True, "tag": "⭐ Bestseller", "allergens": ["dairy"], "image": IMG["chicken_dry"], "available": True, "extra_categories": [],
     "description": "Deep-fried chicken marinated in a fiery blend of yoghurt, red chillies and curry leaves. Crispy outside, juicy inside — India's most beloved starter.",
     "seo_meta_description": "Order hot, crispy Chicken 65 in Milton Keynes. An addictive South Indian fried chicken starter tossed with curry leaves and green chillies."},
    {"name": "Chicken Lollipop", "price": 8.99, "category": "nonVeg", "subcategory": "Starters", "spice_level": 2, "is_veg": False, "featured": False, "tag": "", "allergens": [], "image": IMG["chicken_dry"], "available": True, "extra_categories": [],
     "description": "Frenched chicken winglets marinated in spices and fried until crispy. Fun to eat, impossible to stop at one."},
    {"name": "Dragon Chicken", "price": 8.99, "category": "nonVeg", "subcategory": "Starters", "spice_level": 3, "is_veg": False, "featured": False, "tag": "", "allergens": ["soy", "nuts"], "image": IMG["chicken_dry"], "available": True, "extra_categories": [],
     "description": "Crispy chicken tossed in a bold, tangy dragon sauce with capsicum, cashews and dried chillies. Sizzling and spectacular."},
    {"name": "Chicken Tikka", "price": 8.99, "category": "nonVeg", "subcategory": "Starters", "spice_level": 2, "is_veg": False, "featured": False, "tag": "", "allergens": ["dairy"], "image": IMG["tikka"], "available": True, "extra_categories": [],
     "description": "Boneless chicken marinated overnight in yoghurt and spices, skewered and cooked in a tandoor until charred and juicy.",
     "seo_meta_description": "Savour perfectly charred Chicken Tikka in Milton Keynes. Marinated in spiced yoghurt and grilled in our traditional clay tandoor. Order online."},
    {"name": "Tandoori Chicken", "price": 9.99, "category": "nonVeg", "subcategory": "Starters", "spice_level": 2, "is_veg": False, "featured": False, "tag": "", "allergens": ["dairy"], "image": IMG["tikka"], "available": True, "extra_categories": [],
     "description": "Half chicken marinated in a vibrant red masala of yoghurt, kashmiri chilli and whole spices, roasted in a clay tandoor.",
     "seo_meta_description": "Juicy, flame-grilled Tandoori Chicken delivered hot in Milton Keynes. Infused with traditional clay-oven smokiness and hand-ground spices."},
    {"name": "Whole Grilled Chicken", "price": 13.99, "category": "nonVeg", "subcategory": "Starters", "spice_level": 2, "is_veg": False, "featured": True, "tag": "Showstopper", "allergens": [], "image": IMG["tikka"], "available": True, "extra_categories": [],
     "description": "A whole chicken marinated in aromatic spices and slow-grilled until the skin is charred and the meat falls off the bone."},
    {"name": "Pepper Chicken", "price": 8.99, "category": "nonVeg", "subcategory": "Starters", "spice_level": 3, "is_veg": False, "featured": False, "tag": "", "allergens": [], "image": IMG["chicken_dry"], "available": True, "extra_categories": [],
     "description": "Dry-fried chicken with freshly cracked black pepper, curry leaves and green chillies. Punchy, aromatic and deeply satisfying."},
    {"name": "Garlic Pepper Chicken", "price": 9.99, "category": "nonVeg", "subcategory": "Starters", "spice_level": 3, "is_veg": False, "featured": False, "tag": "", "allergens": [], "image": IMG["chicken_dry"], "available": True, "extra_categories": [],
     "description": "Tender chicken tossed with roasted garlic, cracked pepper and curry leaves in a dry masala. Bold, aromatic and irresistible."},
    {"name": "Chicken Fry", "price": 8.99, "category": "nonVeg", "subcategory": "Starters", "spice_level": 3, "is_veg": False, "featured": False, "tag": "", "allergens": [], "image": IMG["chicken_dry"], "available": True, "extra_categories": [],
     "description": "Bone-in chicken pieces marinated in Andhra spices and deep-fried to a crispy, golden finish. Straight from the village kadai."},
    {"name": "Chicken Ghee Roast", "price": 9.99, "category": "nonVeg", "subcategory": "Starters", "spice_level": 3, "is_veg": False, "featured": True, "tag": "⭐ Chef's Pick", "allergens": ["dairy"], "image": IMG["tikka"], "available": True, "extra_categories": [],
     "description": "Chicken slow-roasted in pure desi ghee with a Mangalorean spice paste of red chillies, tamarind and aromatic spices. A true showstopper."},
    {"name": "Chicken Majestic", "price": 8.99, "category": "nonVeg", "subcategory": "Starters", "spice_level": 3, "is_veg": False, "featured": False, "tag": "Hyderabadi", "allergens": ["dairy"], "image": IMG["chicken_dry"], "available": True, "extra_categories": [],
     "description": "A Hyderabadi party starter — fried chicken tossed with yoghurt, spring onions, green chillies and curry leaves in a dry masala."},
    {"name": "Chicken Pakoda", "price": 7.99, "category": "nonVeg", "subcategory": "Starters", "spice_level": 2, "is_veg": False, "featured": False, "tag": "", "allergens": [], "image": IMG["chicken_dry"], "available": True, "extra_categories": [],
     "description": "Bite-sized chicken pieces dipped in spiced chickpea batter and deep-fried until golden and crunchy. Perfect with a cup of chai."},
    {"name": "Liver Fry", "price": 8.99, "category": "nonVeg", "subcategory": "Starters", "spice_level": 3, "is_veg": False, "featured": False, "tag": "", "allergens": [], "image": IMG["chicken_dry"], "available": True, "extra_categories": [],
     "description": "Chicken liver sautéed with onions, green chillies and freshly ground spices. Rich, earthy and a true Telugu delicacy."},
    {"name": "Prawns Ghee Roast", "price": 11.99, "category": "nonVeg", "subcategory": "Starters", "spice_level": 3, "is_veg": False, "featured": False, "tag": "Coastal ⭐", "allergens": ["shellfish", "dairy"], "image": IMG["tikka"], "available": True, "extra_categories": [],
     "description": "Juicy prawns roasted in desi ghee with a fiery Mangalorean spice paste. Rich, buttery and intensely flavourful."},

    # ── SVADISTA / CURRIES ───────────────────────────────────────────────────
    {"name": "Chicken Curry", "price": 8.99, "category": "nonVeg", "subcategory": "Curries", "spice_level": 2, "is_veg": False, "featured": False, "tag": "", "allergens": [], "image": IMG["curry"], "available": True, "extra_categories": [],
     "description": "Classic bone-in chicken curry cooked with onions, tomatoes and a freshly ground spice blend. Homestyle, hearty and delicious.",
     "seo_meta_description": "Order wholesome, home-cooked Chicken Curry in Milton Keynes. Prepared with village-style hand-blended spices and fresh, clean ingredients."},
    {"name": "Tomato Chicken Curry", "price": 8.99, "category": "nonVeg", "subcategory": "Curries", "spice_level": 2, "is_veg": False, "featured": False, "tag": "", "allergens": [], "image": IMG["curry"], "available": True, "extra_categories": [],
     "description": "Chicken simmered in a bright, tangy tomato-based gravy with whole spices and fresh curry leaves. Light, vibrant and deeply flavourful.",
     "seo_meta_description": "Enjoy authentic Tomato Chicken Curry in Milton Keynes. Prepared Telugu-style with ripe tomatoes and fresh ground spices. Order delivery now!"},
    {"name": "Gongura Chicken Curry", "price": 9.99, "category": "nonVeg", "subcategory": "Curries", "spice_level": 3, "is_veg": False, "featured": True, "tag": "⭐ Signature", "allergens": [], "image": IMG["curry"], "available": True, "extra_categories": [],
     "description": "Tender chicken pieces slow-cooked with tangy gongura (sorrel) leaves and Andhra spices. A signature dish of the Krishna delta.",
     "seo_meta_description": "Savor our authentic Gongura Chicken Curry in Milton Keynes. Tangy sorrel leaves cooked with tender chicken and hand-ground spices. Order online."},
    {"name": "Dum Chicken Curry", "price": 9.99, "category": "nonVeg", "subcategory": "Curries", "spice_level": 2, "is_veg": False, "featured": False, "tag": "", "allergens": [], "image": IMG["curry"], "available": True, "extra_categories": [],
     "description": "Chicken sealed in a rich spice paste and slow-cooked dum-style until the meat absorbs every layer of flavour. Patient cooking, extraordinary taste.",
     "seo_meta_description": "Craving rich, slow-cooked flavors? Order authentic Dum Chicken Curry in Milton Keynes. Made with tender bone-in chicken and sealed-pot dum spices."},
    {"name": "Butter Chicken", "price": 9.99, "category": "nonVeg", "subcategory": "Curries", "spice_level": 1, "is_veg": False, "featured": False, "tag": "Mild", "allergens": ["dairy"], "image": IMG["curry"], "available": True, "extra_categories": [],
     "description": "Tender chicken in a silky, mildly spiced tomato-cream sauce with butter and kasuri methi. A universally loved classic.",
     "seo_meta_description": "Order our signature creamy Butter Chicken in Milton Keynes. Tender grilled chicken simmered in a velvety tomato-cashew butter sauce. Order today!"},
    {"name": "Andhra Egg Curry", "price": 7.99, "category": "nonVeg", "subcategory": "Curries", "spice_level": 2, "is_veg": False, "featured": False, "tag": "", "allergens": ["eggs"], "image": IMG["egg"], "available": True, "extra_categories": [],
     "description": "Boiled eggs simmered in a bold Andhra-style gravy of onions, tomatoes and freshly ground spices. Comforting and full of character.",
     "seo_meta_description": "Savor spicy Andhra Egg Curry in Milton Keynes. Hard-boiled eggs simmered in a tangy, caramelized onion and tamarind curry. Order online today!"},
    {"name": "Egg Kurma", "price": 6.99, "category": "nonVeg", "subcategory": "Curries", "spice_level": 1, "is_veg": False, "featured": False, "tag": "", "allergens": ["eggs", "nuts"], "image": IMG["egg"], "available": True, "extra_categories": [],
     "description": "Eggs nestled in a mild, creamy coconut-based korma sauce with cashews and aromatic spices. Gentle, rich and satisfying.",
     "seo_meta_description": "Try our creamy, rich Egg Kurma in Milton Keynes. Hard-boiled eggs simmered in a fragrant coconut, cashew, and mild spice gravy. Order now!"},
    {"name": "Spicy Andhra Chicken", "price": 8.99, "category": "nonVeg", "subcategory": "Curries", "spice_level": 4, "is_veg": False, "featured": False, "tag": "Extra Spicy", "allergens": [], "image": IMG["curry"], "available": True, "extra_categories": [],
     "description": "Bone-in chicken cooked in an intensely spiced Andhra masala with raw onions and green chillies. Not for the faint-hearted.",
     "seo_meta_description": "Experience the heat! Order our signature Spicy Andhra Chicken in Milton Keynes. Fiery, bold village-style kodi kura delivered hot and fresh."},
    {"name": "Mutton Curry", "price": 11.99, "category": "nonVeg", "subcategory": "Curries", "spice_level": 2, "is_veg": False, "featured": False, "tag": "", "allergens": [], "image": IMG["curry"], "available": True, "extra_categories": [],
     "description": "Slow-cooked bone-in mutton in a rich, aromatic gravy of onions, tomatoes and whole spices. Worth every minute of the wait.",
     "seo_meta_description": "Get tender, slow-cooked Mutton Curry delivered hot in Milton Keynes. Infused with aromatic, hand-ground spices and fresh ginger-garlic paste."},
    {"name": "Spicy Andhra Mutton", "price": 11.99, "category": "nonVeg", "subcategory": "Curries", "spice_level": 4, "is_veg": False, "featured": False, "tag": "Extra Spicy", "allergens": [], "image": IMG["curry"], "available": True, "extra_categories": [],
     "description": "Bone-in mutton cooked in a fierce Andhra red chilli masala. Fiery, bold and unapologetically spicy.",
     "seo_meta_description": "Savor fiery Spicy Andhra Mutton in Milton Keynes. Tender lamb slow-cooked with bold, dry-roasted Guntur chillies and signature spices. Order now!"},
    {"name": "Gongura Mutton", "price": 12.99, "category": "nonVeg", "subcategory": "Curries", "spice_level": 3, "is_veg": False, "featured": True, "tag": "⭐ Signature", "allergens": [], "image": IMG["curry"], "available": True, "extra_categories": [],
     "description": "Tender mutton braised with pungent gongura leaves in an Andhra-style gravy. A legendary combination — tangy, spicy, unforgettable.",
     "seo_meta_description": "Try Sree Svadista's fiery Gongura Mutton in Milton Keynes. Slow-cooked tender lamb in a tangy sorrel leaf gravy with signature Guntur spices."},
    {"name": "Fish Pulusu", "price": 10.99, "category": "nonVeg", "subcategory": "Curries", "spice_level": 2, "is_veg": False, "featured": False, "tag": "Coastal", "allergens": ["fish"], "image": IMG["curry"], "available": True, "extra_categories": [],
     "description": "Fresh fish fillets simmered in a tangy tamarind gravy with onions and Andhra coastal spices.",
     "seo_meta_description": "Savor our legendary Nellore Chepala Pulusu in Milton Keynes. Fresh fish steaks slow-cooked in a fiery, sour tamarind and raw mango gravy."},
    {"name": "Prawns Iguru", "price": 11.99, "category": "nonVeg", "subcategory": "Curries", "spice_level": 3, "is_veg": False, "featured": False, "tag": "Coastal", "allergens": ["shellfish"], "image": IMG["curry"], "available": True, "extra_categories": [],
     "description": "Tiger prawns cooked in a thick, spiced Andhra masala with onions, tomatoes and curry leaves.",
     "seo_meta_description": "Taste authentic Prawns Iguru (Royyala Iguru) in Milton Keynes. Fresh prawns simmered in a semi-dry, heavily spiced caramelized onion gravy."},

    # ── SVADISTA / BIRIYANI ──────────────────────────────────────────────────
    {"name": "Chicken Biryani", "price": 8.99, "category": "nonVeg", "subcategory": "Biriyani", "spice_level": 2, "is_veg": False, "featured": True, "tag": "Popular", "allergens": ["dairy"], "image": IMG["biryani"], "available": True, "extra_categories": [],
     "description": "Tender chicken layered with fragrant basmati, fried onions and whole spices — sealed and dum-cooked for deep, complex flavour.",
     "seo_meta_description": "Order authentic, slow-cooked Chicken Biryani in Milton Keynes. Prepared village-style and delivered piping hot to your door. Order online now!"},
    {"name": "Special Chicken Biryani with Egg", "price": 10.99, "category": "nonVeg", "subcategory": "Biriyani", "spice_level": 2, "is_veg": False, "featured": True, "tag": "⭐ Premium", "allergens": ["dairy", "eggs"], "image": IMG["biryani"], "available": True, "extra_categories": [],
     "description": "Our premium biryani — extra chicken, a whole egg, whole spices, saffron milk and a slow dum cook. Truly special in every sense.",
     "seo_meta_description": "Order our signature Special Chicken Biryani with Egg in Milton Keynes. Double the feast with tender chicken dum pieces and a perfectly spiced egg!"},
    {"name": "Chicken Fry Piece Biryani", "price": 10.99, "category": "nonVeg", "subcategory": "Biriyani", "spice_level": 3, "is_veg": False, "featured": False, "tag": "", "allergens": ["dairy"], "image": IMG["biryani"], "available": True, "extra_categories": [],
     "description": "Biryani made with crispy fried chicken pieces layered into aromatic basmati. The best of both worlds — fried and dum.",
     "seo_meta_description": "Savor the iconic Andhra Chicken Fry Piece Biryani in Milton Keynes. Crispy, spiced fried chicken pieces served on a bed of fragrant dum biryani rice!"},
    {"name": "Mutton Biriyani", "price": 12.99, "category": "nonVeg", "subcategory": "Biriyani", "spice_level": 3, "is_veg": False, "featured": True, "tag": "Chef's Pick", "allergens": ["dairy"], "image": IMG["biryani"], "available": True, "extra_categories": [],
     "description": "Tender mutton pieces marinated overnight, layered with fragrant basmati and sealed — slow-cooked dum style until every grain is infused with flavour.",
     "seo_meta_description": "Craving rich and tender Mutton Biryani in Milton Keynes? Enjoy our authentic, slow-cooked Andhra-style biryani delivered hot. Order today!"},
    {"name": "Egg Biryani", "price": 8.99, "category": "nonVeg", "subcategory": "Biriyani", "spice_level": 2, "is_veg": False, "featured": False, "tag": "", "allergens": ["eggs", "dairy"], "image": IMG["biryani"], "available": True, "extra_categories": [],
     "description": "Boiled eggs marinated in masala, layered with fragrant basmati and dum-cooked. A flavourful, budget-friendly biryani.",
     "seo_meta_description": "Order aromatic Egg Biryani in Milton Keynes. Perfectly spiced boiled eggs layered with fragrant Basmati rice and caramelized onions. Delivered hot!"},

    # ── SVADISTA / INDO - CHINESE ────────────────────────────────────────────
    {"name": "Chicken Noodles", "price": 7.99, "category": "nonVeg", "subcategory": "Indo - Chinese", "spice_level": 2, "is_veg": False, "featured": False, "tag": "", "allergens": ["soy", "gluten"], "image": IMG["noodles"], "available": True, "extra_categories": [],
     "description": "Wok-tossed noodles with tender chicken strips, vegetables, soy sauce and chilli."},
    {"name": "Egg Noodles", "price": 6.99, "category": "nonVeg", "subcategory": "Indo - Chinese", "spice_level": 2, "is_veg": False, "featured": False, "tag": "", "allergens": ["eggs", "soy", "gluten"], "image": IMG["noodles"], "available": True, "extra_categories": [],
     "description": "Stir-fried noodles with scrambled egg, vegetables and a blend of Indo-Chinese sauces. A classic done right."},
    {"name": "Chicken Fried Rice", "price": 7.99, "category": "nonVeg", "subcategory": "Indo - Chinese", "spice_level": 1, "is_veg": False, "featured": False, "tag": "", "allergens": ["eggs", "soy"], "image": IMG["fried_rice"], "available": True, "extra_categories": [],
     "description": "Wok-tossed basmati with tender chicken, eggs, vegetables and soy sauce."},
    {"name": "Egg Fried Rice", "price": 6.99, "category": "nonVeg", "subcategory": "Indo - Chinese", "spice_level": 1, "is_veg": False, "featured": False, "tag": "", "allergens": ["eggs", "soy"], "image": IMG["fried_rice"], "available": True, "extra_categories": [],
     "description": "Basmati fried with scrambled eggs, spring onions and soy sauce in a hot wok."},

    # ── SVADISTA / EGG SPECIALS ──────────────────────────────────────────────
    {"name": "Egg Masala", "price": 6.99, "category": "nonVeg", "subcategory": "Egg Specials", "spice_level": 2, "is_veg": False, "featured": False, "tag": "", "allergens": ["eggs"], "image": IMG["egg"], "available": True, "extra_categories": [],
     "description": "Boiled eggs halved and simmered in a spiced onion-tomato masala. Simple, satisfying and pairs perfectly with any rice or bread."},
    {"name": "Egg Bhurji", "price": 5.99, "category": "nonVeg", "subcategory": "Egg Specials", "spice_level": 2, "is_veg": False, "featured": False, "tag": "", "allergens": ["eggs"], "image": IMG["egg"], "available": True, "extra_categories": [],
     "description": "Scrambled eggs cooked with onions, tomatoes, green chillies and spices. Street-style, quick and utterly comforting."},
    {"name": "Egg Dosa", "price": 5.99, "category": "nonVeg", "subcategory": "Egg Specials", "spice_level": 1, "is_veg": False, "featured": False, "tag": "", "allergens": ["eggs"], "image": IMG["dosa"], "available": True, "extra_categories": [],
     "description": "Crispy dosa with a spiced egg omelette spread inside. A protein-packed South Indian breakfast favourite."},
    {"name": "Chicken Keema Dosa", "price": 7.99, "category": "nonVeg", "subcategory": "Egg Specials", "spice_level": 2, "is_veg": False, "featured": False, "tag": "", "allergens": [], "image": IMG["dosa"], "available": True, "extra_categories": [],
     "description": "Crispy dosa filled with spiced minced chicken keema, onions and green chillies."},
    {"name": "Mutton Keema Dosa", "price": 8.99, "category": "nonVeg", "subcategory": "Egg Specials", "spice_level": 3, "is_veg": False, "featured": False, "tag": "", "allergens": [], "image": IMG["dosa"], "available": True, "extra_categories": [],
     "description": "Thin, crispy dosa loaded with richly spiced minced mutton keema. Bold, meaty and deeply satisfying."},
    {"name": "Bread Omelette", "price": 4.99, "category": "nonVeg", "subcategory": "Egg Specials", "spice_level": 1, "is_veg": False, "featured": False, "tag": "", "allergens": ["eggs", "gluten", "dairy"], "image": IMG["egg"], "available": True, "extra_categories": [],
     "description": "Fluffy spiced omelette sandwiched in soft buttered bread. A beloved Indian street breakfast — simple and filling."},
    {"name": "Cheese Bread Omelette", "price": 6.99, "category": "nonVeg", "subcategory": "Egg Specials", "spice_level": 1, "is_veg": False, "featured": False, "tag": "", "allergens": ["eggs", "gluten", "dairy"], "image": IMG["egg"], "available": True, "extra_categories": [],
     "description": "Fluffy spiced omelette with melted cheese, sandwiched in soft buttered bread. The ultimate comfort breakfast."},
    {"name": "Cheese Omelette", "price": 5.99, "category": "nonVeg", "subcategory": "Egg Specials", "spice_level": 0, "is_veg": False, "featured": False, "tag": "", "allergens": ["eggs", "dairy"], "image": IMG["egg"], "available": True, "extra_categories": [],
     "description": "Light, fluffy omelette loaded with melted cheese and seasoned with black pepper."},
    {"name": "Egg Veggie Omelette", "price": 5.99, "category": "nonVeg", "subcategory": "Egg Specials", "spice_level": 1, "is_veg": False, "featured": False, "tag": "", "allergens": ["eggs"], "image": IMG["egg"], "available": True, "extra_categories": [],
     "description": "Eggs beaten with onions, tomatoes, capsicum and coriander — a wholesome, spiced omelette packed with goodness."},
    {"name": "Pure Veg Omelette", "price": 5.99, "category": "nonVeg", "subcategory": "Egg Specials", "spice_level": 1, "is_veg": True, "featured": False, "tag": "Vegan", "allergens": [], "image": IMG["egg"], "available": True, "extra_categories": [],
     "description": "An egg-free omelette made from chickpea batter with spiced vegetables. 100% plant-based, 100% delicious."},

    # ── SVADISTA / RICE BOWLS ────────────────────────────────────────────────
    {"name": "Rice, Chicken Curry, Pickle, Omelette", "price": 8.99, "category": "nonVeg", "subcategory": "Rice Bowls", "spice_level": 2, "is_veg": False, "featured": False, "tag": "", "allergens": ["eggs"], "image": IMG["curry"], "available": True, "extra_categories": [],
     "description": "A complete Andhra meal in a bowl — hot rice, rich chicken curry, tangy mango pickle and a spiced egg omelette."},
    {"name": "Rice, Mutton Curry, Pickle, Omelette", "price": 9.99, "category": "nonVeg", "subcategory": "Rice Bowls", "spice_level": 2, "is_veg": False, "featured": False, "tag": "", "allergens": ["eggs"], "image": IMG["curry"], "available": True, "extra_categories": [],
     "description": "A hearty Andhra rice bowl with slow-cooked mutton curry, fiery mango pickle and a spiced omelette. Soul food at its finest."},

    # ── PRASADA / STARTERS AND EVENING DELIGHTS (also on Street Food page) ──
    {"name": "Veg Manchurian", "price": 6.99, "category": "veg", "subcategory": "Starters and Evening Delights", "spice_level": 2, "is_veg": True, "featured": False, "tag": "", "allergens": ["soy"], "image": IMG["veg_starter"], "available": True, "extra_categories": _SF,
     "description": "Crispy vegetable dumplings tossed in a tangy Indo-Chinese Manchurian sauce with garlic, ginger and spring onions."},
    {"name": "Gobi Manchurian", "price": 6.99, "category": "veg", "subcategory": "Starters and Evening Delights", "spice_level": 2, "is_veg": True, "featured": False, "tag": "Popular", "allergens": ["soy"], "image": IMG["veg_starter"], "available": True, "extra_categories": _SF,
     "description": "Crispy cauliflower florets tossed in a spicy Manchurian sauce. A crowd favourite — crunchy, tangy and deeply satisfying."},
    {"name": "Crispy Bhindi", "price": 6.99, "category": "veg", "subcategory": "Starters and Evening Delights", "spice_level": 2, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["veg_starter"], "available": True, "extra_categories": _SF,
     "description": "Sliced okra coated in a spiced chickpea batter and deep-fried until perfectly crispy. Addictive as a starter or snack."},
    {"name": "Crispy Corn", "price": 5.99, "category": "veg", "subcategory": "Starters and Evening Delights", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["veg_starter"], "available": True, "extra_categories": _SF,
     "description": "Sweet corn kernels tossed with spices, herbs and a squeeze of lime — light, crunchy and bursting with flavour."},
    {"name": "Crispy Potato", "price": 4.99, "category": "veg", "subcategory": "Starters and Evening Delights", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["veg_starter"], "available": True, "extra_categories": _SF,
     "description": "Thin potato slices fried to golden perfection, seasoned with chaat masala and chilli. Simple, irresistible."},
    {"name": "Onion Bhaji", "price": 4.99, "category": "veg", "subcategory": "Starters and Evening Delights", "spice_level": 2, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["veg_starter"], "available": True, "extra_categories": _SF,
     "description": "Sliced onions in a spiced chickpea batter, fried to golden crispness. Served with mint chutney — the perfect monsoon snack.",
     "seo_meta_description": "Savour crispy, golden-brown Onion Bhajis in Milton Keynes. Hand-mixed with sweet red onions and traditional gram flour. Order delivery now."},
    {"name": "Onion Mirchi Bhajji", "price": 5.99, "category": "veg", "subcategory": "Starters and Evening Delights", "spice_level": 3, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["veg_starter"], "available": True, "extra_categories": _SF,
     "description": "Thick-sliced onions and green chillies dipped in a spiced gram flour batter and fried until golden. Crunchy, fiery and perfect with tea."},
    {"name": "Punugulu", "price": 5.99, "category": "veg", "subcategory": "Starters and Evening Delights", "spice_level": 2, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["veg_starter"], "available": True, "extra_categories": _SF,
     "description": "Bite-sized idli batter fritters deep-fried until puffed and golden. Tossed with curry leaves and chilli powder."},
    {"name": "Cut Mirchi", "price": 5.99, "category": "veg", "subcategory": "Starters and Evening Delights", "spice_level": 4, "is_veg": True, "featured": False, "tag": "Spicy", "allergens": [], "image": IMG["veg_starter"], "available": True, "extra_categories": _SF,
     "description": "Long green chillies stuffed with a tangy besan and spice mix, dipped in batter and fried. A fiery Hyderabadi street classic."},
    {"name": "Panipuri", "price": 4.99, "category": "veg", "subcategory": "Starters and Evening Delights", "spice_level": 2, "is_veg": True, "featured": False, "tag": "Street Food", "allergens": [], "image": IMG["veg_starter"], "available": True, "extra_categories": _SF,
     "description": "Hollow crispy puris filled with spiced potato, chickpeas and tangy tamarind water. India's most beloved street food — best eaten fast!"},
    {"name": "Peanut Chat", "price": 5.99, "category": "veg", "subcategory": "Starters and Evening Delights", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": ["nuts"], "image": IMG["veg_starter"], "available": True, "extra_categories": _SF,
     "description": "Roasted peanuts tossed with onion, tomato, coriander, lemon and chaat masala. Quick, healthy and absolutely delicious."},
    {"name": "Channa Chat", "price": 4.99, "category": "veg", "subcategory": "Starters and Evening Delights", "spice_level": 2, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["veg_starter"], "available": True, "extra_categories": _SF,
     "description": "Boiled chickpeas tossed with tangy tamarind chutney, onions, tomatoes, green chilli and crunchy sev."},

    # ── PRASADA / INDO CHINESE ───────────────────────────────────────────────
    {"name": "Veg Noodles", "price": 6.99, "category": "veg", "subcategory": "Indo Chinese", "spice_level": 2, "is_veg": True, "featured": False, "tag": "", "allergens": ["soy", "gluten"], "image": IMG["noodles"], "available": True, "extra_categories": [],
     "description": "Stir-fried noodles tossed with colourful vegetables, soy sauce, chilli and spring onions."},
    # Veg Fried Rice appears in both Indo Chinese tab AND Biriyanis & Rice tab on Prasada page
    {"name": "Veg Fried Rice", "price": 6.99, "category": "veg", "subcategory": "Indo Chinese", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": ["soy", "sesame"], "image": IMG["fried_rice"], "available": True,
     "extra_categories": [{"category": "veg", "subcategory": "Biriyanis & Rice"}],
     "description": "Wok-tossed basmati with mixed vegetables, soy sauce and a hint of sesame. Light, fragrant and full of colour."},

    # ── PRASADA / CURRIES & DAAL ─────────────────────────────────────────────
    {"name": "Tomato Pappu", "price": 6.99, "category": "veg", "subcategory": "Curries & Daal", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": ["dairy"], "image": IMG["dal"], "available": True, "extra_categories": [],
     "description": "Toor dal cooked with ripe tomatoes, tempered with mustard, cumin, curry leaves and a generous drizzle of ghee."},
    {"name": "Gongura Pappu", "price": 7.99, "category": "veg", "subcategory": "Curries & Daal", "spice_level": 2, "is_veg": True, "featured": False, "tag": "Andhra Special", "allergens": ["dairy"], "image": IMG["dal"], "available": True, "extra_categories": [],
     "description": "Toor dal slow-cooked with tangy gongura (sorrel) leaves and tempered with garlic and dried chillies. Distinctly Andhra.",
     "seo_meta_description": "Enjoy wholesome Gongura Pappu in Milton Keynes. Creamy split pigeon peas (toor dal) cooked with sour sorrel leaves and finished with ghee."},
    {"name": "Tadka Dal", "price": 6.99, "category": "veg", "subcategory": "Curries & Daal", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": ["dairy"], "image": IMG["dal"], "available": True, "extra_categories": [],
     "description": "Yellow lentils cooked until silky, then finished with a sizzling tadka of ghee, cumin, garlic and red chilli."},
    {"name": "Sambar", "price": 6.99, "category": "veg", "subcategory": "Curries & Daal", "spice_level": 2, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["dal"], "available": True, "extra_categories": [],
     "description": "Tamarind-lentil vegetable stew tempered with mustard, curry leaves and sambar powder. The heartbeat of South Indian cooking.",
     "seo_meta_description": "Enjoy our tangy, authentic South Indian Sambar in Milton Keynes. Slow-cooked lentils with fresh vegetables and home-ground sambar powder."},
    {"name": "Rasam", "price": 5.99, "category": "veg", "subcategory": "Curries & Daal", "spice_level": 2, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["dal"], "available": True, "extra_categories": [],
     "description": "Thin, peppery tamarind broth with tomato and aromatic spices. Deeply warming — sipped as soup or poured over rice.",
     "seo_meta_description": "Warm up with fiery, authentic South Indian Rasam in Milton Keynes. A tangy tamarind, black pepper, and garlic broth delivered hot to you."},
    {"name": "Bhindi Pulusu", "price": 7.99, "category": "veg", "subcategory": "Curries & Daal", "spice_level": 2, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["curry"], "available": True, "extra_categories": [],
     "description": "Okra simmered in a tamarind-based Andhra gravy with onions and aromatic spices. A comforting, tangy classic.",
     "seo_meta_description": "Savor our tangy Bhindi Pulusu in Milton Keynes. Fresh tender okra slow-cooked in a sour, spiced tamarind sauce with curry leaves. Order online."},
    {"name": "Paneer Butter Masala", "price": 8.99, "category": "veg", "subcategory": "Curries & Daal", "spice_level": 1, "is_veg": True, "featured": True, "tag": "Popular", "allergens": ["dairy"], "image": IMG["paneer"], "available": True, "extra_categories": [],
     "description": "Soft cubes of cottage cheese in a velvety, mildly spiced tomato-cream sauce. A North Indian classic that wins every table.",
     "seo_meta_description": "Get rich, creamy Paneer Butter Masala delivered hot in Milton Keynes. Soft paneer in a velvety cashew tomato butter sauce. Order online now!"},
    {"name": "Aloo Kurma", "price": 6.99, "category": "veg", "subcategory": "Curries & Daal", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": ["nuts"], "image": IMG["curry"], "available": True, "extra_categories": [],
     "description": "Golden potatoes simmered in a mild coconut-cashew kurma sauce with whole spices."},
    {"name": "Saag Aloo", "price": 6.99, "category": "veg", "subcategory": "Curries & Daal", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["curry"], "available": True, "extra_categories": [],
     "description": "Tender potatoes cooked with fresh spinach, garlic and green chillies. Earthy, nutritious and deeply satisfying."},
    {"name": "Methi Chaman", "price": 6.99, "category": "veg", "subcategory": "Curries & Daal", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": ["dairy"], "image": IMG["paneer"], "available": True, "extra_categories": [],
     "description": "Fresh paneer cubes cooked with fenugreek leaves in a lightly spiced gravy. Aromatic, rich and beautifully balanced."},
    {"name": "Gutti Vankaya Masala", "price": 8.99, "category": "veg", "subcategory": "Curries & Daal", "spice_level": 2, "is_veg": True, "featured": True, "tag": "⭐ Signature", "allergens": ["nuts", "sesame"], "image": IMG["curry"], "available": True, "extra_categories": [],
     "description": "Baby brinjals stuffed with a roasted peanut, sesame and coconut paste, then braised in a tangy tamarind gravy. One of Andhra's most treasured heirloom recipes.",
     "seo_meta_description": "Indulge in our Gutti Vankaya Masala in Milton Keynes. Baby aubergines stuffed with a rich peanut, sesame, and coconut masala. Order veg bliss."},
    {"name": "Channa Masala", "price": 5.99, "category": "veg", "subcategory": "Curries & Daal", "spice_level": 2, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["curry"], "available": True, "extra_categories": [],
     "description": "Chickpeas slow-cooked in a bold, tangy onion-tomato masala with whole spices."},
    {"name": "Mulakkada Tomato Curry", "price": 7.99, "category": "veg", "subcategory": "Curries & Daal", "spice_level": 2, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["curry"], "available": True, "extra_categories": [],
     "description": "Drumstick pieces simmered in a tangy tomato-based curry with mustard and curry leaves. Rustic and deeply flavourful."},
    {"name": "Meal Maker Kurma", "price": 6.99, "category": "veg", "subcategory": "Curries & Daal", "spice_level": 2, "is_veg": True, "featured": False, "tag": "", "allergens": ["soy"], "image": IMG["curry"], "available": True, "extra_categories": [],
     "description": "Soya chunks cooked in a rich coconut-based kurma sauce with whole spices. High protein, deeply flavourful."},
    {"name": "Perugu Pulusu", "price": 5.99, "category": "veg", "subcategory": "Curries & Daal", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": ["dairy"], "image": IMG["curry"], "available": True, "extra_categories": [],
     "description": "A cooling yoghurt-based curry tempered with mustard, dried chillies and curry leaves. Tangy, light and perfect with hot rice.",
     "seo_meta_description": "Order traditional Andhra Perugu Pulusu in Milton Keynes. A refreshing and tangy yogurt stew cooked with fresh vegetables and tempered spices."},
    {"name": "Fry of the Day", "price": 6.99, "category": "veg", "subcategory": "Curries & Daal", "spice_level": 2, "is_veg": True, "featured": False, "tag": "Daily Special", "allergens": [], "image": IMG["curry"], "available": True, "extra_categories": [],
     "description": "Today's seasonal vegetable, lightly spiced and pan-fried with mustard, curry leaves and dried chillies."},

    # ── PRASADA / NAIVEDYAM ──────────────────────────────────────────────────
    {"name": "Pulihora", "price": 4.99, "category": "veg", "subcategory": "Naivedyam", "spice_level": 1, "is_veg": True, "featured": True, "tag": "Divine", "allergens": ["nuts"], "image": IMG["pulihora"], "available": True, "extra_categories": [],
     "description": "Sacred temple tamarind rice prepared with hand-pounded spices, roasted peanuts and curry leaves. Made with devotion.",
     "seo_meta_description": "Order traditional Pulihora (tamarind rice) in Milton Keynes. A perfect balance of tangy, spicy, and nutty flavors, prepared with hand-ground spices."},
    {"name": "Prasadam Pulihora", "price": 5.99, "category": "veg", "subcategory": "Naivedyam", "spice_level": 1, "is_veg": True, "featured": True, "tag": "Divine ⭐", "allergens": ["nuts", "sesame"], "image": IMG["pulihora"], "available": True, "extra_categories": [],
     "description": "Temple-style tamarind rice made with extra devotion — hand-pounded spices, roasted groundnuts and a generous pour of sesame oil.",
     "seo_meta_description": "Experience the divine taste of Prasadam Pulihora in Milton Keynes. Prepared in our separate pure veg kitchen using traditional sacred temple recipes."},
    {"name": "Lemon Rice", "price": 4.99, "category": "veg", "subcategory": "Naivedyam", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": ["nuts"], "image": IMG["rice"], "available": True, "extra_categories": [],
     "description": "Cooked rice tossed with fresh lemon juice, turmeric, mustard, peanuts and curry leaves. Bright, tangy and refreshing."},
    {"name": "Pongal", "price": 5.99, "category": "veg", "subcategory": "Naivedyam", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": ["dairy", "nuts"], "image": IMG["pongal"], "available": True, "extra_categories": [],
     "description": "Rice and moong dal cooked to a comforting khichdi, finished with cracked pepper, cumin, cashews and a generous pour of ghee.",
     "seo_meta_description": "Order warm, comforting Ven Pongal in Milton Keynes. Prepared with fragrant Sona Masoori rice, yellow moong dal, whole peppercorns, and pure ghee."},
    {"name": "Chekara Pongal", "price": 7.99, "category": "veg", "subcategory": "Naivedyam", "spice_level": 0, "is_veg": True, "featured": False, "tag": "Sweet", "allergens": ["dairy", "nuts"], "image": IMG["pongal"], "available": True, "extra_categories": [],
     "description": "Sweet rice and moong dal cooked with jaggery, ghee, cardamom and cashews. Festive, warming and deeply comforting.",
     "seo_meta_description": "Treat yourself to our decadent Chakkara Pongal in Milton Keynes. Sweet rice cooked in rich milk, organic jaggery, pure ghee, and roasted cashews."},
    {"name": "Coconut Rice", "price": 4.99, "category": "veg", "subcategory": "Naivedyam", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": ["nuts"], "image": IMG["rice"], "available": True, "extra_categories": [],
     "description": "Fragrant rice cooked with fresh grated coconut, tempered with mustard, cashews and dried chillies."},
    {"name": "Tomato Rice", "price": 5.99, "category": "veg", "subcategory": "Naivedyam", "spice_level": 2, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["rice"], "available": True, "extra_categories": [],
     "description": "Fragrant rice cooked with ripe tomatoes, onions and South Indian spices. Tangy, comforting and great on its own."},
    {"name": "Pudina Rice", "price": 4.99, "category": "veg", "subcategory": "Naivedyam", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["rice"], "available": True, "extra_categories": [],
     "description": "Basmati rice cooked with fresh mint leaves, whole spices and green chillies. Fragrant, cooling and wonderfully aromatic."},
    {"name": "Coriander Rice", "price": 4.99, "category": "veg", "subcategory": "Naivedyam", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["rice"], "available": True, "extra_categories": [],
     "description": "Rice tossed with a freshly ground coriander paste, lemon and spices. Herb-forward, vibrant and uniquely Andhra."},
    {"name": "Cut Pongal", "price": 5.99, "category": "veg", "subcategory": "Naivedyam", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": ["dairy", "nuts"], "image": IMG["pongal"], "available": True, "extra_categories": [],
     "description": "Ven pongal shaped into thick patties and pan-fried until golden. Crispy outside, soft and peppery inside — a breakfast revelation."},

    # ── PRASADA / BIRIYANIS & RICE ───────────────────────────────────────────
    {"name": "Jeera Rice", "price": 4.99, "category": "veg", "subcategory": "Biriyanis & Rice", "spice_level": 0, "is_veg": True, "featured": False, "tag": "", "allergens": ["dairy"], "image": IMG["rice"], "available": True, "extra_categories": [],
     "description": "Long-grain basmati tempered with cumin seeds, ghee and a pinch of salt. The ideal base for any curry."},
    {"name": "Garlic Rice", "price": 4.99, "category": "veg", "subcategory": "Biriyanis & Rice", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["rice"], "available": True, "extra_categories": [],
     "description": "Basmati rice stir-fried with crispy golden garlic, curry leaves and mild spices."},
    {"name": "Jeera Garlic Rice", "price": 5.99, "category": "veg", "subcategory": "Biriyanis & Rice", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": ["dairy"], "image": IMG["rice"], "available": True, "extra_categories": [],
     "description": "Basmati rice tempered with cumin, crispy golden garlic and a touch of ghee. Aromatic, flavourful and pairs with everything."},
    {"name": "Veg Pulao", "price": 6.99, "category": "veg", "subcategory": "Biriyanis & Rice", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": ["dairy"], "image": IMG["biryani"], "available": True, "extra_categories": [],
     "description": "Fragrant basmati cooked with seasonal vegetables, whole spices and mint."},
    {"name": "Veg Biryani", "price": 7.99, "category": "veg", "subcategory": "Biriyanis & Rice", "spice_level": 2, "is_veg": True, "featured": False, "tag": "", "allergens": ["dairy"], "image": IMG["biryani"], "available": True, "extra_categories": [],
     "description": "Seasonal vegetables layered with long-grain basmati, whole spices, caramelised onions, and saffron milk — dum-cooked and served with cooling raita.",
     "seo_meta_description": "Fragrant Basmati rice layered with garden vegetables and aromatic spices. Order healthy, authentic Veg Biryani in Milton Keynes today."},
    {"name": "Sambar Rice", "price": 6.99, "category": "veg", "subcategory": "Biriyanis & Rice", "spice_level": 2, "is_veg": True, "featured": False, "tag": "", "allergens": ["dairy"], "image": IMG["rice"], "available": True, "extra_categories": [],
     "description": "Hot rice mixed with freshly made sambar and a drizzle of ghee. Classic South Indian comfort food."},
    {"name": "Rasam Rice", "price": 5.99, "category": "veg", "subcategory": "Biriyanis & Rice", "spice_level": 2, "is_veg": True, "featured": False, "tag": "", "allergens": ["dairy"], "image": IMG["rice"], "available": True, "extra_categories": [],
     "description": "Steamed rice mixed with peppery rasam and ghee. Light, digestive and deeply comforting."},
    {"name": "Ghee Pappu Avakaya Rice", "price": 7.99, "category": "veg", "subcategory": "Biriyanis & Rice", "spice_level": 3, "is_veg": True, "featured": False, "tag": "Andhra Classic", "allergens": ["dairy", "sesame"], "image": IMG["rice"], "available": True, "extra_categories": [],
     "description": "Hot rice mixed with creamy dal, fiery mango pickle and a generous pour of ghee — a quintessential Andhra combination."},

    # ── PRASADA / RICE BOWLS ─────────────────────────────────────────────────
    {"name": "Pappu, Pappadam, Roti Pachadi, Rice", "price": 6.99, "category": "veg", "subcategory": "Rice Bowls", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": ["dairy"], "image": IMG["rice"], "available": True, "extra_categories": [],
     "description": "Steaming hot rice paired with creamy Andhra dal, crispy pappadam and tangy tomato-onion pachadi. Simple. Complete. Perfect."},

    # ── PICKLES ──────────────────────────────────────────────────────────────
    {"name": "Gongura Pickle", "price": 4.99, "category": "pickles", "subcategory": None, "spice_level": 3, "is_veg": True, "featured": False, "tag": "Signature", "allergens": ["sesame"], "image": IMG["pickle"], "available": True, "extra_categories": [],
     "description": "Sun-dried sorrel leaves blended with red chillies, garlic, mustard and sesame oil. Tangy, spicy and utterly addictive on hot rice.",
     "seo_meta_description": "Buy authentic Gongura Pickle online in the UK. Hand-stirred, spicy, and tangy sorrel leaves pickle prepared in traditional Andhra style."},
    {"name": "Mango Avakaya", "price": 4.99, "category": "pickles", "subcategory": None, "spice_level": 4, "is_veg": True, "featured": True, "tag": "King of Pickles", "allergens": ["sesame"], "image": IMG["pickle"], "available": True, "extra_categories": [],
     "description": "Chunks of raw Totapuri mango ground with mustard powder, red chilli and sesame oil — the undisputed king of Telugu pickles.",
     "seo_meta_description": "Get the taste of Andhra with our Mango Avakaya Pickle in the UK. Hand-stirred, spicy, and infused with freshly ground mustard powder."},
    {"name": "Lemon Pickle", "price": 4.49, "category": "pickles", "subcategory": None, "spice_level": 2, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["pickle"], "available": True, "extra_categories": [],
     "description": "Fresh lemons quartered and aged in ceramic jars with salt, turmeric, fenugreek and chilli powder. Fermented for weeks."},
    {"name": "Tomato Pickle", "price": 4.49, "category": "pickles", "subcategory": None, "spice_level": 2, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["pickle"], "available": True, "extra_categories": [],
     "description": "Ripe tomatoes cooked down with red chillies, tamarind and mustard into a thick, glossy pickle that brightens every meal."},
    {"name": "Velluli Pachadi", "price": 4.99, "category": "pickles", "subcategory": None, "spice_level": 3, "is_veg": True, "featured": False, "tag": "Bold", "allergens": [], "image": IMG["pickle"], "available": True, "extra_categories": [],
     "description": "Whole garlic cloves slow-cooked with dried red chillies, tamarind and mustard oil until caramelised and deeply aromatic."},
    {"name": "Allam Pachadi", "price": 4.49, "category": "pickles", "subcategory": None, "spice_level": 3, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["pickle"], "available": True, "extra_categories": [],
     "description": "Fresh ginger blended with tamarind, jaggery, chilli and mustard — the iconic Andhra chutney-pickle that accompanies pesarattu.",
     "seo_meta_description": "Buy authentic Andhra Allam Pachadi (ginger pickle) online with fast UK-wide delivery. Perfectly sweet, spicy, and tangy ginger condiment."},

    # ── PODIS ─────────────────────────────────────────────────────────────────
    {"name": "Kandi Podi", "price": 3.99, "category": "podis", "subcategory": None, "spice_level": 2, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["podi"], "available": True, "extra_categories": [],
     "description": "Roasted toor dal ground with dried chillies, cumin and asafoetida. Mixed with hot rice and ghee — the simplest, most satisfying meal.",
     "seo_meta_description": "Buy authentic, dry-roasted Kandi Podi (Paruppu Podi) online with fast UK-wide delivery. Enjoy with hot steamed rice and dollops of ghee!"},
    {"name": "Nalla Karam", "price": 3.99, "category": "podis", "subcategory": None, "spice_level": 3, "is_veg": True, "featured": False, "tag": "Fiery", "allergens": ["sesame"], "image": IMG["podi"], "available": True, "extra_categories": [],
     "description": "A fiery Andhra chutney powder of sesame, dried red chillies and garlic — stirred into hot rice with oil for an instant flavour explosion.",
     "seo_meta_description": "Add a fiery kick to your idlis and dosas. Buy authentic Andhra Nalla Karam Podi online with fast UK-wide shipping. Hand-ground."},
    {"name": "Karivepaku Podi", "price": 3.99, "category": "podis", "subcategory": None, "spice_level": 2, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["podi"], "available": True, "extra_categories": [],
     "description": "Curry leaves, urad dal and dried chillies slow-roasted and ground into a fragrant, earthy powder."},
    {"name": "Palli Podi", "price": 3.99, "category": "podis", "subcategory": None, "spice_level": 2, "is_veg": True, "featured": False, "tag": "", "allergens": ["nuts"], "image": IMG["podi"], "available": True, "extra_categories": [],
     "description": "Roasted peanuts ground with red chillies, garlic and salt into a coarse, crunchy powder. Fantastic on idli, dosa or mixed with ghee and rice."},
    {"name": "Nuvvula Podi", "price": 3.99, "category": "podis", "subcategory": None, "spice_level": 2, "is_veg": True, "featured": False, "tag": "", "allergens": ["sesame"], "image": IMG["podi"], "available": True, "extra_categories": [],
     "description": "White sesame seeds roasted with dried chillies, garlic and coconut, ground into a nutty, aromatic powder."},
    {"name": "Kobbari Podi", "price": 3.99, "category": "podis", "subcategory": None, "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["podi"], "available": True, "extra_categories": [],
     "description": "Dry-roasted coconut ground with urad dal, red chillies and curry leaves into a mildly sweet, aromatic powder."},

    # ── BREAKFAST / IDLI & VADA ──────────────────────────────────────────────
    {"name": "Idli (3 pcs)", "price": 4.99, "category": "breakfast", "subcategory": "Idli & Vada", "spice_level": 0, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["idli"], "available": True, "extra_categories": [],
     "description": "Three fluffy steamed rice cakes from 24-hour fermented batter. Served with sambar and chutneys.",
     "seo_meta_description": "Order soft, fluffy, steamed Idlis in Milton Keynes. Prepared fresh from naturally fermented batter and served with hot sambar and chutneys."},
    {"name": "Ghee Karam Idli (3 pcs)", "price": 5.99, "category": "breakfast", "subcategory": "Idli & Vada", "spice_level": 3, "is_veg": True, "featured": False, "tag": "", "allergens": ["dairy"], "image": IMG["idli"], "available": True, "extra_categories": [],
     "description": "Soft idlis tossed in warm desi ghee and fiery Andhra karam (red chilli paste). Simple heat. Pure comfort."},
    {"name": "Sambar Idli (2 pcs)", "price": 4.99, "category": "breakfast", "subcategory": "Idli & Vada", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["idli"], "available": True, "extra_categories": [],
     "description": "Soft idlis dunked in piping hot sambar and served with coconut chutney. A complete, satisfying South Indian breakfast."},
    {"name": "Vada (3 pcs)", "price": 4.99, "category": "breakfast", "subcategory": "Idli & Vada", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["idli"], "available": True, "extra_categories": [],
     "description": "Three crispy golden urad dal vadas, fried fresh to order. Served with sambar and coconut chutney.",
     "seo_meta_description": "Freshly fried, golden-brown crispy Medu Vada delivered hot in Milton Keynes. Perfectly paired with rich lentil sambar and coconut chutney."},
    {"name": "Sambar Vada (2 pcs)", "price": 4.99, "category": "breakfast", "subcategory": "Idli & Vada", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["idli"], "available": True, "extra_categories": [],
     "description": "Crispy vadas soaked in warm sambar until they absorb every drop of flavour. A South Indian café classic."},

    # ── BREAKFAST / DOSAS ────────────────────────────────────────────────────
    {"name": "Plain Dosa (2 pcs)", "price": 4.99, "category": "breakfast", "subcategory": "Dosas", "spice_level": 0, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["dosa"], "available": True, "extra_categories": [],
     "description": "Two golden, crispy plain dosas straight off the tawa. Served with sambar and coconut chutney. The classic, unadorned."},
    {"name": "Masala Dosa (2 pcs)", "price": 6.99, "category": "breakfast", "subcategory": "Dosas", "spice_level": 2, "is_veg": True, "featured": True, "tag": "Morning Favourite", "allergens": [], "image": IMG["dosa"], "available": True, "extra_categories": [],
     "description": "Paper-thin crispy rice crepe filled with spiced potato masala. Served with sambar and three chutneys. Iconic.",
     "seo_meta_description": "Order crispy, golden Masala Dosa in Milton Keynes. Stuffed with seasoned potato masala and served with hot sambar and fresh chutneys. Order now!"},
    {"name": "Ghee Dosa (2 pcs)", "price": 5.99, "category": "breakfast", "subcategory": "Dosas", "spice_level": 0, "is_veg": True, "featured": False, "tag": "", "allergens": ["dairy"], "image": IMG["dosa"], "available": True, "extra_categories": [],
     "description": "Crispy dosa roasted in a generous pour of desi ghee until golden and fragrant. Pure, simple indulgence."},
    {"name": "Carrot Dosa (2 pcs)", "price": 6.99, "category": "breakfast", "subcategory": "Dosas", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["dosa"], "available": True, "extra_categories": [],
     "description": "Dosa batter mixed with grated carrot and mild spices. Colourful, nutritious and delicately sweet."},
    {"name": "Beetroot Dosa (2 pcs)", "price": 6.99, "category": "breakfast", "subcategory": "Dosas", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["dosa"], "available": True, "extra_categories": [],
     "description": "Vibrantly pink dosa made with beetroot-infused batter. Earthy, sweet and packed with nutrients."},
    {"name": "Nellore Ghee Karam Dosa (2 pcs)", "price": 6.99, "category": "breakfast", "subcategory": "Dosas", "spice_level": 4, "is_veg": True, "featured": False, "tag": "Spicy", "allergens": ["dairy"], "image": IMG["dosa"], "available": True, "extra_categories": [],
     "description": "Nellore karam dosa elevated with desi ghee roasted in. Fiery heat meets rich butteriness."},
    {"name": "Cheese Dosa", "price": 6.99, "category": "breakfast", "subcategory": "Dosas", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": ["dairy"], "image": IMG["dosa"], "available": True, "extra_categories": [],
     "description": "Crispy dosa filled with melted cheese and spiced potato. Kids' favourite and adults' guilty pleasure."},
    {"name": "Upma Dosa", "price": 5.99, "category": "breakfast", "subcategory": "Dosas", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["dosa"], "available": True, "extra_categories": [],
     "description": "Crispy dosa filled with soft, spiced upma. A unique combination — crunchy meets fluffy."},
    {"name": "Paneer Dosa", "price": 6.99, "category": "breakfast", "subcategory": "Dosas", "spice_level": 2, "is_veg": True, "featured": False, "tag": "", "allergens": ["dairy"], "image": IMG["dosa"], "available": True, "extra_categories": [],
     "description": "Crispy dosa filled with crumbled, spiced paneer and green chillies. Rich, satisfying and utterly delicious."},
    {"name": "Butter Dosa (2 pcs)", "price": 5.99, "category": "breakfast", "subcategory": "Dosas", "spice_level": 0, "is_veg": True, "featured": False, "tag": "", "allergens": ["dairy"], "image": IMG["dosa"], "available": True, "extra_categories": [],
     "description": "Crispy dosa roasted with generous butter until golden and fragrant. Simple indulgence at its best."},

    # ── BREAKFAST / POORI & OTHERS ───────────────────────────────────────────
    {"name": "Poori (3 pcs)", "price": 5.99, "category": "breakfast", "subcategory": "Poori & Others", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": ["gluten"], "image": IMG["pongal"], "available": True, "extra_categories": [],
     "description": "Three puffed, deep-fried whole wheat puris served with a flavourful potato kurma. A royal South Indian breakfast."},
    {"name": "Poha", "price": 4.99, "category": "breakfast", "subcategory": "Poori & Others", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["pongal"], "available": True, "extra_categories": [],
     "description": "Flattened rice sautéed with mustard, turmeric, onions, green chilli and a squeeze of lime. Light, quick and wholesome."},
    {"name": "Uggani", "price": 5.99, "category": "breakfast", "subcategory": "Poori & Others", "spice_level": 2, "is_veg": True, "featured": False, "tag": "Andhra Special", "allergens": ["nuts"], "image": IMG["pongal"], "available": True, "extra_categories": [],
     "description": "Puffed rice stir-fried with onions, green chillies, peanuts and lemon in the Rayalaseema style. A unique, crunchy Andhra breakfast.",
     "seo_meta_description": "Get authentic Rayalaseema Uggani (tempered puffed rice upma) delivered hot in Milton Keynes. Best enjoyed with our crispy onion or mirchi bajjis!"},
    {"name": "Upma", "price": 3.99, "category": "breakfast", "subcategory": "Poori & Others", "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": ["gluten"], "image": IMG["pongal"], "available": True, "extra_categories": [],
     "description": "Semolina cooked with mustard, onions, green chillies and vegetables into a fluffy, spiced porridge. A South Indian morning staple.",
     "seo_meta_description": "Order warm, savory Rava Upma in Milton Keynes. Cooked with roasted semolina, fresh vegetables, ghee, and traditional tempering. Order now!"},
    {"name": "Masala Oats Upma", "price": 5.99, "category": "breakfast", "subcategory": "Poori & Others", "spice_level": 1, "is_veg": True, "featured": False, "tag": "Healthy", "allergens": ["gluten"], "image": IMG["pongal"], "available": True, "extra_categories": [],
     "description": "Steel-cut oats cooked with vegetables, mustard and spices into a light, nutritious savoury upma."},

    # ── STREET FOOD (exclusive items; cross-category items live under veg) ───
    {"name": "Veg Burger", "price": 4.99, "category": "streetFood", "subcategory": None, "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": ["gluten", "dairy"], "image": IMG["burger"], "available": True, "extra_categories": [],
     "description": "Crispy spiced veggie patty in a toasted bun with fresh lettuce, tomato, onion and our special house sauce."},
    {"name": "Chicken Burger", "price": 5.99, "category": "streetFood", "subcategory": None, "spice_level": 1, "is_veg": False, "featured": False, "tag": "", "allergens": ["gluten", "dairy"], "image": IMG["burger"], "available": True, "extra_categories": [],
     "description": "Crispy fried chicken fillet in a toasted brioche bun with coleslaw and house sauce. Juicy, crispy and utterly satisfying."},
    {"name": "Veg Wrap", "price": 5.99, "category": "streetFood", "subcategory": None, "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": ["gluten", "dairy"], "image": IMG["wrap"], "available": True, "extra_categories": [],
     "description": "Spiced roasted vegetables and paneer with mint chutney and crunchy salad, wrapped in a soft flour tortilla."},
    {"name": "Chicken Wrap", "price": 6.99, "category": "streetFood", "subcategory": None, "spice_level": 2, "is_veg": False, "featured": False, "tag": "", "allergens": ["gluten", "dairy"], "image": IMG["wrap"], "available": True, "extra_categories": [],
     "description": "Tandoori-spiced chicken strips with salad, raita and mint chutney in a warm tortilla wrap.",
     "seo_meta_description": "Get a delicious, spiced Chicken Wrap delivered in Milton Keynes. Loaded with juicy tandoori chicken, crisp salads, and fresh mint chutney."},
    {"name": "Chicken Cheese Burger", "price": 6.99, "category": "streetFood", "subcategory": None, "spice_level": 1, "is_veg": False, "featured": False, "tag": "", "allergens": ["gluten", "dairy"], "image": IMG["burger"], "available": True, "extra_categories": [],
     "description": "Juicy fried chicken with melted cheese, coleslaw and house sauce in a toasted brioche. A crowd pleaser."},
    {"name": "Veg Cheese Burger", "price": 5.99, "category": "streetFood", "subcategory": None, "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": ["gluten", "dairy"], "image": IMG["burger"], "available": True, "extra_categories": [],
     "description": "Crispy veggie patty loaded with melted cheese, fresh salad and our house sauce in a toasted bun."},
    {"name": "Pani Puri (6 pcs)", "price": 5.99, "category": "streetFood", "subcategory": None, "spice_level": 2, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["veg_starter"], "available": True, "extra_categories": [],
     "description": "Six crispy hollow puris filled with spiced potato and chickpeas, dunked in icy tamarind-mint water. India's most addictive street food.",
     "seo_meta_description": "Enjoy crispy, tangy Pani Puri delivered to your door in Milton Keynes. Complete with spiced potatoes, chickpeas, and hot mint herbal water."},
    {"name": "Veg Momos (6 pcs)", "price": 5.99, "category": "streetFood", "subcategory": None, "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": ["gluten"], "image": IMG["momos"], "available": True, "extra_categories": [],
     "description": "Six steamed dumplings filled with spiced vegetables and herbs. Served with a tangy red chutney."},
    {"name": "Chicken Momos (6 pcs)", "price": 7.99, "category": "streetFood", "subcategory": None, "spice_level": 2, "is_veg": False, "featured": False, "tag": "", "allergens": ["gluten"], "image": IMG["momos"], "available": True, "extra_categories": [],
     "description": "Six steamed dumplings filled with minced chicken and aromatics. Delicate, juicy and deeply satisfying."},

    # ── RAGI SPECIALS ─────────────────────────────────────────────────────────
    {"name": "Ragi Sangati with Chicken Curry", "price": 9.99, "category": "ragiSpecials", "subcategory": None, "spice_level": 2, "is_veg": False, "featured": True, "tag": "Traditional", "allergens": [], "image": IMG["ragi"], "available": True, "extra_categories": [],
     "description": "Firm balls of pearl millet, the traditional Telugu way, served with spicy Andhra chicken curry. Nutritious, filling and deeply rooted.",
     "seo_meta_description": "Wholesome, iron-rich Ragi Sangati (finger millet balls) delivered fresh in Milton Keynes. Perfectly paired with spicy country chicken or dal pulusu."},
    {"name": "Ragi Sangati with Mutton Curry", "price": 10.99, "category": "ragiSpecials", "subcategory": None, "spice_level": 2, "is_veg": False, "featured": False, "tag": "Traditional", "allergens": [], "image": IMG["ragi"], "available": True, "extra_categories": [],
     "description": "Hearty ragi balls paired with slow-cooked mutton curry. A rustic Andhra combination that has sustained generations."},
    {"name": "Ragi Sangati with Pappu and Pachi Pulusu", "price": 7.99, "category": "ragiSpecials", "subcategory": None, "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["ragi"], "available": True, "extra_categories": [],
     "description": "Ragi sangati with creamy Andhra dal and cooling raw tamarind rasam. A vegetarian comfort meal from the heart of Andhra."},
    {"name": "Ragi Jaava / Malt", "price": 6.99, "category": "ragiSpecials", "subcategory": None, "spice_level": 0, "is_veg": True, "featured": False, "tag": "Healthy", "allergens": ["dairy"], "image": IMG["ragi"], "available": True, "extra_categories": [],
     "description": "Smooth, warm ragi porridge with milk and jaggery. A traditional morning drink rich in calcium and iron.",
     "seo_meta_description": "Fuel your body with nutritious Ragi Jaava in Milton Keynes. Slow-cooked finger millet flour served as a warm sweet porridge or cooling savory buttermilk."},
    {"name": "Ragi Butter Milk", "price": 5.99, "category": "ragiSpecials", "subcategory": None, "spice_level": 0, "is_veg": True, "featured": False, "tag": "", "allergens": ["dairy"], "image": IMG["buttermilk"], "available": True, "extra_categories": [],
     "description": "Cool, tangy buttermilk blended with ragi flour and spices. Digestive, refreshing and deeply South Indian."},

    # ── JUICES & SOFTDRINKS ──────────────────────────────────────────────────
    {"name": "Lemon Water (Sweet)", "price": 3.99, "category": "drinks", "subcategory": None, "spice_level": 0, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["juice"], "available": True, "extra_categories": [],
     "description": "Fresh lemon juice with water and sugar. Cooling, simple and perfectly refreshing."},
    {"name": "Lemon Water (Salt)", "price": 3.99, "category": "drinks", "subcategory": None, "spice_level": 0, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["juice"], "available": True, "extra_categories": [],
     "description": "Freshly squeezed lemon juice with water and a pinch of black salt. The Indian way to rehydrate."},
    {"name": "Orange Juice", "price": 5.99, "category": "drinks", "subcategory": None, "spice_level": 0, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["juice"], "available": True, "extra_categories": [],
     "description": "Freshly squeezed sweet oranges. No added sugar, no preservatives — just pure citrus goodness."},
    {"name": "Apple Juice", "price": 5.99, "category": "drinks", "subcategory": None, "spice_level": 0, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["juice"], "available": True, "extra_categories": [],
     "description": "Freshly pressed apple juice — crisp, sweet and naturally refreshing with no added sugar."},
    {"name": "Carrot Juice", "price": 5.99, "category": "drinks", "subcategory": None, "spice_level": 0, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["juice"], "available": True, "extra_categories": [],
     "description": "Freshly pressed carrot juice, naturally sweet and packed with beta-carotene. Vibrant, healthy and delicious."},
    {"name": "ABC Juice", "price": 6.99, "category": "drinks", "subcategory": None, "spice_level": 0, "is_veg": True, "featured": False, "tag": "Healthy", "allergens": [], "image": IMG["juice"], "available": True, "extra_categories": [],
     "description": "Apple, beetroot and carrot blended fresh — a powerhouse of vitamins and natural sweetness."},
    {"name": "Pineapple Juice", "price": 6.99, "category": "drinks", "subcategory": None, "spice_level": 0, "is_veg": True, "featured": False, "tag": "", "allergens": [], "image": IMG["juice"], "available": True, "extra_categories": [],
     "description": "Freshly pressed pineapple juice — sweet, tangy and tropical. A natural mood lifter."},
    {"name": "Sweet Lassi", "price": 4.99, "category": "drinks", "subcategory": None, "spice_level": 0, "is_veg": True, "featured": False, "tag": "", "allergens": ["dairy"], "image": IMG["lassi"], "available": True, "extra_categories": [],
     "description": "Thick, chilled yoghurt blended with sugar and a hint of cardamom. Creamy, cooling and utterly indulgent.",
     "seo_meta_description": "Cool down with our smooth, sweet Lassi in Milton Keynes. Prepared with thick, fresh yoghurt and a hint of fragrant cardamom. Order online."},
    {"name": "Mango Lassi", "price": 5.99, "category": "drinks", "subcategory": None, "spice_level": 0, "is_veg": True, "featured": True, "tag": "Favourite", "allergens": ["dairy"], "image": IMG["lassi"], "available": True, "extra_categories": [],
     "description": "Ripe Alphonso mango blended with creamy yoghurt and a whisper of cardamom. The queen of Indian drinks.",
     "seo_meta_description": "Quench your thirst with sweet, creamy Mango Lassi in Milton Keynes. Blended fresh with real Alphonso mango pulp and thick, rich yoghurt."},
    {"name": "Masala Buttermilk", "price": 4.99, "category": "drinks", "subcategory": None, "spice_level": 1, "is_veg": True, "featured": False, "tag": "", "allergens": ["dairy"], "image": IMG["buttermilk"], "available": True, "extra_categories": [],
     "description": "Chilled yoghurt drink tempered with roasted cumin, ginger, coriander and green chilli. Digestive, cooling and deeply South Indian."},
    {"name": "Plant Based Chocolate Protein Shake", "price": 7.99, "category": "drinks", "subcategory": None, "spice_level": 0, "is_veg": True, "featured": False, "tag": "Vegan", "allergens": ["nuts"], "image": IMG["protein"], "available": True, "extra_categories": [],
     "description": "Rich chocolate shake made with plant-based protein powder, almond milk and cacao. Delicious and nutritious."},
    {"name": "Whey Chocolate Protein Shake", "price": 7.99, "category": "drinks", "subcategory": None, "spice_level": 0, "is_veg": True, "featured": False, "tag": "", "allergens": ["dairy"], "image": IMG["protein"], "available": True, "extra_categories": [],
     "description": "Thick, rich chocolate protein shake with premium whey, milk and cacao. Fuel your body, satisfy your sweet tooth."},
]


async def sync_menu_may_2026():
    """Rename items, unhide returning items, set extra_categories on existing DB records."""

    renames = [
        ("Gongura Chicken",         "Gongura Chicken Curry"),
        ("Gutti Vankaya",           "Gutti Vankaya Masala"),
        ("Kothimeera Rice",         "Coriander Rice"),
        ("Pappu Avakaya Rice",      "Ghee Pappu Avakaya Rice"),
        ("Special Chicken Biryani", "Special Chicken Biryani with Egg"),
        ("Veg Biriyani",            "Veg Biryani"),
        ("Lemon Water",             "Lemon Water (Sweet)"),
        ("Vada (2 pcs)",            "Vada (3 pcs)"),
        ("Sambar Vada",             "Sambar Vada (2 pcs)"),
        ("Sambar Idli",             "Sambar Idli (2 pcs)"),
        ("Ghee Idli",               "Ghee Karam Idli (3 pcs)"),
        ("Nellore Karam Dosa",      "Nellore Ghee Karam Dosa (2 pcs)"),
        ("Carrot Dosa",             "Carrot Dosa (2 pcs)"),
        ("Beetroot Dosa",           "Beetroot Dosa (2 pcs)"),
        ("Masala Dosa",             "Masala Dosa (2 pcs)"),
        ("Ghee Dosa",               "Ghee Dosa (2 pcs)"),
    ]
    for old_name, new_name in renames:
        result = await db.menu_items.update_one(
            {"name": old_name},
            {"$set": {"name": new_name}}
        )
        if result.modified_count:
            print(f"  Renamed: {old_name} → {new_name}")

    # Unhide items returning to the menu
    for name in ["Plain Dosa (2 pcs)", "Upma"]:
        await db.menu_items.update_one({"name": name}, {"$set": {"available": True}})

    # Cross-page veg starters → also appear on Street Food page
    cross_page = [
        "Veg Manchurian", "Gobi Manchurian", "Crispy Bhindi", "Crispy Corn",
        "Crispy Potato", "Onion Bhaji", "Onion Mirchi Bhajji", "Punugulu",
        "Cut Mirchi", "Panipuri", "Peanut Chat", "Channa Chat",
    ]
    for name in cross_page:
        await db.menu_items.update_one(
            {"name": name},
            {"$set": {"extra_categories": [{"category": "streetFood", "subcategory": None}]}}
        )

    # Veg Fried Rice appears in both Indo Chinese and Biriyanis & Rice tabs
    await db.menu_items.update_one(
        {"name": "Veg Fried Rice"},
        {"$set": {"extra_categories": [{"category": "veg", "subcategory": "Biriyanis & Rice"}]}}
    )

    print("May 2026 sync applied.")


async def update_item_categories():
    """Rename subcategories to May 2026 naming."""
    veg_map = {
        "Starters & Snacks": "Starters and Evening Delights",
        "Indo-Chinese":       "Indo Chinese",
        "Curries & Dal":      "Curries & Daal",
        "Biryani & Rice":     "Biriyanis & Rice",
        "Rice Specials":      "Naivedyam",
    }
    for old, new in veg_map.items():
        await db.menu_items.update_many(
            {"category": "veg", "subcategory": old},
            {"$set": {"subcategory": new}}
        )
    nonveg_map = {
        "Indo-Chinese": "Indo - Chinese",
        "Biryani":      "Biriyani",
    }
    for old, new in nonveg_map.items():
        await db.menu_items.update_many(
            {"category": "nonVeg", "subcategory": old},
            {"$set": {"subcategory": new}}
        )
    await db.menu_items.update_many(
        {"category": "breakfast", "subcategory": "Others"},
        {"$set": {"subcategory": "Poori & Others"}}
    )
    print("Subcategory migrations applied.")


async def cleanup_menu_april_2026():
    """Full sync of prices, categories, subcategories and extra_categories from MENU_ITEMS."""
    seed_by_name = {item["name"]: item for item in MENU_ITEMS}
    for name, seed_item in seed_by_name.items():
        await db.menu_items.update_one(
            {"name": name},
            {"$set": {
                "description":      seed_item["description"],
                "price":            seed_item["price"],
                "category":         seed_item["category"],
                "subcategory":      seed_item["subcategory"],
                "spice_level":      seed_item["spice_level"],
                "is_veg":           seed_item["is_veg"],
                "available":        seed_item["available"],
                "extra_categories": seed_item.get("extra_categories", []),
            }}
        )
    print("Full menu sync applied.")


async def seed_menu():
    """Step 1: rename/migrate. Step 2: insert new. Step 3: full sync."""
    import uuid
    from datetime import datetime

    await sync_menu_may_2026()

    existing_names = set()
    async for doc in db.menu_items.find({}, {"name": 1}):
        existing_names.add(doc["name"])

    new_items = [i for i in MENU_ITEMS if i["name"] not in existing_names]
    if new_items:
        docs = [
            {"id": str(uuid.uuid4()), "created_at": datetime.utcnow().isoformat(),
             "faqs": [], "pairs_with": [], **item}
            for item in new_items
        ]
        await db.menu_items.insert_many(docs)
        print(f"Seeded {len(docs)} new menu items.")
    else:
        print(f"All menu items already present — skipping seed.")

    await update_item_categories()
    await cleanup_menu_april_2026()
    await apply_seo_h1_june_2026()


SAMPLE_DAILY_SPECIALS = [
    {"title": "Hyderabadi Chicken Dum Biryani", "subtitle": "Today only — slow-cooked on embers", "price": 11.99, "image": IMG["biryani"], "link": None, "display_order": 1},
    {"title": "Gongura Mutton", "subtitle": "Chef's pick · Fresh gongura leaves", "price": 14.50, "image": IMG["curry"], "link": None, "display_order": 2},
    {"title": "Masala Dosa Combo", "subtitle": "With sambar + 3 chutneys", "price": 7.99, "image": IMG["dosa"], "link": None, "display_order": 3},
    {"title": "Andhra Thali", "subtitle": "15-item full meal · Limited plates", "price": 13.99, "image": IMG["rice"], "link": None, "display_order": 4},
    {"title": "Pesarattu Upma", "subtitle": "Breakfast special until 11am", "price": 6.50, "image": IMG["pulihora"], "link": None, "display_order": 5},
    {"title": "Avakaya Jar (200g)", "subtitle": "Fresh mango pickle · Small batch", "price": 5.99, "image": IMG["pickle"], "link": None, "display_order": 6},
    {"title": "Paneer Tikka Masala", "subtitle": "Clay-oven paneer · Rich gravy", "price": 10.99, "image": IMG["paneer"], "link": None, "display_order": 7},
    {"title": "Mysore Bonda + Filter Coffee", "subtitle": "Evening snack combo", "price": 4.50, "image": IMG["veg_starter"], "link": None, "display_order": 8},
]


async def seed_daily_specials():
    import uuid
    from datetime import datetime
    count = await db.daily_specials.count_documents({})
    if count > 0:
        return
    docs = [
        {"id": str(uuid.uuid4()), "active": True,
         "created_at": datetime.utcnow().isoformat(),
         "updated_at": datetime.utcnow().isoformat(), **item}
        for item in SAMPLE_DAILY_SPECIALS
    ]
    await db.daily_specials.insert_many(docs)
    print(f"Seeded {len(docs)} daily specials.")


async def apply_seo_h1_june_2026():
    """Set seo_h1 on all 50 featured dish pages for ItemDetail.jsx H1 optimisation."""
    SEO_H1 = {
        "Chicken 65":                           "Crispy Chicken 65 Starter in Milton Keynes",
        "Chicken Tikka":                         "Authentic Chicken Tikka in Milton Keynes",
        "Tandoori Chicken":                      "Juicy Tandoori Chicken in Milton Keynes",
        "Chicken Curry":                         "Home-Style Chicken Curry in Milton Keynes",
        "Tomato Chicken Curry":                  "Authentic Tomato Chicken Curry in Milton Keynes",
        "Gongura Chicken Curry":                 "Iconic Gongura Chicken Curry in Milton Keynes",
        "Dum Chicken Curry":                     "Rich Dum Chicken Curry in Milton Keynes",
        "Butter Chicken":                        "Creamy Butter Chicken Delivery in Milton Keynes",
        "Andhra Egg Curry":                      "Spicy Andhra Egg Curry in Milton Keynes",
        "Egg Kurma":                             "Creamy Egg Kurma in Milton Keynes",
        "Spicy Andhra Chicken":                  "Fiery Spicy Andhra Chicken in Milton Keynes",
        "Mutton Curry":                          "Tender Mutton Curry in Milton Keynes",
        "Spicy Andhra Mutton":                   "Fiery Andhra Mutton Curry in Milton Keynes",
        "Gongura Mutton":                        "Iconic Gongura Mutton in Milton Keynes",
        "Fish Pulusu":                           "Authentic Andhra Fish Pulusu in Milton Keynes",
        "Prawns Iguru":                          "Traditional Prawns Iguru in Milton Keynes",
        "Chicken Biryani":                       "Authentic Chicken Biryani in Milton Keynes",
        "Special Chicken Biryani with Egg":      "Special Chicken Biryani with Egg in Milton Keynes",
        "Chicken Fry Piece Biryani":             "Andhra Chicken Fry Piece Biryani in Milton Keynes",
        "Mutton Biriyani":                       "Slow-Cooked Mutton Biryani in Milton Keynes",
        "Egg Biryani":                           "Fragrant Egg Biryani Delivery in Milton Keynes",
        "Onion Bhaji":                           "Golden Crispy Onion Bhaji in Milton Keynes",
        "Gongura Pappu":                         "Authentic Andhra Gongura Pappu in Milton Keynes",
        "Sambar":                                "Authentic South Indian Sambar in Milton Keynes",
        "Rasam":                                 "Warming Andhra Rasam in Milton Keynes",
        "Bhindi Pulusu":                         "Tangy Bhindi Pulusu in Milton Keynes",
        "Paneer Butter Masala":                  "Rich Paneer Butter Masala in Milton Keynes",
        "Gutti Vankaya Masala":                  "Gutti Vankaya — Stuffed Brinjal Curry in Milton Keynes",
        "Perugu Pulusu":                         "Traditional Andhra Perugu Pulusu in Milton Keynes",
        "Pulihora":                              "Sacred Pulihora (Tamarind Rice) in Milton Keynes",
        "Prasadam Pulihora":                     "Divine Temple-Style Prasadam Pulihora in Milton Keynes",
        "Pongal":                                "Comforting Ven Pongal in Milton Keynes",
        "Chekara Pongal":                        "Sweet Chakkara Pongal in Milton Keynes",
        "Veg Biryani":                           "Aromatic Veg Biryani Delivery in Milton Keynes",
        "Gongura Pickle":                        "Buy Authentic Gongura Pickle Online — UK Delivery",
        "Mango Avakaya":                         "Buy Mango Avakaya Pickle Online — UK Delivery",
        "Allam Pachadi":                         "Buy Andhra Allam Pachadi (Ginger Pickle) Online",
        "Kandi Podi":                            "Buy Authentic Kandi Podi (Lentil Spice Mix) Online",
        "Nalla Karam":                           "Buy Fiery Andhra Nalla Karam Podi Online",
        "Idli (3 pcs)":                          "Fresh Steamed Idli Delivery in Milton Keynes",
        "Vada (3 pcs)":                          "Crispy Golden Medu Vada in Milton Keynes",
        "Masala Dosa (2 pcs)":                   "Crispy Masala Dosa Delivery in Milton Keynes",
        "Uggani":                                "Authentic Andhra Uggani (Puffed Rice Upma) in Milton Keynes",
        "Upma":                                  "Traditional South Indian Rava Upma in Milton Keynes",
        "Chicken Wrap":                          "Spiced Chicken Wrap Delivery in Milton Keynes",
        "Pani Puri (6 pcs)":                     "Crispy Pani Puri Street Food in Milton Keynes",
        "Ragi Sangati with Chicken Curry":       "Nutritious Ragi Sangati with Chicken Curry in Milton Keynes",
        "Ragi Jaava / Malt":                     "Healthy Ragi Jaava (Finger Millet Porridge) in Milton Keynes",
        "Sweet Lassi":                           "Thick and Creamy Sweet Lassi in Milton Keynes",
        "Mango Lassi":                           "Fresh Mango Lassi Delivery in Milton Keynes",
    }
    for name, h1 in SEO_H1.items():
        await db.menu_items.update_one({"name": name}, {"$set": {"seo_h1": h1}})
    print(f"Applied seo_h1 to {len(SEO_H1)} menu items.")


async def create_indexes():
    await db.menu_items.create_index("id", unique=True)
    await db.menu_items.create_index("category")
    await db.menu_items.create_index([("extra_categories.category", 1)])
    await db.users.create_index("id", unique=True)
    await db.users.create_index("email", unique=True)
    await db.orders.create_index("id", unique=True)
    await db.orders.create_index("payment_intent_id", unique=True, sparse=True)
    await db.daily_specials.create_index("id", unique=True)


import os

async def create_admin_user():
    import uuid, bcrypt
    from datetime import datetime

    admins_to_seed = []
    email = os.environ.get("ADMIN_EMAIL")
    password = os.environ.get("ADMIN_PASSWORD")
    if email and password:
        admins_to_seed.append((email, password, "Admin"))
    email2 = os.environ.get("ADMIN_EMAIL_2")
    password2 = os.environ.get("ADMIN_PASSWORD_2")
    if email2 and password2:
        admins_to_seed.append((email2, password2, "Admin"))

    for adm_email, adm_password, adm_name in admins_to_seed:
        existing = await db.users.find_one({"email": adm_email})
        hashed = bcrypt.hashpw(adm_password.encode(), bcrypt.gensalt()).decode()
        if existing:
            await db.users.update_one(
                {"email": adm_email},
                {"$set": {"role": "admin", "password": hashed}}
            )
            print(f"Admin user updated: {adm_email}")
        else:
            await db.users.insert_one({
                "id": str(uuid.uuid4()),
                "name": adm_name,
                "email": adm_email,
                "password": hashed,
                "role": "admin",
                "created_at": datetime.utcnow().isoformat(),
            })
            print(f"Admin user created: {adm_email}")


GALLERY_SEED = [
    {"id": 1, "order": 1,  "src": "https://images.unsplash.com/photo-1587409059079-e1f9f840caa0?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", "alt": "Traditional brass vessels with sweets", "category": "Kitchen"},
    {"id": 2, "order": 2,  "src": "https://images.unsplash.com/photo-1773209927959-b2959be5e684?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", "alt": "Chicken curry in clay pot", "category": "Svadista"},
    {"id": 3, "order": 3,  "src": "https://images.unsplash.com/photo-1742281257687-092746ad6021?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", "alt": "Traditional South Indian thali", "category": "Prasada"},
    {"id": 4, "order": 4,  "src": "https://images.unsplash.com/photo-1599043513900-ed6fe01d3833?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", "alt": "Fragrant biriyani", "category": "Svadista"},
    {"id": 5, "order": 5,  "src": "https://images.unsplash.com/photo-1743615467363-250466982515?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", "alt": "Masala Dosa on banana leaf", "category": "Breakfast"},
    {"id": 6, "order": 6,  "src": "https://images.unsplash.com/photo-1588594907301-823478af8be5?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", "alt": "Spices tempering in oil", "category": "Kitchen"},
    {"id": 7, "order": 7,  "src": "https://images.unsplash.com/photo-1660541880621-2c37ce3a88b4?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", "alt": "Pickle jars on wooden shelf", "category": "Snacks"},
    {"id": 8, "order": 8,  "src": "https://images.unsplash.com/photo-1652250406978-622a4d19e7e3?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", "alt": "Traditional cooking process", "category": "Kitchen"},
    {"id": 9, "order": 9,  "src": "https://images.unsplash.com/photo-1752673508949-f4aeeaef75f0?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", "alt": "Rice in clay bowl", "category": "Prasada"},
    {"id": 10, "order": 10, "src": "https://images.unsplash.com/photo-1666251214695-405f673b396a?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", "alt": "Temple prasadam offering", "category": "Prasada"},
    {"id": 11, "order": 11, "src": "https://images.unsplash.com/photo-1606791422814-b32c705e3e2f?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", "alt": "Cooking in traditional pan", "category": "Kitchen"},
    {"id": 12, "order": 12, "src": "https://images.unsplash.com/photo-1748323123788-87a32949f4b0?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", "alt": "Traditional Indian kitchen", "category": "Kitchen"},
]

FAQ_SEED = [
    {"order": 0, "category": "Ordering & Delivery", "items": [
        {"q": "Where do you deliver?", "a": "We deliver full meals and subscriptions in Milton Keynes. Snacks, pickles, and podis ship UK-wide."},
        {"q": "What are the delivery charges?", "a": "Delivery is free for orders over £30 in Milton Keynes. Below £30, a delivery fee applies based on your zone. UK-wide snack shipping is free over £25."},
        {"q": "What is the minimum order?", "a": "£15 for meal delivery in Milton Keynes. £10 for UK-wide snack orders."},
        {"q": "How long does delivery take?", "a": "30–60 minutes in Milton Keynes. UK-wide snack orders arrive in 2–3 business days."},
        {"q": "What are your delivery hours?", "a": "Mon–Fri: 11am–10pm, Sat–Sun: 10am–11pm. Breakfast delivery available from 8am on weekends."},
    ]},
    {"order": 1, "category": "Subscriptions (Dabba Wala)", "items": [
        {"q": "How does the Dabba Wala subscription work?", "a": "Choose your plan (Weekly/Monthly/Family), select your box type (Prasada/Svadista/Mixed), set any dietary preferences, and pick your start date. Freshly cooked meals are delivered to your door on your chosen days."},
        {"q": "Can I pause or cancel my subscription?", "a": "Yes! You can pause, resume, or cancel anytime with 24 hours notice. No penalty."},
        {"q": "What comes in a typical dabba (tiffin)?", "a": "Each meal includes rice/roti, a main curry, dal or sambar, a side dish, pickle/chutney, and papad. Portions are generous for one adult."},
        {"q": "Can I switch between Prasada and Svadista boxes?", "a": "Absolutely. With the Mixed Box option, we alternate between veg and non-veg meals. You can also switch your box type at any time."},
    ]},
    {"order": 2, "category": "Food & Dietary", "items": [
        {"q": "Is the Prasada menu truly 100% vegetarian?", "a": "Yes. Our Prasada kitchen is completely separate with different utensils, cooking oils, and preparation areas. No cross-contamination whatsoever. Suitable for strict vegetarians and Jain preferences."},
        {"q": "Do you cater for allergies?", "a": "We clearly mark allergens (nuts, dairy, gluten, sesame) on all our dishes. For severe allergies, please contact us directly and we will accommodate your needs."},
        {"q": "Are your dishes spicy?", "a": "Spice levels vary. Each dish has a spice meter (1–5 flames). You can request \"less spicy\" in your subscription preferences or while ordering."},
        {"q": "Do you use MSG or artificial flavours?", "a": "Never. All our food is cooked with fresh, natural ingredients using traditional methods. No preservatives, no shortcuts."},
    ]},
    {"order": 3, "category": "Catering & Events", "items": [
        {"q": "How far in advance should I book catering?", "a": "We recommend at least 7 days for small events and 2–3 weeks for large functions (50+ guests). For temple poojas, 3–5 days notice is usually sufficient."},
        {"q": "Do you provide utensils and serving?", "a": "Yes, we offer full-service catering including crockery, serving staff, and setup. This can be discussed when you submit your enquiry."},
        {"q": "What is the minimum guest count for catering?", "a": "We cater for events starting from 10 guests. No event is too small or too large."},
    ]},
    {"order": 4, "category": "Payment & General", "items": [
        {"q": "What payment methods do you accept?", "a": "We accept all major credit/debit cards, Apple Pay, Google Pay, and bank transfers. Cash on delivery available in Milton Keynes."},
        {"q": "How do I contact you?", "a": "Call us at +44 73 0711 9962, WhatsApp the same number, or email hello@sreesvadista.co.uk. You can also use the contact form on our website."},
    ]},
]


async def seed_content():
    """Seed gallery images and FAQ data if collections are empty."""
    if not await db.gallery_images.count_documents({}):
        await db.gallery_images.insert_many(GALLERY_SEED)
        print(f"Seeded {len(GALLERY_SEED)} gallery images")
    if not await db.faq_data.count_documents({}):
        await db.faq_data.insert_many(FAQ_SEED)
        print(f"Seeded {len(FAQ_SEED)} FAQ categories")
