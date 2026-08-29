"""
Insights Router — Premium daily financial pulse + causal chain risks.
"""
import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.database import get_db
from app.models.schemas import User
from app.schemas.insight import DailyInsightResponse
from app.services.auth_service import get_current_user
from app.services.causal_chain_service import run_causal_chain_reasoner
from app.services.weekly_aggregation_service import run_weekly_aggregation_for_user
from app.services.wma_service import compute_full_budget_state

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/daily", response_model=DailyInsightResponse)
def get_daily_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the user's complete financial pulse for today."""
    state = compute_full_budget_state(current_user.id, db)
    return DailyInsightResponse(**state)


@router.get("/causal-chains")
def get_causal_chains(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return causal risk chains for upcoming shortfalls.

    Each chain explains the downstream consequence cascade and
    provides ranked interventions the user can act on.
    """
    chains = run_causal_chain_reasoner(current_user.id, db)
    return {"risk_count": len(chains), "chains": chains}


@router.post("/recalculate")
def recalculate_weekly_features(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually trigger weekly feature aggregation for the current user.

    Useful right after uploading a CSV or classifying many transactions —
    recalculates WMA, safe-to-spend, and persona immediately without
    waiting for the Monday cron job.
    """
    rows = run_weekly_aggregation_for_user(current_user.id, db, weeks_back=8)
    state = compute_full_budget_state(current_user.id, db)
    return {
        "status": "recalculated",
        "weeks_aggregated": rows,
        "updated_state": state,
    }
