from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime, date
from typing import Optional

class TransactionBase(BaseModel):
    amount: float
    merchant: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None

class TransactionCreate(BaseModel):
    """Schema for manually creating a transaction from mobile app."""
    amount: float
    description: str
    category: Optional[str] = None
    direction: str  # 'credit' or 'debit'
    merchant_name: Optional[str] = None
    transaction_date: date

class TransactionResponse(TransactionBase):
    id: int
    user_id: Optional[int] = None
    category: Optional[str] = None
    confidence_score: Optional[float] = None
    is_tax_deductible: bool
    tax_category: Optional[str] = None
    direction: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
