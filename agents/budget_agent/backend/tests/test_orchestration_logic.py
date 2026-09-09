"""Deterministic tests for the multi-agent orchestration decisions."""
import asyncio

from app.orchestration.graph import NitisaathiOrchestrator, _intent_and_weights


def _orchestrator_without_db():
    # These node tests do not touch DB/client state.
    return NitisaathiOrchestrator.__new__(NitisaathiOrchestrator)


def test_relevance_gate_routes_scheme_and_budget_together():
    intent, weights = _intent_and_weights("Should I enroll in PM-SYM when my income changes every week?")
    assert intent == "scheme_eligibility"
    assert weights["scheme"] >= 0.30
    assert weights["budget"] >= 0.30
    assert weights["fraud"] < 0.30


def test_relevance_gate_always_escalates_pin_otp_content_to_fraud():
    intent, weights = _intent_and_weights("They told me to share my OTP for KYC")
    assert intent == "fraud_check"
    assert weights["fraud"] == 1.0


def test_synthesizer_surfaces_budget_scheme_conflict():
    state = {
        "agent_outputs": {
            "budget": {
                "answer": "Save 5% this week.", "confidence": 0.88,
                "structured_evidence": {"savings_rate_recommendation": 0.05},
            },
            "scheme": {
                "answer": "PM-SYM needs a monthly contribution.", "confidence": 0.95,
                "structured_evidence": {"required_savings_rate": 0.14},
            },
        },
        "counterfactual_scenarios": [], "causal_risk_chain": [], "temporal_memory": [],
    }
    result = asyncio.run(_orchestrator_without_db()._synthesizer(state))
    assert result["synthesis_result"]["tradeoffs"]
    assert "5%" in result["synthesis_result"]["tradeoffs"][0]
    assert "14%" in result["synthesis_result"]["tradeoffs"][0]


def test_counterfactual_engine_returns_three_ranked_options():
    state = {"finassist_data": {"income_wma_4w": 2800, "closing_balance": 1000, "savings_rate_recommendation": .10, "income_volatility_pct": 22}}
    result = asyncio.run(_orchestrator_without_db()._counterfactual(state))
    scenarios = result["counterfactual_scenarios"]
    assert len(scenarios) == 3
    assert sum(s["recommended"] for s in scenarios) == 1
