"""Gateway-owned persistence/delivery and closed-loop outcome measurement."""
from __future__ import annotations

import json
from datetime import timedelta
from sqlalchemy.orm import Session

from app.models.schemas import NudgeLog
from app.services.notification_service import create_notification
from app.services.wma_service import compute_full_budget_state
from app.utils.time import utcnow


def record_and_deliver(db: Session, user_id: int, nudges: list[dict], state: dict) -> None:
    for nudge in nudges:
        if db.query(NudgeLog).filter_by(external_nudge_id=nudge["id"]).first():
            continue
        log = NudgeLog(external_nudge_id=nudge["id"], user_id=user_id, nudge_type=nudge["trigger_id"], message=nudge["message"], state_before=json.dumps(state, default=str), outcome_check_at=utcnow() + timedelta(days=9))
        db.add(log)
        create_notification(db, user_id, "proactive_nudge", "NitiSaathi reminder", nudge["message"], {"nudge_id": nudge["id"], "trigger_id": nudge["trigger_id"]})


def record_feedback(db: Session, user_id: int, nudge_id: str, rating: str) -> NudgeLog | None:
    log = db.query(NudgeLog).filter_by(user_id=user_id, external_nudge_id=nudge_id).first()
    if log:
        log.feedback = rating
        db.commit()
    return log


def check_due_outcomes(db: Session) -> int:
    due = db.query(NudgeLog).filter(NudgeLog.outcome_status == "pending", NudgeLog.outcome_check_at <= utcnow()).all()
    for log in due:
        before = json.loads(log.state_before)
        after = compute_full_budget_state(log.user_id, db)
        
        improved_balance = float(after.get("closing_balance", 0)) > float(before.get("closing_balance", 0))
        improved_wma = float(after.get("income_wma_4w", 0)) > float(before.get("income_wma_4w", 0))
        improved_savings = float(after.get("savings_rate_actual", 0)) > float(before.get("savings_rate_actual", 0))
        
        improved = improved_balance or improved_wma or improved_savings
        
        log.outcome_status = "improved" if improved else "not_improved"
        log.outcome_details = json.dumps({
            "balance_before": before.get("closing_balance", 0), 
            "balance_after": after.get("closing_balance", 0),
            "wma_before": before.get("income_wma_4w", 0),
            "wma_after": after.get("income_wma_4w", 0),
            "savings_before": before.get("savings_rate_actual", 0),
            "savings_after": after.get("savings_rate_actual", 0),
            "feedback": log.feedback
        })
        log.checked_at = utcnow()
    db.commit()
    return len(due)

def suppress_ineffective_types(db: Session):
    from sqlalchemy import func
    from app.models.schemas import NudgeSuppression
    
    # Query NudgeLog group by nudge_type
    stats = db.query(
        NudgeLog.nudge_type,
        func.count(NudgeLog.id).label('total'),
        func.sum(func.case((NudgeLog.feedback == 'not_useful', 1), else_=0)).label('not_useful_count')
    ).group_by(NudgeLog.nudge_type).all()
    
    for row in stats:
        if row.total > 5 and (row.not_useful_count / row.total) > 0.7:
            # check if already suppressed
            existing = db.query(NudgeSuppression).filter_by(nudge_type=row.nudge_type).first()
            if not existing:
                suppression = NudgeSuppression(
                    nudge_type=row.nudge_type,
                    reason=f"Ineffective: {(row.not_useful_count / row.total)*100:.1f}% not useful"
                )
                db.add(suppression)
    db.commit()
