"""Nudge feedback and management endpoints at the gateway level."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.schemas import User, NudgeLog, UserNotification
from app.services.auth_service import get_current_user

router = APIRouter()

class FeedbackRequest(BaseModel):
    rating: str  # 'useful' | 'not_useful' | 'harmful'

@router.post('/{nudge_id}/feedback')
def post_nudge_feedback(nudge_id: str, request: FeedbackRequest, db=Depends(get_db), current_user=Depends(get_current_user)):
    log = db.query(NudgeLog).filter_by(user_id=current_user.id, external_nudge_id=nudge_id).first()
    if not log:
        # Try by notification
        raise HTTPException(404, 'Nudge not found')
    log.feedback = request.rating
    db.commit()
    return {'status': 'ok', 'nudge_id': nudge_id, 'rating': request.rating}

@router.get('/')
def list_nudges(db=Depends(get_db), current_user=Depends(get_current_user)):
    """List recent nudge logs for the current user."""
    logs = db.query(NudgeLog).filter_by(user_id=current_user.id).order_by(NudgeLog.created_at.desc()).limit(20).all()
    return logs
