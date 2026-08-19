import pandas as pd
import numpy as np

def forecast_spending(transactions: list) -> dict:
    """Uses basic time-series forecasting to predict next month's spending."""
    if len(transactions) < 10:
        return {"forecast": "Not enough data for forecasting."}
        
    try:
        import statsmodels.api as sm
        df = pd.DataFrame(transactions)
        df['date'] = pd.to_datetime(df['date']).dt.to_period('M')
        monthly = df.groupby('date')['amount'].sum()
        
        if len(monthly) < 3:
            return {"forecast": "Need at least 3 months of data."}
            
        model = sm.tsa.ExponentialSmoothing(monthly.values, trend='add').fit()
        forecast = model.forecast(1)
        next_month_val = float(forecast[0])
        return {"next_month_prediction": next_month_val}
    except Exception as e:
        return {"error": str(e)}

def detect_anomalies(transactions: list) -> list:
    """Detects transactions that are significantly higher than average."""
    if not transactions:
        return []
    
    df = pd.DataFrame(transactions)
    if 'amount' not in df.columns:
        return []
        
    mean = df['amount'].mean()
    std = df['amount'].std()
    
    anomalies = df[df['amount'] > mean + 2 * std]
    return anomalies.to_dict('records')
