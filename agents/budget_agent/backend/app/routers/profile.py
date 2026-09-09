from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.models.database import get_db
from app.models.schemas import User, UserProfile
from app.services.auth_service import get_current_user

router = APIRouter()

class ProfileUpdateReq(BaseModel):
    age: int = 28
    monthly_income: float = 0.0
    monthly_expenses: float = 0.0
    monthly_emi: float = 0.0
    current_savings: float = 0.0
    has_health_insurance: bool = False
    target_retirement_age: int = 60
    risk_tolerance: str = "moderate"
    is_couple: bool = False
    partner_age: Optional[int] = None
    partner_income: Optional[float] = None
    epfo_esic_status: bool = False
    income_tax_payer: bool = False
    e_shram_registered: bool = False
    days_active_with_aggregator: Optional[int] = None
    state: Optional[str] = None
    savings_bank_account: bool = True
    aadhaar_linked: bool = True
    language_pref: str = "hi"
    literacy_level: str = "medium"

class ProfileResponse(ProfileUpdateReq):
    id: int
    user_id: int

@router.get("/", response_model=Optional[ProfileResponse])
def get_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get the user's financial profile."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        return None
    return profile

@router.post("/", response_model=ProfileResponse)
def upsert_profile(
    req: ProfileUpdateReq,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create or update the user's financial profile (Onboarding)."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        
    profile.age = req.age
    profile.monthly_income = req.monthly_income
    profile.monthly_expenses = req.monthly_expenses
    profile.monthly_emi = req.monthly_emi
    profile.current_savings = req.current_savings
    profile.has_health_insurance = req.has_health_insurance
    profile.target_retirement_age = req.target_retirement_age
    profile.risk_tolerance = req.risk_tolerance
    profile.is_couple = req.is_couple
    profile.partner_age = req.partner_age
    profile.partner_income = req.partner_income
    profile.epfo_esic_status = req.epfo_esic_status
    profile.income_tax_payer = req.income_tax_payer
    profile.e_shram_registered = req.e_shram_registered
    profile.days_active_with_aggregator = req.days_active_with_aggregator
    profile.state = req.state
    profile.savings_bank_account = req.savings_bank_account
    profile.aadhaar_linked = req.aadhaar_linked
    profile.language_pref = req.language_pref
    profile.literacy_level = req.literacy_level
    
    db.commit()
    db.refresh(profile)
    return profile
