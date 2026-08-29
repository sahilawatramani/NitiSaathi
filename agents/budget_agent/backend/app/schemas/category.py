from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class CategoryCreate(BaseModel):
    name: str
    direction: str = "debit"  # credit / debit
    icon: Optional[str] = None
    color: Optional[str] = None


class CategoryResponse(BaseModel):
    id: int
    user_id: int
    name: str
    direction: str
    icon: Optional[str] = None
    color: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
