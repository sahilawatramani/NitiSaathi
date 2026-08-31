"""
Comprehensive API Route Testing
Tests all endpoints for Scheme Agent and Fraud Guard
"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL_SCHEME = "http://127.0.0.1:8001"
BASE_URL_FRAUD = "http://127.0.0.1:8002"

def print_section(title):
    print("\n" + "="*80)
    print(f" {title}")
    print("="*80)

def test_endpoint(method, url, data=None, expected_status=200):
    """Test a single endpoint"""
    try:
        if method == "GET":
            response = requests.get(url, timeout=5)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=5)
        
        status_icon = "[OK]" if response.status_code == expected_status else "[FAIL]"
        print(f"{status_icon} {method} {url}")
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                json_data = response.json()
                # Print first few keys for verification
                if isinstance(json_data, dict):
                    keys = list(json_data.keys())[:5]
                    print(f"   Keys: {keys}")
                elif isinstance(json_data, list):
                    print(f"   Items: {len(json_data)}")
            except:
                print(f"   Response: {response.text[:100]}")
        else:
            print(f"   Error: {response.text[:200]}")
        
        return response
    except Exception as e:
        print(f"[FAIL] {method} {url}")
        print(f"   Exception: {str(e)}")
        return None

# =============================================================================
# SCHEME AGENT TESTS
# =============================================================================

print_section("SCHEME AGENT - Testing All Routes")

# Test 1: Root endpoint
print("\n1. Root Endpoint")
test_endpoint("GET", f"{BASE_URL_SCHEME}/")

# Test 2: Health check
print("\n2. Health Check")
test_endpoint("GET", f"{BASE_URL_SCHEME}/api/v1/schemes/health")

# Test 3: List schemes
print("\n3. List All Schemes")
response = test_endpoint("GET", f"{BASE_URL_SCHEME}/api/v1/schemes/schemes/list")
if response and response.status_code == 200:
    data = response.json()
    print(f"   Total Schemes: {data.get('total_schemes')}")
    for scheme in data.get('schemes', [])[:3]:
        print(f"   - {scheme.get('full_name')} ({scheme.get('scheme_code')})")

# Test 4: Check eligibility - Basic user
print("\n4. Check Eligibility - Basic Gig Worker")
eligibility_request = {
    "user_profile": {
        "age": 28,
        "epfo_esic_status": False,
        "income_tax_payer": False,
        "days_active_with_aggregator": 95,
        "aggregators_count": 1,
        "e_shram_registered": True,
        "bank_account_linked": True,
        "aadhar_verified": True,
        "average_monthly_income": 15000
    }
}
response = test_endpoint("POST", f"{BASE_URL_SCHEME}/api/v1/schemes/check-eligibility", eligibility_request)
if response and response.status_code == 200:
    data = response.json()
    print(f"   Gig Worker Status: {data.get('gig_worker_eligible_status')}")
    print(f"   Eligible Schemes: {len(data.get('eligible_schemes', []))}")
    for scheme in data.get('eligible_schemes', [])[:3]:
        print(f"   - {scheme.get('scheme_name')}")

# Test 5: Check eligibility with budget state
print("\n5. Check Eligibility - With Budget Agent State")
eligibility_with_budget = {
    "user_profile": {
        "age": 28,
        "epfo_esic_status": False,
        "income_tax_payer": False,
        "days_active_with_aggregator": 95,
        "aggregators_count": 1,
        "e_shram_registered": True,
        "bank_account_linked": True,
        "aadhar_verified": True,
        "average_monthly_income": 15000
    },
    "budget_state": {
        "income_wma_4w": 14000.0,
        "savings_rate_recommendation": 0.12,
        "current_balance": 5000.0,
        "stable_weeks_count": 6,
        "total_weeks_tracked": 8,
        "volatility_coefficient": 0.15
    }
}
response = test_endpoint("POST", f"{BASE_URL_SCHEME}/api/v1/schemes/check-eligibility", eligibility_with_budget)
if response and response.status_code == 200:
    data = response.json()
    print(f"   Priority Recommendations: {len(data.get('priority_recommendations', []))}")

# Test 6: Check single scheme - e-Shram
print("\n6. Check Single Scheme - e_shram")
response = test_endpoint("POST", f"{BASE_URL_SCHEME}/api/v1/schemes/check-scheme/e_shram", eligibility_request)

# Test 7: Check single scheme - PM-SYM
print("\n7. Check Single Scheme - pm_sym")
response = test_endpoint("POST", f"{BASE_URL_SCHEME}/api/v1/schemes/check-scheme/pm_sym", eligibility_with_budget)

# Test 8: Check single scheme - PMSBY
print("\n8. Check Single Scheme - pmsby")
response = test_endpoint("POST", f"{BASE_URL_SCHEME}/api/v1/schemes/check-scheme/pmsby", eligibility_with_budget)

# Test 9: Check single scheme - Invalid
print("\n9. Check Single Scheme - Invalid Code (Should Fail)")
response = test_endpoint("POST", f"{BASE_URL_SCHEME}/api/v1/schemes/check-scheme/invalid_scheme", eligibility_request, expected_status=404)

# Test 10: Analyze affordability
print("\n10. Analyze Affordability - PM-SYM")
affordability_request = {
    "scheme_code": "pm_sym",
    "contribution": 95.0,
    "frequency": "monthly",
    "user_age": 28,
    "budget_state": {
        "income_wma_4w": 14000.0,
        "savings_rate_recommendation": 0.12,
        "current_balance": 5000.0,
        "stable_weeks_count": 6,
        "total_weeks_tracked": 8,
        "volatility_coefficient": 0.15
    }
}
response = test_endpoint("POST", f"{BASE_URL_SCHEME}/api/v1/schemes/analyze-affordability?scheme_code=pm_sym&contribution=95.0&frequency=monthly&user_age=28", affordability_request)

# Test 11: Check data freshness
print("\n11. Check Data Freshness")
response = test_endpoint("GET", f"{BASE_URL_SCHEME}/api/v1/schemes/check-data-freshness?staleness_threshold_days=90")

# Test 12: Check data freshness - Custom threshold
print("\n12. Check Data Freshness - 30 day threshold")
response = test_endpoint("GET", f"{BASE_URL_SCHEME}/api/v1/schemes/check-data-freshness?staleness_threshold_days=30")

# =============================================================================
# FRAUD GUARD TESTS
# =============================================================================

print_section("FRAUD GUARD - Testing All Routes")

# Test 1: Root endpoint
print("\n1. Root Endpoint")
test_endpoint("GET", f"{BASE_URL_FRAUD}/")

# Test 2: Health check
print("\n2. Health Check")
response = test_endpoint("GET", f"{BASE_URL_FRAUD}/api/v1/fraud-guard/health")
if response and response.status_code == 200:
    data = response.json()
    print(f"   Patterns Loaded: {data.get('total_patterns')}")
    print(f"   Hard Rules Active: {data.get('hard_rules_active')}")

# Test 3: List fraud patterns
print("\n3. List Fraud Patterns")
response = test_endpoint("GET", f"{BASE_URL_FRAUD}/api/v1/fraud-guard/patterns")
if response and response.status_code == 200:
    data = response.json()
    print(f"   Total Patterns: {data.get('total_patterns')}")
    for pattern in data.get('patterns', [])[:3]:
        print(f"   - {pattern.get('pattern_name')} (Severity: {pattern.get('severity')})")

# Test 4: Detect fraud - Clean transaction
print("\n4. Detect Fraud - Clean Transaction")
clean_transaction = {
    "transaction_id": "TXN001",
    "user_id": "USER001",
    "timestamp": datetime.now().isoformat(),
    "amount": 250.0,
    "direction": "debit",
    "counterparty": "Local Grocery Store",
    "counterparty_upi": "grocery@paytm",
    "description": "Grocery purchase",
    "category": "food",
    "balance_before": 5000.0,
    "balance_after": 4750.0,
    "is_first_time_counterparty": False,
    "transaction_hour": datetime.now().hour
}
user_history = {
    "user_id": "USER001",
    "total_transactions": 50,
    "avg_credit_amount": 10000.0,
    "avg_debit_amount": 225.0,
    "stddev_credit": 2000.0,
    "stddev_debit": 100.0,
    "unique_counterparties": 15,
    "frequent_counterparties": [{"counterparty": "Local Grocery Store", "count": 20}],
    "category_distribution": {"food": 20, "transport": 15, "shopping": 10, "utilities": 5},
    "typical_transaction_hours": [9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    "previous_fraud_incidents": 0
}
detect_request = {
    "transaction": clean_transaction,
    "user_history": user_history
}
response = test_endpoint("POST", f"{BASE_URL_FRAUD}/api/v1/fraud-guard/detect", detect_request)
if response and response.status_code == 200:
    data = response.json()
    print(f"   Flagged: {data.get('is_flagged')}")
    print(f"   Risk Score: {data.get('risk_score')}")

# Test 5: Detect fraud - PIN request (CRITICAL)
print("\n5. Detect Fraud - PIN Request (Should Alert)")
pin_transaction = clean_transaction.copy()
pin_request_detect = {
    "transaction": pin_transaction,
    "user_history": user_history,
    "check_description": "Please enter your 6-digit PIN to complete verification"
}
response = test_endpoint("POST", f"{BASE_URL_FRAUD}/api/v1/fraud-guard/detect", pin_request_detect)
if response and response.status_code == 200:
    data = response.json()
    print(f"   Flagged: {data.get('is_flagged')} (Should be True)")
    print(f"   Risk Score: {data.get('risk_score')}")
    if data.get('alert_message'):
        print(f"   Alert: {data.get('alert_message')[:100]}...")

# Test 6: Detect fraud - Large unusual transaction
print("\n6. Detect Fraud - Large Unusual Transaction")
large_transaction = {
    "transaction_id": "TXN002",
    "user_id": "USER001",
    "timestamp": datetime.now().isoformat(),
    "amount": 5000.0,  # Much larger than average
    "direction": "debit",
    "counterparty": "Unknown Vendor",
    "counterparty_upi": "unknown@paytm",
    "description": "Online purchase",
    "category": "shopping",
    "balance_before": 5500.0,
    "balance_after": 500.0,
    "is_first_time_counterparty": True,
    "transaction_hour": datetime.now().hour
}
large_detect = {
    "transaction": large_transaction,
    "user_history": user_history
}
response = test_endpoint("POST", f"{BASE_URL_FRAUD}/api/v1/fraud-guard/detect", large_detect)
if response and response.status_code == 200:
    data = response.json()
    print(f"   Flagged: {data.get('is_flagged')}")
    print(f"   Matched Patterns: {len(data.get('matched_patterns', []))}")

# Test 7: Batch detect
print("\n7. Batch Detect - Multiple Transactions")
batch_request = {
    "transactions": [clean_transaction, large_transaction],
    "user_history": user_history
}
response = test_endpoint("POST", f"{BASE_URL_FRAUD}/api/v1/fraud-guard/batch-detect", batch_request)
if response and response.status_code == 200:
    data = response.json()
    print(f"   Total Checked: {len(data)}")
    flagged = sum(1 for r in data if r.get('is_flagged'))
    print(f"   Flagged: {flagged}")

# Test 8: Check RBI lender - Known bank
print("\n8. Check RBI Lender - HDFC Bank")
lender_request = {
    "lender_name": "HDFC Bank",
    "transaction_amount": 10000.0,
    "loan_offer_link": "https://hdfc.com/loan"
}
response = test_endpoint("POST", f"{BASE_URL_FRAUD}/api/v1/fraud-guard/check-lender", lender_request)
if response and response.status_code == 200:
    data = response.json()
    print(f"   Is Verified: {data.get('is_verified')}")
    print(f"   Lender Type: {data.get('lender_type')}")

# Test 9: Check RBI lender - Unknown lender
print("\n9. Check RBI Lender - Fake Lender (Should Flag)")
fake_lender_request = {
    "lender_name": "QuickCash Finance",
    "transaction_amount": 50000.0,
    "loan_offer_link": "https://quickcash.xyz/loan"
}
response = test_endpoint("POST", f"{BASE_URL_FRAUD}/api/v1/fraud-guard/check-lender", fake_lender_request)
if response and response.status_code == 200:
    data = response.json()
    print(f"   Is Verified: {data.get('is_verified')} (Should be False)")
    print(f"   Warning: {data.get('warning_message', 'N/A')[:80]}...")

# Test 10: Get fraud statistics
print("\n10. Get Fraud Statistics")
response = test_endpoint("GET", f"{BASE_URL_FRAUD}/api/v1/fraud-guard/statistics")

# Test 11: Get pattern by ID
print("\n11. Get Pattern Details - fake_kyc_call")
response = test_endpoint("GET", f"{BASE_URL_FRAUD}/api/v1/fraud-guard/patterns/fake_kyc_call")
if response and response.status_code == 200:
    data = response.json()
    print(f"   Pattern: {data.get('pattern_name')}")
    print(f"   Severity: {data.get('severity')}")

# Test 12: Get pattern by ID - Invalid
print("\n12. Get Pattern Details - Invalid ID (Should Fail)")
response = test_endpoint("GET", f"{BASE_URL_FRAUD}/api/v1/fraud-guard/patterns/invalid_pattern", expected_status=404)

# =============================================================================
# SUMMARY
# =============================================================================

print_section("TESTING COMPLETE")
print("""
[OK] All route tests completed!

Check above output for any [FAIL] failures.

Documentation URLs:
  • Scheme Agent: http://127.0.0.1:8001/docs
  • Fraud Guard:  http://127.0.0.1:8002/docs
""")
