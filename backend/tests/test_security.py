"""Authentication, authorisation and abuse limits — Phase 08."""
import time

from tests.conftest import run, token

AUTH = "/api/auth"


def make_user(db, uid="u1", email="u1@example.com", password="correct horse", **extra):
    import auth
    doc = {"id": uid, "name": "Test User", "email": email, "role": "customer",
           "password_hash": auth.hash_password(password), **extra}
    run(db.users.replace_one({"id": uid}, doc, upsert=True))
    return doc


# ── Tokens follow the account, not just the signature ─────────────────────────

def test_token_for_a_deleted_account_is_refused(client, db):
    headers = token("ghost")
    run(db.users.delete_one({"id": "ghost"}))
    assert client.get(f"{AUTH}/me", headers=headers).status_code == 401


def test_role_comes_from_the_database_not_the_token(client, db):
    headers = token("boss", "admin")
    assert client.get(f"{AUTH}/users", headers=headers).status_code == 200
    run(db.users.update_one({"id": "boss"}, {"$set": {"role": "customer"}}))      # demoted
    assert client.get(f"{AUTH}/users", headers=headers).status_code == 403
    forged = token("u9", "customer")
    run(db.users.update_one({"id": "u9"}, {"$set": {"role": "customer"}}))
    import auth
    fake_admin = {"Authorization": "Bearer " + auth.create_access_token("u9", "admin")}   # claims admin
    assert client.get(f"{AUTH}/users", headers=fake_admin).status_code == 403
    assert client.get(f"{AUTH}/users", headers=forged).status_code == 403


def test_customer_cannot_reach_admin_endpoints(client, user_headers):
    for method, url in (
        ("get", "/api/admin/coupons"), ("get", "/api/admin/settings/pickup-slots"),
        ("get", "/api/admin/dabba-wala/alerts"), ("get", f"{AUTH}/users"),
        ("get", "/api/enquiries/contact"), ("get", "/api/reviews/admin/all"),
    ):
        assert getattr(client, method)(url, headers=user_headers).status_code == 403, url
        assert getattr(client, method)(url).status_code == 401, url


# ── Login, registration, password reset ───────────────────────────────────────

def test_login_is_case_insensitive_and_does_not_reveal_which_part_was_wrong(client, db):
    make_user(db, email="Mixed.Case@Example.com")
    ok = client.post(f"{AUTH}/login", json={"email": "mixed.case@example.com", "password": "correct horse"})
    assert ok.status_code == 200 and ok.json()["access_token"]
    wrong_pw = client.post(f"{AUTH}/login", json={"email": "mixed.case@example.com", "password": "nope"})
    no_user = client.post(f"{AUTH}/login", json={"email": "nobody@example.com", "password": "nope"})
    assert wrong_pw.status_code == no_user.status_code == 401
    assert wrong_pw.json()["detail"] == no_user.json()["detail"]


def test_login_is_rate_limited_per_visitor(client, db):
    make_user(db)
    body = {"email": "u1@example.com", "password": "wrong"}
    mine = {"x-forwarded-for": "203.0.113.5"}
    codes = [client.post(f"{AUTH}/login", json=body, headers=mine).status_code for _ in range(12)]
    assert codes[:10] == [401] * 10 and codes[10:] == [429, 429]
    other = client.post(f"{AUTH}/login", json=body, headers={"x-forwarded-for": "198.51.100.7"})
    assert other.status_code == 401                                   # a different visitor is not locked out


def test_registration_rejects_short_passwords_and_duplicate_emails(client, db):
    make_user(db, email="taken@example.com")
    short = client.post(f"{AUTH}/register", json={"name": "A", "email": "new@example.com", "password": "short", "phone": "+447000000009", "firebase_token": "x"})
    assert short.status_code == 422
    dup = client.post(f"{AUTH}/register", json={"name": "A", "email": "TAKEN@example.com", "password": "long enough pw", "phone": "+447000000009", "firebase_token": "x"})
    assert dup.status_code == 400


def test_mobile_registration_is_closed_without_its_key(client, monkeypatch):
    body = {"name": "A", "email": "m@example.com", "password": "long enough pw"}
    monkeypatch.delenv("MOBILE_API_KEY", raising=False)
    assert client.post(f"{AUTH}/register/simple", json=body).status_code == 403
    monkeypatch.setenv("MOBILE_API_KEY", "app-key")
    assert client.post(f"{AUTH}/register/simple", json=body).status_code == 403
    assert client.post(f"{AUTH}/register/simple", json=body, headers={"X-Mobile-Key": "wrong"}).status_code == 403
    assert client.post(f"{AUTH}/register/simple", json=body, headers={"X-Mobile-Key": "app-key"}).status_code == 200


def test_password_reset_is_single_use_and_signs_out_other_sessions(client, db, state):
    import auth
    make_user(db, email="Reset.Me@example.com")
    old_session = {"Authorization": "Bearer " + auth.jwt.encode(
        {"sub": "u1", "role": "customer", "iat": int(time.time()) - 3600, "exp": int(time.time()) + 3600},
        auth.SECRET_KEY, algorithm=auth.ALGORITHM)}
    assert client.get(f"{AUTH}/me", headers=old_session).status_code == 200

    same = "If an account exists"
    assert same in client.post(f"{AUTH}/forgot-password", json={"email": "reset.me@example.com"}).json()["message"]
    assert same in client.post(f"{AUTH}/forgot-password", json={"email": "nobody@example.com"}).json()["message"]
    client.post(f"{AUTH}/forgot-password", json={"email": "reset.me@example.com"})           # a second link
    links = run(db.password_resets.find({}).to_list(10))
    assert len(links) == 2 and len(state.outbox.email) == 2                                   # two reset emails, none for the unknown address

    first, second = links[0]["token"], links[1]["token"]
    assert client.post(f"{AUTH}/reset-password", json={"token": first, "new_password": "short"}).status_code == 422
    assert client.post(f"{AUTH}/reset-password", json={"token": first, "new_password": "brand new password"}).status_code == 200
    assert client.post(f"{AUTH}/reset-password", json={"token": first, "new_password": "another password"}).status_code == 400
    assert client.post(f"{AUTH}/reset-password", json={"token": second, "new_password": "another password"}).status_code == 400

    assert client.get(f"{AUTH}/me", headers=old_session).status_code == 401                   # old session ended
    assert client.post(f"{AUTH}/login", json={"email": "reset.me@example.com", "password": "correct horse"}).status_code == 401
    fresh = client.post(f"{AUTH}/login", json={"email": "reset.me@example.com", "password": "brand new password"})
    assert fresh.status_code == 200
    assert client.get(f"{AUTH}/me", headers={"Authorization": "Bearer " + fresh.json()["access_token"]}).status_code == 200


# ── Enquiries ─────────────────────────────────────────────────────────────────

CONTACT = {"name": "Guest <b>Person</b>", "email": "victim@example.com", "phone": "07000000000",
           "subject": "Hello", "message": "<script>alert(1)</script>"}


def test_unverified_email_does_not_unlock_someone_elses_enquiry(client, db):
    enquiry = client.post("/api/enquiries/contact", json=CONTACT).json()
    make_user(db, uid="attacker", email="victim@example.com")                 # registered with the victim's email
    attacker = token("attacker")
    mine = client.get("/api/enquiries/my", headers=attacker).json()
    assert mine["contact"] == []
    assert client.get(f"/api/enquiries/contact/{enquiry['id']}/messages", headers=attacker).status_code == 403
    assert client.post(f"/api/enquiries/contact/{enquiry['id']}/reply", json={"text": "hi"}, headers=attacker).status_code == 403
    make_user(db, uid="owner", email="victim@example.com", google_id="g-123")  # Google has verified this address
    assert len(client.get("/api/enquiries/my", headers=token("owner")).json()["contact"]) == 1


def test_enquiry_cannot_be_planted_on_another_account(client, db, user_headers):
    planted = client.post("/api/enquiries/contact", json={**CONTACT, "user_id": "u1"}).json()
    assert planted["user_id"] is None
    own = client.post("/api/enquiries/contact", json={**CONTACT, "user_id": "someone-else"}, headers=user_headers).json()
    assert own["user_id"] == "u1"


def test_customer_text_is_escaped_in_admin_emails(client, monkeypatch):
    from routes import enquiries
    sent = []
    monkeypatch.setattr(enquiries, "notify_admin", lambda subject, html: sent.append(html))
    monkeypatch.setattr(enquiries, "send_email", lambda *a, **k: None)
    client.post("/api/enquiries/contact", json=CONTACT)
    assert "<script>" not in sent[0] and "&lt;script&gt;" in sent[0] and "<b>Person</b>" not in sent[0]


def test_enquiry_forms_are_rate_limited(client):
    codes = [client.post("/api/enquiries/contact", json=CONTACT).status_code for _ in range(7)]
    assert codes[:5] == [200] * 5 and codes[5:] == [429, 429]


# ── Coupons ───────────────────────────────────────────────────────────────────

def test_exclusive_coupons_are_not_listed_for_a_typed_email(client, db):
    base = {"scope": "orders", "kind": "multi", "discount_type": "percent", "discount_value": 10, "status": "active",
            "redemptions_count": 0, "listed": True, "assigned_user_id": None, "assigned_email": None}
    run(db.coupons.insert_many([
        {**base, "id": "pub", "code": "PUBLIC"},
        {**base, "id": "vip", "code": "VIPONLY", "listed": False, "assigned_email": "vip@example.com"},
    ]))
    listed = client.get("/api/coupons/available", params={"scope": "orders", "email": "vip@example.com"}).json()
    assert [c["code"] for c in listed] == ["PUBLIC"]
    make_user(db, uid="vip", email="vip@example.com")
    mine = client.get("/api/coupons/available", params={"scope": "orders"}, headers=token("vip")).json()
    assert sorted(c["code"] for c in mine) == ["PUBLIC", "VIPONLY"]
