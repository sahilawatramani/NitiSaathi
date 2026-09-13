"""
Integration test for Budget-Agent orchestration client and Nudge-Agent evaluate endpoint.
Ensures schema compatibility between AgentServiceClient.nudge() and NudgeEvaluationIn/Out.
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from agents.nudge_agent.main import app as nudge_app
from agents.nudge_agent.models.schemas import NudgeEvaluationIn, NudgeEvaluationOut


@pytest.mark.asyncio
async def test_nudge_orchestration_client_schema_compatibility():
    """Verify that the exact payload structure sent by AgentServiceClient works with Nudge API."""
    transport = ASGITransport(app=nudge_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Test evaluation with low balance flag
        payload = {
            "user_id": "42",
            "closing_balance": 150.0,
            "low_balance_flag": True,
            "pmsby_debit_due_soon": False,
            "days_to_next_pmsby_debit": None,
            "nudge_trigger_low_balance_before_debit": False,
            "missed_goal": False,
            "high_volatility_streak": False,
            "language_pref": "en",
        }
        
        # Verify schema validates directly
        validated_in = NudgeEvaluationIn(**payload)
        assert validated_in.user_id == "42"
        assert validated_in.closing_balance == 150.0
        
        # Call the live endpoint
        response = await ac.post("/nudges/evaluate", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response schema matches NudgeEvaluationOut
        validated_out = NudgeEvaluationOut(**data)
        assert len(validated_out.nudges) >= 1
        assert validated_out.nudges[0].trigger_id == "low_balance"
        assert "150" in validated_out.nudges[0].message


@pytest.mark.asyncio
async def test_nudge_orchestration_pmsby_due_soon():
    """Verify evaluation when PMSBY debit is due soon."""
    transport = ASGITransport(app=nudge_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "user_id": "101",
            "closing_balance": 10.0,
            "low_balance_flag": True,
            "pmsby_debit_due_soon": True,
            "days_to_next_pmsby_debit": 3.0,
            "nudge_trigger_low_balance_before_debit": True,
            "missed_goal": False,
            "high_volatility_streak": False,
            "language_pref": "hi",
        }
        
        response = await ac.post("/nudges/evaluate", json=payload)
        assert response.status_code == 200
        data = response.json()
        validated_out = NudgeEvaluationOut(**data)
        assert len(validated_out.nudges) >= 1
        assert validated_out.nudges[0].trigger_id == "low_balance_before_debit"


@pytest.mark.asyncio
async def test_nudge_user_list_endpoint():
    """Verify that GET /nudges/{user_id}/list returns stored nudges for that user."""
    transport = ASGITransport(app=nudge_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # First evaluate to generate and persist a nudge
        payload = {
            "user_id": "999",
            "closing_balance": 50.0,
            "low_balance_flag": True,
            "pmsby_debit_due_soon": False,
            "days_to_next_pmsby_debit": None,
            "nudge_trigger_low_balance_before_debit": False,
            "missed_goal": False,
            "high_volatility_streak": False,
            "language_pref": "en",
        }
        eval_resp = await ac.post("/nudges/evaluate", json=payload)
        assert eval_resp.status_code == 200
        
        # Now fetch from list endpoint
        list_resp = await ac.get("/nudges/999/list")
        assert list_resp.status_code == 200
        nudges = list_resp.json()
        assert isinstance(nudges, list)
        assert len(nudges) >= 1
        assert nudges[0]["user_id"] == "999"
