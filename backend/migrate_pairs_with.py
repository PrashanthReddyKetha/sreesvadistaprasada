"""
One-time migration: populate pairs_with for all menu items.

Position 0 of each list = Combo Deal item (shown in the combo banner).
Positions 1-5 = Goes Best With cards.

Run locally (from repo root):
    cd backend
    MONGO_URL="mongodb://..." python migrate_pairs_with.py

Run on Render shell:
    cd backend && python migrate_pairs_with.py

Idempotent — safe to re-run.
"""
import os, asyncio
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient

# Auto-load .env from backend/ or repo root
for _env in [Path(__file__).parent / ".env", Path(__file__).parent.parent / ".env"]:
    if _env.exists():
        from dotenv import load_dotenv
        load_dotenv(_env)
        print(f"Loaded env from {_env}")
        break

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME   = os.environ.get("DB_NAME", "sreesvadistaprasada")

# ── Pairings dict ─────────────────────────────────────────────────────────────
# Key   = exact item name as stored in DB
# Value = [ComboItem, Item2, Item3, Item4, Item5, Item6]
#         Position 0 is shown as the Combo Deal on the product page.
PAIRINGS = {

    # ── NON-VEG STARTERS ──────────────────────────────────────────────────────
    "Chicken Manchurian":         ["Egg Fried Rice",           "Chilli Chicken",             "Chicken Noodles",            "Chicken Fried Rice",         "Dragon Chicken",             "Masala Buttermilk"],
    "Chilli Chicken":             ["Chicken Fried Rice",        "Egg Fried Rice",              "Chicken Manchurian",         "Chicken Noodles",            "Dragon Chicken",             "Masala Buttermilk"],
    "Chicken 65":                 ["Chicken Biryani",           "Pepper Chicken",              "Gongura Chicken Curry",      "Chilli Chicken",             "Garlic Rice",                "Masala Buttermilk"],
    "Chicken Lollipop":           ["Chicken 65",                "Chicken Biryani",             "Chilli Chicken",             "Chicken Majestic",           "Masala Buttermilk",          "Ragi Butter Milk"],
    "Dragon Chicken":             ["Egg Fried Rice",            "Chilli Chicken",              "Chicken Fried Rice",         "Chicken Noodles",            "Chicken Manchurian",         "Masala Buttermilk"],
    "Chicken Tikka":              ["Butter Chicken",            "Chicken Biryani",             "Garlic Rice",                "Chicken Ghee Roast",         "Tandoori Chicken",           "Mango Lassi"],
    "Tandoori Chicken":           ["Mutton Biriyani",           "Chicken Biryani",             "Gongura Chicken Curry",      "Chicken Tikka",              "Chicken 65",                 "Masala Buttermilk"],
    "Whole Grilled Chicken":      ["Chicken Biryani",           "Gongura Chicken Curry",       "Garlic Rice",                "Pepper Chicken",             "Chicken 65",                 "Masala Buttermilk"],
    "Pepper Chicken":             ["Garlic Rice",               "Chicken Biryani",             "Gongura Chicken Curry",      "Chicken Fry",                "Chicken Ghee Roast",         "Masala Buttermilk"],
    "Garlic Pepper Chicken":      ["Garlic Rice",               "Jeera Garlic Rice",           "Pepper Chicken",             "Chicken Biryani",            "Chicken Fry",                "Masala Buttermilk"],
    "Chicken Fry":                ["Chicken Curry",             "Gongura Chicken Curry",       "Garlic Rice",                "Chicken Biryani",            "Pepper Chicken",             "Masala Buttermilk"],
    "Chicken Ghee Roast":         ["Garlic Rice",               "Jeera Garlic Rice",           "Mutton Biriyani",            "Chicken Biryani",            "Pepper Chicken",             "Masala Buttermilk"],
    "Chicken Majestic":           ["Chicken Biryani",           "Chicken 65",                  "Garlic Rice",                "Chilli Chicken",             "Masala Buttermilk",          "Ragi Butter Milk"],
    "Chicken Pakoda":             ["Chicken 65",                "Chilli Chicken",              "Masala Buttermilk",          "Chicken Biryani",            "Egg Fried Rice",             "Ragi Butter Milk"],
    "Liver Fry":                  ["Garlic Rice",               "Chicken Curry",               "Mutton Curry",               "Mutton Biriyani",            "Gongura Mutton",             "Masala Buttermilk"],
    "Prawns Ghee Roast":          ["Jeera Garlic Rice",         "Fish Pulusu",                 "Prawns Iguru",               "Garlic Rice",                "Sambar Rice",                "Masala Buttermilk"],

    # ── NON-VEG CURRIES ───────────────────────────────────────────────────────
    "Chicken Curry":              ["Sambar Rice",               "Garlic Rice",                 "Ghee Pappu Avakaya Rice",    "Chicken Fry",                "Chicken Biryani",            "Masala Buttermilk"],
    "Tomato Chicken Curry":       ["Sambar Rice",               "Garlic Rice",                 "Ghee Pappu Avakaya Rice",    "Chicken Fry",                "Chicken Biryani",            "Masala Buttermilk"],
    "Gongura Chicken Curry":      ["Ghee Pappu Avakaya Rice",   "Garlic Rice",                 "Sambar Rice",                "Chicken Biryani",            "Chicken Fry",                "Ragi Butter Milk"],
    "Dum Chicken Curry":          ["Garlic Rice",               "Ghee Pappu Avakaya Rice",     "Chicken Biryani",            "Pepper Chicken",             "Chicken 65",                 "Masala Buttermilk"],
    "Butter Chicken":             ["Garlic Rice",               "Jeera Garlic Rice",           "Paneer Butter Masala",       "Chicken Tikka",              "Veg Biryani",                "Mango Lassi"],
    "Andhra Egg Curry":           ["Sambar Rice",               "Ghee Pappu Avakaya Rice",     "Garlic Rice",                "Egg Biryani",                "Egg Masala",                 "Masala Buttermilk"],
    "Egg Kurma":                  ["Veg Biryani",               "Jeera Garlic Rice",           "Sambar Rice",                "Aloo Kurma",                 "Egg Masala",                 "Masala Buttermilk"],
    "Spicy Andhra Chicken":       ["Ghee Pappu Avakaya Rice",   "Garlic Rice",                 "Sambar Rice",                "Chicken Biryani",            "Gongura Chicken Curry",      "Ragi Butter Milk"],
    "Mutton Curry":               ["Garlic Rice",               "Ghee Pappu Avakaya Rice",     "Sambar Rice",                "Mutton Biriyani",            "Spicy Andhra Mutton",        "Masala Buttermilk"],
    "Spicy Andhra Mutton":        ["Ghee Pappu Avakaya Rice",   "Garlic Rice",                 "Sambar Rice",                "Mutton Biriyani",            "Gongura Mutton",             "Ragi Butter Milk"],
    "Gongura Mutton":             ["Ghee Pappu Avakaya Rice",   "Garlic Rice",                 "Sambar Rice",                "Mutton Biriyani",            "Spicy Andhra Mutton",        "Ragi Butter Milk"],
    "Fish Pulusu":                ["Garlic Rice",               "Jeera Garlic Rice",           "Sambar Rice",                "Prawns Iguru",               "Prawns Ghee Roast",          "Masala Buttermilk"],
    "Prawns Iguru":               ["Jeera Garlic Rice",         "Garlic Rice",                 "Sambar Rice",                "Fish Pulusu",                "Prawns Ghee Roast",          "Masala Buttermilk"],

    # ── NON-VEG BIRYANIS ──────────────────────────────────────────────────────
    "Chicken Biryani":                    ["Chicken 65",               "Pepper Chicken",        "Gongura Chicken Curry",  "Mutton Biriyani",        "Masala Buttermilk",      "Ragi Butter Milk"],
    "Special Chicken Biryani with Egg":   ["Chicken Ghee Roast",       "Gongura Chicken Curry", "Pepper Chicken",         "Chicken 65",             "Masala Buttermilk",      "Ragi Butter Milk"],
    "Chicken Fry Piece Biryani":          ["Chilli Chicken",           "Gongura Chicken Curry", "Chicken 65",             "Egg Biryani",            "Masala Buttermilk",      "Ragi Butter Milk"],
    "Mutton Biriyani":                    ["Spicy Andhra Mutton",      "Gongura Mutton",        "Liver Fry",              "Chicken Biryani",        "Masala Buttermilk",      "Ragi Butter Milk"],
    "Egg Biryani":                        ["Andhra Egg Curry",         "Chicken 65",            "Chilli Chicken",         "Egg Masala",             "Masala Buttermilk",      "Ragi Butter Milk"],

    # ── EGG & INDO-CHINESE ────────────────────────────────────────────────────
    "Chicken Noodles":            ["Chilli Chicken",            "Egg Fried Rice",              "Chicken Fried Rice",         "Chicken Manchurian",         "Dragon Chicken",             "Masala Buttermilk"],
    "Egg Noodles":                ["Egg Fried Rice",            "Chilli Chicken",              "Chicken Noodles",            "Chicken Fried Rice",         "Masala Buttermilk",          "Ragi Butter Milk"],
    "Chicken Fried Rice":         ["Chilli Chicken",            "Chicken Manchurian",          "Egg Fried Rice",             "Chicken Noodles",            "Dragon Chicken",             "Masala Buttermilk"],
    "Egg Fried Rice":             ["Egg Noodles",               "Chilli Chicken",              "Chicken Fried Rice",         "Chicken Manchurian",         "Dragon Chicken",             "Masala Buttermilk"],
    "Egg Masala":                 ["Sambar Rice",               "Ghee Pappu Avakaya Rice",     "Garlic Rice",                "Egg Biryani",                "Andhra Egg Curry",           "Masala Buttermilk"],
    "Egg Bhurji":                 ["Butter Dosa (2 pcs)",       "Masala Buttermilk",           "Upma",                       "Bread Omelette",             "Mango Lassi",                "Masala Dosa (2 pcs)"],
    "Egg Dosa":                   ["Sambar",                    "Masala Dosa (2 pcs)",         "Allam Pachadi",              "Ghee Karam Idli (3 pcs)",    "Vada (3 pcs)",               "Masala Buttermilk"],
    "Chicken Keema Dosa":         ["Chicken Biryani",           "Chilli Chicken",              "Masala Buttermilk",          "Masala Dosa (2 pcs)",        "Pepper Chicken",             "Ragi Butter Milk"],
    "Mutton Keema Dosa":          ["Mutton Biriyani",           "Pepper Chicken",              "Masala Buttermilk",          "Masala Dosa (2 pcs)",        "Liver Fry",                  "Ragi Butter Milk"],
    "Bread Omelette":             ["Butter Dosa (2 pcs)",       "Masala Buttermilk",           "Upma",                       "Masala Dosa (2 pcs)",        "Mango Lassi",                "Egg Bhurji"],
    "Cheese Bread Omelette":      ["Mango Lassi",               "Butter Dosa (2 pcs)",         "Masala Buttermilk",          "Upma",                       "Masala Dosa (2 pcs)",        "Sweet Lassi"],
    "Cheese Omelette":            ["Mango Lassi",               "Butter Dosa (2 pcs)",         "Masala Buttermilk",          "Upma",                       "Masala Dosa (2 pcs)",        "Sweet Lassi"],
    "Egg Veggie Omelette":        ["Masala Buttermilk",         "Upma",                        "Masala Dosa (2 pcs)",        "Sambar",                     "Idli (3 pcs)",               "Mango Lassi"],
    "Pure Veg Omelette":          ["Masala Buttermilk",         "Upma",                        "Idli (3 pcs)",               "Masala Dosa (2 pcs)",        "Sambar",                     "Mango Lassi"],
    "Rice, Chicken Curry, Pickle, Omelette": ["Gongura Chicken Curry", "Chicken Fry",          "Masala Buttermilk",          "Chicken Biryani",            "Ragi Butter Milk",           "Spicy Andhra Chicken"],
    "Rice, Mutton Curry, Pickle, Omelette":  ["Gongura Mutton",       "Spicy Andhra Mutton",   "Masala Buttermilk",          "Mutton Biriyani",            "Ragi Butter Milk",           "Liver Fry"],

    # ── VEG STARTERS ──────────────────────────────────────────────────────────
    "Veg Manchurian":             ["Veg Fried Rice",            "Gobi Manchurian",             "Veg Noodles",                "Egg Noodles",                "Veg Biryani",                "Mango Lassi"],
    "Gobi Manchurian":            ["Veg Biryani",               "Veg Fried Rice",              "Veg Manchurian",             "Crispy Bhindi",              "Channa Masala",              "Mango Lassi"],
    "Crispy Bhindi":              ["Sambar Rice",               "Garlic Rice",                 "Veg Biryani",                "Gobi Manchurian",            "Kandi Podi",                 "Mango Lassi"],
    "Crispy Corn":                ["Veg Biryani",               "Crispy Bhindi",               "Gobi Manchurian",            "Veg Fried Rice",             "Mango Lassi",                "Masala Buttermilk"],
    "Crispy Potato":              ["Sambar Rice",               "Crispy Bhindi",               "Veg Biryani",                "Gobi Manchurian",            "Kandi Podi",                 "Masala Buttermilk"],
    "Onion Bhaji":                ["Masala Buttermilk",         "Allam Pachadi",               "Sambar",                     "Masala Dosa (2 pcs)",        "Onion Mirchi Bhajji",        "Mango Lassi"],
    "Onion Mirchi Bhajji":        ["Masala Buttermilk",         "Allam Pachadi",               "Sambar",                     "Onion Bhaji",                "Cut Mirchi",                 "Mango Lassi"],
    "Punugulu":                   ["Allam Pachadi",             "Masala Buttermilk",           "Sambar",                     "Idli (3 pcs)",               "Vada (3 pcs)",               "Mango Lassi"],
    "Cut Mirchi":                 ["Masala Buttermilk",         "Allam Pachadi",               "Sambar",                     "Punugulu",                   "Onion Mirchi Bhajji",        "Mango Lassi"],
    "Panipuri":                   ["Channa Chat",               "Peanut Chat",                 "Crispy Corn",                "Masala Buttermilk",          "Onion Bhaji",                "Mango Lassi"],
    "Peanut Chat":                ["Channa Chat",               "Panipuri",                    "Crispy Corn",                "Masala Buttermilk",          "Onion Bhaji",                "Mango Lassi"],
    "Channa Chat":                ["Peanut Chat",               "Panipuri",                    "Crispy Corn",                "Masala Buttermilk",          "Onion Bhaji",                "Mango Lassi"],
    "Veg Noodles":                ["Veg Manchurian",            "Veg Fried Rice",              "Gobi Manchurian",            "Egg Fried Rice",             "Crispy Bhindi",              "Mango Lassi"],
    "Veg Fried Rice":             ["Veg Manchurian",            "Veg Noodles",                 "Gobi Manchurian",            "Veg Biryani",                "Crispy Bhindi",              "Mango Lassi"],

    # ── VEG CURRIES ───────────────────────────────────────────────────────────
    "Tomato Pappu":               ["Ghee Pappu Avakaya Rice",   "Garlic Rice",                 "Sambar Rice",                "Gongura Pappu",              "Mango Avakaya",              "Kandi Podi"],
    "Gongura Pappu":              ["Ghee Pappu Avakaya Rice",   "Garlic Rice",                 "Coconut Rice",               "Tomato Pappu",               "Mango Avakaya",              "Kandi Podi"],
    "Tadka Dal":                  ["Garlic Rice",               "Jeera Garlic Rice",           "Coconut Rice",               "Paneer Butter Masala",       "Gongura Pickle",             "Kandi Podi"],
    "Sambar":                     ["Idli (3 pcs)",              "Vada (3 pcs)",                "Masala Dosa (2 pcs)",        "Sambar Rice",                "Allam Pachadi",              "Kandi Podi"],
    "Rasam":                      ["Garlic Rice",               "Rasam Rice",                  "Sambar Rice",                "Tomato Pappu",               "Kandi Podi",                 "Coconut Rice"],
    "Bhindi Pulusu":              ["Garlic Rice",               "Sambar Rice",                 "Ghee Pappu Avakaya Rice",    "Gongura Pappu",              "Mango Avakaya",              "Kandi Podi"],
    "Paneer Butter Masala":       ["Garlic Rice",               "Jeera Garlic Rice",           "Veg Biryani",                "Gobi Manchurian",            "Aloo Kurma",                 "Mango Lassi"],
    "Aloo Kurma":                 ["Veg Biryani",               "Poori (3 pcs)",               "Jeera Garlic Rice",          "Paneer Butter Masala",       "Gobi Manchurian",            "Masala Buttermilk"],
    "Saag Aloo":                  ["Garlic Rice",               "Jeera Garlic Rice",           "Veg Biryani",                "Paneer Butter Masala",       "Mango Lassi",                "Kandi Podi"],
    "Methi Chaman":               ["Garlic Rice",               "Jeera Garlic Rice",           "Veg Biryani",                "Paneer Butter Masala",       "Mango Lassi",                "Kandi Podi"],
    "Gutti Vankaya Masala":       ["Ghee Pappu Avakaya Rice",   "Garlic Rice",                 "Sambar Rice",                "Gongura Pappu",              "Mango Avakaya",              "Kandi Podi"],
    "Channa Masala":              ["Veg Biryani",               "Garlic Rice",                 "Veg Pulao",                  "Poori (3 pcs)",              "Gobi Manchurian",            "Mango Lassi"],
    "Mulakkada Tomato Curry":     ["Sambar Rice",               "Garlic Rice",                 "Ghee Pappu Avakaya Rice",    "Tomato Pappu",               "Mango Avakaya",              "Kandi Podi"],
    "Meal Maker Kurma":           ["Veg Biryani",               "Garlic Rice",                 "Jeera Garlic Rice",          "Aloo Kurma",                 "Paneer Butter Masala",       "Mango Lassi"],
    "Perugu Pulusu":              ["Coconut Rice",              "Garlic Rice",                 "Sambar Rice",                "Gongura Pickle",             "Mango Avakaya",              "Kandi Podi"],
    "Fry of the Day":             ["Garlic Rice",               "Sambar Rice",                 "Ghee Pappu Avakaya Rice",    "Gongura Pappu",              "Kandi Podi",                 "Masala Buttermilk"],

    # ── VEG BIRYANI & PULAO ───────────────────────────────────────────────────
    "Veg Biryani":                ["Paneer Butter Masala",      "Gutti Vankaya Masala",        "Aloo Kurma",                 "Gobi Manchurian",            "Mango Lassi",                "Masala Buttermilk"],
    "Veg Pulao":                  ["Aloo Kurma",                "Paneer Butter Masala",        "Tadka Dal",                  "Channa Masala",              "Mango Lassi",                "Masala Buttermilk"],

    # ── NAIVEDYAM / RICE ──────────────────────────────────────────────────────
    "Pulihora":                   ["Kandi Podi",                "Tomato Pappu",                "Mango Avakaya",              "Gongura Pickle",             "Coconut Rice",               "Masala Buttermilk"],
    "Prasadam Pulihora":          ["Kandi Podi",                "Nuvvula Podi",                "Tomato Pappu",               "Coconut Rice",               "Mango Avakaya",              "Masala Buttermilk"],
    "Lemon Rice":                 ["Gongura Pickle",            "Coconut Rice",                "Kandi Podi",                 "Mango Avakaya",              "Tomato Pappu",               "Masala Buttermilk"],
    "Pongal":                     ["Sambar",                    "Vada (3 pcs)",                "Allam Pachadi",              "Masala Dosa (2 pcs)",        "Masala Buttermilk",          "Mango Lassi"],
    "Chekara Pongal":             ["Pongal",                    "Idli (3 pcs)",                "Vada (3 pcs)",               "Masala Buttermilk",          "Mango Lassi",                "Sweet Lassi"],
    "Coconut Rice":               ["Gongura Pickle",            "Lemon Rice",                  "Kandi Podi",                 "Mango Avakaya",              "Tomato Pappu",               "Masala Buttermilk"],
    "Tomato Rice":                ["Kandi Podi",                "Gongura Pickle",              "Sambar Rice",                "Tomato Pappu",               "Mango Avakaya",              "Masala Buttermilk"],
    "Pudina Rice":                ["Aloo Kurma",                "Gongura Pickle",              "Kandi Podi",                 "Garlic Rice",                "Coconut Rice",               "Masala Buttermilk"],
    "Coriander Rice":             ["Kandi Podi",                "Gongura Pickle",              "Garlic Rice",                "Coconut Rice",               "Tomato Pappu",               "Masala Buttermilk"],
    "Cut Pongal":                 ["Sambar",                    "Allam Pachadi",               "Masala Buttermilk",          "Vada (3 pcs)",               "Mango Lassi",                "Idli (3 pcs)"],
    "Jeera Rice":                 ["Paneer Butter Masala",      "Tadka Dal",                   "Gongura Pickle",             "Garlic Rice",                "Kandi Podi",                 "Mango Lassi"],
    "Garlic Rice":                ["Gutti Vankaya Masala",      "Bhindi Pulusu",               "Gongura Pappu",              "Gongura Pickle",             "Kandi Podi",                 "Masala Buttermilk"],
    "Jeera Garlic Rice":          ["Paneer Butter Masala",      "Garlic Rice",                 "Gongura Pappu",              "Kandi Podi",                 "Gutti Vankaya Masala",       "Masala Buttermilk"],
    "Sambar Rice":                ["Kandi Podi",                "Ghee Pappu Avakaya Rice",     "Tomato Pappu",               "Gongura Pickle",             "Coconut Rice",               "Masala Buttermilk"],
    "Rasam Rice":                 ["Sambar Rice",               "Kandi Podi",                  "Tomato Pappu",               "Gongura Pickle",             "Coconut Rice",               "Masala Buttermilk"],
    "Ghee Pappu Avakaya Rice":    ["Mango Avakaya",             "Gongura Pickle",              "Kandi Podi",                 "Gongura Pappu",              "Tomato Pappu",               "Perugu Pulusu"],
    "Pappu, Pappadam, Roti Pachadi, Rice": ["Gongura Pickle",  "Kandi Podi",                  "Mango Avakaya",              "Gongura Pappu",              "Tomato Pappu",               "Masala Buttermilk"],

    # ── PICKLES & PODIS ───────────────────────────────────────────────────────
    "Gongura Pickle":             ["Garlic Rice",               "Ghee Pappu Avakaya Rice",     "Kandi Podi",                 "Coconut Rice",               "Lemon Rice",                 "Gongura Pappu"],
    "Mango Avakaya":              ["Ghee Pappu Avakaya Rice",   "Gongura Pickle",              "Kandi Podi",                 "Sambar Rice",                "Garlic Rice",                "Tomato Pappu"],
    "Lemon Pickle":               ["Ghee Pappu Avakaya Rice",   "Garlic Rice",                 "Sambar Rice",                "Gongura Pickle",             "Kandi Podi",                 "Tomato Pappu"],
    "Tomato Pickle":              ["Garlic Rice",               "Ghee Pappu Avakaya Rice",     "Kandi Podi",                 "Sambar Rice",                "Gongura Pickle",             "Tomato Pappu"],
    "Velluli Pachadi":            ["Garlic Rice",               "Ghee Pappu Avakaya Rice",     "Kandi Podi",                 "Sambar Rice",                "Gongura Pickle",             "Tomato Pappu"],
    "Allam Pachadi":              ["Masala Dosa (2 pcs)",       "Idli (3 pcs)",                "Vada (3 pcs)",               "Upma",                       "Sambar",                     "Masala Buttermilk"],
    "Kandi Podi":                 ["Sambar Rice",               "Ghee Pappu Avakaya Rice",     "Garlic Rice",                "Mango Avakaya",              "Gongura Pickle",             "Tomato Pappu"],
    "Nalla Karam":                ["Ghee Pappu Avakaya Rice",   "Sambar Rice",                 "Garlic Rice",                "Kandi Podi",                 "Gongura Pickle",             "Mango Avakaya"],
    "Karivepaku Podi":            ["Garlic Rice",               "Sambar Rice",                 "Kandi Podi",                 "Ghee Pappu Avakaya Rice",    "Gongura Pickle",             "Masala Buttermilk"],
    "Palli Podi":                 ["Sambar Rice",               "Garlic Rice",                 "Kandi Podi",                 "Ghee Pappu Avakaya Rice",    "Gongura Pickle",             "Coconut Rice"],
    "Nuvvula Podi":               ["Sambar Rice",               "Kandi Podi",                  "Garlic Rice",                "Mango Avakaya",              "Gongura Pickle",             "Ghee Pappu Avakaya Rice"],
    "Kobbari Podi":               ["Sambar Rice",               "Kandi Podi",                  "Garlic Rice",                "Ghee Pappu Avakaya Rice",    "Gongura Pickle",             "Coconut Rice"],

    # ── BREAKFAST ─────────────────────────────────────────────────────────────
    "Idli (3 pcs)":               ["Sambar",                    "Vada (3 pcs)",                "Masala Dosa (2 pcs)",        "Allam Pachadi",              "Ghee Karam Idli (3 pcs)",    "Masala Buttermilk"],
    "Ghee Karam Idli (3 pcs)":    ["Sambar",                    "Idli (3 pcs)",                "Vada (3 pcs)",               "Masala Dosa (2 pcs)",        "Allam Pachadi",              "Masala Buttermilk"],
    "Sambar Idli (2 pcs)":        ["Vada (3 pcs)",              "Idli (3 pcs)",                "Masala Dosa (2 pcs)",        "Allam Pachadi",              "Ghee Karam Idli (3 pcs)",    "Masala Buttermilk"],
    "Vada (3 pcs)":               ["Sambar",                    "Idli (3 pcs)",                "Masala Dosa (2 pcs)",        "Allam Pachadi",              "Sambar Vada (2 pcs)",        "Masala Buttermilk"],
    "Sambar Vada (2 pcs)":        ["Vada (3 pcs)",              "Idli (3 pcs)",                "Masala Dosa (2 pcs)",        "Allam Pachadi",              "Sambar",                     "Masala Buttermilk"],
    "Plain Dosa (2 pcs)":         ["Sambar",                    "Allam Pachadi",               "Masala Dosa (2 pcs)",        "Idli (3 pcs)",               "Vada (3 pcs)",               "Masala Buttermilk"],
    "Masala Dosa (2 pcs)":        ["Sambar",                    "Vada (3 pcs)",                "Idli (3 pcs)",               "Allam Pachadi",              "Ghee Karam Idli (3 pcs)",    "Masala Buttermilk"],
    "Ghee Dosa (2 pcs)":          ["Sambar",                    "Allam Pachadi",               "Masala Dosa (2 pcs)",        "Vada (3 pcs)",               "Idli (3 pcs)",               "Masala Buttermilk"],
    "Carrot Dosa (2 pcs)":        ["Sambar",                    "Allam Pachadi",               "Masala Dosa (2 pcs)",        "Beetroot Dosa (2 pcs)",      "Vada (3 pcs)",               "Mango Lassi"],
    "Beetroot Dosa (2 pcs)":      ["Sambar",                    "Allam Pachadi",               "Masala Dosa (2 pcs)",        "Carrot Dosa (2 pcs)",        "Vada (3 pcs)",               "Mango Lassi"],
    "Nellore Ghee Karam Dosa (2 pcs)": ["Sambar",              "Ghee Karam Idli (3 pcs)",     "Allam Pachadi",              "Masala Dosa (2 pcs)",        "Vada (3 pcs)",               "Masala Buttermilk"],
    "Cheese Dosa":                ["Sambar",                    "Masala Dosa (2 pcs)",         "Allam Pachadi",              "Mango Lassi",                "Vada (3 pcs)",               "Sweet Lassi"],
    "Upma Dosa":                  ["Sambar",                    "Allam Pachadi",               "Masala Dosa (2 pcs)",        "Upma",                       "Vada (3 pcs)",               "Masala Buttermilk"],
    "Paneer Dosa":                ["Sambar",                    "Masala Dosa (2 pcs)",         "Allam Pachadi",              "Ghee Dosa (2 pcs)",          "Paneer Butter Masala",       "Mango Lassi"],
    "Butter Dosa (2 pcs)":        ["Allam Pachadi",             "Sambar",                      "Ghee Karam Idli (3 pcs)",    "Masala Dosa (2 pcs)",        "Idli (3 pcs)",               "Masala Buttermilk"],
    "Poori (3 pcs)":              ["Aloo Kurma",                "Sambar",                      "Masala Dosa (2 pcs)",        "Allam Pachadi",              "Masala Buttermilk",          "Mango Lassi"],
    "Poha":                       ["Masala Buttermilk",         "Upma",                        "Sambar",                     "Allam Pachadi",              "Masala Dosa (2 pcs)",        "Mango Lassi"],
    "Uggani":                     ["Masala Buttermilk",         "Poha",                        "Upma",                       "Sambar",                     "Allam Pachadi",              "Mango Lassi"],
    "Upma":                       ["Allam Pachadi",             "Masala Dosa (2 pcs)",         "Idli (3 pcs)",               "Sambar",                     "Masala Buttermilk",          "Mango Lassi"],
    "Masala Oats Upma":           ["Masala Buttermilk",         "Upma",                        "Sambar",                     "Allam Pachadi",              "Idli (3 pcs)",               "Mango Lassi"],

    # ── BURGERS & WRAPS ───────────────────────────────────────────────────────
    "Veg Burger":                 ["Crispy Bhindi",             "Veg Wrap",                    "Veg Cheese Burger",          "Masala Buttermilk",          "Crispy Corn",                "Mango Lassi"],
    "Chicken Burger":             ["Chicken 65",                "Chicken Wrap",                "Chicken Cheese Burger",      "Masala Buttermilk",          "Chilli Chicken",             "Mango Lassi"],
    "Veg Wrap":                   ["Veg Biryani",               "Veg Burger",                  "Crispy Bhindi",              "Masala Buttermilk",          "Gobi Manchurian",            "Mango Lassi"],
    "Chicken Wrap":               ["Chicken Biryani",           "Chicken Burger",              "Chicken 65",                 "Masala Buttermilk",          "Chilli Chicken",             "Mango Lassi"],
    "Chicken Cheese Burger":      ["Chicken 65",                "Chicken Burger",              "Chicken Wrap",               "Masala Buttermilk",          "Chilli Chicken",             "Mango Lassi"],
    "Veg Cheese Burger":          ["Crispy Bhindi",             "Veg Burger",                  "Veg Wrap",                   "Masala Buttermilk",          "Gobi Manchurian",            "Mango Lassi"],

    # ── STREET FOOD ───────────────────────────────────────────────────────────
    "Pani Puri (6 pcs)":          ["Channa Chat",               "Peanut Chat",                 "Crispy Corn",                "Masala Buttermilk",          "Onion Bhaji",                "Mango Lassi"],
    "Veg Momos (6 pcs)":          ["Masala Buttermilk",         "Chicken Momos (6 pcs)",       "Gobi Manchurian",            "Crispy Corn",                "Veg Fried Rice",             "Mango Lassi"],
    "Chicken Momos (6 pcs)":      ["Masala Buttermilk",         "Veg Momos (6 pcs)",           "Chilli Chicken",             "Chicken 65",                 "Chicken Fried Rice",         "Mango Lassi"],

    # ── RAGI SPECIALS ─────────────────────────────────────────────────────────
    "Ragi Sangati with Chicken Curry":         ["Spicy Andhra Chicken",  "Gongura Chicken Curry", "Chicken Fry",     "Mutton Curry",    "Ragi Butter Milk",  "Masala Buttermilk"],
    "Ragi Sangati with Mutton Curry":          ["Spicy Andhra Mutton",   "Gongura Mutton",        "Liver Fry",       "Chicken Curry",   "Ragi Butter Milk",  "Masala Buttermilk"],
    "Ragi Sangati with Pappu and Pachi Pulusu":["Sambar",                "Gongura Pappu",         "Tomato Pappu",    "Kandi Podi",      "Ragi Butter Milk",  "Masala Buttermilk"],
    "Ragi Jaava / Malt":                       ["Ragi Butter Milk",      "Masala Buttermilk",     "Idli (3 pcs)",    "Upma",            "Sambar",            "Mango Lassi"],
    "Ragi Butter Milk":                        ["Ragi Sangati with Chicken Curry", "Masala Buttermilk", "Spicy Andhra Chicken", "Gongura Chicken Curry", "Mutton Biriyani", "Ragi Jaava / Malt"],

    # ── DRINKS ────────────────────────────────────────────────────────────────
    "Masala Buttermilk":          ["Chicken Biryani",           "Ragi Butter Milk",            "Gongura Chicken Curry",      "Spicy Andhra Chicken",       "Mutton Biriyani",            "Masala Dosa (2 pcs)"],
    "Mango Lassi":                ["Paneer Butter Masala",      "Sweet Lassi",                 "Veg Biryani",                "Butter Chicken",             "Chicken Tikka",              "Garlic Rice"],
    "Sweet Lassi":                ["Veg Biryani",               "Mango Lassi",                 "Paneer Butter Masala",       "Aloo Kurma",                 "Channa Masala",              "Jeera Garlic Rice"],
    "Lemon Water (Sweet)":        ["Masala Buttermilk",         "Lemon Water (Salt)",          "Mango Lassi",                "Masala Dosa (2 pcs)",        "Upma",                       "Idli (3 pcs)"],
    "Lemon Water (Salt)":         ["Masala Buttermilk",         "Lemon Water (Sweet)",         "Mango Lassi",                "Masala Dosa (2 pcs)",        "Upma",                       "Idli (3 pcs)"],
    "Orange Juice":               ["Mango Lassi",               "Sweet Lassi",                 "Lemon Water (Sweet)",        "Masala Dosa (2 pcs)",        "Idli (3 pcs)",               "Masala Buttermilk"],
    "Apple Juice":                ["Mango Lassi",               "Sweet Lassi",                 "Orange Juice",               "Lemon Water (Sweet)",        "Masala Dosa (2 pcs)",        "Masala Buttermilk"],
    "Carrot Juice":               ["Masala Buttermilk",         "Apple Juice",                 "Lemon Water (Sweet)",        "Sweet Lassi",                "Idli (3 pcs)",               "Masala Dosa (2 pcs)"],
    "ABC Juice":                  ["Masala Buttermilk",         "Carrot Juice",                "Lemon Water (Sweet)",        "Sweet Lassi",                "Idli (3 pcs)",               "Masala Dosa (2 pcs)"],
    "Pineapple Juice":            ["Mango Lassi",               "Sweet Lassi",                 "Orange Juice",               "Apple Juice",                "Lemon Water (Sweet)",        "Masala Buttermilk"],
    "Plant Based Chocolate Protein Shake": ["Whey Chocolate Protein Shake", "Masala Buttermilk", "Chicken Tikka",           "Whole Grilled Chicken",      "Tandoori Chicken",           "Ragi Jaava / Malt"],
    "Whey Chocolate Protein Shake":        ["Plant Based Chocolate Protein Shake", "Masala Buttermilk", "Chicken Tikka",    "Whole Grilled Chicken",      "Tandoori Chicken",           "Ragi Jaava / Malt"],
}


async def run():
    client = AsyncIOMotorClient(MONGO_URL)
    db     = client[DB_NAME]
    col    = db.menu_items

    # Build name → id lookup from live DB
    # Items have a UUID "id" field (not the Mongo _id) — use that, as the API routes on it
    print("Loading items from DB...")
    name_to_id = {}
    async for doc in col.find({}, {"name": 1, "id": 1}):
        # Prefer the "id" UUID field; fall back to str(_id) if absent
        item_id = doc.get("id") or str(doc["_id"])
        name_to_id[doc["name"]] = item_id

    print(f"  Found {len(name_to_id)} items in DB\n")

    updated = 0
    skipped = 0
    missing_pairs: list[str] = []

    for item_name, pair_names in PAIRINGS.items():
        item_id = name_to_id.get(item_name)
        if not item_id:
            print(f"  [SKIP] Item not found in DB: '{item_name}'")
            skipped += 1
            continue

        pair_ids = []
        for pname in pair_names:
            pid = name_to_id.get(pname)
            if pid:
                pair_ids.append(pid)
            else:
                missing_pairs.append(f"{item_name} → '{pname}'")

        await col.update_one(
            {"name": item_name},
            {"$set": {"pairs_with": pair_ids}}
        )
        updated += 1

    print(f"\n✅ Updated : {updated}")
    print(f"⚠️  Skipped : {skipped}")
    if missing_pairs:
        print(f"\n⚠️  Pair items not found in DB ({len(missing_pairs)}):")
        for m in missing_pairs:
            print(f"   {m}")
    else:
        print("✅ All pair items resolved successfully")

    client.close()


if __name__ == "__main__":
    asyncio.run(run())
