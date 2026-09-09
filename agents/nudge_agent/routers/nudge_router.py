"""
FastAPI router for Nudge Agent endpoints.
"""
import os
import uuid
import logging
from typing import List
import pandas as pd
from fastapi import APIRouter, HTTPException

from ..models.schemas import NudgeOut, FeedbackIn, NudgeEvaluationIn, NudgeEvaluationOut
from ..services.trigger_registry import run_all_checks
from ..services.message_service import simplify_message
from ..services.suppression_service import record_feedback

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
    return NudgeEvaluationOut(nudges=nudges, suppressed_trigger_ids=suppressed)

@router.get("/run-check", response_model=List[NudgeOut])
async def run_check():
    """
    Run all checks for all users found in features.csv,
    simplify the message using the Literacy Agent, and return the list of nudges.
    """
    # 1. Resolve features.csv path
    current_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.normpath(
        os.path.join(current_dir, "..", "..", "..", "data_pipeline", "data", "features.csv")
    )
    
    if not os.path.exists(csv_path):
        raise HTTPException(
            status_code=404, 
            detail=f"features.csv not found at {csv_path}. Please run the data pipeline first."
        )
    
    # 2. Extract unique user_ids and their literacy levels
    try:
        df = pd.read_csv(csv_path)
        user_ids = df["user_id"].dropna().unique().tolist()
    except Exception as e:
        logger.error(f"Error loading features.csv: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load user list: {e}")
        
    # 3. Run all triggers
    raw_nudges = run_all_checks(user_ids)
    
    # 4. Simplify messages and convert to NudgeOut schema
    nudges = []
    for nudge in raw_nudges:
        user_id = nudge["user_id"]
        
        # Determine the user's specific literacy level (defaulting to "medium")
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
        
    return nudges

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
