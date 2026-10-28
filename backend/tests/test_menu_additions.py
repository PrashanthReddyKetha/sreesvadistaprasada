"""The Protein Egg Bowl is added once, in both Svadista sections, and never brought back after the admin deletes it."""
import menu_additions
from tests.conftest import run


def bowl(db):
    return run(db.menu_items.find_one({"slug": "protein-egg-bowl"}))


def test_egg_bowl_is_added_to_protein_bowls_and_egg_specials(db):
    run(menu_additions.apply_protein_egg_bowl())
    item = bowl(db)
    assert item["name"] == "Protein Egg Bowl" and item["available"] and not item["is_veg"]
    assert (item["category"], item["subcategory"]) == ("nonVeg", "Protein & Healthy Bowls")
    assert {"category": "nonVeg", "subcategory": "Egg Specials"} in item["extra_categories"]
    assert item["id"]


def test_runs_once_so_a_deleted_bowl_stays_deleted(db):
    run(menu_additions.apply_protein_egg_bowl())
    run(db.menu_items.delete_one({"slug": "protein-egg-bowl"}))
    run(menu_additions.apply_protein_egg_bowl())
    assert bowl(db) is None


def test_an_existing_bowl_is_not_duplicated(db):
    run(db.menu_items.insert_one({"id": "x", "name": "Protein Egg Bowl", "slug": "protein-egg-bowl", "price": 9.5}))
    run(menu_additions.apply_protein_egg_bowl())
    assert run(db.menu_items.count_documents({"name": "Protein Egg Bowl"})) == 1
    assert bowl(db)["price"] == 9.5
