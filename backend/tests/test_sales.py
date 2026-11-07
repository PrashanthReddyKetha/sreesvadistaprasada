"""The sales book: website sales read live, WhatsApp typed in, Deliveroo imported once per order number."""
from datetime import datetime

from tests.conftest import run, token

ADMIN = lambda: token("admin1", "admin")  # noqa: E731


def whatsapp(**kw):
    return {"channel": "whatsapp", "at": "2026-11-05T12:30:00Z", "customer_name": "Asha", "customer_phone": "07700900123",
            "items": [{"name": "Masala Dosa", "qty": 2, "price": 699}, {"name": "Mango Lassi", "qty": 1, "price": 599}],
            "discount": 197, "charges": 250, "payment_method": "bank", **kw}


def deliveroo(ref, **kw):
    return {"ref": ref, "at": "2026-11-06T18:00:00Z", "customer_name": "Ben", "items_text": "1 x Chicken Dum Biryani",
            "gross": 1099, "discount": 0, "fees": 330, "payment_method": "deliveroo", "fulfilment": "delivery", **kw}


def test_only_the_admin_sees_the_book(client):
    assert client.get("/api/sales").status_code == 401
    assert client.get("/api/sales", headers=token("u1")).status_code == 403
    assert client.post("/api/sales", json=whatsapp(), headers=token("u1")).status_code == 403


def test_a_whatsapp_sale_adds_up_from_its_items(client):
    r = client.post("/api/sales", json=whatsapp(gross=1), headers=ADMIN())
    assert r.status_code == 200, r.text
    s = r.json()
    assert (s["gross"], s["discount"], s["net"], s["charges"], s["paid"], s["payout"]) == (1997, 197, 1800, 250, 2050, 2050)
    book = client.get("/api/sales", headers=ADMIN()).json()
    assert book["totals"]["by_channel"]["whatsapp"]["net"] == 1800


def test_a_discount_bigger_than_the_food_is_refused(client):
    assert client.post("/api/sales", json=whatsapp(discount=5000), headers=ADMIN()).status_code == 422


def test_a_deliveroo_export_uploaded_twice_counts_each_order_once(client):
    rows = [deliveroo("DR-1"), deliveroo("DR-2", gross=2000, discount=200)]
    first = client.post("/api/sales/import", json={"channel": "deliveroo", "rows": rows}, headers=ADMIN()).json()
    again = client.post("/api/sales/import", json={"channel": "deliveroo", "rows": [deliveroo("DR-1", fees=400)]}, headers=ADMIN()).json()
    assert first == {"added": 2, "updated": 0} and again == {"added": 0, "updated": 1}
    t = client.get("/api/sales?channel=deliveroo", headers=ADMIN()).json()["totals"]
    assert t["orders"] == 2 and t["net"] == 1099 + 1800 and t["fees"] == 400 + 330 and t["payout"] == 2899 - 730


def test_imported_rows_need_an_order_number(client):
    r = client.post("/api/sales/import", json={"channel": "deliveroo", "rows": [deliveroo("")]}, headers=ADMIN())
    assert r.status_code == 400


def test_website_orders_and_plans_come_in_without_typing(client, db):
    run(db.orders.insert_many([
        {"id": "o1", "order_number": "SP1001", "created_at": datetime(2026, 11, 6, 12), "customer_name": "Cara",
         "customer_phone": "07700900001", "customer_email": "c@example.com", "delivery_type": "takeaway",
         "items": [{"name": "Masala Dosa", "price": 6.99, "quantity": 3}], "subtotal": 20.97, "takeaway_discount": 2.10,
         "coupon_discount": 0, "delivery_fee": 0, "small_order_fee": 0, "total": 18.87, "status": "delivered",
         "payment_status": "paid", "payment_intent_id": "pi_1"},
        {"id": "o2", "order_number": "SP1002", "created_at": datetime(2026, 11, 6, 13), "customer_name": "Dev",
         "items": [], "subtotal": 15, "total": 15, "status": "cancelled", "payment_status": "refunded"},
    ]))
    run(db.subscriptions.insert_one({"id": "s1", "created_at": datetime(2026, 11, 6, 9), "customer_name": "Esa",
                                     "plan": "weekly", "box_type": "prasada", "plan_price": 50.0, "delivery_fee_total": 5.0,
                                     "coupon_discount": 5.0, "price": 50.0, "payment_intent_id": "pi_2", "status": "active"}))
    book = client.get("/api/sales?channel=website", headers=ADMIN()).json()
    by_ref = {r["ref"]: r for r in book["sales"]}
    assert (by_ref["SP1001"]["gross"], by_ref["SP1001"]["discount"], by_ref["SP1001"]["net"]) == (2097, 210, 1887)
    assert by_ref["SP1002"]["status"] == "refunded"
    plan = next(r for r in book["sales"] if r["kind"] == "dabba")
    assert (plan["gross"], plan["discount"], plan["charges"], plan["paid"]) == (5000, 500, 500, 5000)
    assert book["totals"]["orders"] == 2 and book["totals"]["paid"] == 1887 + 5000


def test_the_date_range_and_the_spreadsheet(client):
    client.post("/api/sales", json=whatsapp(at="2026-11-01T10:00:00Z", notes="=HYPERLINK()"), headers=ADMIN())
    client.post("/api/sales", json=whatsapp(at="2026-11-05T10:00:00Z"), headers=ADMIN())
    inside = client.get("/api/sales?start=2026-11-04T00:00:00Z&end=2026-11-06T00:00:00Z", headers=ADMIN()).json()
    assert len(inside["sales"]) == 1
    csv = client.get("/api/sales/export.csv", headers=ADMIN())
    assert csv.status_code == 200 and "Net sale £" in csv.text and "'=HYPERLINK()" in csv.text and "18.00" in csv.text


def test_typed_sales_can_be_corrected_and_removed(client):
    s = client.post("/api/sales", json=whatsapp(), headers=ADMIN()).json()
    fixed = client.put(f"/api/sales/{s['id']}", json=whatsapp(discount=0), headers=ADMIN()).json()
    assert fixed["net"] == 1997
    assert client.put("/api/sales/order:o1", json=whatsapp(), headers=ADMIN()).status_code == 404
    assert client.delete(f"/api/sales/{s['id']}", headers=ADMIN()).json() == {"ok": True}
    assert client.get("/api/sales", headers=ADMIN()).json()["sales"] == []
