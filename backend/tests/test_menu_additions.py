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


def test_gongura_prawns_and_joint_biryani_are_added_to_svadista(db):
    run(menu_additions.apply_gongura_prawns_and_joint_biryani())
    prawns = run(db.menu_items.find_one({"slug": "gongura-prawns"}))
    biryani = run(db.menu_items.find_one({"slug": "joint-chicken-biryani"}))
    assert (prawns["category"], prawns["subcategory"], prawns["price"]) == ("nonVeg", "Curries", 12.99)
    assert (biryani["category"], biryani["subcategory"], biryani["price"]) == ("nonVeg", "Biryani", 12.99)
    assert prawns["available"] and biryani["available"] and prawns["id"] and biryani["id"]


def test_a_deleted_new_dish_stays_deleted_and_an_existing_one_is_kept(db):
    run(db.menu_items.insert_one({"id": "x", "name": "Gongura Prawns", "slug": "gongura-prawns", "price": 11.5}))
    run(menu_additions.apply_gongura_prawns_and_joint_biryani())
    assert run(db.menu_items.count_documents({"slug": "gongura-prawns"})) == 1
    assert run(db.menu_items.find_one({"slug": "gongura-prawns"}))["price"] == 11.5
    run(db.menu_items.delete_one({"slug": "joint-chicken-biryani"}))
    run(menu_additions.apply_gongura_prawns_and_joint_biryani())
    assert run(db.menu_items.find_one({"slug": "joint-chicken-biryani"})) is None


def test_biryani_spelling_moves_tabs_names_and_addresses_once(db):
    run(db.menu_items.insert_many([
        {"id": "b1", "name": "Mutton Biriyani", "slug": "mutton-biriyani", "category": "nonVeg", "subcategory": "Biriyani", "extra_categories": []},
        {"id": "b2", "name": "Veg Fried Rice", "slug": "veg-fried-rice", "category": "veg", "subcategory": "Indo Chinese",
         "extra_categories": [{"category": "veg", "subcategory": "Biriyanis & Rice"}]},
        {"id": "b3", "name": "Jeera Rice", "slug": "jeera-rice", "category": "veg", "subcategory": "Biriyanis & Rice", "extra_categories": []},
    ]))
    run(menu_additions.apply_biryani_spelling())
    run(menu_additions.apply_biryani_spelling())   # a second boot changes nothing
    mutton = run(db.menu_items.find_one({"id": "b1"}))
    assert (mutton["name"], mutton["slug"], mutton["subcategory"]) == ("Mutton Biryani", "mutton-biryani", "Biryani")
    assert run(db.menu_items.find_one({"id": "b2"}))["extra_categories"] == [{"category": "veg", "subcategory": "Biryanis & Rice"}]
    assert run(db.menu_items.find_one({"id": "b3"}))["subcategory"] == "Biryanis & Rice"
    assert run(db.menu_items.count_documents({"$or": [{"subcategory": {"$regex": "Biriyani"}}, {"name": {"$regex": "Biriyani"}}]})) == 0
