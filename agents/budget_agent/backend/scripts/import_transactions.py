#!/usr/bin/env python3
"""Seed the SQLite DB with transactions from the data pipeline CSV.

Usage:
    cd agents/budget_agent/backend
    python scripts/import_transactions.py [--limit 1000]
"""
import sys, os, argparse, json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from passlib.context import CryptContext
import pandas as pd
from datetime import datetime

from app.models.database import SessionLocal, engine, Base
from app.models.schemas import User, Transaction

# Create tables if needed
Base.metadata.create_all(bind=engine)

TRANSACTIONS_CSV = os.path.normpath(os.path.join(os.path.dirname(__file__), '../../../../data_pipeline/data/transactions.csv'))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, default=None, help='Max rows to seed')
    args = parser.parse_args()
    
    # First call seed_weekly_features logic to ensure users exist
    print("Running seed_weekly_features to ensure users exist...")
    try:
        import seed_weekly_features
        # Patch sys.argv temporarily if needed or just call main
        sys.argv = ['seed_weekly_features.py']
        if args.limit:
            sys.argv.extend(['--limit', str(args.limit)])
        seed_weekly_features.main()
    except Exception as e:
        print(f"Error running seed_weekly_features: {e}")
        
    print(f'Loading transactions from {TRANSACTIONS_CSV}...')
    if not os.path.exists(TRANSACTIONS_CSV):
        print(f"Error: {TRANSACTIONS_CSV} not found.")
        return
        
    df = pd.read_csv(TRANSACTIONS_CSV)
    if args.limit:
        df = df.head(args.limit)
    print(f'Loaded {len(df)} rows')
    
    db = SessionLocal()
    try:
        # First ensure we only import for existing users
        existing_users = {u.email: u.id for u in db.query(User).all()}
        
        # Pre-cache existing transaction IDs to avoid duplicates if possible
        # Or just insert everything since schema might not have unique constraint on (user_id, date, amount, merchant)
        
        txns_created = 0
        chunk = []
        CHUNK_SIZE = 1000
        
        for _, row in df.iterrows():
            uid = row.get('user_id')
            email = f'user{uid}@nitisaathi.demo'
            user_id = existing_users.get(email)
            if not user_id:
                continue # Skip if user doesn't exist
            
            try:
                dt_str = str(row['date'])
                if len(dt_str) == 10: # YYYY-MM-DD
                    dt = datetime.strptime(dt_str, '%Y-%m-%d')
                else:
                    dt = pd.to_datetime(dt_str).to_pydatetime()
            except Exception:
                dt = datetime.utcnow()
                
            txn = Transaction(
                user_id=user_id,
                date=dt,
                amount=float(row['amount']),
                direction=str(row['direction']).lower(),
                merchant=str(row.get('merchant', '')),
                description=str(row.get('description', '')),
                category=str(row.get('category', 'other'))
            )
            chunk.append(txn)
            
            if len(chunk) >= CHUNK_SIZE:
                db.bulk_save_objects(chunk)
                db.commit()
                txns_created += len(chunk)
                chunk = []
                print(f'  Progress: {txns_created} transactions inserted...')
                
        if chunk:
            db.bulk_save_objects(chunk)
            db.commit()
            txns_created += len(chunk)
            
        print(f'Done! Inserted {txns_created} transactions.')
    except Exception as e:
        db.rollback()
        print(f'Error: {e}')
        raise
    finally:
        db.close()

if __name__ == '__main__':
    main()
