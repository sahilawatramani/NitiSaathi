"""
FastAPI router for Nudge Agent endpoints.
"""
import os
import uuid
import logging
from datetime import datetime, timedelta
from typing import List, Optional
import pandas as pd
from fastapi import APIRouter, HTTPException, Query, Path

from ..models.schemas import (
    NudgeOut,
    FeedbackIn,
    NudgeEvaluationIn,
    NudgeEvaluationOut,
    SchedulerStatusOut,
    NudgeOutcomeRecord,
)
from ..services.trigger_registry import run_all_checks, TRIGGER_REGISTRY
from ..services.message_service import simplify_message, get_template_message
from ..services.suppression_service import record_feedback, is_suppressed
from ..services.nudge_storage_service import (
    save_nudges_batch,
    get_nudges_by_user,
    get_all_nudges,
    update_nudge_feedback,
    get_outcome_analytics_summary,
)
from ..services.scheduler_service import nudge_scheduler

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
    lang = request.language_pref or "en"
    bal_fmt = f"{request.closing_balance:,.0f}"
    days_int = int(request.days_to_next_pmsby_debit or 0)

    if request.nudge_trigger_low_balance_before_debit:
        t_data = get_template_message("low_balance_before_debit", language_pref=lang, days=days_int, balance=bal_fmt)
        candidates.append(("low_balance_before_debit", t_data))
    elif request.low_balance_flag:
        t_data = get_template_message("low_balance", language_pref=lang, balance=bal_fmt)
        candidates.append(("low_balance", t_data))

    if request.pmsby_debit_due_soon and not request.nudge_trigger_low_balance_before_debit:
        t_data = get_template_message("pmsby_debit_due", language_pref=lang)
        candidates.append(("pmsby_debit_due", t_data))

    if request.missed_goal:
        t_data = get_template_message("missed_goal", language_pref=lang)
        candidates.append(("missed_goal", t_data))

    if request.high_volatility_streak:
        t_data = get_template_message("high_volatility_streak", language_pref=lang)
        candidates.append(("high_volatility_streak", t_data))

    if request.high_emi_burden:
        t_data = get_template_message("high_emi_burden", language_pref=lang)
        candidates.append(("high_emi_burden", t_data))

    if request.savings_milestone:
        t_data = get_template_message("savings_milestone", language_pref=lang)
        candidates.append(("savings_milestone", t_data))

    nudges: List[NudgeOut] = []
    suppressed: List[str] = []

    for trigger_id, t_info in candidates:
        if is_suppressed(request.user_id, trigger_id):
            suppressed.append(trigger_id)
            continue

        raw_msg = t_info["message"]
        simplified_msg = simplify_message(
            raw_msg,
            literacy_level="medium",
            language_pref=lang,
            trigger_id=trigger_id,
            days=days_int,
            balance=bal_fmt,
        )

        nudge_obj = NudgeOut(
            id=str(uuid.uuid4()),
            user_id=request.user_id,
            trigger_id=trigger_id,
            nudge_type=trigger_id,
            title=t_info.get("title", trigger_id.replace("_", " ").title()),
            message=simplified_msg,
            priority=t_info.get("priority", "advisory"),
            action_url=t_info.get("action_url"),
            action_label=t_info.get("action_label"),
            language=lang,
            status="pending",
            created_at=datetime.utcnow(),
            outcome_check_at=datetime.utcnow() + timedelta(days=9),
            outcome_status="pending",
        )
        nudges.append(nudge_obj)

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
async def run_check(language_pref: str = Query("en", description="Preferred output language")):
    """
    Run all checkers in TRIGGER_REGISTRY for all users found in features.csv,
    simplify messages using Literacy Agent, and return the list of nudges.
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
        user_ids = [str(u) for u in df["user_id"].dropna().unique().tolist()]
    except Exception as e:
        logger.error(f"Error loading features.csv: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load user list: {e}")

    raw_nudges = run_all_checks(user_ids, language_pref=language_pref)

    nudges: List[NudgeOut] = []
    for item in raw_nudges:
        u_id = item["user_id"]
        try:
            user_rows = df[df["user_id"].astype(str) == str(u_id)]
            if not user_rows.empty:
                latest_idx = user_rows["week_start"].idxmax()
                lit_level = user_rows.loc[latest_idx].get("literacy_level", "medium")
                if pd.isna(lit_level):
                    lit_level = "medium"
            else:
                lit_level = "medium"
        except Exception:
            lit_level = "medium"

        simplified = simplify_message(
            item["raw_message"],
            literacy_level=lit_level,
            language_pref=language_pref,
            trigger_id=item["trigger_id"],
        )

        nudge_obj = NudgeOut(
            id=str(uuid.uuid4()),
            user_id=u_id,
            trigger_id=item["trigger_id"],
            nudge_type=item["trigger_id"],
            title=item.get("title", item["trigger_id"].replace("_", " ").title()),
            message=simplified,
            priority=item.get("priority", "advisory"),
            action_url=item.get("action_url"),
            action_label=item.get("action_label"),
            language=language_pref,
            status="pending",
            created_at=datetime.utcnow(),
            outcome_check_at=datetime.utcnow() + timedelta(days=9),
            outcome_status="pending",
        )
        nudges.append(nudge_obj)

    if nudges:
        save_nudges_batch(nudges)

    return nudges


@router.post("/{nudge_id}/feedback")
async def post_nudge_feedback_by_id(nudge_id: str, feedback: FeedbackIn):
    """Record feedback for a specific nudge ID."""
    try:
        record_feedback(feedback.user_id, feedback.trigger_id, feedback.rating, nudge_id=nudge_id, notes=feedback.notes)
        update_nudge_feedback(nudge_id, feedback.rating)
        return {
            "status": "success",
            "nudge_id": nudge_id,
            "message": f"Recorded '{feedback.rating}' feedback for {feedback.user_id}/{feedback.trigger_id}",
            "is_suppressed": is_suppressed(feedback.user_id, feedback.trigger_id),
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
        record_feedback(feedback.user_id, feedback.trigger_id, feedback.rating, notes=feedback.notes)
        return {
            "status": "success",
            "message": f"Recorded '{feedback.rating}' feedback for {feedback.user_id}/{feedback.trigger_id}",
            "is_suppressed": is_suppressed(feedback.user_id, feedback.trigger_id),
        }
    except Exception as e:
        logger.error(f"Error recording feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Autonomous Scheduler & Outcome Evaluation Endpoints ─────────────────────

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


@router.post("/scheduler/evaluate-now", response_model=List[NudgeOut])
async def trigger_scheduler_evaluation_now():
    """Trigger an immediate evaluation cycle across all active users."""
    return await nudge_scheduler.evaluate_all_users()


@router.post("/outcomes/evaluate-now", response_model=List[NudgeOutcomeRecord])
async def evaluate_outcomes_now(force_all: bool = Query(True, description="Force evaluation of pending outcome checkpoints")):
    """Run immediate evaluation of post-intervention outcome checkpoints."""
    return await nudge_scheduler.evaluate_due_outcomes(force_all=force_all)


@router.get("/outcomes/analytics")
async def get_outcomes_analytics():
    """Retrieve statistical summary of nudge effectiveness and outcome rates."""
    return get_outcome_analytics_summary()


@router.get("/health")
async def health_check():
    """Health check endpoint for Nudge Agent service."""
    return {
        "status": "healthy",
        "agent": "nudge_agent",
        "triggers_registered": len(TRIGGER_REGISTRY),
        "scheduler_running": nudge_scheduler._is_running,
    }
