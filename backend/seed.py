"""
Seed the database with initial menu items.
Called on startup — uses upsert-by-name so new items are added without
duplicating existing ones.
"""
from database import db

MENU_ITEMS = [
    # ── NON-VEG ──────────────────────────────────────────────────────────────
    {
        "name": "Andhra Kodi Pulusu",
        "description": "Bone-in chicken slow-cooked in a rich tamarind and onion gravy, seasoned with freshly ground Andhra spices. Best eaten with steamed rice and a dollop of ghee.",
        "price": 12.99, "category": "nonVeg", "subcategory": "Curries",
        "spice_level": 3, "is_veg": False, "featured": True, "tag": "Bestseller",
        "allergens": [],
        "image": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Chettinad Chicken Curry",
        "description": "A fiery Tamil Nadu classic made with freshly roasted Chettinad masala — kalpasi, marathi mokku, and stone flower — delivering layers of unforgettable aroma.",
        "price": 13.99, "category": "nonVeg", "subcategory": "Curries",
        "spice_level": 4, "is_veg": False, "featured": False, "tag": "Spicy",
        "allergens": [],
        "image": "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Natu Kodi Biriyani",
        "description": "Country chicken biriyani cooked dum-style with aged basmati, whole spices, caramelised onions and saffron. The village way — bold, fragrant, and deeply satisfying.",
        "price": 15.99, "category": "nonVeg", "subcategory": "Biriyanis",
        "spice_level": 3, "is_veg": False, "featured": True, "tag": "Popular",
        "allergens": ["dairy"],
        "image": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Mutton Ghee Roast",
        "description": "Tender mutton pieces slow-roasted in pure desi ghee with a Mangalorean spice paste of red chillies, tamarind and aromatic spices. A celebration dish.",
        "price": 16.99, "category": "nonVeg", "subcategory": "Dry Fry",
        "spice_level": 3, "is_veg": False, "featured": False, "tag": "",
        "allergens": ["dairy"],
        "image": "https://images.unsplash.com/photo-1545247181-516773cae754?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Mutton Biriyani",
        "description": "Tender mutton pieces marinated overnight, layered with fragrant basmati and sealed with dough — slow-cooked dum style until every grain is infused with flavour.",
        "price": 17.99, "category": "nonVeg", "subcategory": "Biriyanis",
        "spice_level": 3, "is_veg": False, "featured": True, "tag": "Chef's Pick",
        "allergens": ["dairy"],
        "image": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Royyala Iguru",
        "description": "Fresh tiger prawns cooked in a thick Andhra-style onion-tomato masala with coastal spices, curry leaves and dried red chillies. Pairs perfectly with appam or rice.",
        "price": 14.99, "category": "nonVeg", "subcategory": "Curries",
        "spice_level": 3, "is_veg": False, "featured": False, "tag": "Coastal",
        "allergens": ["shellfish"],
        "image": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Chepala Pulusu",
        "description": "Fresh fish fillets simmered in a tangy tamarind-based gravy with onions, tomatoes and a blend of Andhra coastal spices. A staple of fishing villages along the Krishna delta.",
        "price": 13.99, "category": "nonVeg", "subcategory": "Curries",
        "spice_level": 2, "is_veg": False, "featured": False, "tag": "Coastal",
        "allergens": ["fish"],
        "image": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Kodi Vepudu",
        "description": "Crispy dry-fried chicken tossed with curry leaves, green chillies and freshly cracked black pepper. A beloved Telugu starter eaten straight from the pan.",
        "price": 11.99, "category": "nonVeg", "subcategory": "Dry Fry",
        "spice_level": 3, "is_veg": False, "featured": False, "tag": "",
        "allergens": [],
        "image": "https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Gongura Mamsam",
        "description": "Tender mutton slow-cooked with sour gongura (sorrel) leaves — a prized Andhra delicacy that balances heat and tang in a way no other dish can. Served with hot jowar roti.",
        "price": 17.99, "category": "nonVeg", "subcategory": "Curries",
        "spice_level": 3, "is_veg": False, "featured": False, "tag": "Signature",
        "allergens": [],
        "image": "https://images.unsplash.com/photo-1547592180-85f173990554?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Kodi Guddu Curry",
        "description": "Farm-fresh eggs simmered in a rich onion-tomato masala with South Indian spices and fresh curry leaves. Comfort food at its finest, best with layered paratha.",
        "price": 9.99, "category": "nonVeg", "subcategory": "Curries",
        "spice_level": 2, "is_veg": False, "featured": False, "tag": "",
        "allergens": ["eggs"],
        "image": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },

    # ── VEG ──────────────────────────────────────────────────────────────────
    {
        "name": "Gutti Vankaya",
        "description": "Baby brinjals stuffed with a roasted peanut, sesame and coconut paste, then braised in a tangy tamarind gravy. One of Andhra's most treasured heirloom recipes.",
        "price": 9.99, "category": "veg", "subcategory": "Curries",
        "spice_level": 2, "is_veg": True, "featured": True, "tag": "",
        "allergens": ["nuts", "sesame"],
        "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Bendakaya Pulusu",
        "description": "Tender okra cooked in a tangy tamarind and jaggery gravy with fenugreek and mustard. A weekday staple in every Telugu household, made extraordinary with love.",
        "price": 8.99, "category": "veg", "subcategory": "Curries",
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": [],
        "image": "https://images.unsplash.com/photo-1574484284002-952d92456975?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Veg Biriyani",
        "description": "Seasonal vegetables layered with long-grain basmati, whole spices, caramelised onions, and saffron milk — dum-cooked and served with cooling raita and pappadum.",
        "price": 11.99, "category": "veg", "subcategory": "Biriyanis",
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["dairy"],
        "image": "https://images.unsplash.com/photo-1512058564366-18510be2db19?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Pappu (Andhra Dal)",
        "description": "Yellow toor dal tempered with mustard, dry red chillies, curry leaves and a generous drizzle of ghee. The soul of every South Indian meal — simple, nourishing, irreplaceable.",
        "price": 7.99, "category": "veg", "subcategory": "Dal",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["dairy"],
        "image": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Bagara Baingan",
        "description": "A Hyderabadi speciality — baby brinjals braised in a rich, nutty gravy of roasted peanuts, sesame, coconut and tamarind. Royally rich, silkily smooth.",
        "price": 10.99, "category": "veg", "subcategory": "Curries",
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "Hyderabadi",
        "allergens": ["nuts", "sesame"],
        "image": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Palak Pappu",
        "description": "Fresh spinach cooked down with toor dal, then tempered with garlic, mustard and dried chillies. A nutritious everyday dal that tastes anything but ordinary.",
        "price": 8.99, "category": "veg", "subcategory": "Dal",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["dairy"],
        "image": "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Perugu Annam",
        "description": "Cooling curd rice tempered with mustard, ginger, curry leaves and pomegranate. The perfect ending to a fiery South Indian meal — humble, healing, divine.",
        "price": 6.99, "category": "veg", "subcategory": "Rice",
        "spice_level": 0, "is_veg": True, "featured": False, "tag": "Cooling",
        "allergens": ["dairy"],
        "image": "https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Aloo Curry",
        "description": "Golden potatoes slow-cooked with tomatoes, onions and whole spices in an Andhra-style gravy. Simple, filling and utterly addictive with soft phulka rotis.",
        "price": 7.99, "category": "veg", "subcategory": "Curries",
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": [],
        "image": "https://images.unsplash.com/photo-1574484284002-952d92456975?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },

    # ── PRASADA ──────────────────────────────────────────────────────────────
    {
        "name": "Pulihora",
        "description": "Sacred temple tamarind rice prepared with hand-pounded spices, roasted peanuts and curry leaves. Made with devotion, offered first to the deity, then shared with all.",
        "price": 8.99, "category": "prasada", "subcategory": "Rice",
        "spice_level": 1, "is_veg": True, "featured": True, "tag": "Divine",
        "allergens": ["nuts"],
        "image": "https://images.unsplash.com/photo-1596797038530-2c107229654b?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Sakkarai Pongal",
        "description": "Sweet rice and lentils cooked in jaggery syrup, finished with ghee, cardamom and roasted cashews. The quintessential South Indian festival offering — Makar Sankranti on a plate.",
        "price": 7.99, "category": "prasada", "subcategory": "Sweet",
        "spice_level": 0, "is_veg": True, "featured": True, "tag": "Festival Special",
        "allergens": ["dairy", "nuts"],
        "image": "https://images.unsplash.com/photo-1666251214695-405f673b396a?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Sundal",
        "description": "Steamed chickpeas tossed with grated coconut, curry leaves, mustard and dried chillies. Navaratri's most beloved street food and a cherished temple prasadam.",
        "price": 5.99, "category": "prasada", "subcategory": "Savoury",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": [],
        "image": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Ven Pongal",
        "description": "Savoury rice and moong dal khichdi tempered with ghee, black pepper, cumin, cashews and ginger. Tirupati's famous morning prasadam — soft, warming and deeply comforting.",
        "price": 7.99, "category": "prasada", "subcategory": "Savoury",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "Tirupati Style",
        "allergens": ["dairy", "nuts"],
        "image": "https://images.unsplash.com/photo-1694849789325-914b71ab4075?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Kobbari Annam",
        "description": "Fragrant coconut rice cooked with fresh grated coconut, tempered with mustard, cashews and dried chillies. Light, mildly sweet and perfect as a temple offering.",
        "price": 7.99, "category": "prasada", "subcategory": "Rice",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["nuts"],
        "image": "https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Panchaamrutam",
        "description": "The sacred five-nectar mixture of banana, jaggery, honey, ghee and milk — the offering of offerings. Prepared fresh for pooja, delivered to your door with reverence.",
        "price": 6.99, "category": "prasada", "subcategory": "Sacred",
        "spice_level": 0, "is_veg": True, "featured": False, "tag": "Sacred",
        "allergens": ["dairy"],
        "image": "https://images.unsplash.com/photo-1666251214695-405f673b396a?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Chalimidi",
        "description": "A traditional Andhra sweet made from rice flour, jaggery, cardamom and coconut — kneaded by hand and offered to deities during Vinayaka Chavithi and Dasara.",
        "price": 5.99, "category": "prasada", "subcategory": "Sweet",
        "spice_level": 0, "is_veg": True, "featured": False, "tag": "Festive",
        "allergens": ["dairy"],
        "image": "https://images.unsplash.com/photo-1666251214695-405f673b396a?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },

    # ── BREAKFAST ────────────────────────────────────────────────────────────
    {
        "name": "Idli (4 pcs)",
        "description": "Cloud-soft steamed rice cakes made from a 24-hour fermented batter. Served with sambar, coconut chutney and tomato chutney. The gold standard South Indian breakfast.",
        "price": 6.99, "category": "breakfast", "subcategory": "Tiffins",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": [],
        "image": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Masala Dosa",
        "description": "Paper-thin crispy rice crepe made on a cast-iron tawa, filled with spiced potato masala. Served on a banana leaf with sambar and three chutneys. Iconic.",
        "price": 8.99, "category": "breakfast", "subcategory": "Dosas",
        "spice_level": 2, "is_veg": True, "featured": True, "tag": "Morning Favourite",
        "allergens": [],
        "image": "https://images.unsplash.com/photo-1630383249896-424e482df921?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Pesarattu",
        "description": "Crispy green moong dal dosa topped with ginger, onion and green chillies. An Andhra breakfast staple — protein-rich, earthy and utterly satisfying with allam chutney.",
        "price": 7.99, "category": "breakfast", "subcategory": "Dosas",
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "Andhra Special",
        "allergens": [],
        "image": "https://images.unsplash.com/photo-1630383249896-424e482df921?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Medu Vada",
        "description": "Golden-fried urad dal doughnuts, crispy outside and pillowy inside. Best dunked in sambar and served with coconut chutney. A South Indian café classic.",
        "price": 5.99, "category": "breakfast", "subcategory": "Tiffins",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": [],
        "image": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Rava Dosa",
        "description": "Lacy, instantly crispy semolina dosa made with onion, green chillies and coriander. No fermentation needed — light, crunchy and ready in minutes. Served with sambar.",
        "price": 8.99, "category": "breakfast", "subcategory": "Dosas",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "Crispy",
        "allergens": [],
        "image": "https://images.unsplash.com/photo-1630383249896-424e482df921?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Set Dosa (3 pcs)",
        "description": "Three soft, thick spongy dosas served together with coconut chutney and vegetable sagu. A Karnataka-style breakfast that is gentle on the stomach and heavy on flavour.",
        "price": 7.99, "category": "breakfast", "subcategory": "Dosas",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": [],
        "image": "https://images.unsplash.com/photo-1630383249896-424e482df921?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Upma",
        "description": "Semolina porridge tempered with mustard, urad dal, onions, ginger and vegetables. Quick, wholesome, and deeply nostalgic — the smell of an Indian grandmother's kitchen.",
        "price": 6.99, "category": "breakfast", "subcategory": "Tiffins",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": [],
        "image": "https://images.unsplash.com/photo-1694849789325-914b71ab4075?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Punugulu",
        "description": "Bite-sized idli batter fritters deep-fried until puffed and golden. Tossed with curry leaves and chilli powder, served piping hot with coconut and ginger chutneys.",
        "price": 5.99, "category": "breakfast", "subcategory": "Snacks",
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": [],
        "image": "https://images.unsplash.com/photo-1572442568216-e4a31af30b69?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Atukula Upma",
        "description": "Flattened rice (poha) tempered with mustard, peanuts, turmeric, green chillies and onion. Light, quick and absolutely perfect with a cup of filter coffee or chai.",
        "price": 5.99, "category": "breakfast", "subcategory": "Tiffins",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["nuts"],
        "image": "https://images.unsplash.com/photo-1694849789325-914b71ab4075?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Pongal (Ven)",
        "description": "Rice and moong dal cooked to a comforting khichdi, finished with cracked pepper, cumin, cashews and a generous pour of ghee. Hearty, warming and healing all at once.",
        "price": 6.99, "category": "breakfast", "subcategory": "Tiffins",
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["dairy", "nuts"],
        "image": "https://images.unsplash.com/photo-1694849789325-914b71ab4075?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },

    # ── PICKLES ──────────────────────────────────────────────────────────────
    {
        "name": "Gongura Pickle",
        "description": "Sun-dried sorrel leaves blended with red chillies, garlic, mustard and sesame oil. Grandmother's treasured recipe — tangy, spicy and utterly addictive on hot rice.",
        "price": 4.99, "category": "pickles", "subcategory": None,
        "spice_level": 3, "is_veg": True, "featured": False, "tag": "Signature",
        "allergens": ["sesame"],
        "image": "https://images.unsplash.com/photo-1621427017774-f0e7ebbda11f?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Mango Avakaya",
        "description": "Chunks of raw Totapuri mango ground with mustard powder, red chilli and sesame oil — the undisputed king of Telugu pickles, aged to perfection. Made in the traditional way.",
        "price": 4.99, "category": "pickles", "subcategory": None,
        "spice_level": 4, "is_veg": True, "featured": True, "tag": "King of Pickles",
        "allergens": ["sesame"],
        "image": "https://images.unsplash.com/photo-1621427017774-f0e7ebbda11f?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Lemon Pickle",
        "description": "Fresh lemons quartered and aged in ceramic jars with salt, turmeric, fenugreek and chilli powder. Fermented for weeks until the skin softens and the flavour deepens.",
        "price": 4.49, "category": "pickles", "subcategory": None,
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": [],
        "image": "https://images.unsplash.com/photo-1621427017774-f0e7ebbda11f?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Tomato Pickle",
        "description": "Ripe tomatoes cooked down with red chillies, tamarind and mustard into a thick, glossy pickle that brightens every meal. Ready in minutes — lasting for weeks.",
        "price": 4.49, "category": "pickles", "subcategory": None,
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": [],
        "image": "https://images.unsplash.com/photo-1621427017774-f0e7ebbda11f?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Velluli Pachadi",
        "description": "Whole garlic cloves slow-cooked with dried red chillies, tamarind and mustard oil until caramelised and deeply aromatic. A bold, pungent pickle for the adventurous.",
        "price": 4.99, "category": "pickles", "subcategory": None,
        "spice_level": 3, "is_veg": True, "featured": False, "tag": "Bold",
        "allergens": [],
        "image": "https://images.unsplash.com/photo-1621427017774-f0e7ebbda11f?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Allam Pachadi",
        "description": "Fresh ginger blended with tamarind, jaggery, chilli and mustard — the iconic Andhra chutney-pickle that accompanies pesarattu. Fiery, sweet and intensely aromatic.",
        "price": 4.49, "category": "pickles", "subcategory": None,
        "spice_level": 3, "is_veg": True, "featured": False, "tag": "",
        "allergens": [],
        "image": "https://images.unsplash.com/photo-1621427017774-f0e7ebbda11f?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },

    # ── PODIS ─────────────────────────────────────────────────────────────────
    {
        "name": "Kandi Podi",
        "description": "Roasted toor dal ground with dried chillies, cumin and asafoetida. Mixed with hot rice and a generous spoon of ghee — the simplest, most satisfying meal in South India.",
        "price": 3.99, "category": "podis", "subcategory": None,
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": [],
        "image": "https://images.unsplash.com/photo-1660541880621-2c37ce3a88b4?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Nalla Karam",
        "description": "A fiery Andhra chutney powder of sesame, dried red chillies and garlic — stirred into hot rice with oil for an instant flavour explosion. Also great as a dosa side.",
        "price": 3.99, "category": "podis", "subcategory": None,
        "spice_level": 3, "is_veg": True, "featured": False, "tag": "Fiery",
        "allergens": ["sesame"],
        "image": "https://images.unsplash.com/photo-1660541880621-2c37ce3a88b4?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Karivepaku Podi",
        "description": "Curry leaves, urad dal and dried chillies slow-roasted and ground into a fragrant, earthy powder. A pinch of this podi transforms even plain rice into something extraordinary.",
        "price": 3.99, "category": "podis", "subcategory": None,
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": [],
        "image": "https://images.unsplash.com/photo-1660541880621-2c37ce3a88b4?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Palli Podi",
        "description": "Roasted peanuts ground with red chillies, garlic and salt into a coarse, crunchy powder. Fantastic on idli, dosa or mixed with ghee and rice — a Telugu kitchen essential.",
        "price": 3.99, "category": "podis", "subcategory": None,
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["nuts"],
        "image": "https://images.unsplash.com/photo-1660541880621-2c37ce3a88b4?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Nuvvula Podi",
        "description": "White sesame seeds roasted with dried chillies, garlic and coconut, ground into a nutty, aromatic powder. Rich in calcium and flavour — excellent with hot rice and oil.",
        "price": 3.99, "category": "podis", "subcategory": None,
        "spice_level": 2, "is_veg": True, "featured": False, "tag": "",
        "allergens": ["sesame"],
        "image": "https://images.unsplash.com/photo-1660541880621-2c37ce3a88b4?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
    {
        "name": "Kobbari Podi",
        "description": "Dry-roasted coconut ground with urad dal, red chillies and curry leaves into a mildly sweet, aromatic powder. Perfect with idli, dosa or simply stirred into warm rice.",
        "price": 3.99, "category": "podis", "subcategory": None,
        "spice_level": 1, "is_veg": True, "featured": False, "tag": "",
        "allergens": [],
        "image": "https://images.unsplash.com/photo-1660541880621-2c37ce3a88b4?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "available": True,
    },
]


async def seed_menu():
    """Insert items that don't already exist (by name)."""
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
    # OTP records auto-expire after expires_at
    await db.otp_records.create_index("expires_at", expireAfterSeconds=0)
    await db.otp_records.create_index("phone")
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
        # Always ensure role=admin and password is up to date
        await db.users.update_one(
            {"email": email},
            {"$set": {"role": "admin", "password_hash": hash_password(password)}},
        )
        print(f"Admin user updated: {email}")
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
