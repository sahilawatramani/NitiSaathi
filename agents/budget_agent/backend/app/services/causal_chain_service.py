"""
Causal Chain Reasoner — Maps financial shortfalls to consequence chains
with ranked interventions.

This is the Budget Agent's most distinctive feature: instead of just
saying "your balance is low", it explains the *causal chain* —

    Low balance → can't cover rent → eviction risk → need informal borrow
    → debt spiral → can't save for PMSBY → lose insurance coverage

…and then ranks concrete interventions by impact/feasibility.
"""
from __future__ import annotations

import logging
from datetime import date, timedelta
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.schemas import RecurringDebit, TemporalMemoryEvent, UserProfile, UserWeeklyFeatures
from app.services.wma_service import (
    compute_full_budget_state,
    get_upcoming_mandatory_debits,
    get_weekly_incomes,
    compute_income_wma_4w,
)

logger = logging.getLogger(__name__)


# ─── Consequence Templates ──────────────────────────────────────────────────

CONSEQUENCE_CHAINS = {
    "rent": [
        "Cannot pay rent on time",
        "Late payment penalty or landlord conflict",
        "Risk of eviction or forced relocation",
        "Need informal borrowing from friends/family",
    ],
    "loan_emi": [
        "EMI payment will bounce or be missed",
        "Late fee and credit impact",
        "Lender follow-up / harassment",
        "Potential vehicle/asset seizure for secured loans",
    ],
    "insurance_premium": [
        "PMSBY / insurance premium will lapse",
        "Loss of accident / life coverage for the year",
        "Family left unprotected in case of emergency",
        "Re-enrollment may have waiting period",
    ],
    "recharge": [
        "Phone recharge will lapse",
        "Cannot receive platform orders / ride requests",
        "Direct income loss for days without connectivity",
    ],
    "fuel": [
        "Cannot fuel vehicle for deliveries / rides",
        "Missed work days → income loss",
        "May need to borrow for fuel at unfavorable terms",
    ],
}

# ─── Intervention Templates ────────────────────────────────────────────────

INTERVENTIONS = [
    {
        "action": "Reduce discretionary spending this week",
        "impact": "high",
        "feasibility": "high",
        "category": "expense_cut",
    },
    {
        "action": "Defer non-essential family transfers by 1 week",
        "impact": "medium",
        "feasibility": "medium",
        "category": "expense_defer",
    },
    {
        "action": "Pick up extra shifts / surge hours on platform",
        "impact": "high",
        "feasibility": "medium",
        "category": "income_boost",
    },
    {
        "action": "Move savings goal target date by 2 weeks",
        "impact": "low",
        "feasibility": "high",
        "category": "goal_adjust",
    },
    {
        "action": "Use emergency fund (if available)",
        "impact": "high",
        "feasibility": "low",
        "category": "emergency",
    },
]


def _rank_interventions(
    shortfall: float,
    closing_balance: float,
    persona: str,
) -> List[dict]:
    """Rank interventions by a simple impact × feasibility score,
    adjusted by user persona (conservative users get safer options first).
    """
    feasibility_score = {"high": 3, "medium": 2, "low": 1}
    impact_score = {"high": 3, "medium": 2, "low": 1}
    persona_bonus = {"conservative": 0.5, "moderate": 0.0, "growth": -0.3}

    scored = []
    for intervention in INTERVENTIONS:
        score = (
            impact_score[intervention["impact"]]
            * feasibility_score[intervention["feasibility"]]
            + persona_bonus.get(persona, 0)
        )
        scored.append({**intervention, "score": round(score, 2)})

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored


def run_causal_chain_reasoner(user_id: int, db: Session) -> List[dict]:
    """Analyse the user's current financial state and produce causal risk chains.

    Returns a list of risk items, each containing:
      - trigger: human-readable trigger description
      - due_in_days: days until the debit hits
      - consequences: ordered list of downstream consequences
      - interventions: ranked list of concrete actions
    """
    # Fetch current state
    weekly_incomes = get_weekly_incomes(user_id, db)
    wma = compute_income_wma_4w(weekly_incomes)

    latest = (
        db.query(UserWeeklyFeatures)
        .filter(UserWeeklyFeatures.user_id == user_id)
        .order_by(UserWeeklyFeatures.week_start.desc())
        .first()
    )
    closing = latest.closing_balance if latest else 0.0

    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    persona = profile.financial_persona if profile else "moderate"

    # Check upcoming debits in 14-day window
    upcoming = get_upcoming_mandatory_debits(user_id, db, days_ahead=14)

    chains: List[dict] = []
    for debit in upcoming:
        if closing < debit["amount"]:
            shortfall = debit["amount"] - closing
            category = debit["category"]
            consequences = CONSEQUENCE_CHAINS.get(category, [
                f"Cannot cover {debit['name']}",
                "May need emergency borrowing",
                "Financial stress increases",
            ])

            chains.append({
                "trigger": (
                    f"Balance ₹{closing:,.0f} is below "
                    f"{debit['name']} ₹{debit['amount']:,.0f} "
                    f"(shortfall: ₹{shortfall:,.0f})"
                ),
                "due_in_days": debit["days_until_due"],
                "consequences": consequences,
                "interventions": _rank_interventions(shortfall, closing, persona),
            })

    if chains:
        logger.info(
            "Causal chain reasoner found %d risk(s) for user %d",
            len(chains), user_id,
        )

        # Record in temporal memory
        for chain in chains:
            event = TemporalMemoryEvent(
                user_id=user_id,
                event_type="causal_risk_detected",
                description=chain["trigger"],
                impact_score=min(10, 3 + chain["due_in_days"] * -0.3 + 5),
            )
            db.add(event)
        db.commit()

    return chains
