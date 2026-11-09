"""Stock levels: a dish can be sold out for the day, or until a set time ("Opens at 9:00"), and comes back on its own."""
from datetime import datetime, timedelta

from restock import LONDON, is_sold_out_today, sweep_expired_sold_outs
from tests.conftest import basket, run

CALC = "/api/orders/calculate"


def at(minutes):
    """A London "YYYY-MM-DDTHH:MM" this many minutes from now."""
    return (datetime.now(LONDON) + timedelta(minutes=minutes)).strftime("%Y-%m-%dT%H:%M")


def calc(client, item):
    return client.post(CALC, json={"items": basket((item, 1), ("biryani", 1)), "order_type": "takeaway", "postcode": ""})


def test_a_dish_that_opens_later_cannot_be_ordered_until_then(client, menu, db):
    run(db.menu_items.update_one({"id": "curry"}, {"$set": {"sold_out_until": at(90)}}))
    assert is_sold_out_today(run(db.menu_items.find_one({"id": "curry"})))
    assert calc(client, "curry").status_code == 404
    run(db.menu_items.update_one({"id": "curry"}, {"$set": {"sold_out_until": at(-1)}}))
    assert calc(client, "curry").status_code == 200


def test_the_sweep_clears_a_passed_time_but_keeps_a_whole_day_sold_out(client, menu, db):
    today = datetime.now(LONDON).date().isoformat()
    run(db.menu_items.update_one({"id": "curry"}, {"$set": {"sold_out_until": at(-5)}}))
    run(db.menu_items.update_one({"id": "biryani"}, {"$set": {"sold_out_until": today}}))
    run(sweep_expired_sold_outs())
    assert run(db.menu_items.find_one({"id": "curry"}))["sold_out_until"] is None
    assert run(db.menu_items.find_one({"id": "biryani"}))["sold_out_until"] == today


def test_admin_sets_opens_at_and_bad_values_are_refused(client, menu, admin_headers, db):
    run(db.menu_items.update_one({"id": "curry"}, {"$set": {"description": "Andhra style", "category": "nonVeg"}}))
    r = client.put("/api/menu/curry", headers=admin_headers, json={"sold_out_until": at(60)})
    assert r.status_code == 200 and r.json()["sold_out_today"] is True
    assert client.put("/api/menu/curry", headers=admin_headers, json={"sold_out_until": "9am"}).status_code == 422
    r = client.put("/api/menu/curry", headers=admin_headers, json={"clear_sold_out": True})
    assert r.json()["sold_out_today"] is False
