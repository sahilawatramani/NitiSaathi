"""
Pydantic schemas for the Nudge Agent
"""
from datetime import datetime
from typing import Literal, Optional
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


class NudgeEvaluationIn(BaseModel):
    """Minimal, scoped Budget-Agent state used for one proactive check.

    Keeping this contract small is intentional: the Nudge service must not
    receive raw transactions or eligibility/profile data (DPDP minimisation).
    """

    user_id: str
    closing_balance: float = 0.0
    low_balance_flag: bool = False
    pmsby_debit_due_soon: bool = False
    days_to_next_pmsby_debit: Optional[float] = None
    nudge_trigger_low_balance_before_debit: bool = False
    missed_goal: bool = False
    high_volatility_streak: bool = False
    language_pref: Literal["hi", "en", "mr"] = "en"


class NudgeEvaluationOut(BaseModel):
    nudges: list[NudgeOut] = Field(default_factory=list)
    suppressed_trigger_ids: list[str] = Field(default_factory=list)
