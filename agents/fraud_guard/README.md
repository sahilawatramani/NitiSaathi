# Fraud Guard

**Owner:** Amit | **Component:** Fraud Guard for nitisaathi  
**Purpose:** Real-time UPI fraud detection engine for gig workers

## Overview

The Fraud Guard is responsible for:
- Real-time and async fraud pattern detection on UPI transactions
- Cross-referencing RBI registered lender whitelist / SEBI whitelist
- **NEVER asking for UPI PIN or OTP** — warns user explicitly if anyone else does
- Running anomaly detection on transaction patterns using ground-truth labels
- Labeling suspicious transactions for user review

## ⚠️ CRITICAL HARD RULE

```
NEVER ask the user for their UPI PIN or OTP.

If a message from ANY source (including this system) contains 
"enter your PIN" or "share your OTP", surface an IMMEDIATE fraud 
alert regardless of source.
```

This is non-negotiable and hardcoded into the system.

## Architecture

```
fraud_guard/
├── data/
│   └── fraud_patterns.json       # Knowledge base with all fraud patterns
├── models/
│   └── schemas.py                # Pydantic models
├── services/
│   └── fraud_detector.py         # Core detection engine
├── routers/
│   └── fraud_router.py           # FastAPI endpoints
└── README.md                     # This file
```

## Fraud Patterns Detected

### 1. Fake KYC Call (FP001)
**Severity:** HIGH  
**Description:** Fraudster poses as bank/UPI provider claiming KYC will expire

**Common Phrases:**
- "Your KYC will expire"
- "Your UPI account will be blocked"
- "Complete KYC verification immediately"
- "Click this link to update KYC"

**Detection Signals:**
- Urgency language
- Threat of account blocking
- Link sent via SMS/WhatsApp
- Request to enter OTP or PIN

### 2. Fake QR Overlay (FP002)
**Severity:** MEDIUM  
**Description:** Physical QR code sticker placed over legitimate merchant QR

**Detection Signals:**
- Payment to new/unknown counterparty at frequent location
- Merchant name mismatch (e.g., paying "RAJESH KUMAR" at "HP Petrol Pump")
- First-time counterparty at known merchant category

**Target:** Gig workers who frequently refuel or eat at roadside stalls

### 3. Task-Based Job Scam (FP003)
**Severity:** HIGH  
**Description:** Fake job requiring upfront "registration fee" with promise of high returns

**Common Phrases:**
- "Earn ₹5,000 daily from home"
- "Send ₹500 registration fee to activate account"
- "Complete 10 tasks and get ₹10,000"
- "Work-from-home opportunity"

**Detection Signals:**
- Debit with "registration", "activation", "job fee" keywords
- Amount: ₹300-₹5,000 range
- Counterparty is individual (not company)

### 4. Fake Refund Request (FP004)
**Severity:** HIGH  
**Description:** Fraudster claims accidental payment and requests return

**Pattern:**
1. User receives credit from unknown person
2. Within minutes, receive collect request or message asking for return
3. Collect amount may be HIGHER than credited amount

**User Warning:** Check bank statement first. Never return money via UPI collect.

### 5. UPI Collect Request - New Counterparty Large Amount (FP005)
**Severity:** MEDIUM  
**Description:** Collect request from unknown counterparty for large amount

**Detection Signals:**
- Counterparty: new (first interaction)
- Amount: > 2x user's average OR > ₹1,000
- No recent credit from this counterparty

### 6. Rapid Micro-Debits (FP006)
**Severity:** HIGH  
**Description:** Multiple small debits in short time - often precursor to larger fraud

**Detection Signals:**
- 3+ debits within 10 minutes
- Each amount: ₹1-₹50
- Purpose: Testing if card/UPI is active

**Action:** Block subsequent transactions, recommend changing UPI PIN

### 7. Large Atypical Debit (FP007)
**Severity:** MEDIUM  
**Description:** Single debit significantly larger than user's historical pattern

**Detection Signals:**
- Debit amount > 3x user's average debit
- Counterparty: new or rarely used
- Time: unusual hour (22:00-06:00)

### 8. Duplicate Transaction (FP008)
**Severity:** LOW  
**Description:** Exact same amount to same counterparty within short window

**Detection Signals:**
- Same amount, same counterparty, within 5 minutes
- May be accidental double-click

### 9. Unauthorized Recurring Payment (FP009)
**Severity:** LOW  
**Description:** Recurring debit that user did not authorize or forgot

**Detection Signals:**
- Monthly/weekly recurring debit
- Amount: ₹50-₹500 (subscription range)
- User has not interacted with service recently

## API Endpoints

### Detect Fraud (Single Transaction)
```http
POST /api/v1/fraud-guard/detect
Content-Type: application/json

{
  "transaction": {
    "transaction_id": "txn_20260820_001",
    "user_id": "user_0042",
    "timestamp": "2026-08-20T14:30:00",
    "direction": "debit",
    "amount": 500,
    "counterparty": "Unknown Merchant",
    "category": "fuel",
    "description": "Fuel payment",
    "balance_before": 3000,
    "balance_after": 2500,
    "is_first_time_counterparty": true,
    "transaction_hour": 14
  },
  "user_history": {
    "user_id": "user_0042",
    "total_transactions": 100,
    "avg_credit_amount": 2500,
    "avg_debit_amount": 450,
    "stddev_credit": 300,
    "stddev_debit": 150,
    "unique_counterparties": 25,
    "frequent_counterparties": [
      {"counterparty": "Swiggy", "count": 50},
      {"counterparty": "HP Petrol", "count": 20}
    ],
    "category_distribution": {
      "platform_payout": 50,
      "fuel": 20,
      "food": 15
    },
    "typical_transaction_hours": [9, 10, 11, 14, 15, 18, 19, 20],
    "previous_fraud_incidents": 0
  },
  "check_description": null
}
```

**Response:**
```json
{
  "transaction": { ... },
  "alert": {
    "transaction_id": "txn_20260820_001",
    "user_id": "user_0042",
    "timestamp": "2026-08-20T14:30:05",
    "is_suspicious": true,
    "severity": "MEDIUM",
    "risk_score": 0.72,
    "matched_patterns": [
      {
        "pattern_id": "FP002",
        "pattern_name": "Fake QR Code Overlay at Merchant",
        "description": "Physical QR code sticker placed over legitimate merchant QR...",
        "severity": "MEDIUM",
        "matched_signals": [
          "First-time counterparty: Unknown Merchant",
          "Category: fuel (typical for QR scams)",
          "Merchant name may not match physical location"
        ],
        "confidence": 0.7
      }
    ],
    "alert_title": "⚠️ Suspicious Activity",
    "alert_message": "This transaction matches the 'Fake QR Code Overlay at Merchant' fraud pattern...",
    "user_warning": "Check merchant name carefully before paying...",
    "action_required": "Review transaction details.",
    "contains_pin_otp_request": false
  },
  "anomaly_features": {
    "transaction_id": "txn_20260820_001",
    "amount_deviation_score": 0.33,
    "counterparty_frequency": 0,
    "is_new_counterparty": true,
    "time_of_day_unusual": false,
    "velocity_score": 1,
    "category_mismatch": false,
    "balance_drop_percentage": 0.167,
    "anomaly_score": 0.45
  },
  "detection_timestamp": "2026-08-20T14:30:05",
  "detection_method": "rule_based",
  "processing_time_ms": 12.5
}
```

### Check PIN/OTP Request (CRITICAL)
```http
POST /api/v1/fraud-guard/check-pin-otp-request
Content-Type: application/json

{
  "text": "Please enter your UPI PIN to verify your account"
}
```

**Response:**
```json
{
  "contains_pin_otp_request": true,
  "severity": "CRITICAL",
  "alert_title": "🚨 FRAUD ALERT: PIN/OTP Request Detected",
  "alert_message": "The message you're checking is asking for your UPI PIN or OTP. This is 100% a scam. NEVER share your PIN or OTP with anyone. No bank, government agency, or UPI app will EVER ask for your PIN. Hang up immediately if on call and report to cyber cell.",
  "action_required": "DO NOT share your PIN or OTP. Report this incident."
}
```

### Batch Detect
```http
POST /api/v1/fraud-guard/batch-detect
Content-Type: application/json

{
  "transactions": [ ... ],
  "user_history": { ... }
}
```

### Build User History
```http
POST /api/v1/fraud-guard/build-user-history
Content-Type: application/json

{
  "transactions": [
    {
      "transaction_id": "txn_001",
      "user_id": "user_0042",
      "timestamp": "2026-08-01T10:00:00",
      "direction": "credit",
      "amount": 2500,
      "counterparty": "Swiggy",
      "category": "platform_payout",
      "balance_before": 1000,
      "balance_after": 3500,
      "is_first_time_counterparty": false,
      "transaction_hour": 10
    },
    ... (more transactions)
  ]
}
```

### Check RBI Lender
```http
GET /api/v1/fraud-guard/check-lender/Bajaj%20Finance
```

**Response:**
```json
{
  "entity_name": "Bajaj Finance",
  "is_registered": true,
  "entity_type": "NBFC",
  "source": "RBI Master List of Regulated Entities"
}
```

### List Fraud Patterns
```http
GET /api/v1/fraud-guard/patterns/list
```

## Usage Examples

### Python Client
```python
import requests

# Check if transaction is fraudulent
response = requests.post(
    "http://localhost:8000/api/v1/fraud-guard/detect",
    json={
        "transaction": {
            "transaction_id": "txn_001",
            "user_id": "user_0042",
            "timestamp": "2026-08-20T14:30:00",
            "direction": "debit",
            "amount": 500,
            "counterparty": "Unknown Merchant",
            "category": "fuel",
            "description": "Fuel payment",
            "balance_before": 3000,
            "balance_after": 2500,
            "is_first_time_counterparty": True,
            "transaction_hour": 14
        },
        "user_history": { ... }
    }
)

result = response.json()
if result["alert"]:
    print(f"⚠️ FRAUD ALERT: {result['alert']['severity']}")
    print(f"Risk Score: {result['alert']['risk_score']:.2f}")
    print(f"Warning: {result['alert']['user_warning']}")
```

### Direct Engine Usage
```python
from fraud_guard.services.fraud_detector import FraudDetectionEngine
from fraud_guard.models.schemas import Transaction, UserTransactionHistory, TransactionDirection
from datetime import datetime

detector = FraudDetectionEngine()

# Create transaction
transaction = Transaction(
    transaction_id="txn_001",
    user_id="user_0042",
    timestamp=datetime.now(),
    direction=TransactionDirection.DEBIT,
    amount=500,
    counterparty="Unknown Merchant",
    category="fuel",
    description="Fuel payment",
    balance_before=3000,
    balance_after=2500,
    is_first_time_counterparty=True,
    transaction_hour=14
)

# Build user history first
user_history = detector.build_user_history(past_transactions)

# Detect fraud
result = detector.detect_fraud(transaction, user_history)

if result.alert:
    print(f"Fraud detected: {result.alert.alert_title}")
```

### Check PIN/OTP Request
```python
# CRITICAL: Check if message is asking for PIN/OTP
suspicious_message = "Please share your UPI PIN to complete KYC"

response = requests.post(
    "http://localhost:8000/api/v1/fraud-guard/check-pin-otp-request",
    json={"text": suspicious_message}
)

if response.json()["contains_pin_otp_request"]:
    print("🚨 FRAUD ALERT: This message is asking for your PIN!")
```

## Anomaly Detection

The engine computes statistical anomaly features:

```python
class AnomalyFeatures:
    amount_deviation_score: float      # Z-score (σ/μ)
    counterparty_frequency: int        # Past transactions with same counterparty
    is_new_counterparty: bool          # True if first transaction
    time_of_day_unusual: bool          # Outside typical hours
    velocity_score: int                # Transactions in last 10 minutes
    category_mismatch: bool            # Category outside normal pattern
    balance_drop_percentage: float     # % of balance depleted
    anomaly_score: float               # Composite ML score (0.0-1.0)
```

**Composite Anomaly Score Weights:**
- Amount deviation (Z > 3): +0.35
- New counterparty: +0.25
- Unusual time: +0.15
- High velocity (≥3): +0.30
- Category mismatch: +0.10
- Large balance drop (>50%): +0.25

Threshold: `anomaly_score > 0.75` → Alert

## Ground Truth Evaluation

The synthetic dataset contains 455 labeled fraud transactions:

```python
# Load synthetic data
import pandas as pd
transactions_df = pd.read_csv("data_pipeline/data/transactions.csv")

# Filter labeled fraud
fraud_txns = transactions_df[transactions_df["is_flagged_anomaly"] == True]
print(f"Total fraud transactions: {len(fraud_txns)}")

# Anomaly type distribution
print(fraud_txns["anomaly_type"].value_counts())
```

**Target Metric:** Recall > 0.85  
(Missing fraud is worse than false positives)

Run evaluation:
```bash
pytest tests/test_fraud_guard.py::TestFraudRecallOnSyntheticData -v
```

## Testing

Run full test suite:
```bash
pytest tests/test_fraud_guard.py -v
```

Test coverage:
- PIN/OTP detection (7 test cases)
- All 9 fraud patterns
- Anomaly feature computation
- RBI lender checking
- User history building
- End-to-end detection
- Recall on labeled data

## Fraud Statistics (India 2024-2026)

**Source:** RBI Department of Payment and Settlement Systems, National Cyber Crime Reporting Portal

- FY 2023-24: 13.42 lakh cases, ₹1,087 crore loss
- FY 2024-25 (first 8 months): 28 lakh cases (estimated), ₹805 crore loss
- **Growth:** 11x increase in 4 years (2021-2025)
- **Target:** Gig workers disproportionately affected due to daily UPI transactions and lower financial literacy

## Data Sources

- RBI Master List of Regulated Entities: https://rbi.org.in/Scripts/BS_NBFCListDisplay.aspx
- National Cyber Crime Reporting Portal: https://cybercrime.gov.in/
- UPI fraud statistics: Business Today, Economic Times, RBI reports (2026)

**Last Updated:** 2026-08-20

## Important Notes

1. **PIN/OTP Hard Rule:** This is non-negotiable. Any violation of this rule is a CRITICAL security bug.

2. **False Positives vs False Negatives:** In fraud detection, missing a fraud (false negative) is worse than false alarm (false positive). Recall > Precision.

3. **User Feedback Loop:** Always log user confirmation ("Was this fraud?"). Use feedback to improve pattern weights.

4. **Gig Worker Patterns:** Patterns are tuned for gig workers. Generic fraud detection models miss gig-specific scams (fake QR at petrol pumps, task-based job scams).

5. **Real-Time Requirement:** Fraud detection must run <100ms for real-time transaction blocking.

## Performance Benchmarks

Target performance:
- Detection latency: < 100ms (P95)
- Recall on synthetic labeled data: > 0.85
- False positive rate: < 0.15

Current benchmarks:
```bash
pytest tests/test_fraud_guard.py -v --benchmark
```

## Contributing

When adding new fraud patterns:
1. Add pattern to `fraud_patterns.json` with all required fields
2. Implement detection logic in `fraud_detector.py`
3. Add test cases to `test_fraud_guard.py`
4. Update this README with pattern description
5. Document real-world examples and detection signals

## License

Part of the nitisaathi project for Nomura KakushIN 2026.
