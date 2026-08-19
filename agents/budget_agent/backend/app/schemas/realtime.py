from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class GatewayTransactionIn(BaseModel):
    user_email: str
    provider: str = Field(description="Source provider like paytm, gpay, bank_webhook")
    external_txn_id: str
    amount: float
    merchant: str
    description: Optional[str] = None
    txn_date: Optional[datetime] = None


class SmsTransactionIn(BaseModel):
    sms_text: str
    sender: str = Field(default="BANK-SMS")
    provider: str = Field(default="bank_sms")
    external_txn_id: Optional[str] = None
    received_at: Optional[datetime] = None


class SmsForwardIn(BaseModel):
    sms_text: str
    sender: str = Field(default="BANK-SMS")
    provider: str = Field(default="bank_sms")
    user_email: Optional[str] = None
    external_txn_id: Optional[str] = None
    received_at: Optional[datetime] = None


class PendingClassificationResponse(BaseModel):
    id: int
    provider: str
    external_txn_id: str
    amount: float
    merchant: str
    description: Optional[str] = None
    txn_date: datetime
    status: str
    suggested_categories: List[str]
    selected_category: Optional[str] = None
    confidence_score: Optional[float] = None
    reminder_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ClassifySelectionRequest(BaseModel):
    selected_category: str
    custom_category: Optional[str] = None


class NotificationResponse(BaseModel):
    id: int
    notification_type: str
    title: str
    message: str
    payload: Optional[str] = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
