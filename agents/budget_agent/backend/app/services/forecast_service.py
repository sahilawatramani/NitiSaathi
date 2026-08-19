"""
Forecasting Service — Spending predictions, comparative analytics,
savings goal tracking, and AI-powered financial insights.
"""
import pandas as pd
import numpy as np
from typing import List, Dict, Optional


def forecast_spending(transactions: List[dict], months_ahead: int = 3) -> Dict:
    """
    Predict future spending using weighted moving average on monthly totals.
    """
    if not transactions:
        return {"forecast": [], "methodology": "No data available"}
    
    df = pd.DataFrame(transactions)
    df['date'] = pd.to_datetime(df['date'], errors='coerce')
    df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
    df = df.dropna(subset=['date', 'amount'])
    
    if df.empty:
        return {"forecast": [], "methodology": "No valid data"}
    
    # Monthly aggregation
    df['month'] = df['date'].dt.to_period('M')
    monthly = df.groupby('month')['amount'].sum().sort_index()
    
    if len(monthly) < 2:
        avg = float(monthly.mean())
        return {
            "forecast": [{"month": f"Month +{i+1}", "predicted_spend": round(avg, 2)} for i in range(months_ahead)],
            "methodology": "Simple average (insufficient data for trend analysis)",
            "avg_monthly_spend": round(avg, 2)
        }
    
    # Weighted moving average (recent months weigh more)
    values = monthly.values.astype(float)
    n = len(values)
    weights = np.arange(1, n + 1, dtype=float)
    weights = weights / weights.sum()
    weighted_avg = float(np.dot(values, weights))
    
    # Trend detection (simple linear regression)
    x = np.arange(n)
    slope = float(np.polyfit(x, values, 1)[0])
    trend = "increasing" if slope > 0 else "decreasing" if slope < 0 else "stable"
    trend_pct = round(abs(slope) / weighted_avg * 100, 1) if weighted_avg > 0 else 0
    
    # Generate forecasts
    forecasts = []
    last_period = monthly.index[-1]
    for i in range(months_ahead):
        predicted = weighted_avg + slope * (i + 1)
        predicted = max(0, predicted)  # No negative spending
        future_month = last_period + (i + 1)
        forecasts.append({
            "month": str(future_month),
            "predicted_spend": round(predicted, 2)
        })
    
    # Category-level forecast
    category_forecast = {}
    if 'category' in df.columns:
        for cat in df['category'].unique():
            cat_monthly = df[df['category'] == cat].groupby('month')['amount'].sum()
            if len(cat_monthly) >= 2:
                cat_vals = cat_monthly.values.astype(float)
                cat_avg = float(cat_vals.mean())
                category_forecast[cat] = round(cat_avg, 2)
            elif len(cat_monthly) == 1:
                category_forecast[cat] = round(float(cat_monthly.values[0]), 2)
    
    return {
        "forecast": forecasts,
        "methodology": "Weighted moving average with linear trend",
        "trend": trend,
        "trend_change_pct": trend_pct,
        "avg_monthly_spend": round(weighted_avg, 2),
        "monthly_slope": round(slope, 2),
        "category_forecast": category_forecast,
    }


def compare_periods(transactions: List[dict]) -> Dict:
    """
    Compare spending between the current month vs previous month,
    and current quarter vs previous quarter.
    """
    if not transactions:
        return {"monthly_comparison": None, "quarterly_comparison": None}
    
    df = pd.DataFrame(transactions)
    df['date'] = pd.to_datetime(df['date'], errors='coerce')
    df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
    df = df.dropna(subset=['date', 'amount'])
    
    if df.empty:
        return {"monthly_comparison": None, "quarterly_comparison": None}
    
    df['month'] = df['date'].dt.to_period('M')
    df['quarter'] = df['date'].dt.to_period('Q')
    
    # Monthly comparison
    monthly = df.groupby('month')['amount'].sum().sort_index()
    monthly_comparison = None
    if len(monthly) >= 2:
        current = float(monthly.iloc[-1])
        previous = float(monthly.iloc[-2])
        change = round(((current - previous) / previous * 100), 1) if previous > 0 else 0
        monthly_comparison = {
            "current_month": str(monthly.index[-1]),
            "current_spend": round(current, 2),
            "previous_month": str(monthly.index[-2]),
            "previous_spend": round(previous, 2),
            "change_pct": change,
            "direction": "up" if change > 0 else "down" if change < 0 else "same"
        }
    
    # Quarterly comparison
    quarterly = df.groupby('quarter')['amount'].sum().sort_index()
    quarterly_comparison = None
    if len(quarterly) >= 2:
        current = float(quarterly.iloc[-1])
        previous = float(quarterly.iloc[-2])
        change = round(((current - previous) / previous * 100), 1) if previous > 0 else 0
        quarterly_comparison = {
            "current_quarter": str(quarterly.index[-1]),
            "current_spend": round(current, 2),
            "previous_quarter": str(quarterly.index[-2]),
            "previous_spend": round(previous, 2),
            "change_pct": change,
            "direction": "up" if change > 0 else "down" if change < 0 else "same"
        }
    
    # Category-level monthly comparison
    category_changes = {}
    if 'category' in df.columns and len(monthly) >= 2:
        curr_month = monthly.index[-1]
        prev_month = monthly.index[-2]
        
        for cat in df['category'].unique():
            cat_df = df[df['category'] == cat]
            curr = float(cat_df[cat_df['month'] == curr_month]['amount'].sum())
            prev = float(cat_df[cat_df['month'] == prev_month]['amount'].sum())
            
            if prev > 0 or curr > 0:
                change = round(((curr - prev) / prev * 100), 1) if prev > 0 else 100.0
                category_changes[cat] = {
                    "current": round(curr, 2),
                    "previous": round(prev, 2),
                    "change_pct": change,
                }
    
    return {
        "monthly_comparison": monthly_comparison,
        "quarterly_comparison": quarterly_comparison,
        "category_changes": category_changes
    }


def calculate_savings_potential(transactions: List[dict], income: float = 0) -> Dict:
    """
    Analyze spending patterns and identify potential savings.
    """
    if not transactions:
        return {"potential_savings": 0, "tips": []}
    
    df = pd.DataFrame(transactions)
    df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
    df = df.dropna(subset=['amount'])
    
    total_spent = float(df['amount'].sum())
    tips = []
    potential_savings = 0
    
    if 'category' in df.columns:
        cat_totals = df.groupby('category')['amount'].sum()
        
        # Food & Dining overspending check
        if 'Food & Dining' in cat_totals.index:
            food_pct = float(cat_totals['Food & Dining'] / total_spent * 100)
            if food_pct > 20:
                excess = round(float(cat_totals['Food & Dining']) * 0.3, 2)
                tips.append({
                    "category": "Food & Dining",
                    "message": f"Food spending is {food_pct:.0f}% of total. Cooking at home 3x more per week could save ~₹{excess:,.0f}",
                    "potential_monthly_saving": excess
                })
                potential_savings += excess
        
        # Entertainment check
        if 'Entertainment' in cat_totals.index:
            ent_total = float(cat_totals['Entertainment'])
            if ent_total > 2000:
                saving = round(ent_total * 0.4, 2)
                tips.append({
                    "category": "Entertainment",
                    "message": f"Review streaming subscriptions. Sharing family plans could save ~₹{saving:,.0f}",
                    "potential_monthly_saving": saving
                })
                potential_savings += saving
        
        # Shopping impulse check
        if 'Shopping' in cat_totals.index:
            shop_total = float(cat_totals['Shopping'])
            shop_pct = shop_total / total_spent * 100
            if shop_pct > 15:
                saving = round(shop_total * 0.25, 2)
                tips.append({
                    "category": "Shopping",
                    "message": f"Shopping is {shop_pct:.0f}% of total. Use a 48-hour rule before purchases to cut impulse buys by ~₹{saving:,.0f}",
                    "potential_monthly_saving": saving
                })
                potential_savings += saving
    
    # Income-based savings check
    if income > 0:
        savings_rate = round((1 - total_spent / income) * 100, 1) if income > total_spent else 0
        ideal_rate = 20  # 50/30/20 rule
        tips.append({
            "category": "Overall",
            "message": f"Current savings rate: {savings_rate}%. Target: {ideal_rate}%. {'Great job!' if savings_rate >= ideal_rate else f'Try to save ₹{round(income * 0.2 - (income - total_spent), 0):,.0f} more.'}",
            "potential_monthly_saving": max(0, round(income * 0.2 - (income - total_spent), 2))
        })
    
    return {
        "total_spent": round(total_spent, 2),
        "potential_monthly_savings": round(potential_savings, 2),
        "potential_annual_savings": round(potential_savings * 12, 2),
        "tips": tips,
    }
