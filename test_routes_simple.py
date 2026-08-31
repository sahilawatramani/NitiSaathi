"""
Simple Route Testing - Focus on Key Endpoints
"""
import requests
import json
from datetime import datetime

print("="*80)
print(" Testing Key API Routes")
print("="*80)

# Test Scheme Agent
print("\n[SCHEME AGENT]")
print("-" * 40)

try:
    r = requests.get("http://127.0.0.1:8001/api/v1/schemes/health", timeout=5)
    print(f"Health Check: {r.status_code} - {r.json().get('status')}")
except Exception as e:
    print(f"Health Check: FAILED - {e}")

try:
    r = requests.get("http://127.0.0.1:8001/api/v1/schemes/schemes/list", timeout=5)
    data = r.json()
    print(f"List Schemes: {r.status_code} - Found {data.get('total_schemes')} schemes")
except Exception as e:
    print(f"List Schemes: FAILED - {e}")

try:
    payload = {
        "user_profile": {
            "user_id": "TEST001",
            "age": 28,
            "epfo_esic_status": False,
            "income_tax_payer": False,
            "days_active_with_aggregator": 95,
            "e_shram_registered": True,
            "monthly_income": 15000.0,
            "state": "Maharashtra",
            "savings_bank_account": True,
            "aadhaar_linked": True
        }
    }
    r = requests.post("http://127.0.0.1:8001/api/v1/schemes/check-eligibility", json=payload, timeout=5)
    if r.status_code == 200:
        data = r.json()
        print(f"Check Eligibility: {r.status_code} - Status: {data.get('gig_worker_status')}, Eligible: {len(data.get('eligible_schemes', []))}")
    else:
        print(f"Check Eligibility: {r.status_code} - {r.text[:200]}")
except Exception as e:
    print(f"Check Eligibility: FAILED - {e}")

try:
    r = requests.get("http://127.0.0.1:8001/api/v1/schemes/check-data-freshness?staleness_threshold_days=90", timeout=5)
    data = r.json()
    print(f"Data Freshness: {r.status_code} - All Fresh: {data.get('all_fresh')}")
except Exception as e:
    print(f"Data Freshness: FAILED - {e}")

# Test Fraud Guard
print("\n[FRAUD GUARD]")
print("-" * 40)

try:
    r = requests.get("http://127.0.0.1:8002/api/v1/fraud-guard/health", timeout=5)
    data = r.json()
    print(f"Health Check: {r.status_code} - {data.get('status')}, Patterns: {data.get('total_patterns')}")
except Exception as e:
    print(f"Health Check: FAILED - {e}")

try:
    r = requests.get("http://127.0.0.1:8002/api/v1/fraud-guard/patterns", timeout=5)
    data = r.json()
    print(f"List Patterns: {r.status_code} - Found {data.get('total_patterns')} patterns")
except Exception as e:
    print(f"List Patterns: FAILED - {e}")

try:
    payload = {
        "transaction": {
            "transaction_id": "TXN001",
            "user_id": "USER001",
            "timestamp": datetime.now().isoformat(),
            "direction": "debit",
            "amount": 250.0,
            "counterparty": "Local Store",
            "counterparty_upi": "store@paytm",
            "category": "food",
            "description": "Grocery",
            "balance_before": 5000.0,
            "balance_after": 4750.0,
            "is_first_time_counterparty": False,
            "transaction_hour": datetime.now().hour
        },
        "user_history": {
            "user_id": "USER001",
            "total_transactions": 50,
            "avg_credit_amount": 10000.0,
            "avg_debit_amount": 225.0,
            "stddev_credit": 2000.0,
            "stddev_debit": 100.0,
            "unique_counterparties": 15,
            "frequent_counterparties": [{"counterparty": "Local Store", "count": 20}],
            "category_distribution": {"food": 20, "transport": 15},
            "typical_transaction_hours": [9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
            "previous_fraud_incidents": 0
        }
    }
    r = requests.post("http://127.0.0.1:8002/api/v1/fraud-guard/detect", json=payload, timeout=5)
    if r.status_code == 200:
        data = r.json()
        is_flagged = data.get('alert') is not None
        print(f"Fraud Detection: {r.status_code} - Flagged: {is_flagged}")
    else:
        print(f"Fraud Detection: {r.status_code} - {r.text[:200]}")
except Exception as e:
    print(f"Fraud Detection: FAILED - {e}")

try:
    payload = {"lender_name": "HDFC Bank"}
    r = requests.post("http://127.0.0.1:8002/api/v1/fraud-guard/check-lender", json=payload, timeout=5)
    if r.status_code == 200:
        data = r.json()
        print(f"Check Lender: {r.status_code} - Registered: {data.get('is_registered')}")
    else:
        print(f"Check Lender: {r.status_code} - {r.text[:200]}")
except Exception as e:
    print(f"Check Lender: FAILED - {e}")

try:
    r = requests.get("http://127.0.0.1:8002/api/v1/fraud-guard/patterns/fake_kyc_call", timeout=5)
    if r.status_code == 200:
        data = r.json()
        print(f"Get Pattern: {r.status_code} - {data.get('name')}")
    else:
        print(f"Get Pattern: {r.status_code}")
except Exception as e:
    print(f"Get Pattern: FAILED - {e}")

print("\n" + "="*80)
print(" Testing Complete!")
print("="*80)
print("\nFull API docs:")
print("  - Scheme Agent: http://127.0.0.1:8001/docs")
print("  - Fraud Guard:  http://127.0.0.1:8002/docs")
