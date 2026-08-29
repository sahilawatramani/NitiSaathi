from pydantic import BaseModel
from typing import Optional


class DailyInsightResponse(BaseModel):
    """Premium daily insights payload — the user's financial pulse."""

    # Core WMA metrics
    income_wma_4w: Optional[float] = None
    income_volatility_pct: Optional[float] = None
    savings_rate_recommendation: Optional[float] = None
    low_balance_flag: bool = False
    closing_balance: Optional[float] = None

    # Premium: Safe to Spend
    safe_to_spend_today: Optional[float] = None

    # Gamification
    current_savings_streak: int = 0
    highest_savings_streak: int = 0
    financial_persona: str = "moderate"

    # Proactive nudges (list of human-readable suggestions)
    nudges: list[str] = []

    # Upcoming debit alerts from Smart Radar
    upcoming_debit_alerts: list[dict] = []


class GoalProgressItem(BaseModel):
    goal: str
    target: float
    saved: float
    pct: float
