"""
Unit and integration tests for Scheme Agent endpoints and rule engine.
"""
import pytest
from fastapi.testclient import TestClient

from agents.scheme_agent.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_scheme_health(client):
    """Test health check endpoint."""
    res = client.get("/api/v1/schemes/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["total_schemes"] >= 5


def test_schemes_list(client):
    """Test public schemes list endpoint."""
    res = client.get("/api/v1/schemes/schemes/list")
    assert res.status_code == 200
    data = res.json()
    assert data["total_schemes"] >= 5
    codes = [s["scheme_code"] for s in data["schemes"]]
    assert "e_shram" in codes
    assert "pm_sym" in codes
    assert "pmsby" in codes


def test_check_scheme_direct(client):
    """Test checking a single scheme directly (e_shram)."""
    payload = {
        "user_profile": {
            "user_id": "test_gig_user",
            "age": 28,
            "epfo_esic_status": False,
            "income_tax_payer": False,
            "days_active_with_aggregator": 120,
            "e_shram_registered": False,
            "monthly_income": 15000.0,
            "state": "Maharashtra",
            "savings_bank_account": True,
            "aadhaar_linked": True,
        }
    }
    res = client.post("/api/v1/schemes/check-scheme/e_shram", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["eligible"] is True
    assert data["scheme_code"] == "ESHRAM_001"


def test_check_eligibility_all_schemes(client):
    """Test full eligibility check across all schemes."""
    payload = {
        "user_profile": {
            "user_id": "test_gig_user",
            "age": 28,
            "epfo_esic_status": False,
            "income_tax_payer": False,
            "days_active_with_aggregator": 120,
            "e_shram_registered": True,
            "monthly_income": 15000.0,
            "state": "Maharashtra",
            "savings_bank_account": True,
            "aadhaar_linked": True,
        }
    }
    res = client.post("/api/v1/schemes/check-eligibility", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["user_id"] == "test_gig_user"
    assert len(data["eligible_schemes"]) >= 1
    assert "ESHRAM_001" in [s["scheme_code"] for s in data["eligible_schemes"]]
