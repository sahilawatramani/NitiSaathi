"""
Weekly Aggregation Service — Populates UserWeeklyFeatures from raw transactions.

This is the critical job that feeds every downstream feature:
  - WMA engine (safe-to-spend, volatility, savings rate)
  - Persona tracker
  - Savings streak
  - Causal chain reasoner
  - LangGraph state bridge

Runs automatically every Monday at 1am UTC via the scheduler.
Can also be triggered manually via POST /api/insights/recalculate.
"""
from __future__ import annotations

import logging
from datetime import date, timedelta
from typing import List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.schemas import (
    RecurringDebit,
    Transaction,
    User,
    UserProfile,
    UserWeeklyFeatures,
)
from app.services.wma_service import (
    compute_income_wma_4w,
    compute_low_balance_flag,
    compute_volatility,
    savings_rate_recommendation,
    calculate_safe_to_spend,
    get_weekly_incomes,
)
from app.utils.time import utcnow

logger = logging.getLogger(__name__)

GIG_INCOME_CATEGORIES = {"platform_payout", "informal_borrowing"}
GIG_EXPENSE_MAP = {
    "rent": "exp_rent",
    "fuel": "exp_fuel",
    "recharge": "exp_recharge",
    "food": "exp_food",
    "discretionary": "exp_discretionary",
    "family_support": "exp_family_support",
    "insurance_premium": "exp_insurance_premium",
    "loan_emi": "exp_loan_emi",
}


def _week_start(d: date) -> date:
    """Return the Monday of the week containing *d*."""
    return d - timedelta(days=d.weekday())


def aggregate_week_for_user(user_id: int, week_start: date, db: Session) -> UserWeeklyFeatures:
    """Aggregate all transactions in [week_start, week_start+6] for a user.

    Creates or updates the UserWeeklyFeatures row for that week.
    """
    week_end = week_start + timedelta(days=6)

    txns: List[Transaction] = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == user_id,
            Transaction.date >= week_start,
            Transaction.date <= week_end,
        )
        .all()
    )

    total_income = 0.0
    total_expense = 0.0
    had_informal_borrowing = False
    exp_buckets = {col: 0.0 for col in GIG_EXPENSE_MAP.values()}

    for t in txns:
        cat = (t.category or "").lower().strip()
        direction = (t.direction or "debit").lower()

        if direction == "credit" or cat in GIG_INCOME_CATEGORIES:
            total_income += t.amount
            if cat == "informal_borrowing":
                had_informal_borrowing = True
        else:
            total_expense += t.amount
            col = GIG_EXPENSE_MAP.get(cat)
            if col:
                exp_buckets[col] += t.amount

    net_cashflow = total_income - total_expense

    # Closing balance = sum of all signed transactions up to week end
    balance_rows = (
        db.query(
            func.sum(
                func.case(
                    (Transaction.direction == "credit", Transaction.amount),
                    else_=-Transaction.amount,
                )
            )
        )
        .filter(
            Transaction.user_id == user_id,
            Transaction.date <= week_end,
        )
        .scalar()
    )
    closing_balance = float(balance_rows or 0.0)

    # WMA & volatility using history up to this week
    weekly_incomes = get_weekly_incomes(user_id, db, weeks=8)
    wma = compute_income_wma_4w(weekly_incomes)
    cv = compute_volatility(weekly_incomes)
    rec_rate = savings_rate_recommendation(cv)
    low_flag = compute_low_balance_flag(closing_balance, wma)

    # Savings rate actual
    savings_rate_actual = (
        (total_income - total_expense) / total_income
        if total_income > 0
        else 0.0
    )

    # EMI burden
    emi_amount = exp_buckets["exp_loan_emi"]
    emi_burden_pct = (emi_amount / total_income * 100) if total_income > 0 else 0.0

    # PMSBY / insurance debit check (due on 1st of month)
    today = date.today()
    pmsby_due_date = date(today.year, today.month, 1)
    if today.day > 15:
        # Next month
        if today.month == 12:
            pmsby_due_date = date(today.year + 1, 1, 1)
        else:
            pmsby_due_date = date(today.year, today.month + 1, 1)
    days_to_pmsby = (pmsby_due_date - today).days
    pmsby_due_soon = days_to_pmsby <= 7

    # Safe to spend
    upcoming_debits = (
        db.query(func.sum(RecurringDebit.amount))
        .filter(
            RecurringDebit.user_id == user_id,
            RecurringDebit.is_active == True,
            RecurringDebit.next_due_date != None,
            RecurringDebit.next_due_date <= today + timedelta(days=7),
        )
        .scalar()
    ) or 0.0

    days_left = max(7 - today.weekday(), 1)
    safe_to_spend = calculate_safe_to_spend(
        closing_balance, wma, float(upcoming_debits), rec_rate, days_left
    )

    discretionary_pct = (
        exp_buckets["exp_discretionary"] / total_expense * 100
        if total_expense > 0 else 0.0
    )

    # Upsert
    row = (
        db.query(UserWeeklyFeatures)
        .filter(
            UserWeeklyFeatures.user_id == user_id,
            UserWeeklyFeatures.week_start == week_start,
        )
        .first()
    )
    if row is None:
        row = UserWeeklyFeatures(user_id=user_id, week_start=week_start)
        db.add(row)

    row.total_income = round(total_income, 2)
    row.total_expense = round(total_expense, 2)
    row.closing_balance = round(closing_balance, 2)
    row.net_cashflow = round(net_cashflow, 2)
    row.income_wma_4w = wma
    row.income_volatility_pct = round(cv * 100, 2)
    row.savings_rate_recommendation = rec_rate
    row.savings_rate_actual = round(savings_rate_actual, 4)
    row.low_balance_flag = low_flag
    row.had_informal_borrowing = had_informal_borrowing
    row.has_active_emi = emi_amount > 0
    row.monthly_emi_amount = round(emi_amount, 2)
    row.emi_burden_pct = round(emi_burden_pct, 2)
    row.days_to_next_pmsby_debit = float(days_to_pmsby)
    row.pmsby_debit_due_soon = pmsby_due_soon
    row.nudge_trigger_low_balance_before_debit = low_flag and pmsby_due_soon
    row.safe_to_spend_daily = safe_to_spend
    row.discretionary_pct = round(discretionary_pct, 2)

    for col, val in exp_buckets.items():
        setattr(row, col, round(val, 2))

    db.commit()
    db.refresh(row)
    return row


def run_weekly_aggregation_for_user(user_id: int, db: Session, weeks_back: int = 8) -> int:
    """Aggregate the last *weeks_back* weeks for a single user. Returns rows upserted.
    
    IMPORTANT: Includes the current incomplete week to ensure income forecasting works
    even when the user has transactions in the current week.
    """
    today = date.today()
    count = 0
    # Include current week (i=0) even if incomplete, plus weeks_back-1 previous complete weeks
    for i in range(weeks_back):
        target = _week_start(today - timedelta(weeks=i))
        try:
            aggregate_week_for_user(user_id, target, db)
            count += 1
        except Exception:
            logger.exception(
                "Failed to aggregate week %s for user %d", target, user_id
            )
    return count


def run_full_aggregation(db: Session) -> None:
    """Batch job: aggregate current + last 7 weeks for every user.

    Called by APScheduler every Monday at 1am UTC.
    """
    users = db.query(User.id).all()
    total = 0
    for (user_id,) in users:
        try:
            n = run_weekly_aggregation_for_user(user_id, db, weeks_back=2)
            total += n
        except Exception:
            logger.exception("Aggregation failed for user %d", user_id)
    logger.info("Weekly aggregation complete: %d rows upserted across %d users", total, len(users))
