"""
Unit and integration tests for Nudge Agent storage, listing endpoints, and feedback.
"""
import pytest
from fastapi.testclient import TestClient

from datetime import datetime
from agents.nudge_agent.main import app
from agents.nudge_agent.models.schemas import NudgeOut
from agents.nudge_agent.services.nudge_storage_service import (
    save_nudge,
    get_nudges_by_user,
    get_all_nudges,
)


@pytest.fixture
def client():
    return TestClient(app)


def test_nudge_storage_save_and_list():
    """Test saving and retrieving nudges from SQLite storage."""
    nudge1 = NudgeOut(
        id="test_nudge_1",
        user_id="user_123",
        trigger_id="low_balance_before_debit",
        message="Keep ₹20 in your account before May 31 for PMSBY debit.",
        status="pending",
        created_at=datetime.utcnow()
    )
    save_nudge(nudge1)

    nudge2 = NudgeOut(
        id="test_nudge_2",
        user_id="user_123",
        trigger_id="savings_goal",
        message="Your weekly savings are on track!",
        status="pending",
        created_at=datetime.utcnow()
    )
    save_nudge(nudge2)

    # List by user
    user_nudges = get_nudges_by_user("user_123")
    assert len(user_nudges) >= 2
    nudge_ids = [n.id for n in user_nudges]
    assert "test_nudge_1" in nudge_ids
    assert "test_nudge_2" in nudge_ids


def test_nudge_api_list_and_feedback(client):
    """Test FastAPI /nudges/list and /feedback endpoints via TestClient."""
    # 1. Post an evaluation
    eval_req = {
        "user_id": "test_user_api",
        "closing_balance": 15.0,
        "days_to_next_pmsby_debit": 3.0,
        "nudge_trigger_low_balance_before_debit": True,
        "language_pref": "hi",
    }
    res_eval = client.post("/nudges/evaluate", json=eval_req)
    assert res_eval.status_code == 200
    eval_data = res_eval.json()
    assert len(eval_data["nudges"]) >= 1
    assert eval_data["nudges"][0]["user_id"] == "test_user_api"

    # 2. Get nudges for user
    res_list_user = client.get("/nudges/test_user_api/list")
    assert res_list_user.status_code == 200
    user_nudges = res_list_user.json()
    assert len(user_nudges) >= 1
    target_nudge = user_nudges[0]
    assert "message" in target_nudge
    assert len(target_nudge["message"]) > 0

    # 3. Get all nudges
    res_list_all = client.get("/nudges/")
    assert res_list_all.status_code == 200
    all_nudges = res_list_all.json()
    assert len(all_nudges) >= 1

    # 4. Post feedback
    res_feedback = client.post(
        f"/nudges/{target_nudge['id']}/feedback",
        json={"user_id": "test_user_api", "trigger_id": "low_balance_before_debit", "rating": "useful"}
    )
    assert res_feedback.status_code == 200
    feedback_data = res_feedback.json()
    assert feedback_data["status"] == "success"
