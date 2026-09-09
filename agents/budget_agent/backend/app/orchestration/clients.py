"""Small HTTP adapters for NitiSaathi's separately deployable agents.

The graph deliberately talks to HTTP APIs instead of importing specialist
code.  That keeps ownership boundaries real and permits each service to be
scaled, tested, and released independently.
"""
from __future__ import annotations

import os
from datetime import datetime
from statistics import mean, pstdev
from typing import Any

import httpx


class AgentServiceClient:
    def __init__(self, timeout_seconds: float | None = None) -> None:
        self.timeout = timeout_seconds or float(os.getenv("AGENT_SERVICE_TIMEOUT_SECONDS", "1.5"))
        self.scheme_url = os.getenv("SCHEME_AGENT_URL", "http://localhost:8001").rstrip("/")
        self.fraud_url = os.getenv("FRAUD_GUARD_URL", "http://localhost:8002").rstrip("/")
        self.nudge_url = os.getenv("NUDGE_AGENT_URL", "http://localhost:8004").rstrip("/")
        self.literacy_url = os.getenv("LITERACY_AGENT_URL", "http://localhost:8100").rstrip("/")

    async def _post(self, base_url: str, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(f"{base_url}{path}", json=payload)
            response.raise_for_status()
            return response.json()

    async def scheme(self, profile: dict[str, Any], budget: dict[str, Any]) -> dict[str, Any]:
        # Scoped profile only: no raw transactions are sent to Scheme Agent.
        scheme_profile = {
            "user_id": str(profile["user_id"]),
            "age": profile["age"],
            "epfo_esic_status": profile["epfo_esic_status"],
            "income_tax_payer": profile["income_tax_payer"],
            "days_active_with_aggregator": profile["days_active_with_aggregator"],
            "e_shram_registered": profile["e_shram_registered"],
            "monthly_income": profile["monthly_income"],
            "state": profile.get("state"),
            "savings_bank_account": profile.get("savings_bank_account", True),
            "aadhaar_linked": profile.get("aadhaar_linked", True),
        }
        budget_state = {
            "income_wma_4w": budget.get("income_wma_4w", 0),
            # DB service represents this in percentage points; Scheme API uses a ratio.
            "income_volatility_pct": float(budget.get("income_volatility_pct", 0)) / 100,
            "savings_rate_recommendation": budget.get("savings_rate_recommendation", 0.05),
            "closing_balance": budget.get("closing_balance", 0),
            "financial_persona": budget.get("financial_persona", "moderate"),
        }
        return await self._post(self.scheme_url, "/api/v1/schemes/check-eligibility", {
            "user_profile": scheme_profile, "budget_state": budget_state,
        })

    async def fraud(self, message: str, transactions: list[dict[str, Any]], user_id: int) -> dict[str, Any]:
        # Hard rule first: this route needs no financial profile at all.
        pin_result = await self._post(self.fraud_url, "/api/v1/fraud-guard/check-pin-otp-request", {"text": message})
        if pin_result.get("contains_pin_otp_request"):
            return pin_result

        debits = [t for t in transactions if t.get("direction") == "debit"]
        if not debits:
            return {"is_suspicious": False, "risk_score": 0.0, "reason": "No recent debit is available to analyse."}
        latest = debits[0]
        debit_amounts = [float(t["amount"]) for t in debits]
        avg = mean(debit_amounts)
        history = {
            "user_id": str(user_id), "total_transactions": len(transactions),
            "avg_credit_amount": 0, "avg_debit_amount": avg,
            "stddev_credit": 0, "stddev_debit": pstdev(debit_amounts) if len(debit_amounts) > 1 else 0,
            "unique_counterparties": len({t.get("merchant") for t in transactions}),
            "frequent_counterparties": [],
            "category_distribution": {str(t.get("category") or "unknown"): 1 for t in transactions},
            "typical_transaction_hours": list(range(7, 23)), "previous_fraud_incidents": 0,
        }
        timestamp = latest.get("date") or datetime.now().isoformat()
        transaction = {
            "transaction_id": str(latest.get("id", "latest")), "user_id": str(user_id),
            "timestamp": timestamp, "direction": latest.get("direction", "debit"),
            "amount": float(latest.get("amount", 0)), "counterparty": latest.get("merchant") or "Unknown",
            "category": latest.get("category") or "discretionary", "description": latest.get("description") or message,
            "balance_before": max(float(latest.get("amount", 0)), 1), "balance_after": 0,
            "is_first_time_counterparty": True, "transaction_hour": datetime.now().hour,
        }
        return await self._post(self.fraud_url, "/api/v1/fraud-guard/detect", {
            "transaction": transaction, "user_history": history, "check_description": message,
        })

    async def nudge(self, user_id: int, finassist: dict[str, Any], language_pref: str) -> dict[str, Any]:
        return await self._post(self.nudge_url, "/nudges/evaluate", {
            "user_id": str(user_id), "closing_balance": finassist.get("closing_balance", 0),
            "low_balance_flag": finassist.get("low_balance_flag", False),
            "pmsby_debit_due_soon": finassist.get("pmsby_debit_due_soon", False),
            "days_to_next_pmsby_debit": finassist.get("days_to_next_pmsby_debit"),
            "nudge_trigger_low_balance_before_debit": finassist.get("nudge_trigger_low_balance_before_debit", False),
            "missed_goal": any(g.get("progress_pct", 100) < 100 for g in finassist.get("active_goals", [])),
            "high_volatility_streak": finassist.get("income_volatility_pct", 0) > 30,
            "language_pref": language_pref if language_pref in {"hi", "en", "mr"} else "en",
        })

    async def literacy(self, text: str, literacy_level: str, language_pref: str, financial: bool, scheme: bool) -> dict[str, Any]:
        return await self._post(self.literacy_url, "/literacy/rewrite", {
            "text": text, "literacy_level": literacy_level,
            "language_pref": language_pref, "has_financial_content": financial,
            "has_scheme_content": scheme,
        })
