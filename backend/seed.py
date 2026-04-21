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
    "misc":         "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
}

MENU_ITEMS = [
    # ── NON-VEG STARTERS ────────────────────────────────────────────────────
    {
        "name": "Chicken 65",
        "description": "Deep-fried chicken marinated in a fiery blend of yoghurt, red chillies and curry leaves. Crispy outside, juicy inside — India's most beloved starter.",
        "price": 8.49, "category": "nonVeg", "subcategory": "Starters",
        "spice_level": 3, "is_veg": False, "featured": True, "tag": "⭐ Bestseller",
        "allergens": ["dairy"], "image": IMG["chicken_dry"], "available": True,
    },
    {
        "name": "Chilli Chicken",
        "description": "Crispy fried chicken tossed in a bold Indo-Chinese sauce of soy, garlic, green chilli and spring onions.",
        "price": 7.99, "category": "nonVeg", "subcategory": "Starters",
        "spice_level": 3, "is_veg": False, "featured": False, "tag": "",
        "allergens": ["soy"], "image": IMG["chicken_dry"], "available": True,
    },
    {
        "name": "Chicken Lollipop",
        "description": "Frenched chicken winglets marinated in spices and fried until crispy. Fun to eat, impossible to stop at one.",
        "price": 8.99, "category": "nonVeg", "subcategory": "Starters",
        "spice_level": 2, "is_veg": False, "featured": False, "tag": "",
        "allergens": [], "image": IMG["chicken_dry"], "available": True,
    },
    {
        "name": "Dragon Chicken",
        "description": "Crispy chicken tossed in a bold, tangy dragon sauce with capsicum, cashews and dried chillies. Sizzling and spectacular.",
        "price": 8.99, "category": "nonVeg", "subcategory": "Starters",
        "spice_level": 3, "is_veg": False, "featured": False, "tag": "",
        "allergens": ["soy", "nuts"], "image": IMG["chicken_dry"], "available": True,
    },
    {
        "name": "Chicken Tikka",
        "description": "Boneless chicken marinated overnight in yoghurt and spices, skewered and cooked in a tandoor until charred and juicy.",
        "price": 9.49, "category": "nonVeg", "subcategory": "Starters",
        "spice_level": 2, "is_veg": False, "featured": False, "tag": "",
        "allergens": ["dairy"], "image": IMG["tikka"], "available": True,
    },
    {
        "name": "Tandoori Chicken",
        "description": "Half chicken marinated in a vibrant red masala of yoghurt, kashmiri chilli and whole spices, roasted in a clay tandoor.",
        "price": 9.99, "category": "nonVeg", "subcategory": "Starters",
        "spice_level": 2, "is_veg": False, "featured": False, "tag": "",
        "allergens": ["dairy"], "image": IMG["tikka"], "available": True,
    },
    {
        "name": "Pepper Chicken",
        "description": "Dry-fried chicken with freshly cracked black pepper, curry leaves and green chillies. Punchy, aromatic and deeply satisfying.",
        "price": 8.99, "category": "nonVeg", "subcategory": "Starters",
        "spice_level": 3, "is_veg": False, "featured": False, "tag": "",
        "allergens": [], "image": IMG["chicken_dry"], "available": True,
    },
    {
        "name": "Chicken Fry",
        "description": "Bone-in chicken pieces marinated in Andhra spices and deep-fried to a crispy, golden finish. Straight from the village kadai.",
        "price": 8.49, "category": "nonVeg", "subcategory": "Starters",
        "spice_level": 3, "is_veg": False, "featured": False, "tag": "",
        "allergens": [], "image": IMG["chicken_dry"], "available": True,
    },
    {
        "name": "Chicken Ghee Roast",
        "description": "Chicken slow-roasted in pure desi ghee with a Mangalorean spice paste of red chillies, tamarind and aromatic spices. A true showstopper.",
        "price": 9.99, "category": "nonVeg", "subcategory": "Starters",
        "spice_level": 3, "is_veg": False, "featured": True, "tag": "⭐ Chef's Pick",
        "allergens": ["dairy"], "image": IMG["tikka"], "available": True,
    },
    {
        "name": "Chicken Majestic",
        "description": "A Hyderabadi party starter — fried chicken tossed with yoghurt, spring onions, green chillies and curry leaves in a dry masala.",
        "price": 9.49, "category": "nonVeg", "subcategory": "Starters",
        "spice_level": 3, "is_veg": False, "featured": False, "tag": "Hyderabadi",
        "allergens": ["dairy"], "image": IMG["chicken_dry"], "available": True,
    },
    {
        "name": "Liver Fry",
        "description": "Chicken liver sautéed with onions, green chillies and freshly ground spices. Rich, earthy and a true Telugu delicacy.",
        "price": 8.49, "category": "nonVeg", "subcategory": "Starters",
        "spice_level": 3, "is_veg": False, "featured": False, "tag": "",
        "allergens": [], "image": IMG["chicken_dry"], "available": True,
    },
    {
        "name": "Prawns Ghee Roast",
        "description": "Juicy prawns roasted in desi ghee with a fiery Mangalorean spice paste. Rich, buttery and intensely flavourful.",
        "price": 11.99, "category": "nonVeg", "subcategory": "Starters",
        "spice_level": 3, "is_veg": False, "featured": False, "tag": "Coastal ⭐",
        "allergens": ["shellfish", "dairy"], "image": IMG["tikka"], "available": True,
    },
    {
        "name": "Chicken Manchurian",
        "description": "Crispy chicken pieces tossed in a tangy, spicy Manchurian sauce with garlic, ginger and spring onions. Indo-Chinese at its finest.",
        "price": 7.99, "category": "nonVeg", "subcategory": "Starters",
        "spice_level": 3, "is_veg": False, "featured": False, "tag": "",
        "allergens": ["soy"], "image": IMG["chicken_dry"], "available": True,
    },
    {
        "name": "Whole Grilled Chicken",
        "description": "A whole chicken marinated in aromatic spices and slow-grilled until the skin is charred and the meat falls off the bone.",
        "price": 12.99, "category": "nonVeg", "subcategory": "Starters",
        "spice_level": 2, "is_veg": False, "featured": True, "tag": "Showstopper",
        "allergens": [], "image": IMG["tikka"], "available": True,
    },
    {
        "name": "Garlic Pepper Chicken",
        "description": "Tender chicken tossed with roasted garlic, cracked pepper and curry leaves in a dry masala. Bold, aromatic and irresistible.",
        "price": 9.49, "category": "nonVeg", "subcategory": "Starters",
        "spice_level": 3, "is_veg": False, "featured": False, "tag": "",
        "allergens": [], "image": IMG["chicken_dry"], "available": True,
    },
    {
        "name": "Chicken Pakoda",
        "description": "Bite-sized chicken pieces dipped in spiced chickpea batter and deep-fried until golden and crunchy. Perfect with a cup of chai.",
        "price": 8.49, "category": "nonVeg", "subcategory": "Starters",
        "spice_level": 2, "is_veg": False, "featured": False, "tag": "",
        "allergens": [], "image": IMG["chicken_dry"], "available": True,
    },

    # ── NON-VEG CURRIES ──────────────────────────────────────────────────────
    {
        "name": "Chicken Curry",
        "description": "Classic bone-in chicken curry cooked with onions, tomatoes and a freshly ground spice blend. Homestyle, hearty and delicious.",
        "price": 8.99, "category": "nonVeg", "subcategory": "Curries",
        "spice_level": 2, "is_veg": False, "featured": False, "tag": "",
        "allergens": [], "image": IMG["curry"], "available": True,
    },
    {
        "name": "Gongura Chicken",
        "description": "Tender chicken pieces slow-cooked with tangy gongura (sorrel) leaves and Andhra spices. A signature dish of the Krishna delta.",
        "price": 9.49, "category": "nonVeg", "subcategory": "Curries",
        "spice_level": 3, "is_veg": False, "featured": True, "tag": "⭐ Signature",
        "allergens": [], "image": IMG["curry"], "available": True,
    },
    {
        "name": "Butter Chicken",
        "description": "Tender chicken in a silky, mildly spiced tomato-cream sauce with butter and kasuri methi. A universally loved classic.",
        "price": 9.99, "category": "nonVeg", "subcategory": "Curries",
        "spice_level": 1, "is_veg": False, "featured": False, "tag": "Mild",
        "allergens": ["dairy"], "image": IMG["curry"], "available": True,
    },
    {
        "name": "Spicy Andhra Chicken",
        "description": "Bone-in chicken cooked in an intensely spiced Andhra masala with raw onions and green chillies. Not for the faint-hearted.",
        "price": 9.49, "category": "nonVeg", "subcategory": "Curries",
        "spice_level": 4, "is_veg": False, "featured": False, "tag": "Extra Spicy",
        "allergens": [], "image": IMG["curry"], "available": True,
    },
    {
        "name": "Tomato Chicken Curry",
        "description": "Chicken simmered in a bright, tangy tomato-based gravy with whole spices and fresh curry leaves. Light, vibrant and deeply flavourful.",
        "price": 8.99, "category": "nonVeg", "subcategory": "Curries",
        "spice_level": 2, "is_veg": False, "featured": False, "tag": "",
        "allergens": [], "image": IMG["curry"], "available": True,
    },
    {
        "name": "Dum Chicken Curry",
        "description": "Chicken sealed in a rich spice paste and slow-cooked dum-style until the meat absorbs every layer of flavour. Patient cooking, extraordinary taste.",
        "price": 9.49, "category": "nonVeg", "subcategory": "Curries",
        "spice_level": 2, "is_veg": False, "featured": False, "tag": "",
        "allergens": [], "image": IMG["curry"], "available": True,
    },
    {
        "name": "Mutton Curry",
        "description": "Slow-cooked bone-in mutton in a rich, aromatic gravy of onions, tomatoes and whole spices. Worth every minute of the wait.",
        "price": 11.99, "category": "nonVeg", "subcategory": "Curries",
        "spice_level": 2, "is_veg": False, "featured": False, "tag": "",
        "allergens": [], "image": IMG["curry"], "available": True,
    },
    {
        "name": "Gongura Mutton",
        "description": "Tender mutton braised with pungent gongura leaves in an Andhra-style gravy. A legendary combination — tangy, spicy, unforgettable.",
        "price": 12.99, "category": "nonVeg", "subcategory": "Curries",
        "spice_level": 3, "is_veg": False, "featured": True, "tag": "⭐ Signature",
        "allergens": [], "image": IMG["curry"], "available": True,
    },
    {
        "name": "Spicy Andhra Mutton",
        "description": "Bone-in mutton cooked in a fierce Andhra red chilli masala. Fiery, bold and unapologetically spicy — for those who love the heat.",
        "price": 12.49, "category": "nonVeg", "subcategory": "Curries",
        "spice_level": 4, "is_veg": False, "featured": False, "tag": "Extra Spicy",
        "allergens": [], "image": IMG["curry"], "available": True,
    },
    {
        "name": "Fish Pulusu",
        "description": "Fresh fish fillets simmered in a tangy tamarind gravy with onions and Andhra coastal spices. Light, flavourful and deeply satisfying.",
        "price": 10.99, "category": "nonVeg", "subcategory": "Curries",
        "spice_level": 2, "is_veg": False, "featured": False, "tag": "Coastal",
        "allergens": ["fish"], "image": IMG["curry"], "available": True,
    },
    {
        "name": "Prawns Iguru",
        "description": "Tiger prawns cooked in a thick, spiced Andhra masala with onions, tomatoes and curry leaves. Bold, coastal and magnificent.",
        "price": 11.99, "category": "nonVeg", "subcategory": "Curries",
        "spice_level": 3, "is_veg": False, "featured": False, "tag": "Coastal",
        "allergens": ["shellfish"], "image": IMG["curry"], "available": True,
    },
    {
        "name": "Andhra Egg Curry",
        "description": "Boiled eggs simmered in a bold Andhra-style gravy of onions, tomatoes and freshly ground spices. Comforting and full of character.",
        "price": 7.99, "category": "nonVeg", "subcategory": "Curries",
        "spice_level": 2, "is_veg": False, "featured": False, "tag": "",
        "allergens": ["eggs"], "image": IMG["egg"], "available": True,
    },
    {
        "name": "Egg Kurma",
        "description": "Eggs nestled in a mild, creamy coconut-based korma sauce with cashews and aromatic spices. Gentle, rich and satisfying.",
        "price": 7.49, "category": "nonVeg", "subcategory": "Curries",
        "spice_level": 1, "is_veg": False, "featured": False, "tag": "",
        "allergens": ["eggs", "nuts"], "image": IMG["egg"], "available": True,
    },

    # ── NON-VEG BIRYANI ──────────────────────────────────────────────────────
    {
        "name": "Chicken Biryani",
        "description": "Tender chicken layered with fragrant basmati, fried onions and whole spices — sealed and dum-cooked for deep, complex flavour.",
        "price": 9.99, "category": "nonVeg", "subcategory": "Biryani",
        "spice_level": 2, "is_veg": False, "featured": True, "tag": "Popular",
        "allergens": ["dairy"], "image": IMG["biryani"], "available": True,
    },
    {
        "name": "Special Chicken Biryani",
        "description": "Our premium biryani — extra chicken, whole spices, saffron milk and a slow dum cook. Truly special in every sense.",
        "price": 11.99, "category": "nonVeg", "subcategory": "Biryani",
        "spice_level": 2, "is_veg": False, "featured": True, "tag": "⭐ Premium",
        "allergens": ["dairy"], "image": IMG["biryani"], "available": True,
    },
    {
        "name": "Chicken Fry Piece Biryani",
        "description": "Biryani made with crispy fried chicken pieces layered into aromatic basmati. The best of both worlds — fried and dum.",
        "price": 11.99, "category": "nonVeg", "subcategory": "Biryani",
        "spice_level": 3, "is_veg": False, "featured": False, "tag": "",
        "allergens": ["dairy"], "image": IMG["biryani"], "available": True,
    },
    {
        "name": "Mutton Biriyani",
        "description": "Tender mutton pieces marinated overnight, layered with fragrant basmati and sealed with dough — slow-cooked dum style until every grain is infused with flavour.",
        "price": 17.99, "category": "nonVeg", "subcategory": "Biryani",
        "spice_level": 3, "is_veg": False, "featured": True, "tag": "Chef's Pick",
        "allergens": ["dairy"], "image": IMG["biryani"], "available": True,
    },
    {
        "name": "Egg Biryani",
        "description": "Boiled eggs marinated in masala, layered with fragrant basmati and dum-cooked. A flavourful, budget-friendly biryani.",
        "price": 8.49, "category": "nonVeg", "subcategory": "Biryani",
        "spice_level": 2, "is_veg": False, "featured": False, "tag": "",
        "allergens": ["eggs", "dairy"], "image": IMG["biryani"], "available": True,
    },

    # ── NON-VEG INDO-CHINESE ─────────────────────────────────────────────────
    {
        "name": "Chicken Noodles",
        "description": "Wok-tossed noodles with tender chicken strips, vegetables, soy sauce and chilli. Flavourful, filling and quick.",
        "price": 8.49, "category": "nonVeg", "subcategory": "Indo-Chinese",
        "spice_level": 2, "is_veg": False, "featured": False, "tag": "",
        "allergens": ["soy", "gluten"], "image": IMG["noodles"], "available": True,
    },
    {
        "name": "Egg Noodles",
        "description": "Stir-fried noodles with scrambled egg, vegetables and a blend of Indo-Chinese sauces. A classic done right.",
        "price": 7.99, "category": "nonVeg", "subcategory": "Indo-Chinese",
        "spice_level": 2, "is_veg": False, "featured": False, "tag": "",
        "allergens": ["eggs", "soy", "gluten"], "image": IMG["noodles"], "available": True,
    },
    {
        "name": "Chicken Fried Rice",
        "description": "Wok-tossed basmati with tender chicken, eggs, vegetables and soy sauce. Light, flavourful and satisfying.",
        "price": 8.99, "category": "nonVeg", "subcategory": "Indo-Chinese",
        "spice_level": 1, "is_veg": False, "featured": False, "tag": "",
        "allergens": ["eggs", "soy"], "image": IMG["fried_rice"], "available": True,
    },
    {
        "name": "Egg Fried Rice",
        "description": "Basmati fried with scrambled eggs, spring onions and soy sauce in a hot wok. Simple, classic, always hits the spot.",
        "price": 7.99, "category": "nonVeg", "subcategory": "Indo-Chinese",
        "spice_level": 1, "is_veg": False, "featured": False, "tag": "",
        "allergens": ["eggs", "soy"], "image": IMG["fried_rice"], "available": True,
    },

    # ── EGG SPECIALS ─────────────────────────────────────────────────────────
    {
        "name": "Egg Masala",
        "description": "Boiled eggs halved and simmered in a spiced onion-tomato masala. Simple, satisfying and pairs perfectly with any rice or bread.",
        "price": 6.99, "category": "nonVeg", "subcategory": "Egg Specials",
        "spice_level": 2, "is_veg": False, "featured": False, "tag": "",
        "allergens": ["eggs"], "image": IMG["egg"], "available": True,
    },
    {
        "name": "Egg Bhurji",
        "description": "Scrambled eggs cooked with onions, tomatoes, green chillies and spices. Street-style, quick and utterly comforting.",
        "price": 6.49, "category": "nonVeg", "subcategory": "Egg Specials",
        "spice_level": 2, "is_veg": False, "featured": False, "tag": "",
        "allergens": ["eggs"], "image": IMG["egg"], "available": True,
    },
    {
        "name": "Egg Dosa",
        "description": "Crispy dosa with a spiced egg omelette spread inside. A protein-packed South Indian breakfast favourite.",
        "price": 5.99, "category": "nonVeg", "subcategory": "Egg Specials",
        "spice_level": 1, "is_veg": False, "featured": False, "tag": "",
        "allergens": ["eggs"], "image": IMG["dosa"], "available": True,
    },
    {
        "name": "Chicken Keema Dosa",
        "description": "Crispy dosa filled with spiced minced chicken keema, onions and green chillies. A hearty, indulgent breakfast.",
        "price": 7.99, "category": "nonVeg", "subcategory": "Egg Specials",
        "spice_level": 2, "is_veg": False, "featured": False, "tag": "",
        "allergens": [], "image": IMG["dosa"], "available": True,
    },
    {
        "name": "Mutton Keema Dosa",
        "description": "Thin, crispy dosa loaded with richly spiced minced mutton keema. Bold, meaty and deeply satisfying.",
        "price": 8.99, "category": "nonVeg", "subcategory": "Egg Specials",
        "spice_level": 3, "is_veg": False, "featured": False, "tag": "",
        "allergens": [], "image": IMG["dosa"], "available": True,
    },
    {
        "name": "Bread Omelette",
        "description": "Fluffy spiced omelette sandwiched in soft buttered bread. A beloved Indian street breakfast — simple and filling.",
        "price": 4.99, "category": "nonVeg", "subcategory": "Egg Specials",
        "spice_level": 1, "is_veg": False, "featured": False, "tag": "",
        "allergens": ["eggs", "gluten", "dairy"], "image": IMG["egg"], "available": True,
    },

    # ── VEG STARTERS & SNACKS ─────────────────────────────────────────────────
    {
        "name": "Punugulu",
        "description": "Bite-sized idli batter fritters deep-fried until puffed and golden. Tossed with curry leaves and chilli powder.",
        "price": 5.99, "category": "veg", "subcategory": "Starters & Snacks",
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["veg_starter"], "available": True,
    },
    {
        "name": "Veg Manchurian",
        "description": "Crispy vegetable dumplings tossed in a tangy Indo-Chinese Manchurian sauce with garlic, ginger and spring onions.",
        "price": 6.49, "category": "veg", "subcategory": "Starters & Snacks",
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["soy"], "image": IMG["veg_starter"], "available": True,
    },
    {
        "name": "Gobi Manchurian",
        "description": "Crispy cauliflower florets tossed in a spicy Manchurian sauce. A crowd favourite — crunchy, tangy and deeply satisfying.",
        "price": 6.99, "category": "veg", "subcategory": "Starters & Snacks",
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "Popular",
        "allergens": ["soy"], "image": IMG["veg_starter"], "available": True,
    },
    {
        "name": "Crispy Bhindi",
        "description": "Sliced okra coated in a spiced chickpea batter and deep-fried until perfectly crispy. Addictive as a starter or snack.",
        "price": 6.49, "category": "veg", "subcategory": "Starters & Snacks",
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["veg_starter"], "available": True,
    },
    {
        "name": "Crispy Corn",
        "description": "Sweet corn kernels tossed with spices, herbs and a squeeze of lime — light, crunchy and bursting with flavour.",
        "price": 5.99, "category": "veg", "subcategory": "Starters & Snacks",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["veg_starter"], "available": True,
    },
    {
        "name": "Crispy Potato",
        "description": "Thin potato slices fried to golden perfection, seasoned with chaat masala and chilli. Simple, irresistible.",
        "price": 5.49, "category": "veg", "subcategory": "Starters & Snacks",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["veg_starter"], "available": True,
    },
    {
        "name": "Onion Bhaji",
        "description": "Sliced onions in a spiced chickpea batter, fried to golden crispness. Served with mint chutney — the perfect monsoon snack.",
        "price": 4.99, "category": "veg", "subcategory": "Starters & Snacks",
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["veg_starter"], "available": True,
    },
    {
        "name": "Cut Mirchi",
        "description": "Long green chillies stuffed with a tangy besan and spice mix, dipped in batter and fried. A fiery Hyderabadi street classic.",
        "price": 5.49, "category": "veg", "subcategory": "Starters & Snacks",
        "spice_level": 4, "is_veg": True, "featured": False, "tag": "Spicy",
        "allergens": [], "image": IMG["veg_starter"], "available": True,
    },
    {
        "name": "Onion Mirchi Bhajji",
        "description": "Thick-sliced onions and green chillies dipped in a spiced gram flour batter and fried until golden. Crunchy, fiery and perfect with tea.",
        "price": 5.49, "category": "veg", "subcategory": "Starters & Snacks",
        "spice_level": 3, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["veg_starter"], "available": True,
    },
    {
        "name": "Panipuri",
        "description": "Hollow crispy puris filled with spiced potato, chickpeas and tangy tamarind water. India's most beloved street food — best eaten fast!",
        "price": 4.99, "category": "veg", "subcategory": "Starters & Snacks",
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "Street Food",
        "allergens": [], "image": IMG["veg_starter"], "available": True,
    },
    {
        "name": "Peanut Chat",
        "description": "Roasted peanuts tossed with onion, tomato, coriander, lemon and chaat masala. Quick, healthy and absolutely delicious.",
        "price": 4.49, "category": "veg", "subcategory": "Starters & Snacks",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["nuts"], "image": IMG["veg_starter"], "available": True,
    },
    {
        "name": "Channa Chat",
        "description": "Boiled chickpeas tossed with tangy tamarind chutney, onions, tomatoes, green chilli and crunchy sev.",
        "price": 4.99, "category": "veg", "subcategory": "Starters & Snacks",
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["veg_starter"], "available": True,
    },

    # ── VEG INDO-CHINESE ─────────────────────────────────────────────────────
    {
        "name": "Veg Noodles",
        "description": "Stir-fried noodles tossed with colourful vegetables, soy sauce, chilli and spring onions. Quick, flavourful and satisfying.",
        "price": 7.49, "category": "veg", "subcategory": "Indo-Chinese",
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["soy", "gluten"], "image": IMG["noodles"], "available": True,
    },
    {
        "name": "Veg Fried Rice",
        "description": "Wok-tossed basmati with mixed vegetables, soy sauce and a hint of sesame. Light, fragrant and full of colour.",
        "price": 7.99, "category": "veg", "subcategory": "Indo-Chinese",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["soy", "sesame"], "image": IMG["fried_rice"], "available": True,
    },

    # ── VEG CURRIES & DAL ─────────────────────────────────────────────────────
    {
        "name": "Gutti Vankaya",
        "description": "Baby brinjals stuffed with a roasted peanut, sesame and coconut paste, then braised in a tangy tamarind gravy. One of Andhra's most treasured heirloom recipes.",
        "price": 9.99, "category": "veg", "subcategory": "Curries & Dal",
        "spice_level": 2, "is_veg": True, "featured": True, "tag": "",
        "allergens": ["nuts", "sesame"], "image": IMG["curry"], "available": True,
    },
    {
        "name": "Paneer Butter Masala",
        "description": "Soft cubes of cottage cheese in a velvety, mildly spiced tomato-cream sauce. A North Indian classic that wins every table.",
        "price": 8.99, "category": "veg", "subcategory": "Curries & Dal",
        "spice_level": 1, "is_veg": True, "featured": True, "tag": "Popular",
        "allergens": ["dairy"], "image": IMG["paneer"], "available": True,
    },
    {
        "name": "Gongura Pappu",
        "description": "Toor dal slow-cooked with tangy gongura (sorrel) leaves and tempered with garlic and dried chillies. Distinctly Andhra.",
        "price": 7.49, "category": "veg", "subcategory": "Curries & Dal",
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "Andhra Special",
        "allergens": ["dairy"], "image": IMG["dal"], "available": True,
    },
    {
        "name": "Tomato Pappu",
        "description": "Toor dal cooked with ripe tomatoes, tempered with mustard, cumin, curry leaves and a generous drizzle of ghee. Bright, tangy and deeply comforting.",
        "price": 6.99, "category": "veg", "subcategory": "Curries & Dal",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["dairy"], "image": IMG["dal"], "available": True,
    },
    {
        "name": "Tadka Dal",
        "description": "Yellow lentils cooked until silky, then finished with a sizzling tadka of ghee, cumin, garlic and red chilli.",
        "price": 6.49, "category": "veg", "subcategory": "Curries & Dal",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["dairy"], "image": IMG["dal"], "available": True,
    },
    {
        "name": "Sambar",
        "description": "Tamarind-lentil vegetable stew tempered with mustard, curry leaves and sambar powder. The heartbeat of South Indian cooking.",
        "price": 6.49, "category": "veg", "subcategory": "Curries & Dal",
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["dal"], "available": True,
    },
    {
        "name": "Rasam",
        "description": "Thin, peppery tamarind broth with tomato and aromatic spices. Deeply warming — sipped as soup or poured over rice.",
        "price": 5.99, "category": "veg", "subcategory": "Curries & Dal",
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["dal"], "available": True,
    },
    {
        "name": "Channa Masala",
        "description": "Chickpeas slow-cooked in a bold, tangy onion-tomato masala with whole spices. Hearty, protein-rich and utterly satisfying.",
        "price": 7.99, "category": "veg", "subcategory": "Curries & Dal",
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["curry"], "available": True,
    },
    {
        "name": "Bhindi Pulusu",
        "description": "Okra simmered in a tamarind-based Andhra gravy with onions and aromatic spices. A comforting, tangy classic.",
        "price": 7.49, "category": "veg", "subcategory": "Curries & Dal",
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["curry"], "available": True,
    },
    {
        "name": "Meal Maker Kurma",
        "description": "Soya chunks cooked in a rich coconut-based kurma sauce with whole spices. High protein, deeply flavourful.",
        "price": 7.49, "category": "veg", "subcategory": "Curries & Dal",
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["soy"], "image": IMG["curry"], "available": True,
    },
    {
        "name": "Perugu Pulusu",
        "description": "A cooling yoghurt-based curry tempered with mustard, dried chillies and curry leaves. Tangy, light and perfect with hot rice.",
        "price": 6.99, "category": "veg", "subcategory": "Curries & Dal",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["dairy"], "image": IMG["curry"], "available": True,
    },
    {
        "name": "Aloo Kurma",
        "description": "Golden potatoes simmered in a mild coconut-cashew kurma sauce with whole spices. Creamy, comforting and goes with everything.",
        "price": 7.49, "category": "veg", "subcategory": "Curries & Dal",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["nuts"], "image": IMG["curry"], "available": True,
    },
    {
        "name": "Saag Aloo",
        "description": "Tender potatoes cooked with fresh spinach, garlic and green chillies. Earthy, nutritious and deeply satisfying.",
        "price": 7.49, "category": "veg", "subcategory": "Curries & Dal",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["curry"], "available": True,
    },
    {
        "name": "Methi Chaman",
        "description": "Fresh paneer cubes cooked with fenugreek leaves in a lightly spiced gravy. Aromatic, rich and beautifully balanced.",
        "price": 8.49, "category": "veg", "subcategory": "Curries & Dal",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["dairy"], "image": IMG["paneer"], "available": True,
    },
    {
        "name": "Mulakkada Tomato Curry",
        "description": "Drumstick pieces simmered in a tangy tomato-based curry with mustard and curry leaves. A South Indian favourite — rustic and deeply flavourful.",
        "price": 7.49, "category": "veg", "subcategory": "Curries & Dal",
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["curry"], "available": True,
    },
    {
        "name": "Fry of the Day",
        "description": "Today's seasonal vegetable, lightly spiced and pan-fried with mustard, curry leaves and dried chillies. Simple, fresh and always different.",
        "price": 6.99, "category": "veg", "subcategory": "Curries & Dal",
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "Daily Special",
        "allergens": [], "image": IMG["curry"], "available": True,
    },

    # ── VEG RICE SPECIALS ────────────────────────────────────────────────────
    {
        "name": "Pulihora",
        "description": "Sacred temple tamarind rice prepared with hand-pounded spices, roasted peanuts and curry leaves. Made with devotion.",
        "price": 5.49, "category": "veg", "subcategory": "Rice Specials",
        "spice_level": 1, "is_veg": True, "featured": True, "tag": "Divine",
        "allergens": ["nuts"], "image": IMG["pulihora"], "available": True,
    },
    {
        "name": "Prasadam Pulihora",
        "description": "Temple-style tamarind rice made with extra devotion — hand-pounded spices, roasted groundnuts and a generous pour of sesame oil.",
        "price": 5.99, "category": "veg", "subcategory": "Rice Specials",
        "spice_level": 1, "is_veg": True, "featured": True, "tag": "Divine ⭐",
        "allergens": ["nuts", "sesame"], "image": IMG["pulihora"], "available": True,
    },
    {
        "name": "Lemon Rice",
        "description": "Cooked rice tossed with fresh lemon juice, turmeric, mustard, peanuts and curry leaves. Bright, tangy and refreshing.",
        "price": 5.49, "category": "veg", "subcategory": "Rice Specials",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["nuts"], "image": IMG["rice"], "available": True,
    },
    {
        "name": "Coconut Rice",
        "description": "Fragrant rice cooked with fresh grated coconut, tempered with mustard, cashews and dried chillies. Light, mildly sweet and comforting.",
        "price": 5.99, "category": "veg", "subcategory": "Rice Specials",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["nuts"], "image": IMG["rice"], "available": True,
    },
    {
        "name": "Chekara Pongal",
        "description": "Sweet rice and moong dal cooked with jaggery, ghee, cardamom and cashews. Festive, warming and deeply comforting.",
        "price": 5.99, "category": "veg", "subcategory": "Rice Specials",
        "spice_level": 0, "is_veg": True, "featured": False, "tag": "Sweet",
        "allergens": ["dairy", "nuts"], "image": IMG["pongal"], "available": True,
    },
    {
        "name": "Pongal",
        "description": "Rice and moong dal cooked to a comforting khichdi, finished with cracked pepper, cumin, cashews and a generous pour of ghee.",
        "price": 6.99, "category": "veg", "subcategory": "Rice Specials",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["dairy", "nuts"], "image": IMG["pongal"], "available": True,
    },
    {
        "name": "Peanut Rice",
        "description": "Rice tempered with roasted groundnuts, mustard, dried chillies and curry leaves. Simple, nutty and addictive.",
        "price": 5.99, "category": "veg", "subcategory": "Rice Specials",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["nuts"], "image": IMG["rice"], "available": True,
    },
    {
        "name": "Tomato Rice",
        "description": "Fragrant rice cooked with ripe tomatoes, onions and South Indian spices. Tangy, comforting and great on its own.",
        "price": 5.49, "category": "veg", "subcategory": "Rice Specials",
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["rice"], "available": True,
    },
    {
        "name": "Pudina Rice",
        "description": "Basmati rice cooked with fresh mint leaves, whole spices and green chillies. Fragrant, cooling and wonderfully aromatic.",
        "price": 5.99, "category": "veg", "subcategory": "Rice Specials",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["rice"], "available": True,
    },
    {
        "name": "Kothimeera Rice",
        "description": "Rice tossed with a freshly ground coriander paste, lemon and spices. Herb-forward, vibrant and uniquely Andhra.",
        "price": 5.99, "category": "veg", "subcategory": "Rice Specials",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["rice"], "available": True,
    },

    # ── VEG BIRYANI & RICE ───────────────────────────────────────────────────
    {
        "name": "Veg Biriyani",
        "description": "Seasonal vegetables layered with long-grain basmati, whole spices, caramelised onions, and saffron milk — dum-cooked and served with cooling raita.",
        "price": 8.99, "category": "veg", "subcategory": "Biryani & Rice",
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["dairy"], "image": IMG["biryani"], "available": True,
    },
    {
        "name": "Veg Pulao",
        "description": "Fragrant basmati cooked with seasonal vegetables, whole spices and mint. Light, delicate and perfect with raita.",
        "price": 7.99, "category": "veg", "subcategory": "Biryani & Rice",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["dairy"], "image": IMG["biryani"], "available": True,
    },
    {
        "name": "Jeera Rice",
        "description": "Long-grain basmati tempered with cumin seeds, ghee and a pinch of salt. The ideal base for any curry.",
        "price": 4.99, "category": "veg", "subcategory": "Biryani & Rice",
        "spice_level": 0, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["dairy"], "image": IMG["rice"], "available": True,
    },
    {
        "name": "Jeera Garlic Rice",
        "description": "Basmati rice tempered with cumin, crispy golden garlic and a touch of ghee. Aromatic, flavourful and pairs with everything.",
        "price": 5.99, "category": "veg", "subcategory": "Biryani & Rice",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["dairy"], "image": IMG["rice"], "available": True,
    },
    {
        "name": "Garlic Rice",
        "description": "Basmati rice stir-fried with crispy golden garlic, curry leaves and mild spices. Simple, aromatic, addictive.",
        "price": 5.99, "category": "veg", "subcategory": "Biryani & Rice",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["rice"], "available": True,
    },
    {
        "name": "Sambar Rice",
        "description": "Hot rice mixed with freshly made sambar and a drizzle of ghee. Classic South Indian comfort food.",
        "price": 6.99, "category": "veg", "subcategory": "Biryani & Rice",
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["dairy"], "image": IMG["rice"], "available": True,
    },
    {
        "name": "Rasam Rice",
        "description": "Steamed rice mixed with peppery rasam and ghee. Light, digestive and deeply comforting.",
        "price": 6.99, "category": "veg", "subcategory": "Biryani & Rice",
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["dairy"], "image": IMG["rice"], "available": True,
    },
    {
        "name": "Pappu Avakaya Rice",
        "description": "Hot rice mixed with creamy dal and fiery mango pickle — a quintessential Andhra combination that needs no introduction.",
        "price": 7.49, "category": "veg", "subcategory": "Biryani & Rice",
        "spice_level": 3, "is_veg": True, "featured": False, "tag": "Andhra Classic",
        "allergens": ["dairy", "sesame"], "image": IMG["rice"], "available": True,
    },

    # ── PICKLES ──────────────────────────────────────────────────────────────
    {
        "name": "Gongura Pickle",
        "description": "Sun-dried sorrel leaves blended with red chillies, garlic, mustard and sesame oil. Tangy, spicy and utterly addictive on hot rice.",
        "price": 4.99, "category": "pickles", "subcategory": None,
        "spice_level": 3, "is_veg": True, "featured": False, "tag": "Signature",
        "allergens": ["sesame"], "image": IMG["pickle"], "available": True,
    },
    {
        "name": "Mango Avakaya",
        "description": "Chunks of raw Totapuri mango ground with mustard powder, red chilli and sesame oil — the undisputed king of Telugu pickles.",
        "price": 4.99, "category": "pickles", "subcategory": None,
        "spice_level": 4, "is_veg": True, "featured": True, "tag": "King of Pickles",
        "allergens": ["sesame"], "image": IMG["pickle"], "available": True,
    },
    {
        "name": "Lemon Pickle",
        "description": "Fresh lemons quartered and aged in ceramic jars with salt, turmeric, fenugreek and chilli powder. Fermented for weeks.",
        "price": 4.49, "category": "pickles", "subcategory": None,
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["pickle"], "available": True,
    },
    {
        "name": "Tomato Pickle",
        "description": "Ripe tomatoes cooked down with red chillies, tamarind and mustard into a thick, glossy pickle that brightens every meal.",
        "price": 4.49, "category": "pickles", "subcategory": None,
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["pickle"], "available": True,
    },
    {
        "name": "Velluli Pachadi",
        "description": "Whole garlic cloves slow-cooked with dried red chillies, tamarind and mustard oil until caramelised and deeply aromatic.",
        "price": 4.99, "category": "pickles", "subcategory": None,
        "spice_level": 3, "is_veg": True, "featured": False, "tag": "Bold",
        "allergens": [], "image": IMG["pickle"], "available": True,
    },
    {
        "name": "Allam Pachadi",
        "description": "Fresh ginger blended with tamarind, jaggery, chilli and mustard — the iconic Andhra chutney-pickle that accompanies pesarattu.",
        "price": 4.49, "category": "pickles", "subcategory": None,
        "spice_level": 3, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["pickle"], "available": True,
    },

    # ── PODIS ─────────────────────────────────────────────────────────────────
    {
        "name": "Kandi Podi",
        "description": "Roasted toor dal ground with dried chillies, cumin and asafoetida. Mixed with hot rice and ghee — the simplest, most satisfying meal.",
        "price": 3.99, "category": "podis", "subcategory": None,
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["podi"], "available": True,
    },
    {
        "name": "Nalla Karam",
        "description": "A fiery Andhra chutney powder of sesame, dried red chillies and garlic — stirred into hot rice with oil for an instant flavour explosion.",
        "price": 3.99, "category": "podis", "subcategory": None,
        "spice_level": 3, "is_veg": True, "featured": False, "tag": "Fiery",
        "allergens": ["sesame"], "image": IMG["podi"], "available": True,
    },
    {
        "name": "Karivepaku Podi",
        "description": "Curry leaves, urad dal and dried chillies slow-roasted and ground into a fragrant, earthy powder.",
        "price": 3.99, "category": "podis", "subcategory": None,
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["podi"], "available": True,
    },
    {
        "name": "Palli Podi",
        "description": "Roasted peanuts ground with red chillies, garlic and salt into a coarse, crunchy powder. Fantastic on idli, dosa or mixed with ghee and rice.",
        "price": 3.99, "category": "podis", "subcategory": None,
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["nuts"], "image": IMG["podi"], "available": True,
    },
    {
        "name": "Nuvvula Podi",
        "description": "White sesame seeds roasted with dried chillies, garlic and coconut, ground into a nutty, aromatic powder.",
        "price": 3.99, "category": "podis", "subcategory": None,
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["sesame"], "image": IMG["podi"], "available": True,
    },
    {
        "name": "Kobbari Podi",
        "description": "Dry-roasted coconut ground with urad dal, red chillies and curry leaves into a mildly sweet, aromatic powder.",
        "price": 3.99, "category": "podis", "subcategory": None,
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["podi"], "available": True,
    },

    # ── BREAKFAST ────────────────────────────────────────────────────────────
    {
        "name": "Idli (3 pcs)",
        "description": "Three fluffy steamed rice cakes from 24-hour fermented batter. Served with sambar and chutneys.",
        "price": 3.99, "category": "breakfast", "subcategory": "Idli & Vada",
        "spice_level": 0, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["idli"], "available": True,
    },
    {
        "name": "Ghee Idli",
        "description": "Soft steamed idlis finished with a generous drizzle of warm desi ghee. Simple, nourishing and deeply comforting.",
        "price": 4.49, "category": "breakfast", "subcategory": "Idli & Vada",
        "spice_level": 0, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["dairy"], "image": IMG["idli"], "available": True,
    },
    {
        "name": "Sambar Idli",
        "description": "Soft idlis dunked in piping hot sambar and served with coconut chutney. A complete, satisfying South Indian breakfast.",
        "price": 4.99, "category": "breakfast", "subcategory": "Idli & Vada",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["idli"], "available": True,
    },
    {
        "name": "Vada (2 pcs)",
        "description": "Two crispy golden urad dal vadas, fried fresh to order. Served with sambar and coconut chutney.",
        "price": 3.99, "category": "breakfast", "subcategory": "Idli & Vada",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["idli"], "available": True,
    },
    {
        "name": "Sambar Vada",
        "description": "Crispy vadas soaked in warm sambar until they absorb every drop of flavour. A South Indian café classic.",
        "price": 4.99, "category": "breakfast", "subcategory": "Idli & Vada",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["idli"], "available": True,
    },
    {
        "name": "Masala Dosa",
        "description": "Paper-thin crispy rice crepe filled with spiced potato masala. Served with sambar and three chutneys. Iconic.",
        "price": 6.99, "category": "breakfast", "subcategory": "Dosas",
        "spice_level": 2, "is_veg": True, "featured": True, "tag": "Morning Favourite",
        "allergens": [], "image": IMG["dosa"], "available": True,
    },
    {
        "name": "Rava Dosa",
        "description": "Lacy, instantly crispy semolina dosa made with onion, green chillies and coriander. Light, crunchy and ready in minutes.",
        "price": 6.99, "category": "breakfast", "subcategory": "Dosas",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "Crispy",
        "allergens": [], "image": IMG["dosa"], "available": True,
    },
    {
        "name": "Ghee Dosa",
        "description": "Crispy dosa roasted in a generous pour of desi ghee until golden and fragrant. Pure, simple indulgence.",
        "price": 5.99, "category": "breakfast", "subcategory": "Dosas",
        "spice_level": 0, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["dairy"], "image": IMG["dosa"], "available": True,
    },
    {
        "name": "Carrot Dosa",
        "description": "Dosa batter mixed with grated carrot and mild spices. Colourful, nutritious and delicately sweet.",
        "price": 5.99, "category": "breakfast", "subcategory": "Dosas",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["dosa"], "available": True,
    },
    {
        "name": "Beetroot Dosa",
        "description": "Vibrantly pink dosa made with beetroot-infused batter. Earthy, sweet and packed with nutrients.",
        "price": 5.99, "category": "breakfast", "subcategory": "Dosas",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["dosa"], "available": True,
    },
    {
        "name": "Nellore Karam Dosa",
        "description": "Dosa spread with fiery Nellore-style red chilli chutney and roasted on the tawa. Intensely spicy and deeply satisfying.",
        "price": 6.99, "category": "breakfast", "subcategory": "Dosas",
        "spice_level": 4, "is_veg": True, "featured": False, "tag": "Spicy",
        "allergens": [], "image": IMG["dosa"], "available": True,
    },
    {
        "name": "Nellore Ghee Karam Dosa",
        "description": "Nellore karam dosa elevated with desi ghee roasted in. Fiery heat meets rich butteriness.",
        "price": 7.49, "category": "breakfast", "subcategory": "Dosas",
        "spice_level": 4, "is_veg": True, "featured": False, "tag": "Spicy",
        "allergens": ["dairy"], "image": IMG["dosa"], "available": True,
    },
    {
        "name": "Cheese Dosa",
        "description": "Crispy dosa filled with melted cheese and spiced potato. Kids' favourite and adults' guilty pleasure.",
        "price": 6.99, "category": "breakfast", "subcategory": "Dosas",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["dairy"], "image": IMG["dosa"], "available": True,
    },
    {
        "name": "Upma Dosa",
        "description": "Crispy dosa filled with soft, spiced upma. A unique combination — crunchy meets fluffy.",
        "price": 6.49, "category": "breakfast", "subcategory": "Dosas",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["dosa"], "available": True,
    },
    {
        "name": "Poori (3 pcs)",
        "description": "Three puffed, deep-fried whole wheat puris served with a flavourful potato kurma. A royal South Indian breakfast.",
        "price": 5.99, "category": "breakfast", "subcategory": "Others",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["gluten"], "image": IMG["pongal"], "available": True,
    },
    {
        "name": "Poha",
        "description": "Flattened rice sautéed with mustard, turmeric, onions, green chilli and a squeeze of lime. Light, quick and wholesome.",
        "price": 4.99, "category": "breakfast", "subcategory": "Others",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["pongal"], "available": True,
    },
    {
        "name": "Uggani",
        "description": "Puffed rice stir-fried with onions, green chillies, peanuts and lemon in the Rayalaseema style. A unique, crunchy Andhra breakfast.",
        "price": 5.49, "category": "breakfast", "subcategory": "Others",
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "Andhra Special",
        "allergens": ["nuts"], "image": IMG["pongal"], "available": True,
    },

    # ── STREET FOOD ──────────────────────────────────────────────────────────
    {
        "name": "Veg Burger",
        "description": "Crispy spiced veggie patty in a toasted bun with fresh lettuce, tomato, onion and our special house sauce.",
        "price": 4.99, "category": "streetFood", "subcategory": None,
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["gluten", "dairy"], "image": IMG["burger"], "available": True,
    },
    {
        "name": "Chicken Burger",
        "description": "Crispy fried chicken fillet in a toasted brioche bun with coleslaw and house sauce. Juicy, crispy and utterly satisfying.",
        "price": 5.99, "category": "streetFood", "subcategory": None,
        "spice_level": 1, "is_veg": False, "featured": False, "tag": "",
        "allergens": ["gluten", "dairy"], "image": IMG["burger"], "available": True,
    },
    {
        "name": "Veg Wrap",
        "description": "Spiced roasted vegetables and paneer with mint chutney and crunchy salad, wrapped in a soft flour tortilla.",
        "price": 5.49, "category": "streetFood", "subcategory": None,
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["gluten", "dairy"], "image": IMG["wrap"], "available": True,
    },
    {
        "name": "Chicken Wrap",
        "description": "Tandoori-spiced chicken strips with salad, raita and mint chutney in a warm tortilla wrap.",
        "price": 6.49, "category": "streetFood", "subcategory": None,
        "spice_level": 2, "is_veg": False, "featured": False, "tag": "",
        "allergens": ["gluten", "dairy"], "image": IMG["wrap"], "available": True,
    },

    # ── DRINKS ───────────────────────────────────────────────────────────────
    {
        "name": "Lemon Water",
        "description": "Fresh lemon juice with water, a pinch of salt and sugar. Cooling, simple and perfectly refreshing.",
        "price": 2.49, "category": "drinks", "subcategory": None,
        "spice_level": 0, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["juice"], "available": True,
    },
    {
        "name": "Orange Juice",
        "description": "Freshly squeezed sweet oranges. No added sugar, no preservatives — just pure citrus goodness.",
        "price": 3.49, "category": "drinks", "subcategory": None,
        "spice_level": 0, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["juice"], "available": True,
    },
    {
        "name": "Carrot Juice",
        "description": "Freshly pressed carrot juice, naturally sweet and packed with beta-carotene. Vibrant, healthy and delicious.",
        "price": 3.49, "category": "drinks", "subcategory": None,
        "spice_level": 0, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["juice"], "available": True,
    },
    {
        "name": "ABC Juice",
        "description": "Apple, beetroot and carrot blended fresh — a powerhouse of vitamins and natural sweetness.",
        "price": 3.99, "category": "drinks", "subcategory": None,
        "spice_level": 0, "is_veg": True, "featured": False, "tag": "Healthy",
        "allergens": [], "image": IMG["juice"], "available": True,
    },
    {
        "name": "Pineapple Juice",
        "description": "Freshly pressed pineapple juice — sweet, tangy and tropical. A natural mood lifter.",
        "price": 3.49, "category": "drinks", "subcategory": None,
        "spice_level": 0, "is_veg": True, "featured": False, "tag": "",
        "allergens": [], "image": IMG["juice"], "available": True,
    },
    {
        "name": "Sweet Lassi",
        "description": "Thick, chilled yoghurt blended with sugar and a hint of cardamom. Creamy, cooling and utterly indulgent.",
        "price": 3.49, "category": "drinks", "subcategory": None,
        "spice_level": 0, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["dairy"], "image": IMG["lassi"], "available": True,
    },
    {
        "name": "Mango Lassi",
        "description": "Ripe Alphonso mango blended with creamy yoghurt and a whisper of cardamom. The queen of Indian drinks.",
        "price": 3.99, "category": "drinks", "subcategory": None,
        "spice_level": 0, "is_veg": True, "featured": True, "tag": "Favourite",
        "allergens": ["dairy"], "image": IMG["lassi"], "available": True,
    },
    {
        "name": "Masala Buttermilk",
        "description": "Chilled yoghurt drink tempered with roasted cumin, ginger, coriander and green chilli. Digestive, cooling and deeply South Indian.",
        "price": 2.99, "category": "drinks", "subcategory": None,
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["dairy"], "image": IMG["buttermilk"], "available": True,
    },
]


async def update_item_categories():
    """Migrate existing items to new category/subcategory structure."""

    # Prasada → veg
    prasada_migrations = {
        "Pulihora":       ("veg", "Rice Specials"),
        "Sakkarai Pongal": ("veg", "Rice Specials"),
        "Sundal":         ("veg", "Starters & Snacks"),
        "Ven Pongal":     ("veg", "Rice Specials"),
        "Kobbari Annam":  ("veg", "Rice Specials"),
    }
    for name, (cat, sub) in prasada_migrations.items():
        await db.menu_items.update_one(
            {"name": name},
            {"$set": {"category": cat, "subcategory": sub}}
        )

    # Fix nonVeg subcategories
    nonveg_subcats = {
        "Andhra Kodi Pulusu":   "Curries",
        "Chettinad Chicken Curry": "Curries",
        "Natu Kodi Biriyani":   "Biryani",
        "Mutton Ghee Roast":    "Starters",
        "Mutton Biriyani":      "Biryani",
        "Royyala Iguru":        "Curries",
        "Chepala Pulusu":       "Curries",
        "Kodi Vepudu":          "Starters",
        "Gongura Mamsam":       "Curries",
        "Kodi Guddu Curry":     "Egg Specials",
    }
    for name, sub in nonveg_subcats.items():
        await db.menu_items.update_one(
            {"name": name, "category": "nonVeg"},
            {"$set": {"subcategory": sub}}
        )

    # Fix veg subcategories
    veg_subcats = {
        "Gutti Vankaya":    "Curries & Dal",
        "Bendakaya Pulusu": "Curries & Dal",
        "Veg Biriyani":     "Biryani & Rice",
        "Pappu (Andhra Dal)": "Curries & Dal",
        "Bagara Baingan":   "Curries & Dal",
        "Palak Pappu":      "Curries & Dal",
        "Perugu Annam":     "Biryani & Rice",
        "Aloo Curry":       "Curries & Dal",
    }
    for name, sub in veg_subcats.items():
        await db.menu_items.update_one(
            {"name": name, "category": "veg"},
            {"$set": {"subcategory": sub}}
        )

    # Move breakfast items that belong on veg (Prasada) page
    await db.menu_items.update_one(
        {"name": "Punugulu"},
        {"$set": {"category": "veg", "subcategory": "Starters & Snacks"}}
    )
    await db.menu_items.update_one(
        {"name": "Pongal (Ven)"},
        {"$set": {"category": "veg", "subcategory": "Rice Specials"}}
    )

    # Fix breakfast subcategories
    breakfast_subcats = {
        "Idli (4 pcs)":    "Idli & Vada",
        "Medu Vada":       "Idli & Vada",
        "Masala Dosa":     "Dosas",
        "Pesarattu":       "Dosas",
        "Rava Dosa":       "Dosas",
        "Set Dosa (3 pcs)": "Dosas",
        "Upma":            "Others",
        "Atukula Upma":    "Others",
    }
    for name, sub in breakfast_subcats.items():
        await db.menu_items.update_one(
            {"name": name},
            {"$set": {"subcategory": sub}}
        )

    print("Category migrations applied.")


async def cleanup_menu_april_2026():
    """April 2026 menu cleanup: remove discontinued items, rename items, update prices."""

    # ── Items to hide (set available=false) ──────────────────────────────────
    items_to_remove = [
        "Andhra Kodi Pulusu", "Chettinad Chicken Curry", "Natu Kodi Biriyani",
        "Mutton Ghee Roast", "Royyala Iguru", "Chepala Pulusu",
        "Kodi Vepudu", "Gongura Mamsam", "Kodi Guddu Curry",
        "Bagara Baingan", "Palak Pappu", "Perugu Annam", "Bendakaya Pulusu",
        "Sakkarai Pongal", "Sundal", "Ven Pongal", "Panchaamrutam", "Chalimidi",
        "Idli (4 pcs)", "Pesarattu", "Medu Vada", "Set Dosa (3 pcs)",
        "Upma", "Atukula Upma",
        "Plain Dosa",  # user's list has no Plain Dosa
    ]
    for name in items_to_remove:
        result = await db.menu_items.update_one(
            {"name": name},
            {"$set": {"available": False}}
        )
        if result.modified_count:
            print(f"  Hidden: {name}")

    # ── Renames ──────────────────────────────────────────────────────────────
    renames = [
        ("Pappu (Andhra Dal)", "Tomato Pappu",  {"price": 6.99, "category": "veg", "subcategory": "Curries & Dal"}),
        ("Aloo Curry",         "Aloo Kurma",     {"price": 7.49, "category": "veg", "subcategory": "Curries & Dal"}),
        ("Pongal (Ven)",       "Pongal",         {"price": 6.99, "category": "veg", "subcategory": "Rice Specials"}),
        ("Kobbari Annam",      "Coconut Rice",   {"price": 5.99, "category": "veg", "subcategory": "Rice Specials"}),
    ]
    for old_name, new_name, updates in renames:
        result = await db.menu_items.update_one(
            {"name": old_name},
            {"$set": {"name": new_name, **updates}}
        )
        if result.modified_count:
            print(f"  Renamed: {old_name} → {new_name}")

    # ── Price updates ────────────────────────────────────────────────────────
    price_updates = {
        "Masala Dosa":     6.99,
        "Rava Dosa":       6.99,
        "Pulihora":        5.49,
        "Veg Biriyani":    8.99,
    }
    for name, new_price in price_updates.items():
        result = await db.menu_items.update_one(
            {"name": name},
            {"$set": {"price": new_price}}
        )
        if result.modified_count:
            print(f"  Price updated: {name} → £{new_price}")

    # ── Sync all current items' descriptions, prices, categories from seed ───
    seed_by_name = {item["name"]: item for item in MENU_ITEMS}
    for name, seed_item in seed_by_name.items():
        await db.menu_items.update_one(
            {"name": name},
            {"$set": {
                "description": seed_item["description"],
                "price": seed_item["price"],
                "category": seed_item["category"],
                "subcategory": seed_item["subcategory"],
                "spice_level": seed_item["spice_level"],
                "is_veg": seed_item["is_veg"],
                "available": seed_item["available"],
            }}
        )

    print("April 2026 menu cleanup applied.")


async def seed_menu():
    """Insert items that don't already exist (by name), then run migrations."""
    import uuid
    from datetime import datetime

    existing_names = set()
    async for doc in db.menu_items.find({}, {"name": 1}):
        existing_names.add(doc["name"])

    new_items = [i for i in MENU_ITEMS if i["name"] not in existing_names]
    if new_items:
        docs = [{"id": str(uuid.uuid4()), "created_at": datetime.utcnow().isoformat(), **item} for item in new_items]
        await db.menu_items.insert_many(docs)
        print(f"Seeded {len(docs)} new menu items ({len(existing_names)} already existed).")
    else:
        print(f"All {len(existing_names)} menu items already present — skipping seed.")

    await update_item_categories()
    await cleanup_menu_april_2026()


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
    """Seed a starter set of daily specials if the collection is empty."""
    import uuid
    from datetime import datetime

    count = await db.daily_specials.count_documents({})
    if count > 0:
        return
    docs = [
        {
            "id": str(uuid.uuid4()),
            "active": True,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            **item,
        }
        for item in SAMPLE_DAILY_SPECIALS
    ]
    await db.daily_specials.insert_many(docs)
    print(f"Seeded {len(docs)} daily specials.")


async def create_indexes():
    await db.menu_items.create_index("id", unique=True)
    await db.menu_items.create_index("category")
    await db.users.create_index("id", unique=True)
    await db.users.create_index("email", unique=True)
    await db.orders.create_index("id", unique=True)
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
