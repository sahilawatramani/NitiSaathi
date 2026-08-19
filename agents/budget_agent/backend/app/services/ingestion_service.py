import pandas as pd
from typing import List
from app.schemas.transaction import TransactionCreate

def parse_csv_transactions(file_path: str) -> List[TransactionCreate]:
    """
    Parses a CSV file containing transactions flexibly based on column names.
    """
    try:
        df = pd.read_csv(file_path)
        # Normalize columns for easier matching
        df.columns = [str(col).strip().lower().replace(' ', '_').replace('(', '').replace(')', '') for col in df.columns]
        
        transactions = []
        
        # Identify mapping
        amt_col = next((c for c in df.columns if 'amount' in c or 'inr' in c), None)
        date_col = next((c for c in df.columns if 'date' in c or 'time' in c), None)
        merchant_col = next((c for c in df.columns if 'merchant' in c or 'party' in c or 'name' in c), None)
        desc_col = next((c for c in df.columns if 'desc' in c or 'category' in c or 'type' in c), None)
        
        for _, row in df.iterrows():
            amount = float(row.get(amt_col, 0)) if amt_col else 0.0
            if amount < 0:
                amount = abs(amount)
                
            merchant = str(row.get(merchant_col, 'Unknown')).strip() if merchant_col else "Unknown"
            desc = str(row.get(desc_col, '')).strip() if desc_col else "No description"
            
            # Use merchant as desc if desc is empty
            if not desc or desc == 'nan':
                 desc = merchant
            if merchant == "Unknown" and desc != "No description":
                 merchant = desc

            date_val = row.get(date_col)
            try:
                dt = pd.to_datetime(date_val) if pd.notna(date_val) else pd.Timestamp.now()
            except:
                dt = pd.Timestamp.now()
                
            transaction = TransactionCreate(
                amount=amount,
                merchant=merchant,
                description=desc,
                date=dt
            )
            transactions.append(transaction)
            
        return transactions
    except Exception as e:
        print(f"Error parsing CSV: {e}")
        return []
