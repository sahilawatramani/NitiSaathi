import pandas as pd
import numpy as np
from typing import List, Dict

def analyze_spending_trends(transactions: List[dict]) -> Dict:
    """Comprehensive spending analysis with trends, anomalies, and insights."""
    if not transactions:
        return {"trends": {}, "anomalies": [], "summary": {}}
        
    df = pd.DataFrame(transactions)
    
    if 'date' in df.columns and 'amount' in df.columns:
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
        df = df.dropna(subset=['date', 'amount'])
        df = df.sort_values('date')
    else:
        return {"summary": "Missing required columns", "total_spent": 0.0}
    
    total_spent = float(df['amount'].sum())
    avg_transaction = float(df['amount'].mean())
    transaction_count = len(df)
    
    # Category breakdown
    category_breakdown = {}
    if 'category' in df.columns:
        cat_group = df.groupby('category')['amount'].agg(['sum', 'count', 'mean'])
        for cat, row in cat_group.iterrows():
            category_breakdown[cat] = {
                "total": round(float(row['sum']), 2),
                "count": int(row['count']),
                "avg": round(float(row['mean']), 2),
                "percentage": round(float(row['sum'] / total_spent * 100), 1) if total_spent > 0 else 0
            }
    
    # Monthly trends
    monthly_trends = {}
    if not df.empty:
        df['month'] = df['date'].dt.to_period('M').astype(str)
        monthly = df.groupby('month')['amount'].sum()
        monthly_trends = {k: round(float(v), 2) for k, v in monthly.items()}
    
    # Top merchants
    top_merchants = {}
    if 'merchant' in df.columns:
        merch_group = df.groupby('merchant')['amount'].sum().nlargest(10)
        top_merchants = {k: round(float(v), 2) for k, v in merch_group.items()}
    
    # Anomaly detection (simple z-score)
    anomalies = []
    if len(df) > 5:
        mean_amt = df['amount'].mean()
        std_amt = df['amount'].std()
        if std_amt > 0:
            df['z_score'] = (df['amount'] - mean_amt) / std_amt
            outliers = df[df['z_score'].abs() > 2]
            for _, row in outliers.iterrows():
                anomalies.append({
                    "date": str(row['date']),
                    "merchant": row.get('merchant', 'Unknown'),
                    "amount": round(float(row['amount']), 2),
                    "z_score": round(float(row['z_score']), 2),
                    "flag": "Unusually high" if row['z_score'] > 0 else "Unusually low"
                })
    
    # Budget health score (0-100)
    health_score = 100
    if category_breakdown:
        # Penalize if any single category exceeds 40% of total spend
        for cat, data in category_breakdown.items():
            if data["percentage"] > 40 and cat not in ["Rent", "EMI & Loans", "Investment"]:
                health_score -= 15
        # Bonus for having investments/insurance
        if "Investment" in category_breakdown:
            health_score += 5
        if "Insurance" in category_breakdown:
            health_score += 5
    health_score = max(0, min(100, health_score))
    
    return {
        "summary": {
            "total_spent": round(total_spent, 2),
            "avg_transaction": round(avg_transaction, 2),
            "transaction_count": transaction_count,
            "health_score": health_score
        },
        "category_breakdown": category_breakdown,
        "monthly_trends": monthly_trends,
        "top_merchants": top_merchants,
        "anomalies": anomalies
    }

