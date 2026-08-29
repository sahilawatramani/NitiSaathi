from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import Optional


class GoalCreate(BaseModel):
    name: str
    target_amount: float
    category: Optional[str] = None
    target_date: Optional[date] = None


class GoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    saved_amount: Optional[float] = None
    category: Optional[str] = None
    target_date: Optional[date] = None
    is_active: Optional[bool] = None


class GoalAddSavings(BaseModel):
    amount: float


class GoalResponse(BaseModel):
    id: int
    user_id: int
    name: str
    target_amount: float
    saved_amount: float
    category: Optional[str] = None
    target_date: Optional[date] = None
    is_active: bool
    progress_pct: float = 0.0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
