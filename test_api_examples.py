"""
API Testing Examples for Scheme Agent and Fraud Guard

Run this after starting both API servers:
Terminal 1: uvicorn agents.scheme_agent.routers.scheme_router:router --reload --port 8001
Terminal 2: uvicorn agents.fraud_guard.routers.fraud_router:router --reload --port 8002
"""
import requests
import json
from datetime import datetime


# API Base URLs
SCHEME_API = "http://localhost:8001/api/v1/schemes"
FRAUD_API = "http://localhost:8002/api/v1/fraud-guard"


def test_scheme_agent():
    """Test Scheme Agent API"""
    print("=" * 80)
    print("TESTING SCHEME AGENT")
    print("=" * 80)
    
    # Test 1: Health Check
    print("\n1. Health Check")
    response = requests.get(f"{SCHEME_API}/health")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    
    # Test 2: List Schemes
    print("\n2. List Available Schemes")
    response = requests.get(f"{SCHEME_API}/schemes/list")
    data = response.json()
    print(f"Total Schemes: {data['total_schemes']}")
    for scheme in data['schemes']:
        print(f"  - {scheme['full_name']} ({scheme['scheme_code']})")
    
    # Test 3: Check Eligibility (Comprehensive)
    print("\n3. Check Eligibility (User: Age 28, Gig Worker)")
    payload = {
        "user_profile": {
            "user_id": "test_user_001",
            "age": 28,
            "epfo_esic_status": False,
            "income_tax_payer": False,
            "days_active_with_aggregator": 120,
            "e_shram_registered": True,
            "monthly_income": 12000,
            "state": "Karnataka",
            "savings_bank_account": True,
            "aadhaar_linked": True
        },
        "budget_state": {
            "income_wma_4w": 2800,
            "income_volatility_pct": 0.22,
            "savings_rate_recommendation": 0.10,
            "closing_balance": 3000,
            "financial_persona": "moderate"
        }
    }
    
    response = requests.post(f"{SCHEME_API}/check-eligibility", json=payload)
    data = response.json()
    print(f"Gig Worker Status: {data['gig_worker_status']}")
    print(f"Eligible Schemes: {len(data['eligible_schemes'])}")
    
    for scheme in data['eligible_schemes']:
        print(f"\n  ✓ {scheme['scheme_name']}")
        print(f"    Contribution: ₹{scheme.get('contribution_required', 0)}")
        if scheme.get('affordable') is not None:
            print(f"    Affordable: {'Yes' if scheme['affordable'] else 'No'}")
    
    print("\nPriority Recommendations:")
    for rec in data.get('priority_recommendations', []):
        print(f"  {rec}")
    
    # Test 4: Check Data Freshness
    print("\n4. Check Data Freshness")
    response = requests.get(f"{SCHEME_API}/check-data-freshness?staleness_threshold_days=90")
    data = response.json()
    print(f"Schemes Checked: {data['schemes_checked']}")
    print(f"Stale Schemes: {data['stale_schemes_count']}")
    print(f"All Fresh: {data['all_fresh']}")
    
    print("\n" + "=" * 80)


def test_fraud_guard():
    """Test Fraud Guard API"""
    print("=" * 80)
    print("TESTING FRAUD GUARD")
    print("=" * 80)
    
    # Test 1: Health Check
    print("\n1. Health Check")
    response = requests.get(f"{FRAUD_API}/health")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    
    # Test 2: List Fraud Patterns
    print("\n2. List Fraud Patterns")
    response = requests.get(f"{FRAUD_API}/patterns/list")
    data = response.json()
    print(f"Total Patterns: {data['total_patterns']}")
    for pattern in data['patterns'][:3]:  # Show first 3
        print(f"  - {pattern['name']} ({pattern['severity']})")
    
    # Test 3: Check PIN/OTP Request (CRITICAL)
    print("\n3. Check PIN/OTP Request (CRITICAL SECURITY CHECK)")
    
    # Safe message
    print("\n  Testing safe message:")
    response = requests.post(
        f"{FRAUD_API}/check-pin-otp-request",
        json={"text": "Payment for fuel at HP petrol pump"}
    )
    data = response.json()
    print(f"  Contains PIN/OTP request: {data['contains_pin_otp_request']}")
    print(f"  Status: {data.get('status', 'N/A')}")
    
    # Suspicious message
    print("\n  Testing suspicious message:")
    response = requests.post(
        f"{FRAUD_API}/check-pin-otp-request",
        json={"text": "Please enter your UPI PIN to verify"}
    )
    data = response.json()
    print(f"  Contains PIN/OTP request: {data['contains_pin_otp_request']}")
    print(f"  Severity: {data.get('severity', 'N/A')}")
    print(f"  Alert: {data.get('alert_title', 'N/A')}")
    
    # Test 4: Detect Fraud in Transaction
    print("\n4. Detect Fraud in Transaction")
    
    # Build user history
    user_history_payload = {
        "transactions": [
            {
                "transaction_id": f"txn_{i}",
                "user_id": "test_user_001",
                "timestamp": datetime.now().isoformat(),
                "direction": "credit" if i % 3 == 0 else "debit",
                "amount": 2500 if i % 3 == 0 else 450,
                "counterparty": "Swiggy" if i % 2 == 0 else "HP Petrol",
                "category": "platform_payout" if i % 3 == 0 else "fuel",
                "description": "Transaction",
                "balance_before": 3000,
                "balance_after": 2550,
                "is_first_time_counterparty": False,
                "transaction_hour": 14
            }
            for i in range(30)
        ]
    }
    
    print("  Building user history from 30 transactions...")
    response = requests.post(f"{FRAUD_API}/build-user-history", json=user_history_payload)
    user_history = response.json()
    print(f"  Total Transactions: {user_history['total_transactions']}")
    print(f"  Unique Counterparties: {user_history['unique_counterparties']}")
    
    # Test suspicious transaction (fake QR overlay)
    print("\n  Testing suspicious transaction (Fake QR at petrol pump):")
    fraud_check_payload = {
        "transaction": {
            "transaction_id": "txn_suspicious",
            "user_id": "test_user_001",
            "timestamp": datetime.now().isoformat(),
            "direction": "debit",
            "amount": 500,
            "counterparty": "Unknown Merchant XYZ",  # New counterparty
            "category": "fuel",
            "description": "Fuel payment",
            "balance_before": 3000,
            "balance_after": 2500,
            "is_first_time_counterparty": True,
            "transaction_hour": 14
        },
        "user_history": user_history
    }
    
    response = requests.post(f"{FRAUD_API}/detect", json=fraud_check_payload)
    result = response.json()
    
    print(f"  Suspicious: {result['alert'] is not None if 'alert' in result else 'N/A'}")
    if result.get('alert'):
        print(f"  Severity: {result['alert']['severity']}")
        print(f"  Risk Score: {result['alert']['risk_score']:.2f}")
        print(f"  Alert: {result['alert']['alert_title']}")
        print(f"  Matched Patterns: {len(result['alert']['matched_patterns'])}")
        for pattern in result['alert']['matched_patterns']:
            print(f"    - {pattern['pattern_name']} (confidence: {pattern['confidence']:.2f})")
    
    print(f"\n  Anomaly Score: {result['anomaly_features']['anomaly_score']:.2f}")
    print(f"  Processing Time: {result['processing_time_ms']:.1f}ms")
    
    # Test 5: Check RBI Lender
    print("\n5. Check RBI Lender")
    
    print("  Checking known bank:")
    response = requests.get(f"{FRAUD_API}/check-lender/HDFC Bank")
    data = response.json()
    print(f"  Entity: {data['entity_name']}")
    print(f"  Registered: {data['is_registered']}")
    print(f"  Type: {data.get('entity_type', 'N/A')}")
    
    print("\n  Checking unknown lender:")
    response = requests.get(f"{FRAUD_API}/check-lender/QuickLoan888")
    data = response.json()
    print(f"  Entity: {data['entity_name']}")
    print(f"  Registered: {data['is_registered']}")
    if data.get('warning'):
        print(f"  Warning: {data['warning']}")
    
    print("\n" + "=" * 80)


def main():
    """Run all tests"""
    print("\n")
    print("*" * 80)
    print(" nitisaathi API Testing Suite")
    print(" Scheme Agent + Fraud Guard")
    print("*" * 80)
    print("\n")
    
    print("Prerequisites:")
    print("1. Start Scheme Agent: uvicorn agents.scheme_agent.main:app --reload --port 8001")
    print("2. Start Fraud Guard: uvicorn agents.fraud_guard.main:app --reload --port 8002")
    print("\n")
    
    input("Press Enter when both servers are running...")
    
    try:
        test_scheme_agent()
        print("\n")
        test_fraud_guard()
        
        print("\n")
        print("*" * 80)
        print(" All API tests completed successfully!")
        print("*" * 80)
        print("\n")
        
    except requests.exceptions.ConnectionError as e:
        print(f"\n❌ ERROR: Could not connect to API servers.")
        print(f"Make sure both servers are running on ports 8001 and 8002.")
        print(f"Error: {e}")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")


if __name__ == "__main__":
    main()
