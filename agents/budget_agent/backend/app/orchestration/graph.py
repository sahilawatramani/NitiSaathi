"""NitiSaathi's conflict-aware LangGraph orchestration layer.

The Budget API is the public gateway; Scheme, Fraud Guard, Nudge and Literacy
remain independent HTTP services.  No specialist imports another specialist's
implementation.  Nodes receive a deliberately scoped projection of state.
"""
from __future__ import annotations

import asyncio
import logging
import re
from datetime import datetime, timezone
from typing import Any

import httpx
from sqlalchemy.orm import Session

from app.models.schemas import Transaction, UserProfile, UserConsent
from app.agents.interaction_agent import handle_user_query
from app.orchestration.clients import AgentServiceClient
from app.orchestration.state import NitisaathiState
from app.services.causal_chain_service import run_causal_chain_reasoner
from app.services.state_bridge_service import get_finassist_data
from app.services.orchestration_state_service import load_history, save_state

try:  # Allows deterministic service/unit tests before optional deps are installed.
    from langgraph.graph import END, START, StateGraph
    LANGGRAPH_AVAILABLE = True
except ImportError:  # pragma: no cover - used only in minimal development envs
    END = START = StateGraph = None
    LANGGRAPH_AVAILABLE = False

logger = logging.getLogger(__name__)
RELEVANCE_THRESHOLD = 0.30


def _intent_and_weights(message: str) -> tuple[str, dict[str, float]]:
    """Fast deterministic relevance gate; no LLM call is needed for routing."""
    text = message.lower()
    # Budget is also the safe general-finance/RAG fallback, so every chat turn
    # has one useful responder while specialist calls remain relevance-gated.
    weights = {"budget": 0.35, "scheme": 0.05, "fraud": 0.05, "nudge": 0.05}
    budget_words = ("save", "budget", "income", "expense", "spend", "rent", "emi", "balance", "goal", "cash")
    scheme_words = ("scheme", "e-shram", "eshram", "pm-sym", "pmsby", "pmjjby", "apy", "pension", "welfare")
    fraud_words = ("fraud", "scam", "upi", "otp", "pin", "kyc", "qr", "collect request", "refund", "suspicious")
    nudge_words = ("remind", "nudge", "alert", "due", "lapse", "notify")
    if any(word in text for word in budget_words): weights["budget"] = 0.90
    if any(word in text for word in scheme_words): weights["scheme"] = 0.95
    if any(word in text for word in fraud_words): weights["fraud"] = 1.0
    if any(word in text for word in nudge_words): weights["nudge"] = 0.75
    # Joint affordability is meaningful whenever a scheme question is asked.
    if weights["scheme"] >= RELEVANCE_THRESHOLD: weights["budget"] = max(weights["budget"], 0.65)
    # Fraud dominates dangerous PIN/OTP content even if users phrase it casually.
    if re.search(r"\b(pin|otp)\b", text): weights["fraud"] = 1.0
    active = [name for name, score in weights.items() if score >= RELEVANCE_THRESHOLD]
    if weights["fraud"] >= .9: intent = "fraud_check"
    elif weights["scheme"] >= .9: intent = "scheme_eligibility"
    elif weights["budget"] >= .9: intent = "savings_advice"
    else: intent = "general_chat"
    return intent, weights


def _get_checkpointer():
    """Return a LangGraph checkpointer, or None if not available."""
    if not LANGGRAPH_AVAILABLE:
        return None
    try:
        from langgraph.checkpoint.sqlite import SqliteSaver
        from app.config import DATABASE_URL
        if DATABASE_URL and DATABASE_URL.startswith('sqlite:///'):
            db_path = DATABASE_URL.replace('sqlite:///', '')
            # SqliteSaver needs the plain file path
            from langgraph.checkpoint.memory import MemorySaver
            return MemorySaver()
    except ImportError:
        pass
    try:
        from langgraph.checkpoint.memory import MemorySaver
        logger.info('Using MemorySaver checkpointer (in-memory, no persistence between restarts)')
        return MemorySaver()
    except ImportError:
        pass
    return None

_CHECKPOINTER = None  # lazy initialized

def _profile_projection(profile: UserProfile | None, user_id: int) -> dict[str, Any]:
    """Only fields needed by the relevant agents are placed into shared state."""
    return {
        "user_id": user_id,
        "age": profile.age if profile else 30,
        "monthly_income": profile.monthly_income if profile else 0.0,
        "epfo_esic_status": bool(getattr(profile, "epfo_esic_status", False)),
        "income_tax_payer": bool(getattr(profile, "income_tax_payer", False)),
        "days_active_with_aggregator": int(getattr(profile, "days_active_with_aggregator", 0)),
        "e_shram_registered": bool(getattr(profile, "e_shram_registered", False)),
        "savings_bank_account": bool(getattr(profile, "savings_bank_account", True)),
        "aadhaar_linked": bool(getattr(profile, "aadhaar_linked", True)),
        "state": getattr(profile, "state", None),
        "language_pref": getattr(profile, "language_pref", "en") or "en",
        "literacy_level": getattr(profile, "literacy_level", "medium") or "medium",
        "complete_for_schemes": bool(profile and getattr(profile, "days_active_with_aggregator", None) is not None),
    }


class NitisaathiOrchestrator:
    """Build and execute the graph used by `/api/chat`.

    A graph instance is request-safe: the DB session is used only during
    hydration and does not enter checkpointed state.
    """

    def __init__(self, db: Session, client: AgentServiceClient | None = None) -> None:
        self.db = db
        self.client = client or AgentServiceClient()
        self.graph = self._build_graph() if LANGGRAPH_AVAILABLE else None

    def _build_graph(self):
        graph = StateGraph(NitisaathiState)
        graph.add_node("hydrate", self._hydrate)
        graph.add_node("relevance_gate", self._relevance_gate)
        graph.add_node("budget_agent", self._budget_agent)
        graph.add_node("scheme_agent", self._scheme_agent)
        graph.add_node("fraud_guard", self._fraud_guard)
        graph.add_node("nudge_agent", self._nudge_agent)
        graph.add_node("counterfactual_engine", self._counterfactual)
        graph.add_node("synthesizer", self._synthesizer)
        graph.add_node("trust_calibration", self._trust_calibration)
        graph.add_node("literacy_agent", self._literacy_agent)
        graph.add_edge(START, "hydrate")
        graph.add_edge("hydrate", "relevance_gate")
        # Nodes run concurrently. Inactive nodes are strict no-ops, so the
        # relevance gate avoids service calls/cost while preserving a join.
        graph.add_edge("relevance_gate", "budget_agent")
        graph.add_edge("relevance_gate", "scheme_agent")
        graph.add_edge("relevance_gate", "fraud_guard")
        graph.add_edge("relevance_gate", "nudge_agent")
        graph.add_edge(["budget_agent", "scheme_agent", "fraud_guard", "nudge_agent"], "counterfactual_engine")
        graph.add_edge("counterfactual_engine", "synthesizer")
        graph.add_edge("synthesizer", "trust_calibration")
        graph.add_edge("trust_calibration", "literacy_agent")
        graph.add_edge("literacy_agent", END)
        
        checkpointer = _get_checkpointer()
        if checkpointer is not None:
            return graph.compile(checkpointer=checkpointer)
        return graph.compile()

    async def run(self, *, user_id: int, message: str, chat_history: list[dict[str, str]] | None = None, session_id: str | None = None) -> dict[str, Any]:
        thread_id = session_id or f"user-{user_id}"
        history = chat_history if chat_history is not None else load_history(self.db, user_id, thread_id)
        initial: NitisaathiState = {
            "user_id": user_id, "message": message, "chat_history": history,
            "session_id": thread_id, "agent_outputs": {}, "nudge_queue": [],
        }
        if self.graph is not None:
            # `ainvoke` executes the four specialist nodes concurrently.
            result = await self.graph.ainvoke(initial, config={"configurable": {"thread_id": initial["session_id"]}})
            result["chat_history"] = [*history, {"role": "user", "content": message}, {"role": "assistant", "content": result.get("final_user_response", "")}][-40:]
            save_state(self.db, user_id, thread_id, result)
            return result
        # Same deterministic order for environments where LangGraph has not
        # yet been installed; production requirements install LangGraph.
        state: dict[str, Any] = initial
        for node in (self._hydrate, self._relevance_gate, self._budget_agent, self._scheme_agent,
                     self._fraud_guard, self._nudge_agent, self._counterfactual, self._synthesizer,
                     self._trust_calibration, self._literacy_agent):
            state.update(await node(state))
        state["chat_history"] = [*history, {"role": "user", "content": message}, {"role": "assistant", "content": state.get("final_user_response", "")}][-40:]
        save_state(self.db, user_id, thread_id, state)
        return state

    async def _hydrate(self, state: NitisaathiState) -> dict[str, Any]:
        user_id = state["user_id"]
        profile = self.db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        finassist = get_finassist_data(user_id, self.db)
        causal_chain = run_causal_chain_reasoner(user_id, self.db)
        memory = finassist.get("temporal_memory_summary", {}).get("top_events", [])
        projected = _profile_projection(profile, user_id)
        consent_rows = self.db.query(UserConsent).filter(UserConsent.user_id == user_id, UserConsent.granted == True).all()
        return {
            "user_profile": projected, "finassist_data": finassist,
            "financial_persona": finassist.get("financial_persona", "moderate"),
            "temporal_memory": memory, "causal_risk_chain": causal_chain,
            "language_pref": projected["language_pref"], "literacy_level": projected["literacy_level"],
            "consents": [row.purpose for row in consent_rows],
        }

    async def _relevance_gate(self, state: NitisaathiState) -> dict[str, Any]:
        intent, weights = _intent_and_weights(state["message"])
        return {"current_intent": intent, "relevance_weights": weights,
                "active_agents": [name for name, score in weights.items() if score >= RELEVANCE_THRESHOLD]}

    async def _budget_agent(self, state: NitisaathiState) -> dict[str, Any]:
        if "budget" not in state.get("active_agents", []): return {}
        fd = state["finassist_data"]
        if state.get("current_intent") == "general_chat":
            # Retain the existing Budget Agent RAG/LLM capability rather than
            # replacing it with orchestration. The service itself has an
            # offline deterministic fallback if an LLM key is not configured.
            context = (
                f"Predicted weekly income: ₹{fd.get('income_wma_4w', 0):,.0f}; "
                f"current balance: ₹{fd.get('closing_balance', 0):,.0f}; "
                f"recommended savings rate: {fd.get('savings_rate_recommendation', 0) * 100:.0f}%."
            )
            answer = await asyncio.to_thread(handle_user_query, state["message"], context)
        else:
            answer = (f"Your predicted income for next week is ₹{fd.get('income_wma_4w', 0):,.0f}. "
                      f"With your income variation at {fd.get('income_volatility_pct', 0):.1f}%, "
                      f"keep a savings target of {fd.get('savings_rate_recommendation', 0) * 100:.0f}%.")
            if fd.get("low_balance_flag"):
                answer += f" Your current balance is ₹{fd.get('closing_balance', 0):,.0f}, so limit non-essential spending."
        return {"agent_outputs": {"budget": {"agent": "budget", "answer": answer, "confidence": .88,
            "evidence": [f"income_wma_4w={fd.get('income_wma_4w', 0)}", f"income_volatility_pct={fd.get('income_volatility_pct', 0)}"],
            "structured_evidence": {"savings_rate_recommendation": fd.get("savings_rate_recommendation", 0), "income_wma_4w": fd.get("income_wma_4w", 0)}, "conflicts_with": []}}}

    async def _scheme_agent(self, state: NitisaathiState) -> dict[str, Any]:
        if "scheme" not in state.get("active_agents", []): return {}
        if "scheme_eligibility" not in state.get("consents", []):
            return {"agent_outputs": {"scheme": {"agent": "scheme", "answer": "Please give consent for scheme eligibility checks in Privacy settings before I use your profile.", "confidence": 1.0, "evidence": ["consent_required"], "conflicts_with": []}}}
        if not state["user_profile"].get("complete_for_schemes"):
            return {"agent_outputs": {"scheme": {"agent": "scheme", "answer": "Please complete your gig-work profile before checking scheme eligibility.", "confidence": .2, "evidence": ["missing days_active_with_aggregator"], "conflicts_with": []}}}
        try:
            result = await self.client.scheme(state["user_profile"], state["finassist_data"])
            priorities = result.get("priority_recommendations", [])
            answer = " ".join(priorities) or "No government scheme recommendation is available from the supplied profile."
            required_rate = 0.0
            for item in result.get("eligible_schemes", []):
                if item.get("scheme_code") == "PMSYM_001" and item.get("contribution_required"):
                    monthly_income = max(state["finassist_data"].get("income_wma_4w", 0) * 4, 1)
                    required_rate = item["contribution_required"] / monthly_income
            return {"agent_outputs": {"scheme": {"agent": "scheme", "answer": answer, "confidence": .95,
                "evidence": [f"scheme_data_timestamp={result.get('timestamp', 'unknown')}"] ,
                "structured_evidence": {"required_savings_rate": required_rate, "result": result}, "conflicts_with": ["budget"] if required_rate else []}}}
        except (httpx.HTTPError, asyncio.TimeoutError, ValueError) as exc:
            logger.warning("Scheme Agent unavailable: %s", exc)
            return {"agent_outputs": {"scheme": {"agent": "scheme", "answer": "Scheme service is temporarily unavailable; no eligibility decision was made.", "confidence": 0.0, "evidence": [], "conflicts_with": [], "unavailable": True}}}

    async def _fraud_guard(self, state: NitisaathiState) -> dict[str, Any]:
        if "fraud" not in state.get("active_agents", []): return {}
        if "fraud_detection" not in state.get("consents", []):
            return {"agent_outputs": {"fraud": {"agent": "fraud", "answer": "Please give consent for fraud detection in Privacy settings before I analyse transaction patterns.", "confidence": 1.0, "evidence": ["consent_required"], "conflicts_with": []}}}
        # Fraud Guard is scoped to message plus transaction pattern history.
        try:
            result = await self.client.fraud(state["message"], state["finassist_data"].get("recent_transactions", []), state["user_id"])
            if result.get("contains_pin_otp_request"):
                answer, confidence = result.get("alert_message"), 1.0
            else:
                alert = result.get("alert") or {}
                answer = alert.get("alert_message") or result.get("reason") or "No suspicious pattern was found in the available data."
                confidence = float(alert.get("risk_score", result.get("risk_score", .7 if alert else .5)))
            return {"agent_outputs": {"fraud": {"agent": "fraud", "answer": answer, "confidence": confidence,
                "evidence": ["Fraud Guard hard PIN/OTP rule evaluated"], "conflicts_with": [], "structured_evidence": result}}}
        except (httpx.HTTPError, asyncio.TimeoutError, ValueError) as exc:
            logger.warning("Fraud Guard unavailable: %s", exc)
            return {"agent_outputs": {"fraud": {"agent": "fraud", "answer": "Fraud service is unavailable. Do not share your UPI PIN or OTP with anyone.", "confidence": .4, "evidence": ["safe fallback"], "conflicts_with": [], "unavailable": True}}}

    async def _nudge_agent(self, state: NitisaathiState) -> dict[str, Any]:
        # Nudge monitor always evaluates state independently; it is not part of
        # the answer unless relevant, but it may enqueue a notification.
        if "nudges" not in state.get("consents", []):
            return {"nudge_queue": []}
        try:
            result = await self.client.nudge(state["user_id"], state["finassist_data"], state["language_pref"])
            nudges = result.get("nudges", [])
            update: dict[str, Any] = {"nudge_queue": nudges}
            if "nudge" in state.get("active_agents", []) and nudges:
                update["agent_outputs"] = {"nudge": {"agent": "nudge", "answer": " ".join(n["message"] for n in nudges), "confidence": .8, "evidence": [n["trigger_id"] for n in nudges], "conflicts_with": []}}
            return update
        except (httpx.HTTPError, asyncio.TimeoutError, ValueError) as exc:
            logger.info("Nudge Agent unavailable: %s", exc)
            return {"nudge_queue": []}

    async def _counterfactual(self, state: NitisaathiState) -> dict[str, Any]:
        fd = state["finassist_data"]
        income, balance = float(fd.get("income_wma_4w", 0)), float(fd.get("closing_balance", 0))
        saving = income * float(fd.get("savings_rate_recommendation", 0))
        scenarios = [
            {"name": "Follow recommended savings", "action": "save_recommended", "projected_balance_4w": round(balance + saving * 4, 2), "risk": "LOW", "recommended": True},
            {"name": "Spend the planned savings", "action": "spend_savings", "projected_balance_4w": round(balance, 2), "risk": "MEDIUM", "recommended": False},
            {"name": "Save double the target", "action": "save_double", "projected_balance_4w": round(balance + saving * 8, 2), "risk": "HIGH" if fd.get("income_volatility_pct", 0) > 30 else "MEDIUM", "recommended": False},
        ]
        return {"counterfactual_scenarios": scenarios}

    async def _synthesizer(self, state: NitisaathiState) -> dict[str, Any]:
        outputs = state.get("agent_outputs", {})
        usable = [o for o in outputs.values() if not o.get("unavailable") and o.get("answer")]
        primary = max(usable, key=lambda o: o.get("confidence", 0), default={"answer": "I could not find enough information to answer that yet.", "confidence": 0})
        tradeoffs: list[str] = []
        budget, scheme = outputs.get("budget"), outputs.get("scheme")
        if budget and scheme:
            budget_rate = budget.get("structured_evidence", {}).get("savings_rate_recommendation", 0)
            scheme_rate = scheme.get("structured_evidence", {}).get("required_savings_rate", 0)
            if scheme_rate and budget_rate < scheme_rate:
                tradeoffs.append(f"Your budget recommends saving {budget_rate * 100:.0f}%, while PM-SYM needs about {scheme_rate * 100:.0f}% of estimated monthly income. Wait for four stable weeks before enabling auto-debit.")
        confidence = round(sum(float(o.get("confidence", 0)) for o in usable) / len(usable), 2) if usable else 0.0
        return {"synthesis_result": {"primary_answer": primary["answer"], "tradeoffs": tradeoffs,
            "counterfactual_scenarios": state.get("counterfactual_scenarios", []), "causal_chain": state.get("causal_risk_chain", []),
            "temporal_context": [m for m in state.get("temporal_memory", []) if m.get("current_significance", 0) > .3],
            "overall_confidence": confidence, "advisory_disclaimer": bool({"budget", "scheme"} & set(outputs))}}

    async def _trust_calibration(self, state: NitisaathiState) -> dict[str, Any]:
        result = dict(state["synthesis_result"])
        fd = state["finassist_data"]
        confidence = result["overall_confidence"]
        weekly_features = fd.get("weekly_features_last4") or []
        latest_week = weekly_features[0].get("week_start", "no weekly data") if weekly_features else "no weekly data"
        result["trust_metadata"] = {
            "data_freshness": f"Based on the latest weekly data ({latest_week}).",
            "confidence_score": confidence, "confidence_label": "High" if confidence >= .8 else "Moderate" if confidence >= .5 else "Low",
            "sensitivity": f"This recommendation changes if predicted weekly income drops below ₹{float(fd.get('income_wma_4w', 0)) * .8:,.0f}.",
            "data_source_tags": ["Budget Agent DB", "Scheme/Fraud microservice response"],
        }
        return {"synthesis_result": result}

    async def _literacy_agent(self, state: NitisaathiState) -> dict[str, Any]:
        synthesis = state["synthesis_result"]
        text = synthesis["primary_answer"]
        if synthesis.get("tradeoffs"): text += "\n\nTrade-offs: " + " ".join(synthesis["tradeoffs"])
        trust = synthesis.get("trust_metadata", {})
        text += f"\n\nConfidence: {trust.get('confidence_label', 'Low')}. {trust.get('data_freshness', '')} {trust.get('sensitivity', '')}"
        try:
            result = await self.client.literacy(text, state["literacy_level"], state["language_pref"], "budget" in state.get("active_agents", []), "scheme" in state.get("active_agents", []))
            final = result.get("rewritten_text", text)
        except (httpx.HTTPError, asyncio.TimeoutError, ValueError) as exc:
            logger.warning("Literacy Agent unavailable: %s", exc)
            final = text + ("\n\nThis information is for general guidance only. Verify official sources before enrolling." if synthesis.get("advisory_disclaimer") else "")

        lang = state.get('language_pref', 'en')
        if lang != 'en' and final:
            try:
                from app.services.translation_service import translate
                final = await translate(final, target_lang=lang, source_lang='en')
            except Exception as exc:
                logger.warning('Translation failed: %s', exc)
        return {"final_user_response": final, "agent_outputs": {"literacy": {"agent": "literacy", "answer": final, "confidence": 1.0, "evidence": [f"language={state['language_pref']}", f"level={state['literacy_level']}"], "conflicts_with": []}}}
