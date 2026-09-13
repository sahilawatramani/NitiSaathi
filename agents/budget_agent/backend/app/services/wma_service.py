"""
WMA Service — Core financial computation engine for the Nitisaathi Budget Agent.

Implements:
  - 4-week Weighted Moving Average (income-only)
  - 8-week income volatility (CV)
  - Volatility-adaptive savings rate recommendation
  - Relative low-balance flag
  - "Safe to Spend" daily metric (premium)
"""
from __future__ import annotations

import math
from datetime import date, timedelta
from typing import List, Optional

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.schemas import (
    RecurringDebit,
    Transaction,
    UserGoal,
    UserProfile,
    UserWeeklyFeatures,
)


# ─── Gig-Worker Category Constants ───────────────────────────────────────────

INCOME_CATEGORIES = {"platform_payout", "informal_borrowing"}
GIG_EXPENSE_CATEGORIES = {
    "fuel", "recharge", "food", "discretionary",
    "family_support", "insurance_premium", "loan_emi", "rent",
}
ALL_GIG_CATEGORIES = INCOME_CATEGORIES | GIG_EXPENSE_CATEGORIES

LOW_BALANCE_RATIO = 0.30   # closing_balance < 30% of WMA → flag
WMA_WEIGHTS = [1, 2, 3, 4]  # oldest → newest


# ─── Core Computational Functions ────────────────────────────────────────────

def compute_income_wma_4w(weekly_incomes: List[float]) -> float:
    """4-week Weighted Moving Average on income credits.

    Weights: [1, 2, 3, 4] — most recent week gets highest weight.
    Falls back to simple average when < 4 weeks of data.
    """
    if not weekly_incomes:
        return 0.0
    if len(weekly_incomes) < 4:
        return round(sum(weekly_incomes) / len(weekly_incomes), 2)

    last_4 = weekly_incomes[-4:]
    wma = sum(w * v for w, v in zip(WMA_WEIGHTS, last_4)) / sum(WMA_WEIGHTS)
    return round(wma, 2)


def compute_volatility(weekly_incomes: List[float], window: int = 8) -> float:
    """Coefficient of variation (σ / μ) over the trailing *window* weeks.

    Returns 0 when there is no data or mean income is zero.
    """
    if not weekly_incomes:
        return 0.0
    if len(weekly_incomes) < window:
        window = len(weekly_incomes)
    recent = weekly_incomes[-window:]
    mean = sum(recent) / len(recent)
    if mean <= 0:
        return 0.0
    variance = sum((x - mean) ** 2 for x in recent) / len(recent)
    std = math.sqrt(variance)
    return round(std / mean, 4)


def savings_rate_recommendation(cv: float) -> float:
    """Volatility-adaptive savings rate.

    <15% CV  → stable income  → save 20%
    15-30% CV → moderate       → save 10%
    >30% CV  → volatile       → save 5%
    """
    if cv < 0.15:
        return 0.20
    elif cv <= 0.30:
        return 0.10
    else:
        return 0.05


def compute_low_balance_flag(closing_balance: float, income_wma_4w: float) -> bool:
    """Relative low-balance detection.

    Adapts to the user's own income level rather than using a flat rupee
    threshold — a user earning ₹8k/week has a very different 'low' from
    one earning ₹32k/week.
    """
    if income_wma_4w <= 0:
        return closing_balance <= 0
    threshold = income_wma_4w * LOW_BALANCE_RATIO
    return closing_balance < threshold


def calculate_safe_to_spend(
    closing_balance: float,
    income_wma_4w: float,
    upcoming_mandatory_debits: float,
    target_savings_rate: float,
    days_remaining_in_week: int = 7,
) -> float:
    """Premium "Safe to Spend Today" metric.

    = (Predicted weekly income – mandatory debits – target savings) / days_left

    Tells the user exactly how much they can spend *today* without
    jeopardising rent, EMI, or their savings target.
    """
    target_savings = income_wma_4w * target_savings_rate
    available = income_wma_4w - upcoming_mandatory_debits - target_savings
    # If user already has surplus balance, factor that in
    available = max(available, 0) + max(closing_balance, 0)
    days = max(days_remaining_in_week, 1)
    return round(available / days, 2)


# ─── DB-Backed Helper Functions ──────────────────────────────────────────────

def get_weekly_incomes(user_id: int, db: Session, weeks: int = 8) -> List[float]:
    """Fetch the last *weeks* weekly income totals from the features cache."""
    rows = (
        db.query(UserWeeklyFeatures.total_income)
        .filter(UserWeeklyFeatures.user_id == user_id)
        .order_by(desc(UserWeeklyFeatures.week_start))
        .limit(weeks)
        .all()
    )
    # Return in chronological order (oldest → newest)
    return [r.total_income for r in reversed(rows)]


def get_upcoming_mandatory_debits(user_id: int, db: Session, days_ahead: int = 7) -> List[dict]:
    """Fetch recurring debits due within *days_ahead* days."""
    today = date.today()
    horizon = today + timedelta(days=days_ahead)
    debits = (
        db.query(RecurringDebit)
        .filter(
            RecurringDebit.user_id == user_id,
            RecurringDebit.is_active == True,
            RecurringDebit.next_due_date != None,
            RecurringDebit.next_due_date <= horizon,
        )
        .all()
    )
    return [
        {
            "name": d.name,
            "amount": d.amount,
            "category": d.category,
            "due_date": str(d.next_due_date),
            "days_until_due": (d.next_due_date - today).days,
        }
        for d in debits
    ]


def compute_full_budget_state(user_id: int, db: Session) -> dict:
    """Compute the complete budget state for a user — used by insights endpoint
    and the real-time recalculation after transaction classification.

    Returns a dictionary matching the DailyInsightResponse schema.
    """
    # 1. Weekly incomes for WMA & volatility
    weekly_incomes = get_weekly_incomes(user_id, db, weeks=8)
    wma = compute_income_wma_4w(weekly_incomes)
    cv = compute_volatility(weekly_incomes)
    rec_rate = savings_rate_recommendation(cv)

    # 2. Latest closing balance
    latest = (
        db.query(UserWeeklyFeatures)
        .filter(UserWeeklyFeatures.user_id == user_id)
        .order_by(desc(UserWeeklyFeatures.week_start))
        .first()
    )
    
    # Fallback: if no weekly features exist, compute balance from raw transactions
    if not latest:
        from sqlalchemy import func
        total_credits = (
            db.query(func.sum(Transaction.amount))
            .filter(Transaction.user_id == user_id, Transaction.direction == "credit")
            .scalar()
        ) or 0.0
        total_debits = (
            db.query(func.sum(Transaction.amount))
            .filter(Transaction.user_id == user_id, Transaction.direction == "debit")
            .scalar()
        ) or 0.0
        closing = total_credits - total_debits
    else:
        closing = latest.closing_balance
    
    low_flag = compute_low_balance_flag(closing, wma)

    # 3. Upcoming mandatory debits (7-day horizon)
    upcoming = get_upcoming_mandatory_debits(user_id, db, days_ahead=7)
    mandatory_total = sum(d["amount"] for d in upcoming)

    # Days remaining in current week (Mon=0)
    today = date.today()
    days_left = 7 - today.weekday()  # Mon→7, Sun→1

    safe = calculate_safe_to_spend(closing, wma, mandatory_total, rec_rate, days_left)

    # 4. Profile streaks & persona
    profile = (
        db.query(UserProfile)
        .filter(UserProfile.user_id == user_id)
        .first()
    )
    persona = profile.financial_persona if profile else "moderate"
    streak = profile.current_savings_streak if profile else 0
    best_streak = profile.highest_savings_streak if profile else 0

    # 5. Proactive nudges
    nudges = _generate_nudges(wma, cv, closing, rec_rate, low_flag, upcoming, latest)

    # 6. Upcoming debit alerts (3-day radar)
    debit_alerts = get_upcoming_mandatory_debits(user_id, db, days_ahead=3)
    alerts_with_warning = []
    for d in debit_alerts:
        alert = dict(d)
        alert["can_cover"] = closing >= d["amount"]
        alerts_with_warning.append(alert)

    return {
        "income_wma_4w": wma,
        "predicted_next_week_income": wma,  # Predicted income = WMA of last 4 weeks
        "income_volatility_pct": round(cv * 100, 2),
        "savings_rate_recommendation": rec_rate,
        "low_balance_flag": low_flag,
        "closing_balance": closing,
        "safe_to_spend_today": safe,
        "current_savings_streak": streak,
        "highest_savings_streak": best_streak,
        "financial_persona": persona,
        "nudges": nudges,
        "upcoming_debit_alerts": alerts_with_warning,
    }


# ─── Nudge Generation ───────────────────────────────────────────────────────

def _generate_nudges(
    wma: float,
    cv: float,
    closing: float,
    rec_rate: float,
    low_flag: bool,
    upcoming_debits: list,
    latest_features: Optional[UserWeeklyFeatures],
) -> List[str]:
    """Generate proactive, human-readable nudge strings."""
    nudges: List[str] = []

    # Low balance warning
    if low_flag:
        nudges.append(
            f"⚠️ Your balance (₹{closing:,.0f}) is below 30% of your average weekly income. "
            f"Consider pausing non-essential spending."
        )

    # Upcoming debit can't be covered
    for d in upcoming_debits:
        if closing < d["amount"]:
            nudges.append(
                f"🔴 {d['name']} (₹{d['amount']:,.0f}) is due in {d['days_until_due']} days "
                f"but your balance is only ₹{closing:,.0f}."
            )

    # Move to savings nudge (spent less than expected)
    if latest_features and wma > 0:
        actual_expense = latest_features.total_expense if latest_features else 0
        expected_spend = wma * (1 - rec_rate)
        if actual_expense < expected_spend * 0.85:
            saved_extra = round(expected_spend - actual_expense, 0)
            nudges.append(
                f"💰 You spent ₹{saved_extra:,.0f} less than expected this week! "
                f"Move it to your savings goal?"
            )

    # High volatility advisory
    if cv > 0.30:
        nudges.append(
            "📊 Your income has been volatile (>{:.0f}% variation). "
            "Keep at least 2 weeks of expenses as buffer.".format(cv * 100)
        )

    # Streak celebration
    # (will be populated from profile in the calling function if needed)

    return nudges
