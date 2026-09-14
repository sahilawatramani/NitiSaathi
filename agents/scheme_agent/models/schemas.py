"""
Pydantic schemas for Scheme Agent
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date


class UserProfile(BaseModel):
    """
    User profile fields needed for scheme eligibility.
    All fields have robust defaults to prevent 422 errors on partial profiles.
    """
    user_id: str = "guest_user"
    age: Optional[int] = Field(28, description="User age in years")
    epfo_esic_status: Optional[bool] = Field(False, description="True if registered with EPFO or ESIC")
    income_tax_payer: Optional[bool] = Field(False, description="True if pays income tax")
    days_active_with_aggregator: Optional[int] = Field(90, description="Days active with platform(s)")
    e_shram_registered: Optional[bool] = Field(False, description="True if registered on e-Shram portal")
    monthly_income: Optional[float] = Field(25000.0, description="Monthly income in INR")
    state: Optional[str] = Field(None, description="State of residence for state welfare boards")
    savings_bank_account: Optional[bool] = Field(True, description="Has savings bank account")
    aadhaar_linked: Optional[bool] = Field(True, description="Bank account linked to Aadhaar")
    language: Optional[str] = Field("en", description="Preferred language code (en, hi, mr)")


class BudgetAgentState(BaseModel):
    """Budget Agent state for joint reasoning on affordability"""
    income_wma_4w: Optional[float] = Field(0.0, description="4-week weighted moving average income")
    income_volatility_pct: Optional[float] = Field(0.0, description="Coefficient of variation (0.0-1.0)")
    savings_rate_recommendation: Optional[float] = Field(0.05, description="Recommended savings rate (0.05/0.10/0.20)")
    closing_balance: Optional[float] = Field(0.0, description="Current balance in INR")
    financial_persona: Optional[str] = Field("moderate", description="conservative | moderate | growth")


class SchemeCategory(BaseModel):
    """Welfare Section / Category Taxonomy"""
    id: str
    name: str
    description: str
    icon: Optional[str] = "Shield"
    scheme_count: Optional[int] = 0


class SchemeSearchRequest(BaseModel):
    """Search & Filter Request Payload"""
    user_profile: Optional[UserProfile] = None
    budget_state: Optional[BudgetAgentState] = None
    selected_categories: Optional[List[str]] = Field(None, description="Categories to filter by")
    keywords: Optional[List[str]] = Field(None, description="Keywords to match")
    query: Optional[str] = Field(None, description="Free-text search term")
    language: Optional[str] = Field("en", description="Language preference")


class EligibilityResult(BaseModel):
    """Result of eligibility check for a single scheme"""
    scheme_code: str
    scheme_name: str
    category: Optional[str] = "insurance_healthcare"
    eligible: bool
    eligibility_status: str = Field(description="eligible | not_eligible | conditional")
    match_score_pct: int = Field(100, description="Computed match percentage (0-100)")
    reasons: List[str] = Field(description="List of eligibility reasons or blocking factors")
    official_portal_url: Optional[str] = Field(None, description="Verified official government portal link")
    last_verified: Optional[date] = Field(None, description="Date when scheme info was last verified")
    data_freshness: Optional[str] = Field("✓ Verified", description="Human-readable freshness indicator")
    
    # Conditional & Affordability fields
    pending_requirements: Optional[List[str]] = Field(None, description="What user needs to do to become eligible")
    contribution_required: Optional[float] = Field(None, description="Monthly/annual contribution in INR")
    affordable: Optional[bool] = Field(None, description="Can user afford based on Budget Agent state")
    affordability_reasoning: Optional[str] = Field(None, description="Explanation of affordability check")
    
    # Elaboration enrichment
    required_documents: Optional[List[str]] = Field(None, description="List of required documents")
    step_by_step_process: Optional[List[str]] = Field(None, description="Steps to apply")
    keywords: Optional[List[str]] = Field(None, description="Matching keywords")


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


class SchemeElaboration(BaseModel):
    """Deep personalized scheme dossier for a specific gig worker"""
    scheme_code: str
    scheme_name: str
    category: str
    ministry: str
    official_portal_url: str
    eligible: bool
    eligibility_status: str
    match_score_pct: int
    reasons: List[str]
    benefits: List[str]
    required_documents: List[Dict[str, Any]]
    step_by_step_process: List[str]
    contribution_required: Optional[float] = None
    contribution_frequency: Optional[str] = None
    affordability_analysis: Optional[AffordabilityAnalysis] = None
    data_freshness: str
    target_group: Optional[str] = None
    notes: Optional[str] = None
    language: str = "en"


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
    categories_available: Optional[List[SchemeCategory]] = None


class SchemeUpdateCheck(BaseModel):
    """Result of automated scheme data freshness check"""
    check_timestamp: str
    schemes_checked: int
    stale_schemes: List[Dict[str, Any]] = Field(description="Schemes with data older than threshold")
    all_fresh: bool
    next_check_due: Optional[str] = None
    recommendation: str
