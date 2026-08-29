"""
State Bridge Service — Provides the exact data dictionary expected by
the NitisaathiState LangGraph schema from live DB data.

Used by the system-wide LangGraph orchestrator to hydrate its state
node before running the financial planning subgraph.
"""
from __future__ import annotations

import logging
from datetime import date, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.schemas import (
    RecurringDebit,
    TemporalMemoryEvent,
    Transaction,
    UserGoal,
    UserProfile,
    UserWeeklyFeatures,
)
from app.services.temporal_memory_service import get_memory_summary
from app.services.wma_service import (
    compute_full_budget_state,
    compute_income_wma_4w,
    compute_volatility,
    get_upcoming_mandatory_debits,
    get_weekly_incomes,
    savings_rate_recommendation,
)

logger = logging.getLogger(__name__)


def get_finassist_data(user_id: int, db: Session) -> Dict[str, Any]:
    """Return the complete financial data dictionary for a user.

    This dictionary matches the NitisaathiState TypedDict expected by the
    LangGraph orchestrator.  Call this once per graph invocation to
    hydrate the initial state node.

    Keys returned
    -------------
    user_id, financial_persona, current_savings_streak, highest_savings_streak,
    income_wma_4w, income_volatility_pct, savings_rate_recommendation,
    low_balance_flag, closing_balance, safe_to_spend_today,
    upcoming_mandatory_debits, active_goals, recent_transactions,
    recurring_debits, temporal_memory_summary, nudges,
    weekly_features_last4 (raw cache rows for advanced nodes)
    """
    # ── 1. Core budget state (computed metrics) ───────────────────────────
    budget_state = compute_full_budget_state(user_id, db)

    # ── 2. Profile ────────────────────────────────────────────────────────
    profile: Optional[UserProfile] = (
        db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    )

    # ── 3. Active goals ───────────────────────────────────────────────────
    goals = (
        db.query(UserGoal)
        .filter(UserGoal.user_id == user_id, UserGoal.is_active == True)
        .all()
    )
    active_goals: List[Dict[str, Any]] = [
        {
            "id": g.id,
            "name": g.name,
            "target_amount": g.target_amount,
            "saved_amount": g.saved_amount,
            "category": g.category,
            "target_date": str(g.target_date) if g.target_date else None,
            "progress_pct": round(
                min(g.saved_amount / g.target_amount * 100, 100.0), 2
            ) if g.target_amount > 0 else 0.0,
        }
        for g in goals
    ]

    # ── 4. Recent transactions (last 30 days) ─────────────────────────────
    cutoff = date.today() - timedelta(days=30)
    recent_txns = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == user_id,
            Transaction.date >= cutoff,
        )
        .order_by(desc(Transaction.date))
        .limit(50)
        .all()
    )
    recent_transactions: List[Dict[str, Any]] = [
        {
            "id": t.id,
            "date": str(t.date),
            "amount": t.amount,
            "direction": t.direction,
            "merchant": t.merchant,
            "category": t.category,
            "is_tax_deductible": t.is_tax_deductible,
        }
        for t in recent_txns
    ]

    # ── 5. Recurring debits ───────────────────────────────────────────────
    debits = (
        db.query(RecurringDebit)
        .filter(RecurringDebit.user_id == user_id, RecurringDebit.is_active == True)
        .all()
    )
    recurring_debits: List[Dict[str, Any]] = [
        {
            "name": d.name,
            "amount": d.amount,
            "category": d.category,
            "frequency": d.frequency,
            "due_day_of_month": d.due_day_of_month,
            "next_due_date": str(d.next_due_date) if d.next_due_date else None,
        }
        for d in debits
    ]

    # ── 6. Temporal memory summary ────────────────────────────────────────
    memory_summary = get_memory_summary(user_id=user_id, db=db, top_n=5)

    # ── 7. Raw weekly features (last 4 weeks) for advanced LangGraph nodes ─
    raw_weeks = (
        db.query(UserWeeklyFeatures)
        .filter(UserWeeklyFeatures.user_id == user_id)
        .order_by(desc(UserWeeklyFeatures.week_start))
        .limit(4)
        .all()
    )
    weekly_features_last4: List[Dict[str, Any]] = [
        {
            "week_start": str(w.week_start),
            "total_income": w.total_income,
            "total_expense": w.total_expense,
            "closing_balance": w.closing_balance,
            "savings_rate_actual": w.savings_rate_actual,
            "low_balance_flag": w.low_balance_flag,
            "had_informal_borrowing": w.had_informal_borrowing,
            "financial_persona": w.financial_persona,
        }
        for w in raw_weeks
    ]

    # ── 8. Assemble NitisaathiState dict ──────────────────────────────────
    return {
        "user_id": user_id,
        # Profile
        "financial_persona": budget_state["financial_persona"],
        "current_savings_streak": budget_state["current_savings_streak"],
        "highest_savings_streak": budget_state["highest_savings_streak"],
        # WMA engine outputs
        "income_wma_4w": budget_state["income_wma_4w"],
        "income_volatility_pct": budget_state["income_volatility_pct"],
        "savings_rate_recommendation": budget_state["savings_rate_recommendation"],
        # Balance & spend signals
        "low_balance_flag": budget_state["low_balance_flag"],
        "closing_balance": budget_state["closing_balance"],
        "safe_to_spend_today": budget_state["safe_to_spend_today"],
        # Upcoming debit radar
        "upcoming_mandatory_debits": budget_state["upcoming_debit_alerts"],
        # Proactive nudges
        "nudges": budget_state["nudges"],
        # Structured data for downstream nodes
        "active_goals": active_goals,
        "recent_transactions": recent_transactions,
        "recurring_debits": recurring_debits,
        "temporal_memory_summary": memory_summary,
        "weekly_features_last4": weekly_features_last4,
    }
