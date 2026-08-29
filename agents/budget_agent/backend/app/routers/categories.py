"""
Categories Router — CRUD for custom user-defined transaction categories.
"""
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.models.database import get_db
from app.models.schemas import User, UserCategory
from app.schemas.category import CategoryCreate, CategoryResponse
from app.services.auth_service import get_current_user
from app.services.wma_service import GIG_EXPENSE_CATEGORIES, INCOME_CATEGORIES

logger = logging.getLogger(__name__)
router = APIRouter()

# Default gig-worker categories (always returned alongside custom ones)
DEFAULT_CATEGORIES = [
    {"name": cat, "direction": "credit" if cat in INCOME_CATEGORIES else "debit"}
    for cat in sorted(INCOME_CATEGORIES | GIG_EXPENSE_CATEGORIES)
]


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a custom category for the current user."""
    # Prevent duplicates
    existing = (
        db.query(UserCategory)
        .filter(
            UserCategory.user_id == current_user.id,
            UserCategory.name == payload.name,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Category '{payload.name}' already exists",
        )

    cat = UserCategory(
        user_id=current_user.id,
        name=payload.name,
        direction=payload.direction,
        icon=payload.icon,
        color=payload.color,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    logger.info("Custom category created: %s (user=%s)", cat.name, current_user.email)
    return cat


@router.get("/")
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List default gig categories + user's custom categories."""
    custom = (
        db.query(UserCategory)
        .filter(UserCategory.user_id == current_user.id)
        .order_by(UserCategory.created_at)
        .all()
    )
    custom_dicts = [
        CategoryResponse.model_validate(c).model_dump()
        for c in custom
    ]
    return {
        "default_categories": DEFAULT_CATEGORIES,
        "custom_categories": custom_dicts,
    }


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a custom category."""
    cat = (
        db.query(UserCategory)
        .filter(
            UserCategory.id == category_id,
            UserCategory.user_id == current_user.id,
        )
        .first()
    )
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(cat)
    db.commit()
