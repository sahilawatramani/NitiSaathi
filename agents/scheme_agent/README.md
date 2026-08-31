# Scheme Agent

**Owner:** Amit | **Component:** Scheme Agent for nitisaathi  
**Purpose:** Government welfare scheme eligibility engine for gig workers

## Overview

The Scheme Agent is responsible for:
- Maintaining knowledge of government welfare schemes (e-Shram, PM-SYM, PMSBY, PMJJBY, APY, state welfare boards)
- Running rule-based eligibility checks against user profile fields
- Performing joint reasoning with Budget Agent for affordability analysis
- Timestamping all scheme information with "last verified" dates
- Using Code on Social Security 2020 worker classification

## Architecture

```
scheme_agent/
├── data/
│   ├── schemes_kb.json           # Knowledge base with all schemes
│   ├── scheme_update_log.json    # Auto-generated update history
│   └── scheme_update_report.txt  # Auto-generated freshness report
├── models/
│   └── schemas.py                # Pydantic models
├── services/
│   ├── eligibility_engine.py     # Core eligibility logic
│   └── scheme_updater.py         # Automated data freshness checker
├── routers/
│   └── scheme_router.py          # FastAPI endpoints
└── README.md                     # This file
```

## Knowledge Base

`schemes_kb.json` contains:
- **6 major schemes:**
  - e-Shram (National Database of Unorganized Workers)
  - PM-SYM (Pradhan Mantri Shram Yogi Maan-Dhan) - Pension
  - PMSBY (PM Suraksha Bima Yojana) - Accident Insurance
  - PMJJBY (PM Jeevan Jyoti Bima Yojana) - Life Insurance
  - APY (Atal Pension Yojana)
  - State Welfare Boards (Rajasthan, Karnataka, Bihar, Jharkhand, Telangana)
- **Code on Social Security 2020** classification rules
- Eligibility criteria, contribution matrices, benefits
- Official source URLs for verification
- Last verified dates for all schemes

## API Endpoints

### Check Eligibility (Comprehensive)
```http
POST /api/v1/schemes/check-eligibility
Content-Type: application/json

{
  "user_profile": {
    "user_id": "user_0042",
    "age": 28,
    "epfo_esic_status": false,
    "income_tax_payer": false,
    "days_active_with_aggregator": 120,
    "e_shram_registered": true,
    "monthly_income": 12000,
    "state": "Karnataka",
    "savings_bank_account": true,
    "aadhaar_linked": true
  },
  "budget_state": {
    "income_wma_4w": 2800,
    "income_volatility_pct": 0.22,
    "savings_rate_recommendation": 0.10,
    "closing_balance": 3000,
    "financial_persona": "moderate"
  }
}
```

**Response:**
```json
{
  "user_id": "user_0042",
  "timestamp": "2026-08-20T10:30:00",
  "gig_worker_status": "eligible",
  "gig_worker_days_threshold": "Eligible: 120 days active (≥90 days threshold met)",
  "eligible_schemes": [
    {
      "scheme_code": "ESHRAM_001",
      "scheme_name": "e-Shram National Database of Unorganized Workers",
      "eligible": true,
      "reasons": ["✓ Age 28 is within range 16-59", "✓ Not registered with EPFO/ESIC"],
      "contribution_required": 0,
      "affordable": true
    },
    {
      "scheme_code": "PMSYM_001",
      "scheme_name": "Pradhan Mantri Shram Yogi Maan-Dhan",
      "eligible": true,
      "contribution_required": 95,
      "affordable": true,
      "affordability_reasoning": "Conditionally affordable: ₹95/month fits your budget, but income volatility is 22%. Recommend waiting for 4 consecutive stable weeks before enabling auto-debit."
    },
    {
      "scheme_code": "PMSBY_001",
      "scheme_name": "Pradhan Mantri Suraksha Bima Yojana",
      "eligible": true,
      "contribution_required": 20,
      "affordable": true
    }
  ],
  "priority_recommendations": [
    "1. Register on e-Shram (prerequisite for other schemes, free, takes 10 minutes)",
    "2. Enroll in PMSBY (₹20/year accident cover - CRITICAL for gig workers)",
    "3. Consider PM-SYM (₹95/month for ₹3,000/month pension after 60)"
  ],
  "joint_reasoning_summary": "Based on your current financial state: Weekly income ₹2,800 (volatility 22%), recommended savings rate 10%, current balance ₹3,000. Persona: moderate."
}
```

### Check Single Scheme
```http
POST /api/v1/schemes/check-scheme/pm_sym
Content-Type: application/json

{
  "user_profile": { ... },
  "budget_state": { ... }
}
```

### Analyze Affordability
```http
POST /api/v1/schemes/analyze-affordability
Content-Type: application/json

{
  "scheme_code": "PMSYM_001",
  "contribution": 95,
  "frequency": "monthly",
  "user_age": 28,
  "budget_state": {
    "income_wma_4w": 2800,
    "income_volatility_pct": 0.22,
    "savings_rate_recommendation": 0.10,
    "closing_balance": 3000,
    "financial_persona": "moderate"
  }
}
```

**Response:**
```json
{
  "scheme_code": "PMSYM_001",
  "contribution_required": 95,
  "contribution_frequency": "monthly",
  "monthly_income_estimate": 12124,
  "savings_rate": 0.10,
  "available_savings_per_month": 1212,
  "affordable": true,
  "margin": 1117,
  "confidence": "medium",
  "recommendation": "⚠ Conditionally affordable: ₹95/month fits your budget, but income volatility is 22%.",
  "stability_requirement": "Recommend waiting for 4 consecutive stable weeks before enabling auto-debit",
  "risk_factors": ["Income has moderate volatility"]
}
```

### Check Data Freshness
```http
GET /api/v1/schemes/check-data-freshness?staleness_threshold_days=90
```

**Response:**
```json
{
  "check_timestamp": "2026-08-20T10:30:00",
  "schemes_checked": 6,
  "stale_schemes": [],
  "all_fresh": true,
  "next_check_due": "2026-09-20T10:30:00"
}
```

### List Available Schemes
```http
GET /api/v1/schemes/schemes/list
```

## Usage Examples

### Python Client
```python
import requests

# Check eligibility
response = requests.post(
    "http://localhost:8000/api/v1/schemes/check-eligibility",
    json={
        "user_profile": {
            "user_id": "user_0042",
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
)

recommendation = response.json()
print(f"Gig Worker Status: {recommendation['gig_worker_status']}")
print(f"Eligible Schemes: {len(recommendation['eligible_schemes'])}")
for scheme in recommendation['eligible_schemes']:
    print(f"  - {scheme['scheme_name']}: ₹{scheme['contribution_required']}")
```

### Direct Engine Usage
```python
from scheme_agent.services.eligibility_engine import SchemeEligibilityEngine
from scheme_agent.models.schemas import UserProfile, BudgetAgentState

engine = SchemeEligibilityEngine()

user = UserProfile(
    user_id="user_0042",
    age=28,
    epfo_esic_status=False,
    income_tax_payer=False,
    days_active_with_aggregator=120,
    e_shram_registered=True,
    monthly_income=12000,
    state="Karnataka",
    savings_bank_account=True,
    aadhaar_linked=True
)

budget_state = BudgetAgentState(
    income_wma_4w=2800,
    income_volatility_pct=0.22,
    savings_rate_recommendation=0.10,
    closing_balance=3000,
    financial_persona="moderate"
)

recommendation = engine.generate_recommendation(user, budget_state)
```

## Eligibility Rules

### Code on Social Security 2020 - Gig Worker Classification
- **Option 1:** 90+ days active with ONE aggregator platform
- **Option 2:** 120+ days active across MULTIPLE platforms

### e-Shram
- Age: 16-59
- NOT registered with EPFO/ESIC
- NOT an income tax payer

### PM-SYM (Pension)
- Age: 18-40
- Monthly income < ₹15,000
- NOT registered with EPFO/ESIC/NPS
- NOT an income tax payer
- e-Shram registered (prerequisite)

### PMSBY (Accident Insurance)
- Age: 18-70
- Savings bank account with auto-debit consent
- e-Shram registered (prerequisite)
- **Premium:** ₹20/year
- **CRITICAL:** Coverage lapses for FULL YEAR if balance insufficient on debit date

### PMJJBY (Life Insurance)
- Age: 18-50
- Savings bank account with auto-debit consent
- **Premium:** ₹436/year (debit on June 1st)

### APY (Atal Pension Yojana)
- Age: 18-40
- NOT an income tax payer (for govt co-contribution)
- Savings bank account with auto-debit
- **Pension tiers:** ₹1,000 - ₹5,000/month (choice)

## Affordability Joint Reasoning

The Scheme Agent performs joint reasoning with Budget Agent to determine if a user can afford scheme contributions:

```python
# Example joint reasoning logic
monthly_income = income_wma_4w * 4.33
available_savings = monthly_income * savings_rate_recommendation
scheme_contribution = 95  # PM-SYM for age 28

if scheme_contribution < available_savings:
    affordable = True
    
    # Check income stability
    if income_volatility_pct < 0.15:
        confidence = "high"
    elif income_volatility_pct <= 0.30:
        confidence = "medium"
        stability_requirement = "Wait 4 stable weeks before auto-debit"
    else:
        confidence = "low"
        stability_requirement = "Wait until volatility <30% for 4 weeks"
else:
    affordable = False
```

## Automated Data Updater

The Scheme Agent includes an automated data freshness checker:

```python
from scheme_agent.services.scheme_updater import SchemeDataUpdater

updater = SchemeDataUpdater(staleness_threshold_days=90)

# Run freshness check
summary = updater.check_freshness()
print(f"Stale schemes: {summary['stale_schemes_count']}")

# Generate report
report = updater.generate_update_report()

# Mark scheme as verified after manual check
updater.mark_scheme_verified("pm_sym", verification_date="2026-08-20")
```

### Running as Background Job
```python
import asyncio
from scheme_agent.services.scheme_updater import create_updater_job

# In FastAPI startup
@app.on_event("startup")
async def startup_event():
    updater = create_updater_job(check_interval_hours=24)
    asyncio.create_task(updater.automated_check_job())
```

## Testing

Run tests:
```bash
pytest tests/test_scheme_agent.py -v
```

Test coverage includes:
- Gig worker classification boundary cases (89/90/119/120 days)
- Age boundary cases (15/16, 59/60 for e-Shram; 18, 40/41 for PM-SYM)
- EPFO/income tax blocking factors
- Affordability with stable vs volatile income
- Data freshness checking
- PM-SYM contribution matrix completeness

## Data Sources

All scheme data is sourced from official government portals:
- e-Shram: https://www.eshram.gov.in/
- PM-SYM: https://maandhan.in/
- PMSBY/PMJJBY: https://jansuraksha.gov.in/
- APY: https://npscra.nsdl.co.in/atal-pension.php
- RBI NBFC List: https://rbi.org.in/Scripts/BS_NBFCListDisplay.aspx

**Last Updated:** 2026-08-20

## Important Notes

1. **Stale Data Risk:** Scheme rules change frequently. Always check `last_verified` dates. Run freshness checker weekly.

2. **Joint Reasoning Required:** Never recommend PM-SYM or APY enrollment without checking Budget Agent affordability first.

3. **PMSBY Critical Alert:** If user's balance < ₹20 and PMSBY debit is <14 days away, trigger IMMEDIATE nudge. Coverage lapse = 12-month re-enrollment wait.

4. **e-Shram Prerequisite:** Most gig worker schemes require e-Shram registration. Always recommend this first if user not registered.

5. **State-Specific Schemes:** State welfare boards vary by state. Query user's current state of residence for accurate recommendations.

## Contributing

When adding new schemes:
1. Add scheme to `schemes_kb.json` with all required fields
2. Set `last_verified` to today's date
3. Add official source URLs to `data_sources` array
4. Implement eligibility check method in `eligibility_engine.py`
5. Add tests to `test_scheme_agent.py`
6. Update this README

## License

Part of the nitisaathi project for Nomura KakushIN 2026.
