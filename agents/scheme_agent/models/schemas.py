"""
Pydantic schemas for Scheme Agent
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import date


class UserProfile(BaseModel):
    """User profile fields needed for scheme eligibility"""
    user_id: str
    age: int
    epfo_esic_status: bool = Field(description="True if registered with EPFO or ESIC")
    income_tax_payer: bool = Field(description="True if pays income tax")
    days_active_with_aggregator: int = Field(description="Days active with platform(s)")
    e_shram_registered: bool = Field(description="True if registered on e-Shram portal")
    monthly_income: Optional[float] = Field(None, description="Monthly income in INR")
    state: Optional[str] = Field(None, description="State of residence for state welfare boards")
    savings_bank_account: bool = Field(True, description="Has savings bank account")
    aadhaar_linked: bool = Field(True, description="Bank account linked to Aadhaar")


class BudgetAgentState(BaseModel):
    """Budget Agent state for joint reasoning on affordability"""
    income_wma_4w: float = Field(description="4-week weighted moving average income")
    income_volatility_pct: float = Field(description="Coefficient of variation (0.0-1.0)")
    savings_rate_recommendation: float = Field(description="Recommended savings rate (0.05/0.10/0.20)")
    closing_balance: float = Field(description="Current balance in INR")
    financial_persona: str = Field(description="conservative | moderate | growth")


class EligibilityResult(BaseModel):
    """Result of eligibility check for a single scheme"""
    scheme_code: str
    scheme_name: str
    eligible: bool
    eligibility_status: str = Field(description="eligible | not_eligible | conditional")
    reasons: List[str] = Field(description="List of eligibility reasons or blocking factors")
    last_verified: date = Field(description="Date when scheme info was last verified")
    data_freshness: str = Field(description="Human-readable freshness indicator")
    
    # Conditional eligibility fields
    pending_requirements: Optional[List[str]] = Field(None, description="What user needs to do to become eligible")
    
    # Affordability fields (if eligible)
    contribution_required: Optional[float] = Field(None, description="Monthly/annual contribution in INR")
    affordable: Optional[bool] = Field(None, description="Can user afford based on Budget Agent state")
    affordability_reasoning: Optional[str] = Field(None, description="Explanation of affordability check")


class SchemeRecommendation(BaseModel):
    """Comprehensive scheme recommendation for user"""
    user_id: str
    timestamp: str
    gig_worker_status: str = Field(description="eligible | not_eligible | pending")
    gig_worker_days_threshold: str = Field(description="Status under Code on Social Security 2020")
    
    eligible_schemes: List[EligibilityResult]
    ineligible_schemes: List[EligibilityResult]
    conditional_schemes: List[EligibilityResult]
    
    priority_recommendations: List[str] = Field(description="Ordered list of schemes to enroll in")
    joint_reasoning_summary: Optional[str] = Field(None, description="Summary of Budget Agent affordability analysis")


class AffordabilityAnalysis(BaseModel):
    """Detailed affordability analysis for a scheme"""
    scheme_code: str
    scheme_name: str
    contribution_required: float
    contribution_frequency: str  # "monthly" | "annual"
    
    # User financial state
    monthly_income_estimate: float
    savings_rate: float
    available_savings_per_month: float
    
    # Affordability decision
    affordable: bool
    margin: float = Field(description="Difference between available savings and required contribution")
    confidence: str = Field(description="high | medium | low based on income volatility")
    
    # Recommendations
    recommendation: str
    stability_requirement: Optional[str] = Field(None, description="E.g., 'Wait 4 stable weeks before enrollment'")
    risk_factors: List[str] = Field(description="Risks if user enrolls now")


class SchemeUpdateCheck(BaseModel):
    """Result of automated scheme data freshness check"""
    check_timestamp: str
    schemes_checked: int
    stale_schemes: List[Dict[str, str]] = Field(description="Schemes with data older than threshold")
    all_fresh: bool
    next_check_due: str
