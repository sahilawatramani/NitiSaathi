from typing import List, Dict, Any
from app.models.schemas import UserProfile, Transaction
import math

# Industry standard assumptions
INFLATION_RATE = 0.06
EQUITY_RETURN_RATE = 0.12 # Moderate profile
DEBT_RETURN_RATE = 0.07

def _get_return_rate(risk_tolerance: str) -> float:
    if risk_tolerance == "high":
        return 0.14
    elif risk_tolerance == "low":
        return 0.08
    return 0.10 # moderate

def calculate_fire_plan(profile: UserProfile) -> Dict[str, Any]:
    """Calculate the Financial Independence, Retire Early (FIRE) metrics."""
    annual_expenses = profile.monthly_expenses * 12
    # Standard FIRE rule: 25x annual expenses
    fire_number = annual_expenses * 25 
    
    years_to_retire = max(1, profile.target_retirement_age - profile.age)
    
    # Adjust FIRE number for inflation
    inflation_adjusted_fire_number = fire_number * ((1 + INFLATION_RATE) ** years_to_retire)
    
    # Monthly investment capacity (Combined for couples)
    total_income = profile.monthly_income
    if profile.is_couple and profile.partner_income:
        total_income += profile.partner_income
        
    monthly_investment = max(0, total_income - profile.monthly_expenses - profile.monthly_emi)
    
    # Calculate projected corpus
    expected_return = _get_return_rate(profile.risk_tolerance)
    monthly_rate = expected_return / 12
    months = years_to_retire * 12
    
    # Future value of current savings
    fv_current = profile.current_savings * ((1 + expected_return) ** years_to_retire)
    
    # Future value of monthly SIP
    if monthly_rate > 0 and months > 0:
        fv_sip = monthly_investment * (((1 + monthly_rate) ** months - 1) / monthly_rate) * (1 + monthly_rate)
    else:
        fv_sip = monthly_investment * months
        
    projected_corpus = fv_current + fv_sip
    
    # Calculate Required SIP to hit target
    shortfall = inflation_adjusted_fire_number - fv_current
    required_sip = 0
    if shortfall > 0 and monthly_rate > 0 and months > 0:
        required_sip = shortfall / ((((1 + monthly_rate) ** months - 1) / monthly_rate) * (1 + monthly_rate))
    
    is_on_track = projected_corpus >= inflation_adjusted_fire_number

    return {
        "fire_number_today": round(fire_number, 2),
        "fire_number_adjusted": round(inflation_adjusted_fire_number, 2),
        "projected_corpus": round(projected_corpus, 2),
        "current_monthly_investment": round(monthly_investment, 2),
        "required_monthly_sip": round(max(0, required_sip), 2),
        "years_to_retire": years_to_retire,
        "is_on_track": is_on_track,
        "gap_amount": round(max(0, inflation_adjusted_fire_number - projected_corpus), 2),
        "is_couple_plan": profile.is_couple
    }


def calculate_health_score(profile: UserProfile, transactions: List[Transaction]) -> Dict[str, Any]:
    """Calculate the 6-dimension Money Health Score."""
    
    scores = {}
    insights = []
    
    # 1. Emergency Preparedness
    # Target: 6 months of living expenses (expenses + EMI)
    monthly_burn = profile.monthly_expenses + profile.monthly_emi
    target_emergency_fund = monthly_burn * 6
    emergency_ratio = profile.current_savings / target_emergency_fund if target_emergency_fund > 0 else 1
    scores['emergency'] = min(100, int(emergency_ratio * 100))
    
    if scores['emergency'] < 100:
        insights.append(f"Move ₹{int(target_emergency_fund - profile.current_savings):,} into a Liquid Mutual Fund or FD for emergencies.")

    # 2. Insurance Coverage
    # Check if they have health insurance
    scores['insurance'] = 100 if profile.has_health_insurance else 0
    if not profile.has_health_insurance:
        insights.append("High risk! Get a comprehensive health insurance policy of at least ₹10L cover immediately.")

    # 3. Debt Health
    # Target: EMI should be < 30% of income
    total_income = profile.monthly_income
    if profile.is_couple and profile.partner_income:
        total_income += profile.partner_income
        
    if total_income > 0:
        emi_ratio = profile.monthly_emi / total_income
        if emi_ratio == 0:
            scores['debt'] = 100
        elif emi_ratio <= 0.3:
            scores['debt'] = int(100 - (emi_ratio / 0.3) * 20)  # 80-100 range
        else:
            scores['debt'] = max(0, int(80 - ((emi_ratio - 0.3) / 0.3) * 80))
            insights.append("Your EMI is >30% of your income. Focus on paying off high-interest loans before investing heavily.")
    else:
        scores['debt'] = 0

    # 4. Investment Diversification (Proxy: Savings Rate)
    # Target: Save 20% of income
    if total_income > 0:
        savings_rate = (total_income - profile.monthly_expenses - profile.monthly_emi) / total_income
        scores['investments'] = max(0, min(100, int((savings_rate / 0.20) * 100)))
        if savings_rate < 0.20:
            insights.append(f"Try to increase your savings rate from {int(savings_rate*100)}% to 20%.")
    else:
        scores['investments'] = 0

    # 5. Tax Efficiency
    # Analyze transactions to see tax deductions claimed (Max limit ~1.5L for 80C as proxy)
    tax_deductible_spent = sum(t.amount for t in transactions if t.is_tax_deductible)
    tax_target = 150000
    scores['tax'] = min(100, int((tax_deductible_spent / tax_target) * 100))
    if scores['tax'] < 100:
        insights.append(f"You have ₹{int(tax_target - tax_deductible_spent):,} of unused 80C limit. Consider ELSS or PPF to save tax.")

    # 6. Retirement Readiness
    fire_plan = calculate_fire_plan(profile)
    readiness_ratio = fire_plan['projected_corpus'] / fire_plan['fire_number_adjusted'] if fire_plan['fire_number_adjusted'] > 0 else 0
    scores['retirement'] = min(100, int(readiness_ratio * 100))
    
    if fire_plan['required_monthly_sip'] > fire_plan['current_monthly_investment']:
        insights.append(f"You need a monthly SIP of ₹{int(fire_plan['required_monthly_sip']):,} to retire at {profile.target_retirement_age}. Start indexing now.")

    # Couple's Strategy Injection (High explainability)
    if profile.is_couple:
        higher_earner = "your partner" if (profile.partner_income or 0) > profile.monthly_income else "you"
        insights.append(f"👫 **Couple's Tax Strategy**: Since {higher_earner} is the higher earner, ensure {higher_earner} claims the bulk of the HRA and Home Loan interest deductions to maximize your joint tax savings.")
        insights.append(f"👫 **Joint Health Cover**: Consider upgrading to a 1 Crore floater health insurance policy instead of two separate individual policies. It's cheaper and offers better coverage.")

    overall_score = sum(scores.values()) // 6
    
    return {
        "overall_score": overall_score,
        "dimensions": scores,
        "actionable_insights": insights,
        "fire_plan": fire_plan
    }
