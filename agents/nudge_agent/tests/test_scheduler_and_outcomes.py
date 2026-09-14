"""
Tests for Nudge Agent autonomous scheduler, outcome tracking, and analytics endpoints.
"""
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

from agents.nudge_agent.main import app
from agents.nudge_agent.models.schemas import NudgeOut
from agents.nudge_agent.services.scheduler_service import nudge_scheduler
from agents.nudge_agent.services.nudge_storage_service import save_nudge, get_nudges_by_user


@pytest.fixture
def client():
    return TestClient(app)


def test_scheduler_status_endpoint(client):
    """Test retrieving background scheduler status."""
    res = client.get("/nudges/scheduler/status")
    assert res.status_code == 200
    data = res.json()
    assert "is_running" in data
    assert "interval_seconds" in data
    assert "active_monitored_triggers" in data
    assert "low_balance_before_debit" in data["active_monitored_triggers"]


def test_scheduler_lifecycle(client):
    """Test start and stop controls."""
    res_stop = client.post("/nudges/scheduler/stop")
    assert res_stop.status_code == 200
    assert res_stop.json()["is_running"] is False

    res_start = client.post("/nudges/scheduler/start")
    assert res_start.status_code == 200
    assert res_start.json()["is_running"] is True


def test_outcome_evaluation_and_analytics(client):
    """Test post-intervention outcome evaluation and analytics summary."""
    test_user = "user_outcome_test_99"
    nudge = NudgeOut(
        id="nudge_outcome_test_001",
        user_id=test_user,
        trigger_id="low_balance_before_debit",
        message="Your balance is low and PMSBY payment is due soon.",
        status="pending",
        created_at=datetime.utcnow() - timedelta(days=8),
        outcome_check_at=datetime.utcnow() - timedelta(days=1),
        outcome_status="pending"
    )
    save_nudge(nudge)

    # Trigger immediate outcome evaluation
    res_eval = client.post("/nudges/outcomes/evaluate-now?force_all=true")
    assert res_eval.status_code == 200
    outcomes = res_eval.json()
    assert isinstance(outcomes, list)

    # Check analytics endpoint
    res_analytics = client.get("/nudges/outcomes/analytics")
    assert res_analytics.status_code == 200
    analytics = res_analytics.json()
    assert "total_nudges_recorded" in analytics
    assert "total_outcomes_evaluated" in analytics
    assert "positive_outcomes" in analytics
    assert "efficacy_rate_pct" in analytics
    assert analytics["total_outcomes_evaluated"] >= 1
