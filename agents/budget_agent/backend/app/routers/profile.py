from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.models.database import get_db
from app.models.schemas import User, UserProfile
from app.services.auth_service import get_current_user

router = APIRouter()

class ProfileUpdateReq(BaseModel):
    age: int
    monthly_income: float
    monthly_expenses: float
    monthly_emi: float
    current_savings: float
    has_health_insurance: bool
    target_retirement_age: int
    risk_tolerance: str
    is_couple: bool = False
    partner_age: Optional[int] = None
    partner_income: Optional[float] = None

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
    
    db.commit()
    db.refresh(profile)
    return profile
