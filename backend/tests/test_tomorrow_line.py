"""A dish that has sold out today can still be ordered for tomorrow (routes/orders.py line_day; owner, 25 Nov 2026)."""
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from tests.conftest import order_body, run
from tests.test_checkout import _tomorrow_slot

CALC = "/api/orders/calculate"
ORDERS = "/api/orders"
LONDON = ZoneInfo("Europe/London")


def day(offset=0):
    return (datetime.now(LONDON) + timedelta(days=offset)).strftime("%Y-%m-%d")


def sold_out(db, item_id, until):
    run(db.menu_items.update_one({"id": item_id}, {"$set": {"sold_out_until": until}}))


def calc(client, lines, **kw):
    """lines: (dish id, quantity, asked for tomorrow)"""
    items = [{"menu_item_id": i, "quantity": q, "preorder": pre} for i, q, pre in lines]
    return client.post(CALC, json={"items": items, "order_type": "takeaway", "postcode": "", **kw})


def test_sold_out_today_is_refused_for_today_and_points_to_tomorrow(client, menu, db):
    sold_out(db, "curry", day())
    r = calc(client, [("curry", 1, False), ("biryani", 1, False)])
    assert r.status_code == 404 and "sold out for today" in r.json()["detail"] and "pre-order it for tomorrow" in r.json()["detail"]


def test_sold_out_today_can_be_ordered_for_tomorrow(client, menu, db):
    sold_out(db, "curry", day())
    tomorrow = _tomorrow_slot(client)
    no_time = calc(client, [("curry", 1, True), ("biryani", 1, False)])
    assert no_time.status_code == 400 and "tomorrow" in no_time.json()["detail"]
    r = calc(client, [("curry", 1, True), ("biryani", 1, False)], preorder_slot=tomorrow)
    assert r.status_code == 200, r.text
    assert r.json()["subtotal"] == 20.98 and r.json()["grand_total"] == 18.88


def test_back_at_a_time_today_can_be_ordered_for_tomorrow(client, menu, db):
    later = (datetime.now(LONDON) + timedelta(minutes=1)).strftime("%Y-%m-%dT%H:%M")
    if later[:10] != day():
        return                                    # the minute before midnight: "later today" does not exist
    sold_out(db, "curry", later)
    r = calc(client, [("curry", 2, True)], preorder_slot=_tomorrow_slot(client))
    assert r.status_code == 200, r.text


def test_it_becomes_a_preorder_ticket_beside_todays_order(client, menu, db, pay):
    sold_out(db, "curry", day())
    tomorrow = _tomorrow_slot(client)
    priced = calc(client, [("curry", 1, True), ("biryani", 1, False)], preorder_slot=tomorrow).json()
    body = order_body(menu, [("curry", 1), ("biryani", 1)], pay(priced["grand_total"]), preorder_slot=tomorrow)
    body["items"][0]["preorder"] = True
    r = client.post(ORDERS, json=body)
    assert r.status_code == 200, r.text
    today_order = r.json()
    assert [i["name"] for i in today_order["items"]] == ["Chicken Dum Biryani"] and today_order["is_preorder"] is False
    pre = run(db.orders.find_one({"id": today_order["linked_order_id"]}, {"_id": 0}))
    assert pre["is_preorder"] and [i["name"] for i in pre["items"]] == ["Chicken Curry"] and pre["items"][0]["preorder"] is True
    assert pre["scheduled_slot_final"] == tomorrow
    assert round(today_order["total"] + pre["total"], 2) == priced["grand_total"]
    # the same basket without the "tomorrow" request is still refused: the dish is sold out today
    again = order_body(menu, [("curry", 1), ("biryani", 1)], pay(priced["grand_total"]))
    assert client.post(ORDERS, json=again).status_code == 404


def test_not_back_by_tomorrow_cannot_be_ordered_for_tomorrow(client, menu, db):
    tomorrow = _tomorrow_slot(client)
    sold_out(db, "curry", day(1))                                    # sold out through tomorrow
    assert calc(client, [("curry", 2, True)], preorder_slot=tomorrow).status_code == 404
    sold_out(db, "curry", day(1) + "T09:00")                         # back at a time tomorrow
    assert calc(client, [("curry", 2, True)], preorder_slot=tomorrow).status_code == 404
    run(db.menu_items.update_one({"id": "curry"}, {"$set": {"sold_out_until": None, "coming_soon": True}}))
    r = calc(client, [("curry", 2, True)], preorder_slot=tomorrow)
    assert r.status_code == 404 and "isn't on sale yet" in r.json()["detail"]


def test_a_sold_out_preorder_dish_stays_off_sale(client, menu, db):
    sold_out(db, "oats", day())
    assert calc(client, [("oats", 3, True)], preorder_slot=_tomorrow_slot(client)).status_code == 404


def test_a_dish_on_sale_asked_for_tomorrow_is_a_preorder_and_a_preorder_dish_is_never_todays(client, menu):
    tomorrow = _tomorrow_slot(client)
    r = calc(client, [("curry", 2, True)])                           # asked for tomorrow: needs a time tomorrow
    assert r.status_code == 400 and "tomorrow" in r.json()["detail"]
    assert calc(client, [("curry", 2, True)], preorder_slot=tomorrow).status_code == 200
    r = calc(client, [("oats", 3, False)])                           # a pre-order dish sent as today's is still a pre-order
    assert r.status_code == 400 and "tomorrow" in r.json()["detail"]


# ── The free loyalty dish is a line of the order too ──────────────────────────

def test_a_free_dish_that_has_sold_out_is_refused_before_payment(client, menu, db):
    sold_out(db, "lassi", day())
    r = client.post(CALC, json={"items": [{"menu_item_id": "curry", "quantity": 2}], "order_type": "takeaway", "postcode": "",
                                "free_item_id": "lassi"})
    assert r.status_code == 404 and "free dish" in r.json()["detail"] and "Mango Lassi" in r.json()["detail"]


def test_a_preorder_free_dish_needs_its_time_tomorrow_before_payment(client, menu):
    body = {"items": [{"menu_item_id": "curry", "quantity": 2}], "order_type": "takeaway", "postcode": "", "free_item_id": "oats"}
    r = client.post(CALC, json=body)
    assert r.status_code == 400 and "tomorrow" in r.json()["detail"]
    assert client.post(CALC, json={**body, "preorder_slot": _tomorrow_slot(client)}).status_code == 200


def test_a_part_that_is_only_the_free_dish_carries_no_discount():
    from types import SimpleNamespace as Line
    from routes.orders import split_totals
    today = [Line(menu_item_id="lassi", price=12.00, quantity=1)]                      # the free dish, alone today
    pre = [Line(menu_item_id="b1", price=13.99, quantity=1), Line(menu_item_id="b2", price=13.99, quantity=1)]
    totals = {"small_order_fee": 0.0, "delivery_fee": 0.0, "takeaway_discount": 2.00, "free_item_discount": 12.00,
              "offer_discount": 7.99, "coupon_discount": 0.0, "grand_total": 17.99}
    part_today, part_pre = split_totals(totals, today, pre, "lassi")
    assert part_today["grand_total"] == 0.0 and part_pre["grand_total"] == 17.99
    assert part_today["offer_discount"] == 0.0 and part_today["takeaway_discount"] == 0.0
