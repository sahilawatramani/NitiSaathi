from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class TransactionBase(BaseModel):
    amount: float
    merchant: str
    description: Optional[str] = None
    date: Optional[datetime] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionResponse(TransactionBase):
    id: int
    user_id: Optional[int] = None
    category: Optional[str] = None
    confidence_score: Optional[float] = None
    is_tax_deductible: bool
    tax_category: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
