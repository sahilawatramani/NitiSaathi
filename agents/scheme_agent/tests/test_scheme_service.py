"""
Unit and integration tests for Scheme Agent endpoints, rule engine, and elaboration.
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
    assert "pm_jay" in codes
    assert "pm_svanidhi" in codes


def test_get_categories(client):
    """Test categories retrieval endpoint."""
    res = client.get("/api/v1/schemes/categories")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 6
    category_ids = [c["id"] for c in data]
    assert "insurance_healthcare" in category_ids
    assert "pension_retirement" in category_ids
    assert "credit_loan" in category_ids
    assert "state_welfare_board" in category_ids
    assert "skill_education" in category_ids
    assert "identity" in category_ids


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
    assert data["match_score_pct"] > 0
    assert data["category"] == "identity"


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
    codes = [s["scheme_code"] for s in data["eligible_schemes"]]
    assert "ESHRAM_001" in codes
    assert "PMSBY_001" in codes


def test_partial_profile_compatibility(client):
    """Test that partial profiles with missing/None fields do not cause 422 errors."""
    payload = {
        "user_profile": {
            "user_id": "partial_user_123",
            "age": 25,
            # omitted fields: epfo_esic_status, income_tax_payer, monthly_income, state, etc.
        }
    }
    res = client.post("/api/v1/schemes/check-eligibility", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["user_id"] == "partial_user_123"
    total_evaluated = len(data.get("eligible_schemes", [])) + len(data.get("ineligible_schemes", []))
    assert total_evaluated >= 5


def test_filter_by_category_and_keywords(client):
    """Test filtering schemes by category and search keyword."""
    # 1. Filter by category
    payload = {
        "user_profile": {
            "user_id": "filter_user",
            "age": 30,
            "epfo_esic_status": False,
            "income_tax_payer": False,
            "savings_bank_account": True,
            "aadhaar_linked": True,
        },
        "selected_categories": ["credit_loan"],
        "keywords": "",
    }
    res = client.post("/api/v1/schemes/filter", json=payload)
    assert res.status_code == 200
    data = res.json()
    all_evaluated = data["eligible_schemes"] + data["ineligible_schemes"]
    assert len(all_evaluated) > 0
    for s in all_evaluated:
        assert s["category"] == "credit_loan"

    # 2. Filter by keyword
    payload_kw = {
        "user_profile": {
            "user_id": "filter_user",
            "age": 30,
            "epfo_esic_status": False,
            "income_tax_payer": False,
        },
        "keywords": "ayushman",
    }
    res_kw = client.post("/api/v1/schemes/filter", json=payload_kw)
    assert res_kw.status_code == 200
    data_kw = res_kw.json()
    all_kw = data_kw["eligible_schemes"] + data_kw["ineligible_schemes"]
    assert any("PMJAY" in s["scheme_code"] or "Ayushman" in s["scheme_name"] for s in all_kw)


def test_elaborate_scheme_endpoint(client):
    """Test detailed scheme elaboration with criteria breakdown and budget affordability."""
    payload = {
        "user_profile": {
            "user_id": "gig_driver_01",
            "age": 29,
            "epfo_esic_status": False,
            "income_tax_payer": False,
            "days_active_with_aggregator": 180,
            "e_shram_registered": True,
            "monthly_income": 22000.0,
            "state": "Karnataka",
            "savings_bank_account": True,
            "aadhaar_linked": True,
        },
        "budget_state": {
            "income_volatility_pct": 0.28,
            "monthly_income": 22000.0,
            "recommended_budget": {
                "fixed_needs": 11000.0,
                "variable_wants": 4400.0,
                "safety_cushion": 6600.0,
            }
        },
        "language": "en",
    }
    res = client.post("/api/v1/schemes/elaborate/pmsby", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["scheme_code"] == "PMSBY_001"
    assert data["scheme_name"] == "Pradhan Mantri Suraksha Bima Yojana (PMSBY)"
    assert data["eligible"] is True
    assert data["match_score_pct"] == 100
    assert data["official_portal_url"] == "https://jansuraksha.gov.in/"
    assert len(data["criteria_breakdown"]) >= 4
    assert len(data["required_documents"]) >= 2
    assert len(data["step_by_step_process"]) >= 3
    assert data["budget_affordability_note"] is not None
    assert "₹20" in data["budget_affordability_note"]


def test_scraper_trigger_and_status(client):
    """Test manual trigger of isolated portal scraper."""
    res = client.post("/api/v1/schemes/scrape-now")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert data["status"] in ["started", "queued", "already_running"]

    # Check status endpoint
    status_res = client.get("/api/v1/schemes/scrape-status")
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert "status" in status_data
    assert "staging_file" in status_data
