"""The expense app's copy on the server: admin only, sync by number, later edit wins, receipts round-trip."""
from tests.conftest import run, token

ADMIN = lambda: token("admin1", "admin")  # noqa: E731


def expense(**kw):
    return {"date": "2026-10-24", "amountPence": 3212, "category": "ingredients", "method": "card", "supplier": "Asda",
            "note": "", "items": [{"name": "2 x ASDA Cashews 200g", "standard": "Cashews", "qty": 0.4, "unit": "kg", "pricePence": 350}],
            "createdAt": "2026-10-24T11:00:00.000Z", "updatedAt": "2026-10-24T11:00:00.000Z", **kw}


def test_only_the_admin_can_read_or_write(client):
    assert client.get("/api/expenses/changes").status_code == 401
    assert client.get("/api/expenses/changes", headers=token("u1")).status_code == 403
    assert client.put("/api/expenses/abcdefgh1", json=expense(), headers=token("u1")).status_code == 403
    assert client.put("/api/expenses/receipts/rcpt00001", content=b"x", headers={**token("u1"), "Content-Type": "image/jpeg"}).status_code == 403
    assert client.get("/api/expenses/state", headers=token("u1")).status_code == 403


def test_saved_expenses_come_back_after_the_cursor(client):
    a = client.put("/api/expenses/expense-a1", json=expense(), headers=ADMIN()).json()
    b = client.put("/api/expenses/expense-b1", json=expense(amountPence=500), headers=ADMIN()).json()
    assert a["applied"] and b["applied"] and b["expense"]["seq"] > a["expense"]["seq"]
    first = client.get("/api/expenses/changes?after=0", headers=ADMIN()).json()
    assert [e["id"] for e in first["expenses"]] == ["expense-a1", "expense-b1"]
    assert first["expenses"][0]["items"][0]["standard"] == "Cashews"
    again = client.get(f"/api/expenses/changes?after={first['cursor']}", headers=ADMIN()).json()
    assert again["expenses"] == [] and again["cursor"] == first["cursor"]


def test_an_older_edit_does_not_overwrite_a_newer_one(client):
    client.put("/api/expenses/expense-a1", json=expense(updatedAt="2026-10-24T12:00:00.000Z", note="newer"), headers=ADMIN())
    r = client.put("/api/expenses/expense-a1", json=expense(updatedAt="2026-10-24T11:30:00.000Z", note="older"), headers=ADMIN()).json()
    assert r["applied"] is False and r["expense"]["note"] == "newer"


def test_a_delete_is_kept_as_a_tombstone_and_its_receipt_removed(client, db):
    client.put("/api/expenses/receipts/rcpt00001", content=b"%PDF-1.4 test", headers={**ADMIN(), "Content-Type": "application/pdf"})
    client.put("/api/expenses/expense-a1", json=expense(receiptId="rcpt00001", receiptType="application/pdf"), headers=ADMIN())
    after = client.get("/api/expenses/changes", headers=ADMIN()).json()["cursor"]
    r = client.put("/api/expenses/expense-a1", json=expense(deleted=True, updatedAt="2026-10-24T13:00:00.000Z", receiptId="rcpt00001",
                                                            receiptType="application/pdf"), headers=ADMIN()).json()
    assert r["applied"]
    changed = client.get(f"/api/expenses/changes?after={after}", headers=ADMIN()).json()["expenses"]
    assert changed[0]["deleted"] is True and changed[0]["items"] == []
    assert run(db.expense_receipts.find_one({"id": "rcpt00001"})) is None


def test_receipts_round_trip_and_bad_files_are_refused(client):
    body = b"\xff\xd8\xff\xe0 fake jpeg"
    assert client.put("/api/expenses/receipts/rcpt00002", content=body, headers={**ADMIN(), "Content-Type": "image/jpeg"}).status_code == 200
    got = client.get("/api/expenses/receipts/rcpt00002", headers=ADMIN())
    assert got.status_code == 200 and got.content == body and got.headers["content-type"] == "image/jpeg"
    assert client.put("/api/expenses/receipts/rcpt00003", content=b"<html>", headers={**ADMIN(), "Content-Type": "text/html"}).status_code == 415
    big = b"0" * (8 * 1024 * 1024 + 1)
    assert client.put("/api/expenses/receipts/rcpt00004", content=big, headers={**ADMIN(), "Content-Type": "image/png"}).status_code == 413
    assert client.get("/api/expenses/receipts/missing00", headers=ADMIN()).status_code == 404


def test_bad_expenses_are_refused(client):
    assert client.put("/api/expenses/short", json=expense(), headers=ADMIN()).status_code == 400
    assert client.put("/api/expenses/expense-a1", json=expense(date="2026-02-30"), headers=ADMIN()).status_code == 422
    assert client.put("/api/expenses/expense-a1", json=expense(category="holidays"), headers=ADMIN()).status_code == 422
    assert client.put("/api/expenses/expense-a1", json=expense(items=[{"name": "x", "unit": "tonne"}]), headers=ADMIN()).status_code == 422


def test_app_state_later_write_wins(client):
    s = {"shopping": [{"item": "Toor dal", "qty": 5, "unit": "kg", "done": False}], "names": {"kandi pappu": "Toor dal"},
         "suppliers": ["Sujas"], "updatedAt": "2026-10-24T12:00:00.000Z"}
    assert client.put("/api/expenses/state", json=s, headers=ADMIN()).json()["applied"]
    old = {**s, "shopping": [], "updatedAt": "2026-10-24T11:00:00.000Z"}
    assert client.put("/api/expenses/state", json=old, headers=ADMIN()).json()["applied"] is False
    got = client.get("/api/expenses/state", headers=ADMIN()).json()
    assert got["names"] == {"kandi pappu": "Toor dal"} and got["shopping"][0]["item"] == "Toor dal"


def test_expense_writes_stay_out_of_the_admin_log(client, db):
    client.put("/api/expenses/expense-a1", json=expense(), headers=ADMIN())
    assert run(db.admin_audit.count_documents({"target": {"$regex": "^expenses"}})) == 0
