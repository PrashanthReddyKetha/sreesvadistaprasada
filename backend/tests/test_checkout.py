"""Cart, pricing and checkout rules — the Phase 04 "torture test", server side."""
from datetime import datetime, timedelta, timezone

from tests.conftest import basket, order_body, run, token

CALC = "/api/orders/calculate"
ORDERS = "/api/orders"
MK = "MK12 5AA"   # zone 1: £2.49 fee, free over £28


def delivery_on(db):
    run(db.settings.update_one({"_id": "pickup_slots"}, {"$set": {"delivery_enabled": True}}, upsert=True))


def calc(client, pairs, headers=None, **kw):
    body = {"items": basket(*pairs), "order_type": "takeaway", "postcode": "", **kw}
    return client.post(CALC, json=body, headers=headers or {})


# ── Pricing ───────────────────────────────────────────────────────────────────

def test_collection_gets_ten_percent_off_and_no_fees(client, menu):
    r = calc(client, [("curry", 1), ("biryani", 1)]).json()
    assert r["subtotal"] == 20.98
    assert r["takeaway_discount"] == 2.10
    assert r["delivery_fee"] == 0 and r["small_order_fee"] == 0
    assert r["grand_total"] == 18.88


def test_minimum_order_enforced(client, menu):
    r = calc(client, [("dosa", 2)])
    assert r.status_code == 400 and "Minimum order" in r.json()["detail"]


def test_quantity_bounds(client, menu):
    assert calc(client, [("curry", 0)]).status_code == 422
    assert calc(client, [("curry", 51)]).status_code == 422


def test_delivery_refused_while_switched_off(client, menu):
    r = calc(client, [("curry", 2)], order_type="delivery", postcode=MK)
    assert r.status_code == 400 and "Delivery isn't available" in r.json()["detail"]


def test_delivery_fees_when_switched_on(client, menu, db):
    delivery_on(db)
    small = calc(client, [("curry", 1), ("dosa", 1)], order_type="delivery", postcode=MK).json()   # £16.98
    assert small["small_order_fee"] == 1.50 and small["delivery_fee"] == 2.49
    assert small["grand_total"] == 20.97 and small["takeaway_discount"] == 0
    mid = calc(client, [("curry", 2), ("dosa", 1)], order_type="delivery", postcode=MK).json()    # £26.97
    assert mid["small_order_fee"] == 0 and mid["delivery_fee"] == 2.49
    free = calc(client, [("curry", 3)], order_type="delivery", postcode=MK).json()                # £29.97
    assert free["delivery_fee"] == 0 and free["grand_total"] == 29.97


def test_unsupported_and_invalid_postcodes(client, menu, db):
    delivery_on(db)
    for pc in ("EH1 1AA", "NOTAPOSTCODE", ""):
        r = calc(client, [("curry", 2)], order_type="delivery", postcode=pc)
        assert r.status_code == 400, pc
    assert client.get("/api/orders/check-postcode", params={"postcode": "EH1 1AA"}).json()["deliverable"] is False


def test_hidden_or_sold_out_item_blocks_pricing_with_its_name(client, menu, db):
    assert calc(client, [("curry", 2), ("hidden", 1)]).status_code == 404
    tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")
    run(db.menu_items.update_one({"id": "curry"}, {"$set": {"sold_out_until": tomorrow}}))
    r = calc(client, [("curry", 2)])
    assert r.status_code == 404 and "Chicken Curry" in r.json()["detail"]


def test_kitchen_closed_blocks_pricing(client, menu, db):
    run(db.settings.update_one({"_id": "pickup_slots"}, {"$set": {"paused": True, "paused_message": "Back at 5"}}, upsert=True))
    r = calc(client, [("curry", 2)])
    assert r.status_code == 400 and r.json()["detail"] == "Back at 5"


def test_preorder_item_needs_collection_slot_tomorrow(client, menu):
    r = calc(client, [("oats", 1), ("curry", 1)])
    assert r.status_code == 400 and "tomorrow" in r.json()["detail"]


# ── Server is authoritative ───────────────────────────────────────────────────

def test_client_prices_and_names_are_ignored(client, menu, pay):
    pi = pay(18.88)
    body = order_body(menu, [("curry", 1), ("biryani", 1)], pi)
    body["items"][0].update(name="Free Lunch", price=0.01)
    o = client.post(ORDERS, json=body).json()
    assert o["items"][0]["name"] == "Chicken Curry" and o["items"][0]["price"] == 9.99
    assert o["total"] == 18.88 and o["payment_status"] == "paid"
    assert o["order_number"].startswith("SP")


def test_price_change_between_cart_and_payment_is_caught(client, menu, pay, db):
    pi = pay(18.88)                                                        # paid the old price
    run(db.menu_items.update_one({"id": "curry"}, {"$set": {"price": 12.99}}))
    r = client.post(ORDERS, json=order_body(menu, [("curry", 1), ("biryani", 1)], pi))
    assert r.status_code == 400 and "does not match" in r.json()["detail"]
    assert run(db.orders.count_documents({})) == 0


def test_underpaying_is_refused(client, menu, pay):
    pi = pay(1.00)
    r = client.post(ORDERS, json=order_body(menu, [("curry", 1), ("biryani", 1)], pi))
    assert r.status_code == 400


def test_item_removed_from_menu_after_adding_to_cart(client, menu, pay, db):
    pi = pay(18.88)
    run(db.menu_items.update_one({"id": "curry"}, {"$set": {"available": False}}))
    r = client.post(ORDERS, json=order_body(menu, [("curry", 1), ("biryani", 1)], pi))
    assert r.status_code == 404


def test_guest_cannot_attach_order_to_someone_elses_account(client, menu, pay):
    pi = pay(18.88)
    o = client.post(ORDERS, json=order_body(menu, [("curry", 1), ("biryani", 1)], pi, user_id="u1")).json()
    assert o["user_id"] is None


# ── Payment ───────────────────────────────────────────────────────────────────

def test_payment_is_required(client, menu):
    body = order_body(menu, [("curry", 2)], None)
    assert client.post(ORDERS, json=body).status_code == 400


def test_unknown_or_unfinished_payment_refused(client, menu, pay):
    assert client.post(ORDERS, json=order_body(menu, [("curry", 2)], "pi_does_not_exist")).status_code == 400
    pending = pay(17.98, status="requires_action")
    assert client.post(ORDERS, json=order_body(menu, [("curry", 2)], pending)).status_code == 400


def test_payment_intent_needs_a_purpose_and_a_sane_amount(client):
    assert client.post("/api/payments/create-intent", json={"amount": 10}).status_code == 422
    assert client.post("/api/payments/create-intent", json={"amount": 0.2, "purpose": "order"}).status_code == 400
    assert client.post("/api/payments/create-intent", json={"amount": 10, "purpose": "gift"}).status_code == 422


def test_subscription_payment_cannot_buy_an_order(client, menu, pay):
    pi = pay(18.88, purpose="subscription")
    r = client.post(ORDERS, json=order_body(menu, [("curry", 1), ("biryani", 1)], pi))
    assert r.status_code == 400 and "can't be used for an order" in r.json()["detail"]


def test_double_submit_returns_the_same_order(client, menu, pay, db, user_headers):
    pi = pay(18.88)
    body = order_body(menu, [("curry", 1), ("biryani", 1)], pi)
    first = client.post(ORDERS, json=body, headers=user_headers).json()
    again = client.post(ORDERS, json=body, headers=user_headers)
    assert again.status_code == 200 and again.json()["id"] == first["id"]
    assert run(db.orders.count_documents({})) == 1
    assert client.post(ORDERS, json=body).status_code == 400                       # different person
    assert client.post(ORDERS, json=body, headers=token("someone-else")).status_code == 400


def test_order_sends_confirmation_and_admin_alert(client, menu, pay, state):
    client.post(ORDERS, json=order_body(menu, [("curry", 1), ("biryani", 1)], pay(18.88)))
    assert len(state.outbox.email) == 1 and len(state.outbox.admin) == 1


def test_payment_rate_limit(client):
    codes = [client.post("/api/payments/create-intent", json={"amount": 10, "purpose": "order"}).status_code for _ in range(12)]
    assert codes[:10] == [200] * 10 and codes[10:] == [429, 429]


def test_orphan_payment_is_alerted_once(client, menu, pay, db, state):
    from routes import payments
    old = (datetime.utcnow() - timedelta(minutes=30)).isoformat()
    matched = pay(18.88)
    client.post(ORDERS, json=order_body(menu, [("curry", 1), ("biryani", 1)], matched))
    state.outbox.admin.clear()
    run(db.payments.insert_many([
        {"pi_id": matched, "amount_pence": 1888, "purpose": "order", "received_at": old, "reconciled": False, "alerted": False},
        {"pi_id": "pi_lost", "amount_pence": 7500, "purpose": "order", "received_at": old, "reconciled": False, "alerted": False},
        {"pi_id": "pi_recent", "amount_pence": 500, "purpose": "order", "received_at": datetime.utcnow().isoformat(), "reconciled": False, "alerted": False},
    ]))
    run(payments.check_orphan_payments())
    run(payments.check_orphan_payments())
    assert len(state.outbox.admin) == 1 and "75.00" in state.outbox.admin[0]
    assert run(db.payments.find_one({"pi_id": matched}))["reconciled"] is True
    assert run(db.payments.find_one({"pi_id": "pi_recent"}))["alerted"] is False


# ── Orders belong to their owner ──────────────────────────────────────────────

def test_customer_cannot_see_or_cancel_another_customers_order(client, menu, pay, user_headers):
    o = client.post(ORDERS, json=order_body(menu, [("curry", 1), ("biryani", 1)], pay(18.88)), headers=user_headers).json()
    other = token("u2")
    assert client.get(f"{ORDERS}/{o['id']}", headers=other).status_code == 403
    assert client.delete(f"{ORDERS}/{o['id']}", headers=other).status_code == 403
    assert client.get(ORDERS, headers=other).json() == []
    assert client.get(f"{ORDERS}/{o['id']}").status_code == 401
    assert client.put(f"{ORDERS}/{o['id']}/status", json={"status": "confirmed"}, headers=user_headers).status_code == 403


def test_order_lifecycle_and_cancel_rules(client, menu, pay, user_headers, admin_headers):
    o = client.post(ORDERS, json=order_body(menu, [("curry", 1), ("biryani", 1)], pay(18.88)), headers=user_headers).json()
    url = f"{ORDERS}/{o['id']}/status"
    assert client.put(url, json={"status": "delivered"}, headers=admin_headers).status_code == 400   # can't skip steps
    for step in ("confirmed", "preparing"):
        assert client.put(url, json={"status": step}, headers=admin_headers).status_code == 200
    assert client.delete(f"{ORDERS}/{o['id']}", headers=user_headers).status_code == 400            # too late to self-cancel
    for step in ("ready", "delivered"):
        assert client.put(url, json={"status": step}, headers=admin_headers).status_code == 200
    assert client.put(url, json={"status": "cancelled"}, headers=admin_headers).status_code == 400   # delivered is final


# ── Coupons ───────────────────────────────────────────────────────────────────

def coupon(db, **kw):
    doc = {"id": kw.get("code", "C").lower(), "code": "SAVE10", "scope": "orders", "kind": "multi",
           "discount_type": "percent", "discount_value": 10, "status": "active", "redemptions_count": 0,
           "per_customer_limit": 1, "max_redemptions": None, "listed": True,
           "assigned_user_id": None, "assigned_email": None}
    doc.update(kw)
    run(db.coupons.insert_one(doc))
    return doc


def test_percent_coupon_applies_to_food(client, menu, db):
    coupon(db)
    r = calc(client, [("curry", 1), ("biryani", 1)], coupon_code="save10").json()
    assert r["coupon_code"] == "SAVE10" and r["coupon_discount"] == 2.10
    assert r["grand_total"] == 16.78          # 20.98 − 2.10 coupon − 2.10 collection


def test_bad_coupons_never_block_pricing(client, menu, db):
    now = datetime.now(timezone.utc)
    coupon(db, code="OLD", expires_at=(now - timedelta(days=1)).isoformat())
    coupon(db, code="SOON", starts_at=(now + timedelta(days=1)).isoformat())
    coupon(db, code="PAUSED", status="paused")
    coupon(db, code="DABBA", scope="subscriptions")
    coupon(db, code="BIG", min_subtotal=50)
    coupon(db, code="GONE", max_redemptions=1, redemptions_count=1)
    coupon(db, code="DELIVERYONLY", order_type="delivery")
    for code in ("NOPE", "OLD", "SOON", "PAUSED", "DABBA", "BIG", "GONE", "DELIVERYONLY"):
        r = calc(client, [("curry", 1), ("biryani", 1)], coupon_code=code)
        assert r.status_code == 200, code
        body = r.json()
        assert body["coupon_error"] and body["coupon_code"] is None and body["grand_total"] == 18.88, code


def test_coupon_redeemed_once_per_customer(client, menu, db, pay, user_headers):
    coupon(db)
    body = order_body(menu, [("curry", 1), ("biryani", 1)], pay(16.78), coupon_code="SAVE10")
    assert client.post(ORDERS, json=body, headers=user_headers).status_code == 200
    assert run(db.coupons.find_one({"code": "SAVE10"}))["redemptions_count"] == 1
    r = calc(client, [("curry", 1), ("biryani", 1)], headers=user_headers, coupon_code="SAVE10").json()
    assert "already used" in r["coupon_error"]


def test_coupon_expiring_between_preview_and_payment_does_not_create_a_cheap_order(client, menu, db, pay):
    coupon(db)
    pi = pay(16.78)                                                    # paid the discounted price
    run(db.coupons.update_one({"code": "SAVE10"}, {"$set": {"status": "paused"}}))
    r = client.post(ORDERS, json=order_body(menu, [("curry", 1), ("biryani", 1)], pi, coupon_code="SAVE10"))
    assert r.status_code == 400 and run(db.orders.count_documents({})) == 0


def test_coupon_cannot_take_total_below_card_minimum(client, menu, db):
    coupon(db, code="ALLFREE", discount_value=100)
    r = calc(client, [("curry", 1), ("biryani", 1)], coupon_code="ALLFREE").json()
    assert r["coupon_code"] is None and "smallest card payment" in r["coupon_error"]
    assert r["grand_total"] == 18.88


def test_exclusive_coupon_only_for_its_owner(client, menu, db):
    coupon(db, code="VIP", assigned_email="vip@example.com", listed=False)
    assert calc(client, [("curry", 2)], coupon_code="VIP", customer_email="other@example.com").json()["coupon_error"]
    assert calc(client, [("curry", 2)], coupon_code="VIP", customer_email="VIP@example.com").json()["coupon_code"] == "VIP"


# ── Loyalty free dish ─────────────────────────────────────────────────────────

def test_free_dish_preview_and_order_agree(client, menu, db, pay, user_headers):
    """The preview total is what gets charged, so order creation must compute the same figure."""
    run(db.users.update_one({"id": "u1"}, {"$set": {"loyalty_pending_reward": True}}))
    preview = calc(client, [("curry", 1), ("biryani", 1)], headers=user_headers, free_item_id="lassi").json()
    assert preview["free_item_discount"] == 5.99
    assert preview["grand_total"] == 18.88                              # the dish is free; nothing else is discounted by it
    body = order_body(menu, [("curry", 1), ("biryani", 1), ("lassi", 1)], pay(preview["grand_total"]),
                      is_loyalty_redemption=True, loyalty_free_item_id="lassi")
    r = client.post(ORDERS, json=body, headers=user_headers)
    assert r.status_code == 200, r.text
    o = r.json()
    assert o["total"] == 18.88 and o["free_item_discount"] == 5.99
    assert o["loyalty_free_item_name"] == "Mango Lassi"
    u = run(db.users.find_one({"id": "u1"}))
    assert u["loyalty_pending_reward"] is False and u["loyalty_rewards_redeemed"] == 1


def test_free_dish_needs_a_pending_reward_and_a_login(client, menu, pay, user_headers):
    body = order_body(menu, [("curry", 1), ("biryani", 1), ("lassi", 1)], pay(18.88),
                      is_loyalty_redemption=True, loyalty_free_item_id="lassi")
    assert client.post(ORDERS, json=body, headers=user_headers).status_code == 400   # no reward pending
    assert client.post(ORDERS, json=body).status_code == 400                         # guest


def test_free_dish_must_be_in_the_order(client, menu, db, pay, user_headers):
    run(db.users.update_one({"id": "u1"}, {"$set": {"loyalty_pending_reward": True}}))
    body = order_body(menu, [("curry", 1), ("biryani", 1)], pay(8.00),
                      is_loyalty_redemption=True, loyalty_free_item_id="lassi")
    r = client.post(ORDERS, json=body, headers=user_headers)
    assert r.status_code == 400 and "free dish" in r.json()["detail"]
    assert run(db.users.find_one({"id": "u1"}))["loyalty_pending_reward"] is True


def test_redemption_flag_without_a_dish_does_not_burn_the_reward(client, menu, db, pay, user_headers):
    run(db.users.update_one({"id": "u1"}, {"$set": {"loyalty_pending_reward": True}}))
    body = order_body(menu, [("curry", 1), ("biryani", 1)], pay(18.88), is_loyalty_redemption=True)
    assert client.post(ORDERS, json=body, headers=user_headers).status_code == 200
    assert run(db.users.find_one({"id": "u1"}))["loyalty_pending_reward"] is True


def test_coupon_and_free_dish_do_not_stack(client, menu, db, user_headers):
    coupon(db)
    r = calc(client, [("curry", 1), ("biryani", 1)], headers=user_headers, free_item_id="lassi", coupon_code="SAVE10").json()
    assert r["coupon_code"] is None and "one offer per order" in r["coupon_error"]


def test_fifth_delivered_order_earns_a_reward_guests_earn_nothing(client, menu, db, pay, user_headers, admin_headers):
    def deliver(headers):
        o = client.post(ORDERS, json=order_body(menu, [("curry", 1), ("biryani", 1)], pay(18.88)), headers=headers).json()
        for step in ("confirmed", "preparing", "ready", "delivered"):
            client.put(f"{ORDERS}/{o['id']}/status", json={"status": step}, headers=admin_headers)
    for _ in range(4):
        deliver(user_headers)
    assert not run(db.users.find_one({"id": "u1"})).get("loyalty_pending_reward")
    deliver({})                                                          # a guest order in between
    assert run(db.users.find_one({"id": "u1"}))["loyalty_order_count"] == 4
    deliver(user_headers)
    u = run(db.users.find_one({"id": "u1"}))
    assert u["loyalty_order_count"] == 5 and u["loyalty_pending_reward"] is True


def test_opening_hours_are_public_and_follow_admin_settings(client, admin_headers):
    days = client.get("/api/opening-hours").json()["days"]
    assert set(days) == {"mon", "tue", "wed", "thu", "fri", "sat", "sun"} and days["fri"]["close"] == "21:00"
    client.put("/api/admin/settings/pickup-slots", headers=admin_headers,
               json={"days": {"sun": {"closed": True, "open": "08:00", "close": "20:30"}}})
    assert client.get("/api/opening-hours").json()["days"]["sun"]["closed"] is True


# ── Closed by hours (audit A-0003, COM-001 / COM-007) ─────────────────────────

def _next(settings, now, limit=3):
    from routes import pickup_slots
    from datetime import timedelta
    out = []
    for offset in (0, 1):
        for s in pickup_slots.generate_slots(settings, now.date() + timedelta(days=offset), now):
            out.append({**s, "day": "today" if offset == 0 else "tomorrow"})
            if len(out) >= limit:
                return out
    return out


def test_outside_opening_hours_an_asap_order_is_refused_with_the_next_times(client, menu, monkeypatch):
    from routes import pickup_slots
    from datetime import datetime
    late = datetime(2026, 10, 7, 23, 30, tzinfo=pickup_slots.LONDON)          # a Wednesday night
    monkeypatch.setattr(pickup_slots, "open_now", lambda settings, now=None: False)
    monkeypatch.setattr(pickup_slots, "next_slots", lambda settings, now=None, limit=3: _next(settings, late, limit))
    r = calc(client, [("curry", 1), ("biryani", 1)])
    assert r.status_code == 400
    assert "closed right now" in r.json()["detail"] and "tomorrow" in r.json()["detail"]


def test_open_now_follows_the_opening_hours():
    from routes import pickup_slots
    from datetime import datetime
    settings = pickup_slots.DEFAULT_SETTINGS
    hours = settings["days"]["wed"]
    noon = datetime(2026, 10, 7, 12, 0, tzinfo=pickup_slots.LONDON)
    late = datetime(2026, 10, 7, 23, 30, tzinfo=pickup_slots.LONDON)
    open_fn = _real_open_now()
    assert open_fn(settings, noon) is (not hours.get("closed"))
    assert open_fn(settings, late) is False


def _real_open_now():
    import importlib.util, pathlib
    from routes import pickup_slots
    spec = importlib.util.spec_from_file_location("ps_fresh", pathlib.Path(pickup_slots.__file__))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.open_now


def test_a_paid_order_arriving_after_closing_is_taken_moved_to_the_next_slot_and_the_owner_told(client, menu, pay, state, monkeypatch, db, user_headers):
    from routes import pickup_slots
    from datetime import datetime, timedelta
    monkeypatch.setattr(pickup_slots, "open_now", lambda settings, now=None: False)
    tomorrow = (datetime.now(pickup_slots.LONDON) + timedelta(days=1)).date()
    first = pickup_slots.generate_slots(pickup_slots.DEFAULT_SETTINGS, tomorrow)[0]["iso"]
    monkeypatch.setattr(pickup_slots, "next_slots", lambda settings, now=None, limit=3: [{"iso": first, "label": "8:45 am", "end_label": "09:00", "day": "tomorrow"}])
    pi = pay(18.88)
    r = client.post("/api/orders", json=order_body(menu, [("curry", 1), ("biryani", 1)], pi), headers=user_headers)
    assert r.status_code == 200, r.text
    assert r.json()["scheduled_slot_final"] == first                   # never rejected after payment; moved forward
    assert any("needs a look" in s and "outside opening hours" in s for s in state.outbox.admin)


def test_a_paid_order_arriving_while_paused_is_taken_and_the_owner_told(client, menu, pay, state, db, user_headers):
    run(db.settings.update_one({"_id": "pickup_slots"}, {"$set": {"paused": True}}, upsert=True))
    pi = pay(18.88)
    r = client.post("/api/orders", json=order_body(menu, [("curry", 1), ("biryani", 1)], pi), headers=user_headers)
    assert r.status_code == 200, r.text
    assert any("paid while ordering was paused" in s for s in state.outbox.admin)
