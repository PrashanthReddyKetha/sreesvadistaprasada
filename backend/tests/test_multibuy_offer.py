"""The biryani multi-buy: two non-veg biryanis for one price (offers.py; owner's rules, 25 Nov 2026)."""
from tests.conftest import basket, order_body, run, token

CALC = "/api/orders/calculate"
ORDERS = "/api/orders"
OFFER = "/api/admin/offers/multibuy"

BIRYANIS = [
    {"id": "dum", "name": "Chicken Dum Biryani", "price": 12.99, "available": True, "category": "nonVeg", "subcategory": "Biryani"},
    {"id": "egg", "name": "Special Chicken Biryani with Egg", "price": 13.99, "available": True, "category": "nonVeg", "subcategory": "Biryani"},
    {"id": "joint", "name": "Joint Chicken Biryani", "price": 13.99, "available": True, "category": "nonVeg", "subcategory": "Biryani",
     "preorder_only": True},
    {"id": "vegb", "name": "Veg Biryani", "price": 7.99, "available": True, "category": "veg", "subcategory": "Biryanis & Rice"},
]


def offer_on(db, **kw):
    run(db.menu_items.insert_many([dict(b) for b in BIRYANIS]))
    run(db.settings.update_one({"_id": "multibuy_offer"}, {"$set": {"enabled": True, "price": 19.99, **kw}}, upsert=True))


def calc(client, pairs, headers=None, **kw):
    body = {"items": basket(*pairs), "order_type": "takeaway", "postcode": "", **kw}
    return client.post(CALC, json=body, headers=headers or {})


def test_off_until_switched_on(client, menu, db):
    run(db.menu_items.insert_many([dict(b) for b in BIRYANIS]))
    r = calc(client, [("dum", 2)]).json()
    assert r["offer_discount"] == 0 and r["offer_label"] is None
    assert r["grand_total"] == 23.38                               # £25.98 less 10%
    assert client.get("/api/kitchen-status").json()["offer"]["live"] is False


def test_two_biryanis_then_ten_percent_on_top(client, menu, db):
    offer_on(db)
    r = calc(client, [("dum", 2)]).json()
    assert r["subtotal"] == 25.98 and r["offer_discount"] == 5.99 and r["offer_label"] == "2 for £19.99"
    assert r["takeaway_discount"] == 2.00                          # 10% of £19.99
    assert r["grand_total"] == 17.99
    status = client.get("/api/kitchen-status").json()["offer"]
    assert status == {"live": True, "label": "2 for £19.99", "qty": 2, "price": 19.99, "ends_at": None}


def test_mixed_pair_and_the_odd_one_out_is_the_cheapest(client, menu, db):
    offer_on(db)
    r = calc(client, [("dum", 1), ("egg", 2)]).json()             # 13.99 + 13.99 pair; the 12.99 is full price
    assert r["subtotal"] == 40.97 and r["offer_discount"] == 7.99
    assert r["grand_total"] == round((40.97 - 7.99) * 0.9, 2)
    four = calc(client, [("dum", 2), ("egg", 2)]).json()          # two sets
    assert four["offer_discount"] == round(53.96 - 2 * 19.99, 2)


def test_veg_biryani_and_one_biryani_are_not_in_it(client, menu, db):
    offer_on(db)
    assert calc(client, [("vegb", 2)]).json()["offer_discount"] == 0
    assert calc(client, [("dum", 1), ("vegb", 1)]).json()["offer_discount"] == 0


def test_runs_only_between_its_start_and_end(client, menu, db):
    offer_on(db, starts_at="2999-01-01T00:00")
    assert calc(client, [("dum", 2)]).json()["offer_discount"] == 0
    run(db.settings.update_one({"_id": "multibuy_offer"}, {"$set": {"starts_at": "2000-01-01T00:00", "ends_at": "2000-01-02T00:00"}}))
    assert calc(client, [("dum", 2)]).json()["offer_discount"] == 0
    run(db.settings.update_one({"_id": "multibuy_offer"}, {"$set": {"ends_at": "2999-01-01T00:00"}}))
    assert calc(client, [("dum", 2)]).json()["offer_discount"] == 5.99


def test_coupon_discounts_the_rest_of_the_basket_only(client, menu, db):
    offer_on(db)
    from tests.test_checkout import coupon
    coupon(db, code="TEN")
    r = calc(client, [("dum", 2), ("curry", 1)], coupon_code="TEN").json()
    assert r["coupon_error"] is None, r
    assert r["offer_discount"] == 5.99 and r["coupon_discount"] == 1.00          # 10% of the £9.99 curry only
    assert r["takeaway_discount"] == 3.00                                         # 10% of £29.98
    assert r["grand_total"] == round(35.97 - 5.99 - 1.00 - 3.00, 2)
    only = calc(client, [("dum", 2)], coupon_code="TEN").json()
    assert only["coupon_discount"] == 0 and "biryanis" in only["coupon_error"]
    assert only["grand_total"] == 17.99


def test_free_loyalty_dish_sits_beside_the_offer_and_never_makes_a_pair(client, menu, db):
    offer_on(db)
    r = calc(client, [("dum", 2)], free_item_id="curry").json()
    assert r["offer_discount"] == 5.99 and r["free_item_discount"] == 9.99
    assert r["grand_total"] == 17.99
    one = calc(client, [("dum", 1), ("curry", 1)], free_item_id="dum").json()     # one paid biryani + one free: no pair
    assert one["offer_discount"] == 0


def test_order_is_charged_and_recorded_with_the_offer(client, menu, db, pay):
    offer_on(db)
    menu = {**menu, **{b["id"]: b for b in BIRYANIS}}
    wrong = client.post(ORDERS, json=order_body(menu, [("dum", 2)], pay(23.38)))   # the price without the offer
    assert wrong.status_code == 400
    r = client.post(ORDERS, json=order_body(menu, [("dum", 2)], pay(17.99)))
    assert r.status_code == 200, r.text
    o = r.json()
    assert o["offer_discount"] == 5.99 and o["offer_label"] == "2 for £19.99" and o["total"] == 17.99


def test_pair_split_across_today_and_pre_order_adds_up(client, menu, db, pay):
    offer_on(db)
    menu = {**menu, **{b["id"]: b for b in BIRYANIS}}
    from datetime import datetime, timedelta
    from zoneinfo import ZoneInfo
    slot = (datetime.now(ZoneInfo("Europe/London")) + timedelta(days=1)).strftime("%Y-%m-%dT12:00")
    priced = calc(client, [("egg", 1), ("joint", 1)], preorder_slot=slot).json()
    assert priced["offer_discount"] == 7.99 and priced["grand_total"] == 17.99, priced
    r = client.post(ORDERS, json=order_body(menu, [("egg", 1), ("joint", 1)], pay(17.99), preorder_slot=slot))
    assert r.status_code == 200, r.text
    first = r.json()
    second = run(db.orders.find_one({"id": first["linked_order_id"]}))
    assert round(first["total"] + second["total"], 2) == 17.99
    assert round(first["offer_discount"] + second["offer_discount"], 2) == 7.99


def test_admin_sets_the_times_and_customers_cannot(client, menu, db, admin_headers):
    run(db.menu_items.insert_many([dict(b) for b in BIRYANIS]))
    admin = admin_headers
    assert client.get(OFFER).status_code in (401, 403)
    assert client.put(OFFER, json={"enabled": True, "price": 19.99}, headers=token()).status_code == 403
    view = client.get(OFFER, headers=admin).json()
    assert view["state"] == "off" and [d["name"] for d in view["dishes"]] == sorted(b["name"] for b in BIRYANIS[:3])
    bad = client.put(OFFER, json={"enabled": True, "price": 19.99, "starts_at": "2026-12-02T10:00", "ends_at": "2026-12-01T10:00"}, headers=admin)
    assert bad.status_code == 400
    on = client.put(OFFER, json={"enabled": True, "price": 19.99, "starts_at": "2999-01-01T09:00", "ends_at": None}, headers=admin).json()
    assert on["state"] == "scheduled" and on["label"] == "2 for £19.99"
    live = client.put(OFFER, json={"enabled": True, "price": 18.5, "starts_at": None, "ends_at": "2999-01-01T09:00"}, headers=admin).json()
    assert live["state"] == "live" and live["label"] == "2 for £18.50"
    assert calc(client, [("dum", 2)]).json()["offer_discount"] == round(25.98 - 18.50, 2)
