"""node.py — LangGraph node wrapper for the Literacy Agent.

This module exposes `literacy_agent_node` which plugs into the NitiSaathi
LangGraph graph as the **final processing node** (see MASTER_PROJECT_GUIDE
§11.1 — always runs, after trust_calibration_node).

It reads from the shared NitisaathiState and writes the final user-facing
response back into the state.
"""

import logging
from typing import Any, Dict

from agent import rewrite_output

logger = logging.getLogger("literacy_agent.node")


def literacy_agent_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """LangGraph node function.

    Reads:
        state["synthesis_result"]["primary_answer"]  — raw merged answer
        state["synthesis_result"]["advisory_disclaimer"]  — bool flag
        state["literacy_level"]  — "low" | "medium" | "high"

    Writes:
        state["final_user_response"]  — the simplified, disclaimer-injected text
        state["agent_outputs"]["literacy"]  — standard AgentResponse dict
    """

    # ── Extract inputs from state ─────────────────────────────────────────
    synthesis = state.get("synthesis_result", {})
    raw_answer = synthesis.get("primary_answer", "")
    has_scheme = synthesis.get("advisory_disclaimer", False)

    literacy_level = state.get("literacy_level", "medium")

    # Tradeoff statements from the synthesizer are appended to raw answer
    tradeoffs = synthesis.get("tradeoffs", [])
    if tradeoffs:
        raw_answer += "\n\n**Important trade-offs:**\n"
        for t in tradeoffs:
            raw_answer += f"- {t}\n"

    # Trust metadata (data freshness, confidence) is prepended
    trust = synthesis.get("trust_metadata", {})
    freshness = trust.get("data_freshness", "")
    confidence_label = trust.get("confidence_label", "")
    if freshness or confidence_label:
        trust_prefix = ""
        if confidence_label:
            trust_prefix += f"**Confidence:** {confidence_label}\n"
        if freshness:
            trust_prefix += f"**Data source:** {freshness}\n"
        raw_answer = trust_prefix + "\n" + raw_answer

    # ── Determine content flags ───────────────────────────────────────────
    # Check active agents to decide if financial/scheme content is present
    active_agents = state.get("active_agents", [])
    has_financial = "budget" in active_agents
    has_scheme_content = "scheme" in active_agents or has_scheme

    # ── Run the rewrite pipeline ──────────────────────────────────────────
    result = rewrite_output(
        raw_text=raw_answer,
        literacy_level=literacy_level,
        has_financial_content=has_financial,
        has_scheme_content=has_scheme_content,
    )

    # ── Write back to state ───────────────────────────────────────────────
    state["final_user_response"] = result["rewritten_text"]

    # Standard AgentResponse for the synthesizer / logging
    if "agent_outputs" not in state:
        state["agent_outputs"] = {}

    state["agent_outputs"]["literacy"] = {
        "agent": "literacy",
        "answer": result["rewritten_text"],
        "confidence": 1.0,  # deterministic post-processing — always confident
        "evidence": [
            f"literacy_level={literacy_level}",
            f"disclaimer_added={result['disclaimer_added']}",
        ],
        "conflicts_with": [],  # literacy never conflicts
    }

    logger.info(
        "Literacy Agent rewrote %d chars → %d chars (level=%s, disclaimer=%s)",
        len(result["original_text"]),
        len(result["rewritten_text"]),
        literacy_level,
        result["disclaimer_added"],
    )

    return state
