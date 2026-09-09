"""The shared, persisted contract for the NitiSaathi LangGraph workflow."""
from __future__ import annotations

from operator import or_
from typing import Annotated, Any, TypedDict


class AgentResponse(TypedDict, total=False):
    agent: str
    answer: str
    confidence: float
    evidence: list[str]
    conflicts_with: list[str]
    structured_evidence: dict[str, Any]
    unavailable: bool


class NitisaathiState(TypedDict, total=False):
    # Identity and conversation
    user_id: int
    message: str
    chat_history: list[dict[str, str]]
    session_id: str

    # Hydrated state
    user_profile: dict[str, Any]
    financial_persona: str
    finassist_data: dict[str, Any]
    temporal_memory: list[dict[str, Any]]
    causal_risk_chain: list[dict[str, Any]]
    language_pref: str
    literacy_level: str

    # Routing and agent results.  `or_` lets parallel agent nodes merge safely.
    current_intent: str
    relevance_weights: dict[str, float]
    active_agents: list[str]
    agent_outputs: Annotated[dict[str, AgentResponse], or_]
    nudge_queue: list[dict[str, Any]]

    # Synthesis and final output
    counterfactual_scenarios: list[dict[str, Any]]
    synthesis_result: dict[str, Any]
    final_user_response: str
