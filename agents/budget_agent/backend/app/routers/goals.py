"""
Goals Router — CRUD endpoints for user saving goals.
"""
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.models.database import get_db
from app.models.schemas import User, UserGoal
from app.schemas.goal import GoalAddSavings, GoalCreate, GoalResponse, GoalUpdate
from app.services.auth_service import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


def _to_response(goal: UserGoal) -> dict:
    """Convert a UserGoal ORM object to a response dict with progress_pct."""
    pct = (goal.saved_amount / goal.target_amount * 100) if goal.target_amount > 0 else 0.0
    return GoalResponse(
        id=goal.id,
        user_id=goal.user_id,
        name=goal.name,
        target_amount=goal.target_amount,
        saved_amount=goal.saved_amount,
        category=goal.category,
        target_date=goal.target_date,
        is_active=goal.is_active,
        progress_pct=round(min(pct, 100.0), 2),
        created_at=goal.created_at,
        updated_at=goal.updated_at,
    )


@router.post("/", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(
    payload: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new saving goal."""
    goal = UserGoal(
        user_id=current_user.id,
        name=payload.name,
        target_amount=payload.target_amount,
        category=payload.category,
        target_date=payload.target_date,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    logger.info("Goal created: %s (user=%s)", goal.name, current_user.email)
    return _to_response(goal)


@router.get("/", response_model=List[GoalResponse])
def list_goals(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all goals for the current user."""
    query = db.query(UserGoal).filter(UserGoal.user_id == current_user.id)
    if active_only:
        query = query.filter(UserGoal.is_active == True)
    goals = query.order_by(UserGoal.created_at.desc()).all()
    return [_to_response(g) for g in goals]


@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: int,
    payload: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update goal details (name, target, dates, status)."""
    goal = (
        db.query(UserGoal)
        .filter(UserGoal.id == goal_id, UserGoal.user_id == current_user.id)
        .first()
    )
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(goal, field, value)
    db.commit()
    db.refresh(goal)
    return _to_response(goal)


@router.post("/{goal_id}/add-savings", response_model=GoalResponse)
def add_savings_to_goal(
    goal_id: int,
    payload: GoalAddSavings,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add savings to a goal — incremental update."""
    goal = (
        db.query(UserGoal)
        .filter(UserGoal.id == goal_id, UserGoal.user_id == current_user.id)
        .first()
    )
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    if not goal.is_active:
        raise HTTPException(status_code=400, detail="Goal is archived")
    goal.saved_amount = round(goal.saved_amount + payload.amount, 2)
    # Auto-mark achieved
    if goal.saved_amount >= goal.target_amount:
        goal.is_active = False
    db.commit()
    db.refresh(goal)
    logger.info(
        "Added ₹%.2f to goal '%s' (user=%s, progress=%.1f%%)",
        payload.amount, goal.name, current_user.email,
        goal.saved_amount / goal.target_amount * 100,
    )
    return _to_response(goal)


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft-delete (archive) a goal."""
    goal = (
        db.query(UserGoal)
        .filter(UserGoal.id == goal_id, UserGoal.user_id == current_user.id)
        .first()
    )
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    goal.is_active = False
    db.commit()
