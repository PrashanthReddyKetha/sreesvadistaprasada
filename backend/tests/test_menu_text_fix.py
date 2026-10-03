"""The one-time menu text corrections change only the phrases they name, and only once."""
import menu_text_fix
from tests.conftest import run

RAGI = "Firm balls of pearl millet, the traditional Telugu way, served with spicy Andhra chicken curry."
VADA = "Two crispy golden urad dal vadas served with our spicy Andhra chicken curry."
THALI = "A full banana-leaf feast: steamed rice and lemon rice with pappu."
KURMA = "Aloo Kurma delivery Milton Keynes — golden potatoes. Vegan-friendly South Indian comfort food. Order now."


def dishes():
    return [
        {"id": "ragi", "name": "Ragi Sangati with Chicken Curry", "description": RAGI},
        {"id": "vada", "name": "Vada (3 pcs) + Chicken Curry", "description": VADA},
        {"id": "thali", "name": "Veg Thali", "description": THALI},
        {"id": "kurma", "name": "Aloo Kurma", "description": "Golden potatoes.", "seo_meta_description": KURMA},
        {"id": "other", "name": "Masala Dosa (2 pcs)", "description": "A full banana-leaf feast of pearl millet."},
    ]


def text(db, id, field="description"):
    return run(db.menu_items.find_one({"id": id}))[field]


def test_each_named_phrase_is_corrected(db):
    run(db.menu_items.insert_many(dishes()))
    run(menu_text_fix.apply_menu_text_fix())
    assert "ragi millet" in text(db, "ragi") and "pearl millet" not in text(db, "ragi")
    assert text(db, "vada").startswith("Three crispy golden urad dal vadas")
    assert text(db, "thali").startswith("A full feast:")
    assert "Vegan-friendly" not in text(db, "kurma", "seo_meta_description")
    assert text(db, "kurma", "seo_meta_description").endswith("South Indian comfort food. Order now.")


def test_other_dishes_are_not_touched(db):
    run(db.menu_items.insert_many(dishes()))
    run(menu_text_fix.apply_menu_text_fix())
    assert text(db, "other") == "A full banana-leaf feast of pearl millet."


def test_text_already_rewritten_in_admin_is_left_alone(db):
    edited = dishes()
    edited[0]["description"] = "Soft finger millet balls with our chicken curry."
    run(db.menu_items.insert_many(edited))
    run(menu_text_fix.apply_menu_text_fix())
    assert text(db, "ragi") == "Soft finger millet balls with our chicken curry."


def test_runs_once(db):
    run(db.menu_items.insert_many(dishes()))
    run(menu_text_fix.apply_menu_text_fix())
    # the kitchen puts the old wording back on purpose — a restart must not undo that
    run(db.menu_items.update_one({"id": "thali"}, {"$set": {"description": THALI}}))
    run(menu_text_fix.apply_menu_text_fix())
    assert text(db, "thali") == THALI
