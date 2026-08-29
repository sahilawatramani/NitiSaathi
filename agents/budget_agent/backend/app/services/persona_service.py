"""
Persona Service — Adaptive financial persona tracker.

Classifies users into 'conservative', 'moderate', or 'growth' states
based on their trailing 4-week behaviour. Runs as a weekly scheduled
job via APScheduler.
"""
from __future__ import annotations

import logging
from typing import List, Optional

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.schemas import UserProfile, UserWeeklyFeatures

logger = logging.getLogger(__name__)


def classify_persona(weekly_data: List[UserWeeklyFeatures]) -> str:
    """Classify financial persona from the last 4 weeks of behaviour.

    Rules:
      - growth:       avg savings_rate_actual >= 15% AND no informal borrowing
      - moderate:     avg savings_rate_actual >= 5% AND <= 1 borrow week
      - conservative: everything else (survival mode)
    """
    if not weekly_data:
        return "moderate"

    last_4 = weekly_data[-4:] if len(weekly_data) >= 4 else weekly_data

    savings_rates = []
    borrow_count = 0
    discretionary_pcts = []

    for w in last_4:
        # Compute actual savings rate if not cached
        if w.savings_rate_actual is not None:
            savings_rates.append(w.savings_rate_actual)
        elif w.total_income > 0:
            actual = (w.total_income - w.total_expense) / w.total_income
            savings_rates.append(max(actual, 0))
        else:
            savings_rates.append(0.0)

        if w.had_informal_borrowing:
            borrow_count += 1

        if w.total_expense > 0:
            disc_pct = w.exp_discretionary / w.total_expense
            discretionary_pcts.append(disc_pct)

    avg_savings = sum(savings_rates) / len(savings_rates) if savings_rates else 0.0

    if avg_savings >= 0.15 and borrow_count == 0:
        return "growth"
    elif avg_savings >= 0.05 and borrow_count <= 1:
        return "moderate"
    else:
        return "conservative"


def update_user_persona(user_id: int, db: Session) -> str:
    """Update a single user's financial persona based on recent behaviour."""
    weekly_data = (
        db.query(UserWeeklyFeatures)
        .filter(UserWeeklyFeatures.user_id == user_id)
        .order_by(desc(UserWeeklyFeatures.week_start))
        .limit(4)
        .all()
    )
    # Reverse to chronological order
    weekly_data = list(reversed(weekly_data))

    persona = classify_persona(weekly_data)

    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if profile:
        old_persona = profile.financial_persona
        profile.financial_persona = persona
        if old_persona != persona:
            logger.info(
                "Persona updated for user %d: %s → %s",
                user_id, old_persona, persona,
            )
    db.commit()
    return persona


def update_savings_streak(user_id: int, db: Session) -> dict:
    """Update the user's savings streak based on the latest week.

    Called after each transaction classification or weekly rollup.
    Returns the updated streak info.
    """
    latest = (
        db.query(UserWeeklyFeatures)
        .filter(UserWeeklyFeatures.user_id == user_id)
        .order_by(desc(UserWeeklyFeatures.week_start))
        .first()
    )
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile or not latest:
        return {"current_streak": 0, "highest_streak": 0}

    # Did the user hit their savings rate target this week?
    target_rate = latest.savings_rate_recommendation or 0.10
    actual_rate = latest.savings_rate_actual or 0.0

    if actual_rate >= target_rate:
        profile.current_savings_streak += 1
        if profile.current_savings_streak > profile.highest_savings_streak:
            profile.highest_savings_streak = profile.current_savings_streak
    else:
        profile.current_savings_streak = 0

    db.commit()
    return {
        "current_streak": profile.current_savings_streak,
        "highest_streak": profile.highest_savings_streak,
    }


def run_weekly_persona_update(db: Session) -> None:
    """Batch job: update personas for all users with recent data.

    Intended to be called from APScheduler every Sunday night.
    """
    profiles = db.query(UserProfile).all()
    updated = 0
    for profile in profiles:
        try:
            update_user_persona(profile.user_id, db)
            update_savings_streak(profile.user_id, db)
            updated += 1
        except Exception:
            logger.exception("Failed to update persona for user %d", profile.user_id)
    logger.info("Weekly persona update complete: %d users processed", updated)
