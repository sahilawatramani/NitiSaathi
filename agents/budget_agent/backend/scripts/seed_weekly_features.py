#!/usr/bin/env python3
"""Seed the SQLite DB with users and weekly features from the data pipeline CSV.

Usage:
    cd agents/budget_agent/backend
    python scripts/seed_weekly_features.py [--limit 100]
"""
import sys, os, argparse, json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from passlib.context import CryptContext
import pandas as pd
from datetime import date

from app.models.database import SessionLocal, engine, Base
from app.models.schemas import User, UserProfile, UserWeeklyFeatures

# Create tables if needed
Base.metadata.create_all(bind=engine)

pwd_ctx = CryptContext(schemes=['bcrypt'], deprecated='auto')
DEMO_PASSWORD_HASH = pwd_ctx.hash('demo_password_123')

FEATURES_CSV = os.path.normpath(os.path.join(os.path.dirname(__file__), '../../../../data_pipeline/data/features.csv'))
PROFILES_JSON = os.path.normpath(os.path.join(os.path.dirname(__file__), '../../../../data_pipeline/data/user_profiles.json'))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, default=None, help='Max users to seed')
    args = parser.parse_args()
    
    print(f'Loading features from {FEATURES_CSV}...')
    df = pd.read_csv(FEATURES_CSV).replace({float("nan"): None}); df_old = pd.read_csv(FEATURES_CSV)
    print(f'Loaded {len(df)} rows, {df["user_id"].nunique()} unique users')
    
    profiles = {}
    if os.path.exists(PROFILES_JSON):
        with open(PROFILES_JSON) as f:
            raw = json.load(f)
        # Handle both list and dict formats
        if isinstance(raw, list):
            profiles = {str(p.get('user_id', p.get('id', i))): p for i, p in enumerate(raw)}
        elif isinstance(raw, dict):
            profiles = {str(k): v for k, v in raw.items()}
        print(f'Loaded {len(profiles)} user profiles')
    
    user_ids = df['user_id'].dropna().unique().tolist()
    if args.limit:
        user_ids = user_ids[:args.limit]
    
    db = SessionLocal()
    try:
        users_created = 0
        features_created = 0
        
        for uid in user_ids:
            uid_str = str(uid)
            
            # Create user
            user = db.query(User).filter_by(email=f'user{uid_str}@nitisaathi.demo').first()
            if not user:
                user = User(email=f'user{uid_str}@nitisaathi.demo', hashed_password=DEMO_PASSWORD_HASH)
                db.add(user); db.flush()  # get user.id
                users_created += 1
            
            # Create profile
            if not db.query(UserProfile).filter_by(user_id=user.id).first():
                pdata = profiles.get(uid_str, {})
                profile = UserProfile(
                    user_id=user.id,
                    age=int(pdata.get('age', 28)),
                    monthly_income=float(pdata.get('monthly_income', pdata.get('income', 15000))),
                    monthly_expenses=float(pdata.get('monthly_expenses', pdata.get('expenses', 10000))),
                    language_pref=pdata.get('language_pref', 'hi'),
                    literacy_level=pdata.get('literacy_level', 'medium'),
                    e_shram_registered=bool(pdata.get('e_shram_registered', False)),
                    epfo_esic_status=bool(pdata.get('epfo_esic_status', False)),
                    savings_bank_account=bool(pdata.get('savings_bank_account', True)),
                    aadhaar_linked=bool(pdata.get('aadhaar_linked', True)),
                )
                db.add(profile)
            
            # Insert weekly features
            user_rows = df[df['user_id'] == uid]
            for _, row in user_rows.iterrows():
                try:
                    week_start = pd.to_datetime(row['week_start']).date()
                except Exception:
                    continue
                
                exists = db.query(UserWeeklyFeatures).filter_by(user_id=user.id, week_start=week_start).first()
                if exists:
                    continue
                
                wf = UserWeeklyFeatures(
                    user_id=user.id, week_start=week_start,
                    total_income=float(row.get('total_income', 0) or 0),
                    total_expense=float(row.get('total_expense', 0) or 0),
                    closing_balance=float(row.get('closing_balance', 0) or 0),
                    net_cashflow=float(row.get('net_cashflow', 0) or 0),
                    exp_rent=float(row.get('exp_rent', 0) or 0),
                    exp_fuel=float(row.get('exp_fuel', 0) or 0),
                    exp_food=float(row.get('exp_food', 0) or 0),
                    exp_recharge=float(row.get('exp_recharge', 0) or 0),
                    exp_discretionary=float(row.get('exp_discretionary', 0) or 0),
                    exp_family_support=float(row.get('exp_family_support', 0) or 0),
                    exp_insurance_premium=float(row.get('exp_insurance_premium', 0) or 0),
                    exp_loan_emi=float(row.get('exp_loan_emi', 0) or 0),
                    income_wma_4w=float(row['income_wma_4w']) if pd.notna(row.get('income_wma_4w')) else None,
                    income_volatility_pct=float(row['income_volatility_pct']) if pd.notna(row.get('income_volatility_pct')) else None,
                    savings_rate_recommendation=float(row['savings_rate_recommendation']) if pd.notna(row.get('savings_rate_recommendation')) else None,
                    savings_rate_actual=float(row['savings_rate_actual']) if pd.notna(row.get('savings_rate_actual')) else None,
                    low_balance_flag=bool(row.get('low_balance_flag', False)),
                    days_to_next_pmsby_debit=float(row['days_to_next_pmsby_debit']) if pd.notna(row.get('days_to_next_pmsby_debit')) else None,
                    pmsby_debit_due_soon=bool(row.get('pmsby_debit_due_soon', False)),
                    nudge_trigger_low_balance_before_debit=bool(row.get('nudge_trigger_low_balance_before_debit', False)),
                    has_active_emi=bool(row.get('has_active_emi', False)),
                    monthly_emi_amount=float(row.get('monthly_emi_amount', 0) or 0),
                    emi_burden_pct=float(row.get('emi_burden_pct', 0) or 0),
                    financial_persona=str(row.get('financial_persona', 'moderate') or 'moderate'),
                    safe_to_spend_daily=float(row['safe_to_spend_daily']) if pd.notna(row.get('safe_to_spend_daily')) else None,
                    discretionary_pct=float(row['discretionary_pct']) if pd.notna(row.get('discretionary_pct')) else None,
                    had_informal_borrowing=bool(row.get('had_informal_borrowing', False)),
                )
                db.add(wf)
                features_created += 1
            
            if users_created % 10 == 0 and users_created > 0:
                db.commit()
                print(f'  Progress: {users_created} users, {features_created} feature rows...')
        
        db.commit()
        print(f'Done! Created {users_created} users, {features_created} weekly feature rows.')
    except Exception as e:
        db.rollback()
        print(f'Error: {e}')
        raise
    finally:
        db.close()

if __name__ == '__main__':
    main()
