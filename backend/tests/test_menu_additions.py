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


BREAKFAST = {"category": "breakfast", "subcategory": "English Breakfast"}


def test_the_three_bowls_join_english_breakfast_and_keep_their_other_tabs(db):
    run(db.menu_items.insert_many([
        {"id": "v", "slug": "protein-veg-bowl", "extra_categories": [{"category": "nonVeg", "subcategory": "Protein & Healthy Bowls"}]},
        {"id": "n", "slug": "protein-non-veg-bowl", "extra_categories": []},
        {"id": "o", "slug": "avocado-toast", "extra_categories": []},
    ]))
    run(menu_additions.apply_protein_egg_bowl())
    run(menu_additions.apply_bowls_at_breakfast())
    run(menu_additions.apply_bowls_at_breakfast())
    for slug in ("protein-veg-bowl", "protein-non-veg-bowl", "protein-egg-bowl"):
        extras = run(db.menu_items.find_one({"slug": slug}))["extra_categories"]
        assert extras.count(BREAKFAST) == 1
    assert {"category": "nonVeg", "subcategory": "Protein & Healthy Bowls"} in run(db.menu_items.find_one({"id": "v"}))["extra_categories"]
    assert {"category": "nonVeg", "subcategory": "Egg Specials"} in bowl(db)["extra_categories"]
    assert run(db.menu_items.find_one({"id": "o"}))["extra_categories"] == []


def test_removing_a_bowl_from_breakfast_in_admin_sticks(db):
    run(db.menu_items.insert_one({"id": "n", "slug": "protein-non-veg-bowl", "extra_categories": []}))
    run(menu_additions.apply_bowls_at_breakfast())
    run(db.menu_items.update_one({"id": "n"}, {"$set": {"extra_categories": []}}))
    run(menu_additions.apply_bowls_at_breakfast())
    assert run(db.menu_items.find_one({"id": "n"}))["extra_categories"] == []
