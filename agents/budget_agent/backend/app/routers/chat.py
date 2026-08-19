from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.models.database import get_db
from app.models.schemas import Transaction, User
from app.services.auth_service import get_current_user
from app.agents.interaction_agent import handle_user_query
from app.agents.insight_agent import analyze_spending_trends
from app.models.schemas import UserProfile

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

@router.post("/", response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """RAG-powered financial chatbot endpoint."""
    
    # Add Financial Profile (Hackathon update)
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    profile_ctx = ""
    if profile:
        profile_ctx = f"""
--- USER FINANCIAL PROFILE ---
Age: {profile.age} | Target Retirement: {profile.target_retirement_age}
Monthly Income: ₹{profile.monthly_income} | Monthly Expenses: ₹{profile.monthly_expenses}
Current Savings: ₹{profile.current_savings} | EMI: ₹{profile.monthly_emi}
Has Health Insurance: {"Yes" if profile.has_health_insurance else "No"}
Risk Tolerance: {profile.risk_tolerance}
"""

    if transactions:
        txn_dicts = [
            {"date": str(t.date), "amount": t.amount, "merchant": t.merchant, "category": t.category}
            for t in transactions
        ]
        analytics = analyze_spending_trends(txn_dicts)
        summary = analytics.get("summary", {})
        context = f"""{profile_ctx}
--- SPENDING SUMMARY ---
Total Spent: ₹{summary.get('total_spent', 0)}
Transaction Count: {summary.get('transaction_count', 0)}
Top Categories: {', '.join(list(analytics.get('category_breakdown', {}).keys())[:5])}"""
    else:
        context = f"{profile_ctx}\nNo transactions uploaded yet."
    
    response = handle_user_query(request.message, context)
    return ChatResponse(response=response)
