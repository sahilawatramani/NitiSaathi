"""DPDP consent and data-access controls."""
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.schemas import User, UserConsent
from app.services.auth_service import get_current_user

router = APIRouter()
ALLOWED_PURPOSES = {"transactions", "scheme_eligibility", "fraud_detection", "nudges", "reports", "analytics"}

class ConsentRequest(BaseModel):
    purpose: str
    granted: bool
    language: str = Field(default="en", pattern="^(hi|en|mr)$")

@router.get("/consents")
def list_consents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(UserConsent).filter_by(user_id=current_user.id).all()

@router.put("/consents")
def set_consent(request: ConsentRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if request.purpose not in ALLOWED_PURPOSES:
        raise HTTPException(400, "Unknown consent purpose")
    row = db.query(UserConsent).filter_by(user_id=current_user.id, purpose=request.purpose).first()
    if not row:
        row = UserConsent(user_id=current_user.id, purpose=request.purpose)
        db.add(row)
    row.granted, row.language = request.granted, request.language
    db.commit(); db.refresh(row)
    return row

@router.delete("/consents/{purpose}")
def withdraw_consent(purpose: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Withdraw consent for a purpose. Creates audit log entry."""
    from app.models.schemas import ConsentAuditLog
    row = db.query(UserConsent).filter_by(user_id=current_user.id, purpose=purpose).first()
    if row:
        row.granted = False
    else:
        row = UserConsent(user_id=current_user.id, purpose=purpose, granted=False)
        db.add(row)
    
    log = ConsentAuditLog(user_id=current_user.id, purpose=purpose, action="withdrawn")
    db.add(log)
    db.commit()
    
    return {"status": "withdrawn", "purpose": purpose}

@router.get("/data-export")
def export_my_data(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """DPDP data portability — returns all user data as JSON."""
    from app.models.schemas import UserProfile, Transaction, NudgeLog, UserWeeklyFeatures
    profile = db.query(UserProfile).filter_by(user_id=current_user.id).first()
    consents = db.query(UserConsent).filter_by(user_id=current_user.id).all()
    
    transaction_count = db.query(Transaction).filter_by(user_id=current_user.id).count()
    nudge_log_count = db.query(NudgeLog).filter_by(user_id=current_user.id).count()
    weekly_features_count = db.query(UserWeeklyFeatures).filter_by(user_id=current_user.id).count()
    
    profile_data = {c.name: getattr(profile, c.name) for c in profile.__table__.columns} if profile else {}
    
    return {
        'user_id': current_user.id,
        'email': current_user.email,
        'profile': profile_data,
        'consents': [{"purpose": c.purpose, "granted": c.granted} for c in consents],
        'data_summary': {'transaction_count': transaction_count, 'nudge_log_count': nudge_log_count, 'weekly_feature_records': weekly_features_count}
    }

@router.delete("/account")
def request_erasure(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Right to erasure — anonymize user data per DPDP."""
    from app.models.schemas import UserProfile
    
    current_user.email = f"deleted-{current_user.id}@nitisaathi.deleted"
    current_user.hashed_password = "*"
    
    profile = db.query(UserProfile).filter_by(user_id=current_user.id).first()
    if profile:
        profile.monthly_income = 0
        profile.monthly_expenses = 0
        profile.current_savings = 0
        profile.state = None
        
    consents = db.query(UserConsent).filter_by(user_id=current_user.id).all()
    for c in consents:
        c.granted = False
        
    db.commit()
    return {'status': 'erasure_initiated', 'message': 'Your personal data will be anonymized within 72 hours.'}
