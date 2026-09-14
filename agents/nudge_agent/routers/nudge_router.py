"""
FastAPI router for Nudge Agent endpoints.
"""
import os
import uuid
import logging
from typing import List, Optional
import pandas as pd
from fastapi import APIRouter, HTTPException, Query, Path

from ..models.schemas import NudgeOut, FeedbackIn, NudgeEvaluationIn, NudgeEvaluationOut
from ..services.trigger_registry import run_all_checks
from ..services.message_service import simplify_message
from ..services.suppression_service import record_feedback, is_suppressed
from ..services.nudge_storage_service import (
    save_nudges_batch,
    get_nudges_by_user,
    get_all_nudges,
    get_outcome_analytics_summary,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/nudges", tags=["Nudge Agent"])


@router.post("/evaluate", response_model=NudgeEvaluationOut)
async def evaluate_user_state(request: NudgeEvaluationIn) -> NudgeEvaluationOut:
    """Evaluate one user's current state without scanning the whole CSV.

    This is the orchestration-facing endpoint.  `/run-check` remains useful
    for dataset evaluation, while this endpoint makes the Nudge Agent a true
    independently deployable microservice for real-time chat and schedules.
    """
    candidates = []
    if request.nudge_trigger_low_balance_before_debit:
        candidates.append((
            "low_balance_before_debit",
            f"Your PMSBY ₹20 debit is due in {int(request.days_to_next_pmsby_debit or 0)} days. "
            f"Your balance is ₹{request.closing_balance:,.0f}; set aside ₹20 from your next payout.",
        ))
    elif request.low_balance_flag:
        candidates.append((
            "low_balance",
            f"Your balance is ₹{request.closing_balance:,.0f}, which is low for your usual income. "
            "Pause non-essential spending until the next payout.",
        ))
    if request.pmsby_debit_due_soon and not request.nudge_trigger_low_balance_before_debit:
        candidates.append(("pmsby_debit_due", "Your PMSBY debit is due soon. Please keep at least ₹20 in your bank account."))
    if request.missed_goal:
        candidates.append(("missed_goal", "Your savings goal is behind plan. A small amount from the next payout can help restart it."))
    if request.high_volatility_streak:
        candidates.append(("high_volatility_streak", "Your income has been changing a lot recently. Keep this week's savings target small and avoid new auto-debits."))

    nudges, suppressed = [], []
    for trigger_id, raw_message in candidates:
        if is_suppressed(request.user_id, trigger_id):
            suppressed.append(trigger_id)
            continue
        nudges.append(NudgeOut(
            id=str(uuid.uuid4()),
            user_id=request.user_id,
            trigger_id=trigger_id,
            message=simplify_message(raw_message, literacy_level="medium", language_pref=request.language_pref),
            status="pending",
        ))
    
    # Persist evaluated nudges
    if nudges:
        save_nudges_batch(nudges)
        
    return NudgeEvaluationOut(nudges=nudges, suppressed_trigger_ids=suppressed)


@router.get("/", response_model=List[NudgeOut])
async def list_all_nudges(limit: int = Query(50, ge=1, le=200)):
    """List recent nudges across all users."""
    return get_all_nudges(limit=limit)


@router.get("/{user_id}/list", response_model=List[NudgeOut])
@router.get("/list/{user_id}", response_model=List[NudgeOut])
async def list_user_nudges(
    user_id: str = Path(..., description="User ID to retrieve nudges for"),
    limit: int = Query(50, ge=1, le=200)
):
    """Retrieve stored nudges for a specific user."""
    return get_nudges_by_user(user_id=user_id, limit=limit)


@router.get("/run-check", response_model=List[NudgeOut])
async def run_check():
    """
    Run all checks for all users found in features.csv,
    simplify the message using the Literacy Agent, and return the list of nudges.
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.normpath(
        os.path.join(current_dir, "..", "..", "..", "data_pipeline", "data", "features.csv")
    )
    
    if not os.path.exists(csv_path):
        raise HTTPException(
            status_code=404, 
            detail=f"features.csv not found at {csv_path}. Please run the data pipeline first."
        )
    
    try:
        df = pd.read_csv(csv_path)
        user_ids = df["user_id"].dropna().unique().tolist()
    except Exception as e:
        logger.error(f"Error loading features.csv: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load user list: {e}")
        
    raw_nudges = run_all_checks(user_ids)
    
    nudges = []
    for nudge in raw_nudges:
        user_id = nudge["user_id"]
        try:
            user_rows = df[df["user_id"] == user_id]
            if not user_rows.empty:
                latest_idx = user_rows["week_start"].idxmax()
                lit_level = user_rows.loc[latest_idx].get("literacy_level", "medium")
                if pd.isna(lit_level):
                    lit_level = "medium"
            else:
                lit_level = "medium"
        except Exception:
            lit_level = "medium"
            
        simplified_message = simplify_message(nudge["raw_message"], literacy_level=lit_level)
        
        nudges.append(NudgeOut(
            id=str(uuid.uuid4()),
            user_id=user_id,
            trigger_id=nudge["trigger_id"],
            message=simplified_message,
            status="pending"
        ))
    
    if nudges:
        save_nudges_batch(nudges)
        
    return nudges


@router.post("/{nudge_id}/feedback")
async def post_nudge_feedback_by_id(nudge_id: str, feedback: FeedbackIn):
    """Record feedback for a specific nudge ID."""
    try:
        record_feedback(feedback.user_id, feedback.trigger_id, feedback.rating)
        return {
            "status": "success",
            "nudge_id": nudge_id,
            "message": f"Recorded '{feedback.rating}' feedback for {feedback.user_id}/{feedback.trigger_id}"
        }
    except Exception as e:
        logger.error(f"Error recording feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/feedback")
async def post_feedback(feedback: FeedbackIn):
    """
    Accept feedback on a nudge to suppress/prioritize future nudges.
    """
    try:
        record_feedback(feedback.user_id, feedback.trigger_id, feedback.rating)
        return {
            "status": "success", 
            "message": f"Recorded '{feedback.rating}' feedback for {feedback.user_id}/{feedback.trigger_id}"
        }
    except Exception as e:
        logger.error(f"Error recording feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Autonomous Scheduler & Outcome Evaluation Endpoints ─────────────────────

from ..models.schemas import SchedulerStatusOut, NudgeOutcomeRecord
from ..services.scheduler_service import nudge_scheduler


@router.get("/scheduler/status", response_model=SchedulerStatusOut)
async def get_scheduler_status():
    """Get status of the proactive autonomous nudge background scheduler."""
    return nudge_scheduler.get_status()


@router.post("/scheduler/start", response_model=SchedulerStatusOut)
async def start_scheduler():
    """Start the autonomous background scheduler."""
    await nudge_scheduler.start()
    return nudge_scheduler.get_status()


@router.post("/scheduler/stop", response_model=SchedulerStatusOut)
async def stop_scheduler():
    """Stop the autonomous background scheduler."""
    await nudge_scheduler.stop()
    return nudge_scheduler.get_status()


@router.post("/outcomes/evaluate-now", response_model=List[NudgeOutcomeRecord])
async def evaluate_outcomes_now(force_all: bool = Query(True, description="Force evaluation of pending outcome checkpoints")):
    """Run immediate evaluation of post-intervention outcome checkpoints."""
    return await nudge_scheduler.evaluate_due_outcomes(force_all=force_all)


@router.get("/outcomes/analytics")
async def get_outcomes_analytics():
    """Retrieve statistical summary of nudge effectiveness and outcome rates."""
    return get_outcome_analytics_summary()

