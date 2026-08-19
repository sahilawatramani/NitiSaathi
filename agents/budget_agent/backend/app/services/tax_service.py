"""
Tax Intelligence Service — Generates comprehensive tax reports,
regime comparisons (Old vs New), and optimization suggestions for Indian users.
"""
from typing import List, Dict
from openai import OpenAI
from app.config import OPENAI_API_KEY

client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# FY 2024-25 Indian Income Tax Slabs
OLD_REGIME_SLABS = [
    (250000, 0.00),
    (500000, 0.05),
    (1000000, 0.20),
    (float('inf'), 0.30),
]

NEW_REGIME_SLABS = [
    (300000, 0.00),
    (700000, 0.05),
    (1000000, 0.10),
    (1200000, 0.15),
    (1500000, 0.20),
    (float('inf'), 0.30),
]

# Section-wise deduction limits (Old Regime)
SECTION_LIMITS = {
    "Section 80C": 150000,
    "Section 80C / 80D": 150000,
    "Section 80C / 80E": 150000,
    "Section 80C / 80CCD": 150000,
    "Section 80D": 25000,       # Self+family (50000 for senior citizens)
    "Section 80CCD(1B)": 50000,
    "Section 80E": float('inf'),  # No limit, 8 years max
    "Section 80G": float('inf'),  # Varies by institution
    "Section 24(b)": 200000,
    "Section 24(b) / 80E": 200000,
    "Section 10(13A) / 80GG": float('inf'),  # Formula-based
    "Standard Deduction": 50000,
}


def _calculate_tax(income: float, slabs: list) -> float:
    """Calculate tax based on slab rates."""
    tax = 0
    prev_limit = 0
    for limit, rate in slabs:
        if income <= prev_limit:
            break
        taxable = min(income, limit) - prev_limit
        tax += taxable * rate
        prev_limit = limit
    return round(tax, 2)


def generate_tax_report(transactions: List[dict], annual_income: float = 0) -> Dict:
    """
    Generate a comprehensive tax report from classified transactions.
    
    Args:
        transactions: List of transaction dicts with is_tax_deductible, tax_category, amount
        annual_income: User's gross annual income (optional, for regime comparison)
    """
    
    # --- Section-wise deduction breakdown ---
    section_breakdown = {}
    total_deductions = 0
    
    deductible_txns = [t for t in transactions if t.get("is_tax_deductible")]
    
    for txn in deductible_txns:
        section = txn.get("tax_category", "Uncategorized")
        amount = float(txn.get("amount", 0))
        
        if section not in section_breakdown:
            limit = SECTION_LIMITS.get(section, 0)
            section_breakdown[section] = {
                "total_spent": 0,
                "claimable": 0,
                "limit": limit if limit != float('inf') else "No upper limit",
                "transactions": [],
                "count": 0,
            }
        
        section_breakdown[section]["total_spent"] = round(
            section_breakdown[section]["total_spent"] + amount, 2
        )
        section_breakdown[section]["count"] += 1
        section_breakdown[section]["transactions"].append({
            "merchant": txn.get("merchant", "Unknown"),
            "amount": amount,
            "date": txn.get("date", ""),
        })
    
    # Calculate claimable amounts (capped at section limits)
    for section, data in section_breakdown.items():
        limit = SECTION_LIMITS.get(section, 0)
        if limit == float('inf'):
            data["claimable"] = data["total_spent"]
        else:
            data["claimable"] = round(min(data["total_spent"], limit), 2)
        total_deductions += data["claimable"]
    
    # Always include standard deduction for salaried
    if "Standard Deduction" not in section_breakdown and annual_income > 0:
        section_breakdown["Standard Deduction"] = {
            "total_spent": 50000,
            "claimable": 50000,
            "limit": 50000,
            "transactions": [],
            "count": 0,
        }
        total_deductions += 50000
    
    total_deductions = round(total_deductions, 2)
    
    # --- Regime comparison ---
    regime_comparison = None
    if annual_income > 0:
        taxable_old = max(0, annual_income - total_deductions)
        taxable_new = max(0, annual_income - 50000)  # New regime only allows standard deduction
        
        tax_old = _calculate_tax(taxable_old, OLD_REGIME_SLABS)
        tax_new = _calculate_tax(taxable_new, NEW_REGIME_SLABS)
        
        savings = round(abs(tax_old - tax_new), 2)
        
        regime_comparison = {
            "old_regime": {
                "gross_income": annual_income,
                "total_deductions": total_deductions,
                "taxable_income": taxable_old,
                "tax_payable": tax_old,
            },
            "new_regime": {
                "gross_income": annual_income,
                "total_deductions": 50000,  # Only standard deduction
                "taxable_income": taxable_new,
                "tax_payable": tax_new,
            },
            "recommended": "Old Regime" if tax_old <= tax_new else "New Regime",
            "savings": savings,
            "explanation": f"You save ₹{savings:,.0f} by choosing {'Old' if tax_old <= tax_new else 'New'} Regime"
        }
    
    # --- Optimization suggestions ---
    suggestions = _generate_optimization_suggestions(section_breakdown, annual_income)
    
    # --- Summary ---
    non_deductible = [t for t in transactions if not t.get("is_tax_deductible")]
    
    return {
        "report_summary": {
            "total_transactions": len(transactions),
            "deductible_transactions": len(deductible_txns),
            "non_deductible_transactions": len(non_deductible),
            "total_deductions_claimed": total_deductions,
            "total_spending": round(sum(float(t.get("amount", 0)) for t in transactions), 2),
        },
        "section_breakdown": section_breakdown,
        "regime_comparison": regime_comparison,
        "optimization_suggestions": suggestions,
    }


def _generate_optimization_suggestions(section_breakdown: dict, annual_income: float) -> List[dict]:
    """Generate actionable tax optimization suggestions."""
    suggestions = []
    
    # Check 80C utilization
    sec_80c_keys = [k for k in section_breakdown if "80C" in k and "80CCD" not in k]
    total_80c = sum(section_breakdown[k]["total_spent"] for k in sec_80c_keys)
    
    if total_80c < 150000:
        gap = 150000 - total_80c
        suggestions.append({
            "priority": "HIGH",
            "section": "Section 80C",
            "message": f"You have ₹{gap:,.0f} unused in Section 80C (limit: ₹1.5L). Consider investing in PPF, ELSS, or NSC before March 31.",
            "potential_saving": round(gap * 0.3, 2),  # Assuming 30% tax bracket
        })
    
    # Check 80D (health insurance)
    if "Section 80D" not in section_breakdown:
        suggestions.append({
            "priority": "HIGH",
            "section": "Section 80D",
            "message": "No health insurance deductions found. A family health policy (₹25,000) can save up to ₹7,500 in taxes.",
            "potential_saving": 7500,
        })
    
    # Check NPS (80CCD)
    nps_keys = [k for k in section_breakdown if "80CCD" in k]
    if not nps_keys:
        suggestions.append({
            "priority": "MEDIUM",
            "section": "Section 80CCD(1B)",
            "message": "Consider NPS investment for an additional ₹50,000 deduction over and above Section 80C.",
            "potential_saving": 15000,
        })
    
    # Check home loan
    home_keys = [k for k in section_breakdown if "24(b)" in k]
    if home_keys:
        total_home = sum(section_breakdown[k]["total_spent"] for k in home_keys)
        if total_home < 200000:
            gap = 200000 - total_home
            suggestions.append({
                "priority": "LOW",
                "section": "Section 24(b)",
                "message": f"Home loan interest deduction has ₹{gap:,.0f} unused from the ₹2L limit.",
                "potential_saving": round(gap * 0.3, 2),
            })
    
    # General tip if income is provided
    if annual_income > 0 and annual_income <= 500000:
        suggestions.append({
            "priority": "INFO",
            "section": "Section 87A",
            "message": "With income up to ₹5L, you may be eligible for full tax rebate under Section 87A (zero tax payable).",
            "potential_saving": 0,
        })
    
    return suggestions


def generate_ai_tax_summary(transactions: List[dict], annual_income: float = 0) -> str:
    """Use LLM to generate a human-readable tax summary with advice."""
    report = generate_tax_report(transactions, annual_income)
    
    if not client:
        # Fallback: return formatted text summary
        lines = ["📊 **FinAssist Tax Intelligence Report**\n"]
        lines.append(f"Total Transactions Analyzed: {report['report_summary']['total_transactions']}")
        lines.append(f"Tax-Deductible Transactions: {report['report_summary']['deductible_transactions']}")
        lines.append(f"Total Deductions: ₹{report['report_summary']['total_deductions_claimed']:,.0f}\n")
        
        if report['regime_comparison']:
            rc = report['regime_comparison']
            lines.append(f"**Recommended: {rc['recommended']}** — {rc['explanation']}")
        
        if report['optimization_suggestions']:
            lines.append("\n**Optimization Tips:**")
            for s in report['optimization_suggestions']:
                lines.append(f"- [{s['priority']}] {s['message']}")
        
        return "\n".join(lines)
    
    prompt = f"""You are FinAssist Tax AI. Generate a clear, actionable tax summary for an Indian taxpayer.

Tax Report Data:
{report}

Instructions:
- Summarize in plain English/Hindi
- Highlight the recommended tax regime and why
- List specific actionable steps to save more tax
- Reference exact section numbers
- Keep it concise (under 300 words)"""

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert Indian tax advisor AI."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error generating AI summary: {str(e)}"
