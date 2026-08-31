"""
Pydantic schemas for the Nudge Agent
"""
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field

class NudgeOut(BaseModel):
    id: str = Field(..., description="Unique nudge identifier")
    user_id: str = Field(..., description="The ID of the user receiving the nudge")
    trigger_id: str = Field(..., description="The ID of the trigger that generated the nudge")
    message: str = Field(..., description="The simplified message content")
    status: str = Field(default="pending", description="Status of the nudge")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")

class FeedbackIn(BaseModel):
    user_id: str = Field(..., description="The ID of the user providing feedback")
    trigger_id: str = Field(..., description="The ID of the trigger the feedback is for")
    rating: Literal["useful", "not_useful", "harmful"] = Field(..., description="Feedback rating")
