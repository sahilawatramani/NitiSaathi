import uuid

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def _signup_and_login_token():
    email = f"test_{uuid.uuid4().hex[:10]}@example.com"
    password = "Secret123!"
    signup = client.post("/api/auth/signup", json={"email": email, "password": password})
    assert signup.status_code == 201

    login = client.post("/api/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200
    token = login.json()["access_token"]
    return token


def test_sms_ingest_creates_pending_event():
    token = _signup_and_login_token()
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "sms_text": "Your A/C XXXX1234 is debited by INR 320.00 at ZOMATO on 24-03-2026 20:10.",
        "sender": "HDFCBK",
    }
    ingest = client.post("/api/realtime/sms/ingest", json=payload, headers=headers)
    assert ingest.status_code == 200
    assert ingest.json()["status"] in ["pending_classification", "duplicate"]

    pending = client.get("/api/realtime/pending", headers=headers)
    assert pending.status_code == 200
    assert isinstance(pending.json(), list)


def test_webhook_rejects_invalid_secret():
    payload = {
        "user_email": "missing@example.com",
        "provider": "bank_webhook",
        "external_txn_id": "tx-123",
        "amount": 100.0,
        "merchant": "Test Merchant",
        "description": "Sample",
    }
    res = client.post(
        "/api/realtime/webhook/transaction",
        json=payload,
        headers={"X-Webhook-Secret": "wrong-secret"},
    )
    assert res.status_code == 401
    body = res.json()
    assert "request_id" in body


def test_sms_forward_requires_secret_config_or_valid_header():
    payload = {
        "sms_text": "Your A/C XXXX1234 is debited by INR 120.00 at CAFE on 24-03-2026 21:10.",
        "sender": "HDFCBK",
    }
    res = client.post("/api/realtime/sms/forward", json=payload)
    assert res.status_code in [401, 503]
