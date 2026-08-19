from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.models.database import get_db
from app.models.schemas import Transaction, User
from app.services.auth_service import get_current_user
from app.services.tax_service import generate_tax_report, generate_ai_tax_summary

router = APIRouter()

class TaxReportResponse(BaseModel):
    report: dict
    ai_summary: Optional[str] = None

@router.get("/report")
def get_tax_report(
    annual_income: float = Query(default=0, description="Gross annual income for regime comparison"),
    ai_summary: bool = Query(default=False, description="Include AI-generated summary"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate a comprehensive tax-ready report with deduction breakdown and regime comparison."""
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    
    txn_dicts = [
        {
            "date": str(t.date),
            "amount": t.amount,
            "merchant": t.merchant,
            "category": t.category,
            "description": t.description,
            "is_tax_deductible": t.is_tax_deductible,
            "tax_category": t.tax_category
        }
        for t in transactions
    ]
    
    report = generate_tax_report(txn_dicts, annual_income)
    
    result = {"report": report}
    
    if ai_summary:
        result["ai_summary"] = generate_ai_tax_summary(txn_dicts, annual_income)
    
    return result

@router.get("/suggestions")
def get_tax_suggestions(
    annual_income: float = Query(default=0, description="Gross annual income"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get actionable tax optimization suggestions based on current deductions."""
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    
    txn_dicts = [
        {
            "amount": t.amount,
            "is_tax_deductible": t.is_tax_deductible,
            "tax_category": t.tax_category,
            "merchant": t.merchant,
        }
        for t in transactions
    ]
    
    report = generate_tax_report(txn_dicts, annual_income)
    
    return {
        "suggestions": report["optimization_suggestions"],
        "current_deductions": report["report_summary"]["total_deductions_claimed"],
        "regime_comparison": report.get("regime_comparison"),
    }
