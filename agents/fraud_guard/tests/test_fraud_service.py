"""
Unit and integration tests for Fraud Guard Agent endpoints and rule engine.
"""
from datetime import datetime
import pytest
from fastapi.testclient import TestClient

from agents.fraud_guard.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_fraud_health(client):
    """Test health check endpoint."""
    res = client.get("/api/v1/fraud-guard/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["total_patterns"] >= 5


def test_pin_otp_detection_positive(client):
    """Test that asking for PIN/OTP raises critical security alert."""
    payload = {"text": "Sir, please share the 6-digit OTP sent to your number to complete UPI refund."}
    res = client.post("/api/v1/fraud-guard/check-pin-otp-request", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["contains_pin_otp_request"] is True
    assert data["severity"] == "CRITICAL"
    assert "FRAUD ALERT" in data["alert_title"]


def test_pin_otp_detection_negative(client):
    """Test that benign messages pass safely."""
    payload = {"text": "Your Swiggy order of ₹320 has been delivered. Thank you!"}
    res = client.post("/api/v1/fraud-guard/check-pin-otp-request", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["contains_pin_otp_request"] is False
    assert data["status"] == "safe"


def test_check_rbi_lender(client):
    """Test checking RBI registered and unregistered lenders."""
    # Registered Bank
    res_reg = client.get("/api/v1/fraud-guard/check-lender/HDFC Bank")
    assert res_reg.status_code == 200
    data_reg = res_reg.json()
    assert data_reg["is_registered"] is True
    assert data_reg["entity_type"] == "Bank"

    # Registered NBFC
    res_nbfc = client.get("/api/v1/fraud-guard/check-lender/Bajaj Finance Ltd")
    assert res_nbfc.status_code == 200
    data_nbfc = res_nbfc.json()
    assert data_nbfc["is_registered"] is True
    assert data_nbfc["entity_type"] == "NBFC"

    # Unregistered suspicious
    res_unreg = client.get("/api/v1/fraud-guard/check-lender/QuickCash Loans")
    assert res_unreg.status_code == 200
    data_unreg = res_unreg.json()
    assert data_unreg["is_registered"] is False
    assert "warning" in data_unreg


def test_detect_fraud_transaction(client):
    """Test single transaction detection."""
    now_str = datetime.utcnow().isoformat()
    payload = {
        "transaction": {
            "transaction_id": "tx_test_001",
            "user_id": "user_001",
            "timestamp": now_str,
            "direction": "debit",
            "amount": 25000.0,
            "counterparty": "UNKNOWN_CRYPTO_EXCHANGE",
            "counterparty_upi": "scammer@ybl",
            "category": "Transfer",
            "description": "Urgent transfer",
            "balance_before": 26000.0,
            "balance_after": 1000.0,
            "is_first_time_counterparty": True,
            "transaction_hour": 2
        },
        "user_history": {
            "user_id": "user_001",
            "total_transactions": 50,
            "avg_credit_amount": 1200.0,
            "avg_debit_amount": 350.0,
            "stddev_credit": 400.0,
            "stddev_debit": 150.0,
            "unique_counterparties": 15,
            "frequent_counterparties": [{"counterparty": "Swiggy", "count": 20}],
            "category_distribution": {"Food & Dining": 30, "Transport": 20},
            "typical_transaction_hours": [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
            "previous_fraud_incidents": 0,
            "last_fraud_date": None
        }
    }
    res = client.post("/api/v1/fraud-guard/detect", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "transaction" in data
    assert "anomaly_features" in data
    assert "detection_method" in data

