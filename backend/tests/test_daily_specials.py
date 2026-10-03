"""Today's specials must show what the customer will actually be charged."""
from routes import daily_specials
from tests.conftest import run


def item(id, name, price, available=True, **kw):
    return {"id": id, "name": name, "price": price, "available": available, "category": "breakfast",
            "subcategory": "Idli & Vada", "slug": id, "image": f"https://img/{id}.jpg", **kw}


def special(title, price, order=0, **kw):
    return {"id": f"s-{title}", "title": title, "price": price, "active": True, "display_order": order, **kw}


def shown(db, menu_items, specials):
    run(db.menu_items.insert_many(menu_items))
    run(db.daily_specials.insert_many(specials))
    return {s["title"]: s for s in run(daily_specials.list_active_specials())}


def test_linked_special_takes_the_dish_price_name_and_address(db):
    out = shown(db, [item("ghee-karam-idli-3-pcs", "Ghee Karam Idli (3 pcs)", 5.99)],
                [special("Idli special", 4.49, menu_item_id="ghee-karam-idli-3-pcs", link="/old/link")])
    s = out["Ghee Karam Idli (3 pcs)"]
    assert s["price"] == 5.99
    assert s["link"] == "/breakfast/idli-vada/ghee-karam-idli-3-pcs"
    assert s["image"] == "https://img/ghee-karam-idli-3-pcs.jpg"


def test_unlinked_special_is_matched_ignoring_the_portion_size(db):
    """The live case: 'Ghee Karam Idli' at a stale £4.49 while the dish on sale is 'Ghee Karam Idli (3 pcs)' at £5.99."""
    out = shown(db, [item("ghee-karam-idli-3-pcs", "Ghee Karam Idli (3 pcs)", 5.99)],
                [special("Ghee Karam Idli", 4.49, link="/breakfast/idli-vada/ghee-karam-idli")])
    assert out["Ghee Karam Idli (3 pcs)"]["price"] == 5.99
    assert out["Ghee Karam Idli (3 pcs)"]["link"].endswith("/ghee-karam-idli-3-pcs")


def test_special_linked_to_a_hidden_dish_follows_the_one_on_sale(db):
    out = shown(db, [item("poori-3-pcs", "Poori (3 pcs)", 5.99, available=False, subcategory="Poori & Others"),
                     item("poori-2pcs", "Poori (2pcs)", 5.49, subcategory="Poori & Others")],
                [special("Poori (3 pcs)", 5.99, menu_item_id="poori-3-pcs")])
    assert list(out) == ["Poori (2pcs)"]
    assert out["Poori (2pcs)"]["price"] == 5.49
    assert out["Poori (2pcs)"]["link"] == "/breakfast/poori-others/poori-2pcs"


def test_special_with_no_dish_on_sale_is_not_shown(db):
    out = shown(db, [item("pongal", "Pongal", 4.99, available=False)],
                [special("Pongal", 4.99, menu_item_id="pongal"), special("Mystery Dish", 3.00, order=1)])
    assert out == {}


def test_inactive_specials_stay_hidden_and_order_is_kept(db):
    out = shown(db, [item("a", "Dish A", 1.0), item("b", "Dish B", 2.0)],
                [special("Dish B", 2.0, order=2), special("Dish A", 1.0, order=1),
                 {**special("Dish A hidden", 1.0, order=0, menu_item_id="a"), "active": False}])
    assert list(out) == ["Dish A", "Dish B"]
