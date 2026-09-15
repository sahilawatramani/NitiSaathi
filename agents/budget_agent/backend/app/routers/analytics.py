from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from app.models.database import get_db
from app.models.schemas import Transaction, User, UserProfile, MonthlyIncomeHistory
from app.services.auth_service import get_current_user
from app.agents.insight_agent import analyze_spending_trends
from app.services.forecast_service import (
    forecast_spending,
    compare_periods,
    calculate_savings_potential,
    forecast_monthly_income_and_budget_plan,
    GIG_SEASONALITY_PRIORS,
)
from app.services.planner_service import calculate_health_score
from app.services.state_bridge_service import get_finassist_data

router = APIRouter()

class IncomeHistoryItem(BaseModel):
    month: str
    income: float
    source: Optional[str] = "Primary Income"

class BudgetPlannerUpdateRequest(BaseModel):
    history: List[IncomeHistoryItem]
    current_cost: Optional[float] = 1000.0

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

@router.get("/budget-state")
def get_budget_state(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Return WMA-computed budget state from the state bridge service.
    """
    return get_finassist_data(current_user.id, db)

@router.get("/budget-planner")
def get_budget_planner(
    current_cost: float = Query(default=1000.0, description="Interactive cost for inflation projections"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the monthly income history, time-series forecast, spending guide (50/10/25/15),
    and inflation awareness analysis matching the reference video design.
    """
    records = (
        db.query(MonthlyIncomeHistory)
        .filter(MonthlyIncomeHistory.user_id == current_user.id)
        .order_by(MonthlyIncomeHistory.id.asc())
        .all()
    )
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    fallback_income = profile.monthly_income if (profile and profile.monthly_income and profile.monthly_income > 0) else 25000.0

    if not records:
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
        seed_data = [
            (m, round(fallback_income * GIG_SEASONALITY_PRIORS.get(m, 1.0), 0), "Primary Income")
            for m in months
        ]
        created_records = []
        for idx, (m, inc, src) in enumerate(seed_data):
            rec = MonthlyIncomeHistory(
                user_id=current_user.id,
                month_label=m,
                month_index=idx + 1,
                amount=inc,
                source=src,
            )
            db.add(rec)
            created_records.append({"month": m, "income": inc, "source": src})
        db.commit()
        history_dicts = created_records
    else:
        history_dicts = [
            {"month": r.month_label, "income": r.amount, "source": r.source}
            for r in records
        ]

    return forecast_monthly_income_and_budget_plan(
        history_records=history_dicts,
        user_monthly_income_fallback=fallback_income,
        current_cost_item=current_cost,
    )

@router.post("/budget-planner")
def update_budget_planner(
    payload: BudgetPlannerUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Save edited monthly income history entries and recalculate time-series forecast,
    recommended spending guide, and inflation awareness.
    """
    db.query(MonthlyIncomeHistory).filter(MonthlyIncomeHistory.user_id == current_user.id).delete()
    
    history_dicts = []
    for idx, item in enumerate(payload.history):
        rec = MonthlyIncomeHistory(
            user_id=current_user.id,
            month_label=item.month,
            month_index=idx + 1,
            amount=item.income,
            source=item.source or "Primary Income",
        )
        db.add(rec)
        history_dicts.append({
            "month": item.month,
            "income": item.income,
            "source": item.source or "Primary Income",
        })
    db.commit()

    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    fallback_income = profile.monthly_income if (profile and profile.monthly_income and profile.monthly_income > 0) else 25000.0

    return forecast_monthly_income_and_budget_plan(
        history_records=history_dicts,
        user_monthly_income_fallback=fallback_income,
        current_cost_item=payload.current_cost or 1000.0,
    )
