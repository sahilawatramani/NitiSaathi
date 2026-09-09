"""
Recurring Debits Router — Manage EMI, rent, and subscription radar entries.
"""
import logging
from datetime import date, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.models.database import get_db
from app.models.schemas import RecurringDebit, User
from app.services.auth_service import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


class RecurringDebitCreate(BaseModel):
    name: str
    amount: float
    category: str          # rent | loan_emi | insurance_premium | recharge | fuel | food
    frequency: str = "monthly"
    due_day_of_month: Optional[int] = None   # 1–31


class RecurringDebitUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    due_day_of_month: Optional[int] = None
    is_active: Optional[bool] = None


class RecurringDebitResponse(BaseModel):
    id: int
    name: str
    amount: float
    category: str
    frequency: str
    due_day_of_month: Optional[int]
    next_due_date: Optional[date]
    is_active: bool
    auto_detected: bool

    model_config = {"from_attributes": True}


def _compute_next_due(due_day: Optional[int]) -> Optional[date]:
    if not due_day:
        return None
    today = date.today()
    candidate = date(today.year, today.month, min(due_day, 28))
    if candidate < today:
        if today.month == 12:
            candidate = date(today.year + 1, 1, min(due_day, 28))
        else:
            candidate = date(today.year, today.month + 1, min(due_day, 28))
    return candidate


@router.get("/", response_model=List[RecurringDebitResponse])
def list_recurring_debits(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(RecurringDebit).filter(RecurringDebit.user_id == current_user.id)
    if active_only:
        q = q.filter(RecurringDebit.is_active == True)
    return q.order_by(RecurringDebit.next_due_date).all()


@router.post("/", response_model=RecurringDebitResponse, status_code=status.HTTP_201_CREATED)
def create_recurring_debit(
    payload: RecurringDebitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    debit = RecurringDebit(
        user_id=current_user.id,
        name=payload.name,
        amount=payload.amount,
        category=payload.category,
        frequency=payload.frequency,
        due_day_of_month=payload.due_day_of_month,
        next_due_date=_compute_next_due(payload.due_day_of_month),
    )
    db.add(debit)
    db.commit()
    db.refresh(debit)
    logger.info("Recurring debit created: %s ₹%.0f (user=%s)", debit.name, debit.amount, current_user.email)
    return debit


@router.put("/{debit_id}", response_model=RecurringDebitResponse)
def update_recurring_debit(
    debit_id: int,
    payload: RecurringDebitUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    debit = (
        db.query(RecurringDebit)
        .filter(RecurringDebit.id == debit_id, RecurringDebit.user_id == current_user.id)
        .first()
    )
    if not debit:
        raise HTTPException(status_code=404, detail="Recurring debit not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(debit, field, value)

    if payload.due_day_of_month is not None:
        debit.next_due_date = _compute_next_due(payload.due_day_of_month)

    db.commit()
    db.refresh(debit)
    return debit


@router.delete("/{debit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recurring_debit(
    debit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    debit = (
        db.query(RecurringDebit)
        .filter(RecurringDebit.id == debit_id, RecurringDebit.user_id == current_user.id)
        .first()
    )
    if not debit:
        raise HTTPException(status_code=404, detail="Recurring debit not found")
    debit.is_active = False
    db.commit()
