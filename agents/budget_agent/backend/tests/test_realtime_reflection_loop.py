import uuid

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def _signup_and_login_token() -> str:
    email = f"reflect_{uuid.uuid4().hex[:10]}@example.com"
    password = "Secret123!"
    signup = client.post("/api/auth/signup", json={"email": email, "password": password})
    assert signup.status_code == 201

    login = client.post("/api/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200
    return login.json()["access_token"]


def test_reclassify_flow_records_feedback_and_updates_category():
    token = _signup_and_login_token()
    headers = {"Authorization": f"Bearer {token}"}

    merchant_token = f"REFLECT{uuid.uuid4().hex[:5].upper()}"
    payload = {
        "sms_text": (
            f"Your A/C XXXX1234 is debited by INR 440.00 at {merchant_token} "
            "on 24-03-2026 20:10."
        ),
        "sender": "HDFCBK",
    }
    ingest = client.post("/api/realtime/sms/ingest", json=payload, headers=headers)
    assert ingest.status_code == 200

    pending = client.get("/api/realtime/pending", headers=headers)
    assert pending.status_code == 200
    pending_rows = pending.json()
    assert pending_rows

    event = pending_rows[0]
    selected = (event.get("suggested_categories") or ["Miscellaneous"])[0]
    classify = client.post(
        f"/api/realtime/pending/{event['id']}/classify",
        json={"selected_category": selected},
        headers=headers,
    )
    assert classify.status_code == 200
    transaction_id = classify.json()["transaction_id"]

    reclass = client.post(
        f"/api/realtime/transactions/{transaction_id}/reclassify",
        json={"selected_category": "Others", "custom_category": "Team Lunch"},
        headers=headers,
    )
    assert reclass.status_code == 200
    body = reclass.json()
    assert body["status"] in ["updated", "unchanged"]
    assert body["category"] == "Team Lunch"


def test_feedback_metrics_endpoint_returns_quality_summary():
    token = _signup_and_login_token()
    headers = {"Authorization": f"Bearer {token}"}

    sms = {
        "sms_text": "Your A/C XXXX1234 is debited by INR 520.00 at METRICS CAFE on 24-03-2026 20:10.",
        "sender": "HDFCBK",
    }
    ingest = client.post("/api/realtime/sms/ingest", json=sms, headers=headers)
    assert ingest.status_code == 200

    pending = client.get("/api/realtime/pending", headers=headers)
    assert pending.status_code == 200
    pending_rows = pending.json()
    if pending_rows:
        event = pending_rows[0]
        selected = (event.get("suggested_categories") or ["Miscellaneous"])[0]
        classify = client.post(
            f"/api/realtime/pending/{event['id']}/classify",
            json={"selected_category": selected},
            headers=headers,
        )
        assert classify.status_code == 200

    metrics = client.get("/api/realtime/metrics/feedback", headers=headers)
    assert metrics.status_code == 200
    data = metrics.json()

    assert "auto_classification_enabled" in data
    assert "totals" in data
    assert "quality" in data
    assert "acceptance_rate_pct" in data["quality"]
    assert "override_rate_pct" in data["quality"]
