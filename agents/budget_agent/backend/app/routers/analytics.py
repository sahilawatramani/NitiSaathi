from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.models.database import get_db
from app.models.schemas import Transaction, User
from app.services.auth_service import get_current_user
from app.agents.insight_agent import analyze_spending_trends
from app.services.forecast_service import forecast_spending, compare_periods, calculate_savings_potential
from app.services.planner_service import calculate_health_score
from app.models.schemas import UserProfile

router = APIRouter()

def _get_txn_dicts(db, current_user):
    """Helper to fetch and convert user transactions to dicts."""
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    return transactions, [
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

@router.get("/")
def get_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get comprehensive spending analytics for the current user."""
    transactions, txn_dicts = _get_txn_dicts(db, current_user)
    
    analytics = analyze_spending_trends(txn_dicts)
    
    # Add tax summary
    tax_deductible = [t for t in transactions if t.is_tax_deductible]
    tax_summary = {
        "total_deductible_amount": round(sum(t.amount for t in tax_deductible), 2),
        "deductible_count": len(tax_deductible),
        "total_transactions": len(transactions),
        "deduction_sections": {}
    }
    
    for t in tax_deductible:
        section = t.tax_category or "Uncategorized"
        if section not in tax_summary["deduction_sections"]:
            tax_summary["deduction_sections"][section] = {"total": 0, "count": 0}
        tax_summary["deduction_sections"][section]["total"] = round(
            tax_summary["deduction_sections"][section]["total"] + t.amount, 2
        )
        tax_summary["deduction_sections"][section]["count"] += 1
    
    analytics["tax_summary"] = tax_summary
    
    # Add new hackathon feature: Health Score and FIRE Plan
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if profile:
        planner_data = calculate_health_score(profile, transactions)
        analytics["health_score"] = planner_data
    else:
        analytics["health_score"] = None
        
    return analytics

@router.get("/forecast")
def get_forecast(
    months: int = Query(default=3, ge=1, le=12, description="Number of months to forecast"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Predict future spending using weighted moving average with trend analysis."""
    _, txn_dicts = _get_txn_dicts(db, current_user)
    return forecast_spending(txn_dicts, months)

@router.get("/compare")
def get_comparison(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Compare spending between current vs previous month/quarter with category drill-down."""
    _, txn_dicts = _get_txn_dicts(db, current_user)
    return compare_periods(txn_dicts)

@router.get("/savings")
def get_savings_potential(
    monthly_income: float = Query(default=0, description="Monthly take-home income for savings rate calculation"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Analyze spending patterns and identify potential savings with actionable tips."""
    _, txn_dicts = _get_txn_dicts(db, current_user)
    return calculate_savings_potential(txn_dicts, monthly_income)

