# nitisaathi — Master Project Guide

**Version:** 1.0 | **Last Updated:** August 2026 | **Event:** Nomura KakushIN 2026

> This document is the single source of truth for the entire nitisaathi project. Every team member — regardless of which agent they are building — should read this fully before writing a single line of code.

---

## Table of Contents

1. [What We Are Building](#1-what-we-are-building)
2. [The Problem We Are Solving](#2-the-problem-we-are-solving)
3. [Target User — Rajesh](#3-target-user--rajesh)
4. [Project Structure](#4-project-structure)
5. [Data — What We Have and Where It Lives](#5-data--what-we-have-and-where-it-lives)
6. [Full System Architecture](#6-full-system-architecture)
7. [The Five Agents — What Each One Does](#7-the-five-agents--what-each-one-does)
8. [The Novel Architecture Components](#8-the-novel-architecture-components)
9. [The Multi-Agent Synthesizer — Deep Dive](#9-the-multi-agent-synthesizer--deep-dive)
10. [Budget Agent — Deep Dive](#10-budget-agent--deep-dive)
11. [LangGraph State Schema](#11-langgraph-state-schema)
12. [Technology Stack](#12-technology-stack)
13. [Functional Requirements](#13-functional-requirements)
14. [Non-Functional Requirements](#14-non-functional-requirements)
15. [Government Schemes Knowledge Base](#15-government-schemes-knowledge-base)
16. [Competitive Landscape](#16-competitive-landscape)
17. [Patent Claims and Paper Contributions](#17-patent-claims-and-paper-contributions)
18. [Timeline](#19-timeline)
19. [Testing Strategy](#20-testing-strategy)
2. [DPDP Compliance Checklist](#21-dpdp-compliance-checklist)

---


## 1. What We Are Building

nitisaathi is an AI-powered, multi-agent financial assistant built specifically for India's gig and informal workforce. It is not a generic finance app. Every design decision is made with one user in mind: a delivery partner or ride-hailing driver with irregular weekly income, low financial literacy, and no access to the financial tools built for salaried professionals.

The system has five specialist agents coordinated by a LangGraph orchestration layer:

- **Budget Agent** — models irregular income, forecasts cash flow, sends periodic PDF/email reports
- **Scheme Agent** — matches the user to gig-worker-specific government welfare schemes
- **Fraud Guard** — detects UPI scam patterns targeting gig workers
- **Nudge Agent** — proactively intervenes before problems happen (not after)
- **Literacy Agent** — translates every output to the user's language and literacy level

What makes nitisaathi genuinely different from everything else: it is **proactive, causal, and multi-agent**. It does not wait for the user to ask. It reasons about chains of financial consequences. And when a query touches multiple domains, multiple agents work in parallel and their outputs are synthesized — not just the highest-priority one picked.

---

## 2. The Problem We Are Solving

India's gig workforce: ~7.7 million workers in 2023, projected 23.5 million by 2030.

Three compounding problems this group faces that no existing fintech app addresses:

**Problem 1: Irregular income breaks every budgeting formula**
Standard budgeting apps (Jupiter, Fi Money, Jar) assume a fixed monthly salary. Gig workers earn daily via platform payouts that vary ±40% week to week. A monsoon week, a festival surge, a sick day — all create income swings that a "monthly budget" model cannot handle.

**Problem 2: Wrong schemes are being recommended (or none at all)**
Most scheme-recommendation tools are built for farmers (PM-KISAN) or salaried workers (EPF). Gig workers fall into a specific eligibility category — e-Shram, PM-SYM, PMSBY, APY, state welfare boards — that generic tools either miss or misclassify.

**Problem 3: UPI fraud hits gig workers disproportionately**
₹805 crore lost in first 8 months of FY26 alone. Gig workers are targeted specifically with fake KYC calls, fake QR codes, and task-based job scams. No existing consumer app has fraud detection tuned to these specific patterns.

The gap no one has closed: combining all three — irregular-income budgeting + gig-specific scheme eligibility + gig-targeted fraud detection — in a single proactive, multilingual system.

---

## 3. Target User — Rajesh

**Name:** Rajesh (composite persona)
**Occupation:** Delivery partner / ride-hailing driver
**Income:** ₹8,000–₹32,000/month, paid daily via platform UPI payouts
**Income pattern:** Highly volatile — good weeks ₹6,000, slow weeks ₹1,500, zero weeks during illness or monsoon
**Languages:** Hindi primary, basic English
**Literacy level:** Medium — comfortable with smartphone apps, limited formal financial education
**Financial stress points:**
- Does not know which week he can afford rent vs. which week he cannot
- Has heard of e-Shram but does not know if he is eligible or what it gives him
- Has received suspicious UPI payment requests but did not know they were scams
- Has no savings buffer — relies on family borrowing when balance runs out

**What nitisaathi does for Rajesh:**
- Automatically tracks his platform payouts and categorizes every expense
- Tells him each week: "Your predicted income next week is ₹3,200. With your rent due in 6 days, your discretionary budget is ₹400 this week."
- Tells him: "You are eligible for PMSBY accident cover. Your annual ₹20 debit is in 9 days — your current balance is ₹10. Top up before then or your cover lapses."
- Flags: "This UPI collect request looks like a fake refund scam. Do not enter your PIN."
- Sends him a monthly PDF report via email with his full spending breakdown, savings progress, and budget plan for next month.

---

## 4. Project Structure

```
Nitisaathi/                          ← project root
├── agents/
│   └── budget_agent/                ← FinAssist codebase (FastAPI + React)
│       ├── backend/
│       │   ├── app/
│       │   │   ├── agents/          ← expense_agent, insight_agent, tax_agent, interaction_agent
│       │   │   ├── routers/         ← API endpoints
│       │   │   ├── services/        ← business logic, LLM, RAG, forecast, SMS parser
│       │   │   ├── models/          ← SQLAlchemy DB models
│       │   │   └── schemas/         ← Pydantic schemas
│       │   ├── data/                ← all datasets (see Section 5)
│       │   ├── alembic/             ← DB migrations
│       │   └── tests/
│       └── frontend/                ← React + Vite dashboard UI
├── data_pipeline/                   ← Krisha's synthetic data scripts
│   ├── generate_mock_data.py
│   ├── preprocessing.py
│   ├── feature_engineering.py
│   ├── INTERFACE.md                 ← schema reference for all agents
│   └── data/                        ← pipeline outputs
│       ├── user_profiles.json       ← 1,000 gig worker profiles
│       ├── transactions.csv         ← 984k raw transactions
│       ├── weekly_transactions.csv  ← 104,940 weekly summaries
│       └── features.csv             ← 104,940 rows with WMA, volatility, nudge flags
└── docs/
    ├── sahai_updated_docs.md        ← original SRS
    └── MASTER_PROJECT_GUIDE.md      ← this file
```

**Important:** `agents/budget_agent/` contains the existing FinAssist codebase. It is the Budget Agent. The other four agents (Scheme, Fraud Guard, Nudge, Literacy) will be built as separate modules and wired into the LangGraph orchestration layer.

---

## 5. Data — What We Have and Where It Lives

### 5.1 Synthetic Pipeline Data (`data_pipeline/data/`)

Generated by Krisha's pipeline. Already generated — do not regenerate unless needed.

| File | Rows | Description |
|---|---|---|
| `user_profiles.json` | 1,000 | Gig worker profiles: age, income tier, volatility band, e-Shram status, EPFO status, EMI details |
| `transactions.csv` | 983,986 | Raw daily UPI transactions: direction (credit/debit), category, counterparty, balance_after, anomaly flags |
| `weekly_transactions.csv` | 104,940 | Per-user weekly rollup: total_income, total_expense, closing_balance, per-category spend |
| `features.csv` | 104,940 | Engineered features: income_wma_4w, income_volatility_pct, savings_rate_recommendation, low_balance_flag, nudge triggers |

**Transaction categories in the synthetic data:**
- Credits: `platform_payout`, `informal_borrowing`
- Debits: `fuel`, `recharge`, `food`, `discretionary`, `family_support`, `insurance_premium`, `loan_emi`, `rent`

**Anomaly labels** (ground truth for Fraud Guard):
- `large_atypical_debit`, `rapid_micro_debits`, `new_counterparty_large_debit`, `duplicate_transaction`
- ~5% of users have 3–6 injected anomalous transactions — deliberately imbalanced

**Key features in `features.csv`** (Budget Agent reads these directly):
- `income_wma_4w` — 4-week weighted moving average of income (FR-4.3)
- `predicted_next_week_income` = income_wma_4w
- `income_volatility_pct` — coefficient of variation over 8 weeks
- `savings_rate_recommendation` — 0.20 / 0.10 / 0.05 based on volatility (FR-4.4)
- `low_balance_flag` — closing_balance < 30% of income_wma_4w (FR-4.5)
- `days_to_next_pmsby_debit` — countdown to PMSBY annual debit
- `nudge_trigger_low_balance_before_debit` — combined trigger for Nudge Agent (FR-7.1)
- `emi_burden_pct` — EMI as % of monthly income
- Profile fields merged in: `worker_type`, `income_tier`, `age`, `epfo_esic_status`, `e_shram_registered`, etc.

### 5.2 Reference Datasets (`agents/budget_agent/backend/data/`)

| File | Rows | Used For |
|---|---|---|
| `financial_knowledge_base.csv` | 55 | RAG knowledge base — 30 general finance + 25 gig-worker specific (e-Shram, PM-SYM, PMSBY, APY, UPI fraud, welfare boards) |
| `upi_transactions_2024.csv` | 250,000 | Real-pattern UPI transactions with fraud_flag — for classifier training |
| `tax_rules.csv` | 28 | Indian tax sections (80C, 80D, HRA, etc.) for tax agent |
| `sample_indian_transactions.csv` | 500 | Testing expense classifier |
| `Financial Transaction Classification-banksim/` | — | Banksim fraud detection dataset |
| `Merchant & Text Understanding/` | — | Merchant categorization training data |

### 5.3 Regenerating the Pipeline

Only needed if `transactions.csv` is deleted or if you change `generate_mock_data.py`:

```bash
cd Nitisaathi/data_pipeline
python generate_mock_data.py    # ~5 min — generates transactions.csv
python preprocessing.py          # ~3 min — generates weekly_transactions.csv
python feature_engineering.py   # ~1 min — generates features.csv
```

---

## 6. Full System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         INPUT LAYER                             │
│  Voice (Bhashini ASR) │ Text │ SMS Parser │ CSV/FinAssist Feed  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PREPROCESSING                              │
│  Language Detection → Bhashini Translation → Intent Extraction  │
│  User Profile Load → Adaptive Persona State Update              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              INTENT CLASSIFIER + RELEVANCE GATING               │
│                                                                 │
│  Assigns relevance weight (0.0–1.0) per domain for this query   │
│  Agents below threshold (0.3) are skipped                       │
│  Example: "How to save this week?" →                            │
│    Budget: 0.9, Nudge: 0.7, Scheme: 0.4, Fraud: 0.1            │
└────────────────────────────┬────────────────────────────────────┘
                             │
              ┌──────────────┼─────────────────────┐
              │ fan-out (parallel, async)           │
              ▼              ▼                      ▼
     ┌──────────────┐ ┌────────────┐  ┌────────────────────┐
     │ Budget Agent │ │Scheme Agent│  │   Fraud Guard      │
     │              │ │            │  │                    │
     │ WMA engine   │ │ RAG lookup │  │ Rule engine +      │
     │ Causal chain │ │ Eligibility│  │ LLM classifier     │
     │ Temp. memory │ │ Joint bdgt │  │ Anomaly detection  │
     └──────┬───────┘ └─────┬──────┘  └────────┬───────────┘
            │               │                   │
            └───────────────┼───────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              COUNTERFACTUAL SIMULATION ENGINE                   │
│                                                                 │
│  Runs 3 "what-if" scenarios on the combined agent outputs       │
│  Ranks by outcome quality using user's own volatility model     │
│  Example: Take loan / Don't repair / Partial repair             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                MULTI-AGENT SYNTHESIZER                          │
│                                                                 │
│  1. Collect all agent responses (confidence + evidence)         │
│  2. Detect conflicts between agents                             │
│  3. Confidence-weighted merge                                   │
│  4. Causal chain injection from Budget Agent state              │
│  5. Temporal memory injection (recent + significant events)     │
│  6. Scenario ranking from Counterfactual Engine                 │
│  7. Generate unified response + explicit tradeoffs              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  TRUST CALIBRATION LAYER                        │
│                                                                 │
│  Data freshness tag: "Based on last 4 weeks, synced 2 days ago" │
│  Synthesis confidence score: explicit %                         │
│  Sensitivity statement: "Changes if income drops below ₹2,800" │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│               LITERACY AGENT (final pass)                       │
│                                                                 │
│  Rewrites output at user's literacy_level (low/medium/high)     │
│  Translates to user's language_pref (hi/en/mr)                  │
│  Adds advisory disclaimer on financial/scheme outputs           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       OUTPUT LAYER                              │
│  Chat response │ Dashboard charts │ Browser TTS │ Push notif.   │
│  PDF report (monthly/quarterly/yearly) → Email delivery         │
└─────────────────────────────────────────────────────────────────┘

                ↑ runs asynchronously in parallel ↑
┌─────────────────────────────────────────────────────────────────┐
│                     NUDGE AGENT                                 │
│  Monitors LangGraph state continuously                          │
│  Fires on: low_balance_flag, pmsby_debit_due_soon,              │
│            missed_goal, high_volatility_streak                  │
│  Logs outcome → feedback-calibrated suppression                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. The Five Agents — What Each One Does

This section defines the responsibility boundary for each agent. No agent owns another agent's logic. When two agents need the same data, they both read it from the shared LangGraph state — they do not call each other directly.

### 7.1 Budget Agent (Sahil)

**Owns:** Everything related to money in/money out for the individual user.

**Core responsibilities:**
- Ingests UPI transactions from SMS, CSV upload, or synthetic data feed
- Classifies every transaction into gig-specific categories (see below)
- Runs the 4-week Weighted Moving Average (WMA) engine on income — not expenses
- Computes income_volatility_pct (coefficient of variation over 8 weeks)
- Sets savings_rate_recommendation (20% / 10% / 5%) based on volatility band
- Sets low_balance_flag when closing_balance < 30% of income_wma_4w
- Maintains user saving goals in the DB
- Tracks custom user-defined categories (per-user DB table)
- Pushes real-time notification on every new transaction ingest
- Runs the causal chain reasoner — maps income shortfall to consequence chain → ranked interventions
- Updates financial_persona weekly (conservative / moderate / growth)
- Applies significance-weighted temporal memory with decay
- Generates PDF reports (monthly/quarterly/yearly) and emails them
- Provides get_finassist_data() bridge function for LangGraph state

**Transaction categories:**
| Category | Direction | Example |
|---|---|---|
| platform_payout | credit | Swiggy payout ₹840 |
| informal_borrowing | credit | Transfer from Suresh bhai |
| fuel | debit | Petrol ₹450 |
| recharge | debit | Jio recharge ₹239 |
| food | debit | Dhaba ₹85 |
| discretionary | debit | Clothing, entertainment |
| family_support | debit | Transfer to family |
| insurance_premium | debit | PMSBY debit ₹20 |
| loan_emi | debit | Vehicle EMI ₹3,200 |
| rent | debit | Monthly room rent ₹4,500 |

**What already exists (do not rebuild):**
- JWT auth endpoints
- CSV transaction upload + SMS parser
- Hybrid expense classifier (rule-based + LLM batch)
- Tax deductibility analysis per transaction
- RAG service (FAISS) + knowledge base
- LLM service (Gemini/OpenAI/Ollama)
- APScheduler (already configured)
- WebSocket realtime router
- In-app notification system

**What needs to be built (Sahil):**
1. Gig transaction ingestion service (reads synthetic data schema)
2. Variable income WMA engine (income-side only)
3. Volatility-adjusted savings rate calculator
4. Low-balance flag logic (relative to own WMA, not flat rupee threshold)
5. User saving goals model + API endpoints
6. Custom user categories DB table + classifier integration
7. Real-time push notification on transaction ingest
8. Causal chain reasoner
9. Adaptive persona tracker (weekly scheduled job)
10. PDF report generator (monthly/quarterly/yearly)
11. Email delivery service (SMTP/SendGrid)
12. Nudge outcome tracker table + weekly comparison job
13. LangGraph state bridge — get_finassist_data()

### 7.2 Scheme Agent (Amit)

**Owns:** Knowledge of government welfare schemes and eligibility logic for gig workers.

**Core responsibilities:**
- Maintains knowledge base: e-Shram, PM-SYM, PMSBY, PMJJBY, APY, state welfare boards
- Runs rule-based eligibility check against user profile fields
- Performs joint reasoning with Budget Agent state (e.g., "PM-SYM needs 14% savings but your volatility model recommends only 10% — wait 4 stable weeks")
- Timestamps all scheme information with "last verified" date (schemes change; stale advice is dangerous)
- Uses Code on Social Security 2020 worker classification

**Eligibility fields read from user profile:**
- `age` — must be 16–59 for e-Shram; 18–40 for PM-SYM and APY
- `epfo_esic_status` — if true, blocks most scheme eligibility
- `income_tax_payer` — if true, blocks most scheme eligibility
- `days_active_with_aggregator` — 90 days one platform OR 120 days multi-platform for Code on Social Security 2020
- `e_shram_registered` — prerequisite for PMSBY; needed for scheme access

**Joint reasoning example:**
```
User asks: "Should I enroll in PM-SYM?"
Scheme Agent: eligible = True, required_monthly_contribution = ₹55 (age 28)
Budget Agent state: savings_rate_recommendation = 0.10, income_wma_4w = ₹2,800/week
Savings available per month ≈ ₹1,120 (10% of ₹11,200)
PM-SYM contribution ₹55 < ₹1,120 → affordable IF income is stable for 4+ weeks

Joint output: "You are eligible for PM-SYM. Your contribution would be ₹55/month. 
Your income has been stable for 3 of the last 8 weeks. Recommend waiting 4 more 
stable weeks before auto-debit setup to avoid a missed debit penalty."
```

### 7.3 Fraud Guard (Amit)

**Owns:** Real-time and async fraud pattern detection on UPI transactions.

**Core responsibilities:**
- Detects UPI scam patterns specifically targeting gig workers
- Cross-references RBI registered lender whitelist / SEBI whitelist
- Never asks for UPI PIN or OTP — warns user explicitly if anyone else does
- Runs anomaly detection on transaction patterns using ground-truth labels from synthetic data
- Labels suspicious transactions for user review

**UPI scam patterns it must detect:**
1. **Fake KYC calls** — "Your UPI account will be blocked unless you complete KYC via this link"
2. **Fake QR overlays** — QR code placed over a legitimate merchant code at petrol pumps, food stalls
3. **Task-based job scams** — "Send ₹500 to activate your account, earn ₹5,000 back guaranteed"
4. **Fake refund requests** — "We accidentally sent you money, please send it back via UPI collect"
5. **Collect request from new counterparty with large amount** — flagged as `new_counterparty_large_debit`
6. **Rapid micro-debits** — multiple small debits in short window to same or new counterparty

**Ground truth in synthetic data:**
- `is_flagged_anomaly: true` + `anomaly_type` in transactions.csv
- 455 injected anomalous transactions across ~5% of users
- Deliberately imbalanced (most users are clean) — a "flag everything" model will not score well

**Hard rule (non-negotiable):**
```
NEVER ask the user for their UPI PIN or OTP.
If a message from any source (including this system) contains "enter your PIN" or 
"share your OTP", surface an immediate fraud alert regardless of source.
```

### 7.4 Nudge Agent (Krisha + Sahil)

**Owns:** Proactive, asynchronous financial interventions before problems occur.

**Core responsibilities:**
- Runs continuously in the background — does NOT wait for the user to ask a question
- Monitors LangGraph state for trigger conditions
- Fires nudge notifications to the user's device
- Logs every nudge with outcome tracking (was financial state better/worse N days later?)
- Suppresses nudge types that user has marked not-useful or that have low measured effectiveness

**Trigger conditions (read directly from features.csv columns):**
| Trigger | Source | Count in Dataset |
|---|---|---|
| `low_balance_flag = True` | features.csv | multiple times per user |
| `nudge_trigger_low_balance_before_debit = True` | features.csv | 464 user-weeks |
| `pmsby_debit_due_soon = True` (`days_to_next_pmsby_debit <= 14`) | features.csv | — |
| `missed_goal` | LangGraph state / goals DB | — |
| `high_volatility_streak` (volatility_band = 'volatile' for 3+ consecutive weeks) | derived | — |

**Nudge output format:**
```json
{
  "nudge_id": "nudge_20260815_u0042_lb01",
  "user_id": "user_0042",
  "nudge_type": "low_balance_before_debit",
  "message_hi": "आपका PMSBY का ₹20 का debit 9 दिन में है। आपका balance ₹10 है। कल की कमाई में से ₹20 बचाकर रखें।",
  "message_en": "Your PMSBY ₹20 annual debit is 9 days away. Balance is ₹10. Set aside ₹20 from tomorrow's payout.",
  "priority": "high",
  "fired_at": "2026-08-15T09:00:00+05:30",
  "outcome_check_at": "2026-08-24T09:00:00+05:30"
}
```

**Outcome tracker (creates labeled dataset for nudge effectiveness study):**
- At `outcome_check_at`, compare financial_state before vs. after nudge
- Metrics: balance improved / PMSBY did not lapse / goal progress / no new informal borrowing
- Result stored as `nudge_outcome` record → Paper Contribution 4

### 7.5 Literacy Agent (Krisha + Sahil)

**Owns:** The final output pass. Every response from every agent goes through Literacy Agent before reaching the user.

**Core responsibilities:**
- Reads `literacy_level` (low/medium/high) and `language_pref` (hi/en/mr) from user profile
- Rewrites outputs at appropriate complexity level
- Translates to preferred language using Bhashini API (or fallback templates)
- Explains gig-specific jargon in plain terms
- Adds advisory disclaimer to financial and scheme outputs

**Jargon simplification table:**
| Technical term | Low-literacy Hindi replacement |
|---|---|
| Platform payout | "Swiggy/Ola से मिला पैसा" |
| WMA forecast | "अगले हफ्ते का अनुमानित income" |
| Income volatility | "income का उतार-चढ़ाव" |
| Welfare cess | "कल्याण कर" |
| TDS deducted | "सरकार ने काटी हुई राशि" |
| Coefficient of variation | (never shown to user — internal only) |

**Advisory disclaimer (required on financial and scheme outputs):**
> "यह जानकारी सामान्य मार्गदर्शन के लिए है। किसी भी सरकारी योजना में दाखिला लेने से पहले आधिकारिक वेबसाइट पर जाँचें।"
> (This information is for general guidance only. Verify on the official website before enrolling in any government scheme.)

**Evaluation metric:** ROUGE/BLEU scores comparing simplified outputs to human-written reference summaries at each literacy level.

---

## 8. The Novel Architecture Components

These six components are what make nitisaathi original. Each one has a patent claim or paper contribution mapped to it.

### 8.1 Relevance-Gated Fan-Out

**What it does:** Before any agent runs, an intent classifier assigns a relevance weight (0.0–1.0) per agent domain for the current query. Any agent scoring below 0.3 is skipped entirely. Agents above the threshold run in parallel (async).

**Why it matters:** For a system with 5 agents, naively calling all 5 on every query would add latency and cost. This gate ensures only relevant agents are invoked, while preserving the ability to involve multiple agents when genuinely needed.

```python
# Intent classification output example
relevance_weights = {
    "budget": 0.92,    # "How much can I save this week?" — very relevant
    "nudge": 0.71,     # proactive nudge may apply
    "scheme": 0.41,    # scheme recommendation possibly relevant
    "fraud": 0.08,     # not relevant — skipped
    "literacy": 1.0    # always runs on output
}
THRESHOLD = 0.3
active_agents = [k for k, v in relevance_weights.items() if v >= THRESHOLD]
# active_agents = ["budget", "nudge", "scheme", "literacy"]
```

### 8.2 Multi-Agent Synthesizer

Covered in detail in Section 9.

### 8.3 Counterfactual Simulation Engine

**What it does:** Before generating a final recommendation, the engine runs 3 "what-if" scenarios using the user's own WMA/volatility model. It ranks scenarios by projected financial outcome and includes them in the response with an explanation of why alternatives were rejected.

**Why it matters:** Most finance apps tell users what to do. This engine shows users why the recommendation is better than the alternatives they might be considering — crucial for building trust with low-literacy users who have been burned by bad advice before.

```python
# Example: Rajesh's bike needs repair. Options:
scenarios = [
    {
        "name": "Take ₹5,000 loan",
        "action": "informal_loan_5000",
        "projected_balance_4w": 2100,
        "projected_emi_burden": 0.38,   # 38% of income — too high
        "risk": "HIGH — income volatility 28%, EMI may be unserviceable in low weeks"
    },
    {
        "name": "Skip repair, keep working",
        "action": "no_repair",
        "projected_income_impact": -0.22, # 22% income drop from bike downtime
        "projected_balance_4w": 800,
        "risk": "HIGH — continued degradation leads to full breakdown in 3-5 weeks"
    },
    {
        "name": "Partial repair ₹2,000 from savings",
        "action": "partial_repair_savings",
        "projected_balance_4w": 3200,
        "projected_income_impact": -0.04,
        "risk": "LOW — addresses immediate issue, defers full repair to stable week"
        # RECOMMENDED
    }
]
```

### 8.4 Trust Calibration Layer

**What it does:** Every synthesized response includes three transparency elements before reaching the user.

**Components:**
1. **Data freshness tag** — "Based on your last 28 transactions, most recent 2 days ago"
2. **Synthesis confidence score** — explicit percentage: "Confidence: 74%"
3. **Sensitivity statement** — "This recommendation changes if your income next week drops below ₹2,800"

**Why it matters (XAI contribution):** Explanation-by-contrast for financial advice in low-literacy contexts. The user does not just get a recommendation — they understand under what conditions the recommendation would be different. This is the Paper Contribution 5 (see Section 17).

```python
trust_metadata = {
    "data_freshness": "Last transaction: 2 days ago. WMA based on 28 days of data.",
    "confidence_score": 0.74,
    "confidence_label": "Moderate confidence",
    "sensitivity": "Recommendation changes if income_wma_4w drops below ₹2,800/week",
    "data_source_tags": ["features.csv week 104", "scheme_kb v2.1 verified 2026-07-01"]
}
```

### 8.5 Significance-Weighted Temporal Memory with Decay

**What it does:** The system remembers past events but weights recent events more heavily than old ones. Critically, some events — fraud, missed EMI, achieved goal — never fully decay below a floor weight.

**Formula:**
```
event_weight = base_weight × e^(−λ × days_since_event)
floor_weight = 0.1 for high-significance events (fraud, missed_emi, goal_achieved)
effective_weight = max(event_weight, floor_weight)
```

**λ (decay constant):** 0.05 by default — a 14-day-old normal event has ~50% of original weight.

**Event significance classes:**
| Event type | base_weight | Has floor? |
|---|---|---|
| fraud_incident | 1.0 | Yes (0.1) |
| missed_emi | 0.9 | Yes (0.1) |
| goal_achieved | 0.8 | Yes (0.1) |
| pmsby_lapsed | 0.85 | Yes (0.1) |
| high_volatility_week | 0.5 | No |
| low_balance_week | 0.4 | No |
| large_discretionary | 0.3 | No |

**Why this matters:** A fraud event two months ago should still influence how the system advises on suspicious transactions today. A low-balance week from 6 weeks ago should not dominate current advice when the user has recovered.

### 8.6 Feedback-Calibrated Nudge Engine

**What it does:** Closes the loop on every nudge that fires. The system checks financial state N days after each nudge and records whether the recommended action was taken and whether it helped. Nudge types with persistently low measured effectiveness are auto-suppressed.

**Loop:**
```
Fire nudge → user receives notification → [optional: user marks useful/not/harmful]
→ N days later: automated outcome check → compare financial_state before vs after
→ Update nudge_effectiveness_score per nudge_type
→ If effectiveness_score < threshold for 3 consecutive fires: suppress nudge_type
```

This creates a labeled dataset of (nudge_type, user_context, outcome) triples — the basis for Paper Contribution 4.

---

## 9. The Multi-Agent Synthesizer — Deep Dive

This is the most complex component in the system and the most important to get right. When multiple agents have responded to a query, their outputs must be merged intelligently — not just concatenated, not silently dominated by the highest-confidence agent.

### 9.1 What Each Agent Returns

Every agent returns a structured response object:

```python
# Agent response schema
AgentResponse = {
    "agent": str,               # "budget" | "scheme" | "fraud"
    "answer": str,              # the agent's answer text (pre-literacy)
    "confidence": float,        # 0.0 to 1.0
    "evidence": list[str],      # source citations or data references
    "conflicts_with": list[str] # names of other agents this output conflicts with
}

# Example — Budget Agent
{
    "agent": "budget",
    "answer": "Based on your 8-week volatility of 31%, recommend saving only 5% this week.",
    "confidence": 0.88,
    "evidence": ["income_wma_4w=2800", "income_volatility_pct=0.31", "features.csv row w104"],
    "conflicts_with": ["scheme"]  # budget says 5%, scheme needs 14% for PM-SYM
}

# Example — Scheme Agent
{
    "agent": "scheme",
    "answer": "You are eligible for PM-SYM. Monthly contribution ₹55 requires ~14% savings rate.",
    "confidence": 0.95,
    "evidence": ["user age=28", "epfo_esic=false", "income_tax_payer=false"],
    "conflicts_with": ["budget"]
}
```

### 9.2 Conflict Detection

The synthesizer checks `conflicts_with` fields and also independently detects conflicts by comparing numerical recommendations:

```python
def detect_conflicts(agent_outputs: dict) -> list[Conflict]:
    conflicts = []
    budget = agent_outputs.get("budget")
    scheme = agent_outputs.get("scheme")

    if budget and scheme:
        budget_savings_rate = budget["evidence"]["savings_rate_recommendation"]
        scheme_required_rate = scheme["evidence"].get("required_savings_rate")
        if scheme_required_rate and budget_savings_rate < scheme_required_rate:
            conflicts.append(Conflict(
                agents=["budget", "scheme"],
                description=f"Budget recommends {budget_savings_rate*100:.0f}% savings rate; "
                            f"PM-SYM enrollment needs {scheme_required_rate*100:.0f}%",
                severity="medium"
            ))
    return conflicts
```

### 9.3 Confidence-Weighted Merge

Conflicts are NOT silently resolved. They are surfaced to the user as explicit tradeoffs. However, the confidence scores do influence the framing:

```python
def merge_outputs(agent_outputs: dict, conflicts: list) -> SynthesisResult:
    # Weight each agent's contribution by confidence
    weighted_answers = [
        (out["answer"], out["confidence"]) 
        for out in agent_outputs.values()
    ]
    
    # Build primary answer from highest-confidence non-conflicting outputs
    primary = max(weighted_answers, key=lambda x: x[1])
    
    # Conflicts become explicit tradeoff statements in final response
    tradeoff_statements = [
        f"Note: {c.description}. You can choose to prioritize one or wait "
        f"until your income stabilizes for 4 weeks."
        for c in conflicts
    ]
    
    return SynthesisResult(
        primary_answer=primary[0],
        tradeoffs=tradeoff_statements,
        overall_confidence=sum(w for _, w in weighted_answers) / len(weighted_answers),
        causal_chain=state["causal_risk_chain"],
        temporal_context=[e for e in state["temporal_memory"] if e["effective_weight"] > 0.3]
    )
```

### 9.4 Causal Chain Injection

After merging agent answers, the synthesizer injects the current causal risk chain from Budget Agent state. This gives users a complete picture — not just "you have low balance" but the full consequence chain:

```python
# Example causal chain
causal_risk_chain = [
    {
        "trigger": "income_wma_4w dropped 22% over last 3 weeks",
        "consequence_1": "Rent payment in 8 days may not be covered",
        "consequence_2": "PMSBY debit in 9 days will fail if rent is paid first",
        "consequence_3": "PMSBY lapse → 12-month wait to re-enroll",
        "interventions_ranked": [
            "1. Reduce discretionary spend by ₹400 this week",
            "2. Request advance from platform (available to Swiggy Gold partners)",
            "3. Borrow ₹500 from family (informal, known counterparty)"
        ]
    }
]
```

### 9.5 Synthesis Result Schema

```python
class SynthesisResult(TypedDict):
    primary_answer: str             # main response text (pre-Literacy Agent)
    tradeoffs: list[str]            # explicit conflict statements
    counterfactual_scenarios: list  # from Counterfactual Engine
    causal_chain: list              # from Budget Agent state
    temporal_context: list          # significant recent events above weight threshold
    overall_confidence: float
    trust_metadata: dict            # freshness + sensitivity statement
    advisory_disclaimer: bool       # True if financial/scheme content present
```

---

## 10. Budget Agent — Deep Dive

The Budget Agent is built on top of the existing FinAssist codebase. This section documents the new components that must be built, their formulas, and their expected outputs.

### 10.1 WMA Engine (Income Only)

The 4-week Weighted Moving Average is applied to income credits only — platform_payout and informal_borrowing. It is NOT applied to expenses (expenses are tracked but not forecasted via WMA).

```python
def compute_income_wma_4w(weekly_income: list[float]) -> float:
    """
    Computes weighted moving average over last 4 weeks.
    Most recent week gets highest weight.
    weights: [1, 2, 3, 4] — most recent = 4
    """
    if len(weekly_income) < 4:
        return sum(weekly_income) / len(weekly_income)  # fallback: simple average
    
    last_4 = weekly_income[-4:]
    weights = [1, 2, 3, 4]
    wma = sum(w * v for w, v in zip(weights, last_4)) / sum(weights)
    return round(wma, 2)

# Example
weekly_income = [2200, 1800, 3100, 2600]  # oldest → newest
income_wma_4w = compute_income_wma_4w(weekly_income)
# = (1*2200 + 2*1800 + 3*3100 + 4*2600) / 10 = 25700 / 10 = 2570
```

### 10.2 Volatility and Savings Rate

```python
import numpy as np

def compute_volatility(weekly_income: list[float], window: int = 8) -> float:
    """Coefficient of variation over last 8 weeks (σ/μ)."""
    if len(weekly_income) < window:
        window = len(weekly_income)
    recent = weekly_income[-window:]
    cv = np.std(recent) / np.mean(recent) if np.mean(recent) > 0 else 0
    return round(cv, 4)

def savings_rate_recommendation(cv: float) -> float:
    """
    Volatility-adaptive savings rate.
    <15% CV  → stable income → save 20%
    15-30% CV → moderate    → save 10%
    >30% CV  → volatile     → save 5%
    """
    if cv < 0.15:
        return 0.20
    elif cv <= 0.30:
        return 0.10
    else:
        return 0.05
```

### 10.3 Low Balance Flag

```python
def compute_low_balance_flag(closing_balance: float, income_wma_4w: float) -> bool:
    """
    Flag if closing_balance < 30% of this week's predicted income.
    Uses relative threshold — adapts to each user's income level.
    A user earning ₹8k/week has a different 'low' than one earning ₹32k/week.
    """
    LOW_BALANCE_RATIO = 0.30
    threshold = income_wma_4w * LOW_BALANCE_RATIO
    return closing_balance < threshold
```

### 10.4 Causal Chain Reasoner

The causal chain reasoner maps the current financial state to a chain of potential consequences and produces ranked interventions. It runs as a LangGraph node — it reads state and writes to `causal_risk_chain`.

```python
def run_causal_chain_reasoner(state: NitisaathiState) -> NitisaathiState:
    fd = state["finassist_data"]
    chain = []
    
    if fd["low_balance_flag"]:
        # Identify upcoming mandatory debits
        upcoming_debits = get_upcoming_debits(state["user_id"])  # rent, EMI, PMSBY
        
        for debit in upcoming_debits:
            if fd["closing_balance"] < debit["amount"]:
                consequences = build_consequence_chain(debit, fd, state["user_profile"])
                chain.append({
                    "trigger": f"Balance ₹{fd['closing_balance']:.0f} below {debit['name']} ₹{debit['amount']:.0f}",
                    "due_in_days": debit["days_until_due"],
                    "consequences": consequences,
                    "interventions": rank_interventions(consequences, fd, state["user_profile"])
                })
    
    state["causal_risk_chain"] = chain
    return state
```

### 10.5 Adaptive Persona Tracker

Financial persona is updated weekly by a scheduled job. It reads the last 4 weeks of behavior and classifies the user's current financial stance.

```python
# Persona classification logic (simplified)
def classify_persona(weekly_data: list[dict]) -> str:
    avg_savings_rate = mean([w["savings_rate_actual"] for w in weekly_data[-4:]])
    avg_discretionary_pct = mean([w["discretionary_pct"] for w in weekly_data[-4:]])
    informal_borrow_count = sum(1 for w in weekly_data[-4:] if w["had_informal_borrowing"])
    
    if avg_savings_rate >= 0.15 and informal_borrow_count == 0:
        return "growth"       # actively saving, no emergency borrowing
    elif avg_savings_rate >= 0.05 and informal_borrow_count <= 1:
        return "moderate"     # some savings, occasional borrowing
    else:
        return "conservative" # survival mode — no savings buffer
```

### 10.6 PDF Report Structure

Monthly/quarterly/yearly reports generated via ReportLab or WeasyPrint, emailed via SMTP/SendGrid.

**Report sections:**
1. **Cover page** — month/quarter/year, user name, generated date
2. **Income Summary** — weekly income bar chart, WMA trend line, volatility summary
3. **Expense Breakdown** — pie chart by category, top 5 merchants
4. **Low Balance Weeks** — calendar view with flagged weeks highlighted
5. **Goal Progress** — progress bar for each active saving goal
6. **Scheme Nudges** — schemes checked this period + status (enrolled / pending / ineligible)
7. **Budget Plan for Next Period** — WMA-based income forecast + recommended category budgets
8. **Appendix** — full transaction list

### 10.7 LangGraph State Bridge

```python
# Called at the start of every LangGraph run to populate finassist_data
async def get_finassist_data(user_id: str, db: Session) -> dict:
    """
    Reads from the Budget Agent DB and features.csv equivalent to populate
    the finassist_data field in NitisaathiState.
    """
    latest_features = await db.query(UserWeeklyFeatures)\
        .filter(UserWeeklyFeatures.user_id == user_id)\
        .order_by(UserWeeklyFeatures.week_start.desc())\
        .first()
    
    goals = await db.query(UserGoal)\
        .filter(UserGoal.user_id == user_id, UserGoal.is_active == True)\
        .all()
    
    return {
        "income_wma_4w": latest_features.income_wma_4w,
        "income_volatility_pct": latest_features.income_volatility_pct,
        "savings_rate_recommendation": latest_features.savings_rate_recommendation,
        "low_balance_flag": latest_features.low_balance_flag,
        "closing_balance": latest_features.closing_balance,
        "predicted_next_week_income": latest_features.predicted_next_week_income,
        "pmsby_debit_due_soon": latest_features.pmsby_debit_due_soon,
        "days_to_next_pmsby_debit": latest_features.days_to_next_pmsby_debit,
        "nudge_trigger_low_balance_before_debit": latest_features.nudge_trigger_low_balance_before_debit,
        "goal_progress": [{"goal": g.name, "target": g.target_amount, 
                           "saved": g.saved_amount, "pct": g.saved_amount/g.target_amount} 
                          for g in goals],
        "financial_persona": latest_features.financial_persona,
        "week_start": str(latest_features.week_start)
    }
```

---

## 11. LangGraph State Schema

The LangGraph state is the shared memory of the entire system. All agents read from and write to this state. No agent should maintain its own hidden state outside this schema.

```python
from typing import TypedDict, Optional

class NitisaathiState(TypedDict):
    # Identity
    user_id: str
    
    # User profile — loaded from user_profiles.json schema
    # Contains: age, language_pref, literacy_level, worker_type, income_tier,
    #           volatility_band, e_shram_registered, epfo_esic_status, 
    #           income_tax_payer, aggregators, days_active_with_aggregator,
    #           has_emi, emi_amount, opening_balance
    user_profile: dict
    
    # Financial persona — updated weekly by adaptive persona tracker
    # Values: "conservative" | "moderate" | "growth"
    financial_persona: str
    
    # Budget Agent data bridge — populated by get_finassist_data() at session start
    # Contains: income_wma_4w, income_volatility_pct, savings_rate_recommendation,
    #           low_balance_flag, closing_balance, predicted_next_week_income,
    #           pmsby_debit_due_soon, days_to_next_pmsby_debit,
    #           nudge_trigger_low_balance_before_debit, goal_progress,
    #           financial_persona, week_start
    finassist_data: dict
    
    # Temporal memory — decaying event log
    # Each entry: {event_type, description, occurred_at, base_weight, 
    #              days_since_event, effective_weight}
    temporal_memory: list
    
    # Current consequence chain from causal chain reasoner
    # Each entry: {trigger, due_in_days, consequences, interventions_ranked}
    causal_risk_chain: list
    
    # Full conversation history for this session
    chat_history: list  # list of {role: "user"|"assistant", content: str}
    
    # Classified intent for the current message
    # Examples: "savings_advice", "scheme_eligibility", "fraud_check", 
    #           "expense_query", "general_chat"
    current_intent: str
    
    # Which agents are active for this query (populated by relevance gate)
    active_agents: list[str]
    
    # Per-agent response objects
    # Each key is agent name, value is AgentResponse dict
    agent_outputs: dict  # {agent_name: {answer, confidence, evidence, conflicts_with}}
    
    # Counterfactual scenarios from Counterfactual Engine
    # Each entry: {name, action, projected_balance_4w, risk, recommended: bool}
    counterfactual_scenarios: list
    
    # Final merged response from Multi-Agent Synthesizer
    # Contains: primary_answer, tradeoffs, overall_confidence, trust_metadata
    synthesis_result: dict
    
    # Pending nudge notifications
    nudge_queue: list  # list of Nudge objects waiting to be sent
    
    # User preferences (from user_profile, surfaced for convenience)
    language_pref: str   # "hi" | "en" | "mr"
    literacy_level: str  # "low" | "medium" | "high"
```

### 11.1 LangGraph Node Execution Order

```
load_user_profile
    → get_finassist_data
    → classify_intent + assign_relevance_weights
    → [parallel fan-out based on active_agents]:
        ├── budget_agent_node
        ├── scheme_agent_node
        └── fraud_guard_node
    → [join — wait for all active agents]
    → counterfactual_engine_node
    → synthesizer_node
    → trust_calibration_node
    → literacy_agent_node       ← always runs, final pass
    → [async, independent]:
        └── nudge_agent_node    ← monitors state, fires notifications
```

### 11.2 State Persistence

LangGraph checkpoints are persisted to SQLite in development (`data/langgraph_checkpoints.sqlite`) and PostgreSQL in production. This enables:
- Session resumption (user closes app mid-conversation)
- Temporal memory reconstruction across sessions
- Nudge outcome tracking across days

---

## 12. Technology Stack

### 12.1 Backend

| Component | Technology | Notes |
|---|---|---|
| Web framework | FastAPI (Python 3.10+) | Async, type-safe |
| Orchestration | LangGraph | Multi-agent state machine |
| ORM | SQLAlchemy + Alembic | Migrations in `alembic/versions/` |
| DB (dev) | SQLite | `data/finassist.db` |
| DB (prod) | PostgreSQL | Via `DATABASE_URL` env var |
| LLM (primary) | Gemini Flash | Via `GOOGLE_API_KEY` |
| LLM (fallback) | OpenAI GPT-4o-mini | Via `OPENAI_API_KEY` |
| LLM (local/offline) | Ollama | Via `OLLAMA_BASE_URL` |
| RAG vector store | FAISS | In-memory, rebuilt on startup |
| Scheduler | APScheduler | Already configured in `scheduler_service.py` |
| Auth | JWT (python-jose) | Access + refresh tokens |
| PDF generation | ReportLab or WeasyPrint | For monthly reports |
| Email | SMTP or SendGrid | Via `EMAIL_*` env vars |
| Voice input | Bhashini API | Hindi/Marathi ASR → text |
| SMS parsing | Custom parser | `sms_parser_service.py` — already exists |

### 12.2 Frontend

| Component | Technology | Notes |
|---|---|---|
| Framework | React 19 + Vite | `agents/budget_agent/frontend/` |
| Charts | Recharts | Income trend, expense pie chart |
| Animations | Framer Motion | Dashboard transitions |
| Icons | Lucide React | Consistent icon set |
| Real-time | WebSocket | Connects to `/ws/realtime` |
| State | React Context / hooks | No Redux needed at this scale |

### 12.3 Infrastructure

| Layer | Dev | Prod |
|---|---|---|
| Database | SQLite | PostgreSQL (Supabase or Railway) |
| LangGraph checkpoints | `langgraph_checkpoints.sqlite` | PostgreSQL table |
| File storage | Local `data/` directory | Object storage (S3/GCS) for PDFs |
| Hosting | Local / Uvicorn | Render, Railway, or GCP Cloud Run |
| Env config | `.env` (see `.env.example`) | Secrets manager |

### 12.4 Key Existing Services (Do Not Rebuild)

```
app/services/
├── llm_service.py         — Gemini/OpenAI/Ollama with fallback chain
├── rag_service.py         — FAISS index + query function
├── sms_parser_service.py  — UPI SMS → structured transaction
├── scheduler_service.py   — APScheduler with existing jobs
├── notification_service.py — In-app notification dispatch
├── auth_service.py        — JWT create/verify
├── forecast_service.py    — existing forecast logic (extend, don't replace)
└── analytics_service.py   — existing analytics (extend, don't replace)
```

### 12.5 Environment Variables

See `.env.example`. Key variables:

```bash
# LLM
GOOGLE_API_KEY=...
OPENAI_API_KEY=...
OLLAMA_BASE_URL=http://localhost:11434

# Database
DATABASE_URL=sqlite:///./data/finassist.db   # dev
# DATABASE_URL=postgresql://user:pass@host/db  # prod

# Auth
SECRET_KEY=...    # JWT signing key — must be long random string
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
# OR
SENDGRID_API_KEY=...

# Bhashini (voice)
BHASHINI_API_KEY=...
BHASHINI_USER_ID=...
```

---

## 13. Functional Requirements

These are the system's must-haves. Each FR maps to specific agent code and test cases.

### FR-4: Budget Agent

| ID | Requirement | Agent | Status |
|---|---|---|---|
| FR-4.1 | Ingest and categorize UPI transactions from SMS, CSV, and synthetic data feed | Budget | Build |
| FR-4.2 | Accept irregular/variable income — no fixed salary assumption | Budget | Build |
| FR-4.3 | Compute rolling 4-week WMA cash-flow forecast on income | Budget | Build |
| FR-4.4 | Compute volatility-adjusted savings rate recommendation | Budget | Build |
| FR-4.5 | Flag high-risk spending periods (low_balance_flag relative to own WMA) | Budget | Build |
| FR-4.6 | User saving goals: create, track progress, mark achieved | Budget | Build |
| FR-4.7 | Custom user categories per user, stored in DB | Budget | Build |
| FR-4.8 | Real-time push notification on every transaction ingest | Budget | Extend (notification_service exists) |
| FR-4.9 | Generate PDF reports (monthly / quarterly / yearly) | Budget | Build |
| FR-4.10 | Email PDF report to user | Budget | Build |
| FR-4.11 | Causal chain reasoner: map shortfall → consequence chain → ranked interventions | Budget | Build |
| FR-4.12 | Adaptive persona tracker: update financial_persona weekly | Budget | Build |

### FR-5: Scheme Agent

| ID | Requirement | Agent | Status |
|---|---|---|---|
| FR-5.1 | Maintain knowledge base of gig-worker welfare schemes (e-Shram, PM-SYM, PMSBY, PMJJBY, APY, state boards) | Scheme | Build |
| FR-5.2 | Rule-based eligibility check using user profile fields (age, epfo_esic, income_tax_payer, days_active) | Scheme | Build |
| FR-5.3 | Timestamp all scheme info with "last verified" date | Scheme | Build |
| FR-5.4 | Joint reasoning with Budget Agent state on affordability | Scheme | Build |

### FR-6: Fraud Guard

| ID | Requirement | Agent | Status |
|---|---|---|---|
| FR-6.1 | Detect UPI scam patterns: fake KYC, fake QR, task-based scams, fake refunds | Fraud | Build |
| FR-6.2 | Cross-reference RBI lender / SEBI whitelist | Fraud | Build |
| FR-6.3 | Never request UPI PIN or OTP; alert if any source does | Fraud | Build (hard rule) |
| FR-6.4 | Anomaly detection on transaction patterns using labeled ground truth | Fraud | Build |

### FR-7: Nudge Agent

| ID | Requirement | Agent | Status |
|---|---|---|---|
| FR-7.1 | Proactive nudge on low_balance_flag trigger | Nudge | Build |
| FR-7.2 | Proactive nudge when pmsby_debit_due_soon | Nudge | Build |
| FR-7.3 | Log every nudge; collect user feedback (useful / not useful / harmful) | Nudge | Build |
| FR-7.4 | Suppress nudge types with persistently low effectiveness | Nudge | Build |
| FR-7.5 | Automated outcome check N days after nudge | Nudge | Build |

### FR-8: Literacy Agent and Output

| ID | Requirement | Agent | Status |
|---|---|---|---|
| FR-8.1 | Dashboard with income trend chart, expense breakdown, goal progress, nudge history | Frontend | Build |
| FR-8.2 | Voice output support via browser TTS or Bhashini | Literacy | Build |
| FR-8.3 | Advisory disclaimer on all financial/scheme outputs | Literacy | Build |
| FR-8.4 | Jargon simplification for low-literacy users | Literacy | Build |
| FR-8.5 | Multi-language output (hi / en / mr) | Literacy | Build |

---

## 14. Non-Functional Requirements

| ID | Requirement | Target |
|---|---|---|
| NFR-1 | DPDP compliance: data minimization, consent, encryption at rest | All agents |
| NFR-2 | Response latency: query to final response | < 3 seconds |
| NFR-3 | Uptime | 99% (dev/demo target) |
| NFR-4 | LLM cost per query | Minimize via relevance gating — skip agents below threshold |
| NFR-5 | Offline fallback for scheme eligibility | Rule-based engine works without LLM |
| NFR-6 | Mobile-first UI | React dashboard must be usable on a mid-range Android device |
| NFR-7 | No PII in synthetic dataset | Synthetic IDs only — no real user data |
| NFR-8 | All agent outputs must pass through Literacy Agent | Hard architectural constraint |
| NFR-9 | Scheme knowledge base must be versioned with "last verified" dates | Stale scheme info is a compliance risk |
| NFR-10 | PDF reports accessible offline | Generated PDF stored locally or in object store |

---

## 15. Government Schemes Knowledge Base

This is the core reference for the Scheme Agent. All scheme data must be versioned with a `last_verified` date because eligibility rules change frequently.

### 15.1 e-Shram

| Field | Value |
|---|---|
| Full name | e-Shram National Database of Unorganized Workers |
| Eligibility | Age 16–59; NOT EPFO/ESIC registered; NOT income tax payer |
| Benefits | Accident cover linkage; gateway to other schemes (PMSBY, PM-SYM) |
| Registration | Free at Common Service Centre or e-shram.gov.in |
| Document | Aadhaar + bank account mandatory |
| Last verified | 2026-07-01 |

### 15.2 PM-SYM (PM Shram Yogi Maan-Dhan)

| Field | Value |
|---|---|
| Full name | Pradhan Mantri Shram Yogi Maan-Dhan |
| Eligibility | Age 18–40; unorganized worker; monthly income < ₹15,000 |
| Benefits | ₹3,000/month pension after age 60 |
| Contribution | Age-based; e.g., ₹55/month at age 28, ₹200/month at age 40 |
| Government match | Govt matches employee contribution 1:1 |
| Enrollment | CSC or Jan Suraksha portal |
| Joint reasoning | Budget Agent must confirm savings rate can sustain contribution before enrolling |
| Last verified | 2026-07-01 |

### 15.3 PMSBY (PM Suraksha Bima Yojana)

| Field | Value |
|---|---|
| Full name | Pradhan Mantri Suraksha Bima Yojana |
| Eligibility | e-Shram registered; bank account with auto-debit consent |
| Benefits | ₹2 lakh accidental death/disability cover |
| Premium | ₹20/year (auto-debited annually on e-Shram registration anniversary) |
| Critical alert | If balance < ₹20 on debit date, cover lapses for full year |
| Nudge trigger | `pmsby_debit_due_soon` = True when <= 14 days away |
| Last verified | 2026-07-01 |

### 15.4 PMJJBY (PM Jeevan Jyoti Bima Yojana)

| Field | Value |
|---|---|
| Full name | Pradhan Mantri Jeevan Jyoti Bima Yojana |
| Eligibility | Age 18–50; savings bank account with auto-debit consent |
| Benefits | ₹2 lakh life insurance cover |
| Premium | ₹436/year — auto-debited on June 1st every year |
| Last verified | 2026-07-01 |

### 15.5 APY (Atal Pension Yojana)

| Field | Value |
|---|---|
| Full name | Atal Pension Yojana |
| Eligibility | Age 18–40; not an income tax payer; has bank account |
| Benefits | Guaranteed ₹1,000–₹5,000/month pension after age 60 (choice of amount) |
| Contribution | Age and pension amount dependent (higher pension / younger entry = lower contribution) |
| Government co-contribution | 50% of contribution or ₹1,000/year — for 5 years, for non-income-tax-payers |
| Last verified | 2026-07-01 |

### 15.6 State Welfare Boards

| State | Status | Notes |
|---|---|---|
| Rajasthan | Active (2023) | Welfare cess on aggregator transactions |
| Karnataka | Active (Aug 2025) | Platform-level aggregator welfare cess |
| Bihar | Active (Aug 2025) | Registration at state labor portal |
| Jharkhand | Active (Aug 2025) | — |
| Telangana | Active (2026) | — |

### 15.7 Code on Social Security 2020

**Key eligibility clause for gig worker classification:**
- Worker status under Code on Social Security 2020 (effective November 2025):
  - 90 days with ONE aggregator platform, OR
  - 120 days across MULTIPLE platforms (cumulative)
- This classification unlocks access to welfare board schemes
- Boundary test cases: users with 89/90/91 days and 119/120/121 days in profiles (`user_0001`–`user_0012`)

```python
def is_gig_worker_under_code_2020(days_one: int, days_multi: int) -> bool:
    return days_one >= 90 or days_multi >= 120
```

---

## 16. Competitive Landscape

Understanding where existing apps fail for gig workers is important context for the demo and paper.

| App | What it does | Why it fails for gig workers |
|---|---|---|
| Jupiter | Smart banking + budgeting | Fixed monthly income assumption; no irregular income model |
| Fi Money | Goal-based savings, analytics | Fixed income assumption; no scheme or fraud agent |
| Jar | Passive micro-savings (rounds up) | Savings only; no scheme eligibility; no fraud detection; no advisory |
| PhonePe / Paytm | UPI payments, insurance marketplace | Payment rails, not advisory; insurance is passive discovery, not eligibility-mapped |
| NavaNiti | Closest competitor — scheme info for gig workers | **Reactive only** (answers when asked); no nudge engine; no LangGraph; no Budget Agent; no fraud detection |

**The gap nitisaathi closes:** ProACTIVE + CAUSAL + MULTI-AGENT. NavaNiti tells you about schemes when you ask. nitisaathi notices you have ₹10 balance and a ₹20 PMSBY debit in 9 days and tells you before you lose your cover.

---

## 17. Patent Claims and Paper Contributions

### 17.1 Patent Claims (6)

These six claims describe novel computational methods that are specific, implementable, and non-obvious.

| # | Claim | Implemented In |
|---|---|---|
| 1 | **Method for causal chain financial risk prediction for irregular-income workers** — maps income shortfall to downstream consequence chains with ranked interventions | Budget Agent — causal_chain_reasoner node |
| 2 | **Volatility-adaptive financial persona state machine** — transitions between conservative/moderate/growth states based on CV thresholds computed from rolling income windows | Budget Agent — adaptive_persona_tracker job |
| 3 | **Feedback-calibrated proactive nudge system with counterfactual outcome tracking** — closed-loop nudge engine that self-suppresses based on measured intervention effectiveness | Nudge Agent — nudge_outcome_tracker |
| 4 | **Conflict-aware multi-agent synthesis with tradeoff surfacing** — detects cross-agent recommendation conflicts and surfaces them as explicit user-facing tradeoffs rather than silently resolving | Multi-Agent Synthesizer |
| 5 | **Significance-weighted temporal financial memory with adaptive decay** — event importance degrades exponentially over time with a non-zero floor for high-significance events | Budget Agent — temporal_memory module |
| 6 | **Counterfactual scenario simulation using user-specific volatility models** — generates ranked what-if scenarios using the individual user's own WMA and CV rather than population averages | Counterfactual Engine |

### 17.2 Paper Contributions (5)

Target venue: CIKM 2027, ACL FinNLP Workshop, or AAAI IAAI 2027.

| # | Contribution | What Makes It Novel |
|---|---|---|
| 1 | **First proactive causal multi-agent financial system for gig workers** | Prior systems are reactive (answer when asked). This system monitors state and intervenes before financial damage occurs. |
| 2 | **First conflict-aware synthesis with explicit tradeoff surfacing in consumer fintech** | Multi-agent systems typically pick a winner or average. This system surfaces conflicts to users and shows the tradeoff, improving trust and decision quality. |
| 3 | **First counterfactual financial scenario engine using individual WMA models** | Existing counterfactual tools use population models. This system uses each user's own income trajectory for personalized scenario projection. |
| 4 | **First empirical nudge effectiveness study with closed-loop outcome tracking** | Existing nudge research is observational. This system creates a labeled (nudge, context, outcome) dataset with ground truth from actual balance changes. |
| 5 | **Explanation-by-contrast for financial advice transparency in low-literacy contexts** | XAI for finance typically uses SHAP/LIME for model explanation. This paper proposes explanation-by-contrast — telling users not just what to do, but what condition would make the advice different. |

### 17.3 Evaluation Metrics

| Component | Metric | Target |
|---|---|---|
| Fraud Guard | Precision / Recall on 455 labeled anomalies | Recall > 0.85 (missing fraud is worse than false alarm) |
| Scheme Agent | Eligibility accuracy on users 0001–0012 boundary cases | 100% on deterministic rules |
| Nudge Agent | Positive outcome rate (balance improved after nudge) | Measure — no prior baseline |
| Literacy Agent | ROUGE-L vs. human reference summaries | > 0.60 |
| Synthesis | Conflict detection accuracy (manually labeled test set) | > 0.90 |
| Latency | End-to-end query response time | < 3 seconds P95 |

---


## 18. Timeline

| Week | Phase | Key Deliverables |
|---|---|---|
| Week 1 | Foundation | SRS, docs, project setup ✅ |
| Week 2 | Design | HLD, LLD, API contracts between agents |
| Week 2–3 | Planning | WBS, Risk Register, test plan |
| Week 3–5 | **Build Sprint 1** | Budget Agent (WMA + volatility + goals + persona + PDF), Literacy Agent skeleton |
| Week 5–7 | **Build Sprint 2** | Scheme Agent, Fraud Guard, Nudge Agent, Multi-Agent Synthesizer, Counterfactual Engine, Trust Calibration Layer |
| Week 7–8 | Compliance + Testing | DPDP audit, pytest suite, latency benchmarks, ROUGE/BLEU evaluation |
| Week 8–9 | Pitch prep + demo | Demo video, presentation, final integration test |
| Week 9 | Final report | Paper draft, patent claim write-up, project report submission |

### Sprint 1 Exit Criteria (end of Week 5)

- [ ] Budget Agent running with real synthetic data from `features.csv`
- [ ] WMA correctly computed for all 1,000 users (diff against features.csv values)
- [ ] Savings rate correctly assigned (20/10/5%) per volatility band
- [ ] Low-balance flag firing for correct user-weeks (validate against features.csv `low_balance_flag`)
- [ ] At least one saving goal creatable via API and visible in dashboard
- [ ] PDF report generates for at least one user without error
- [ ] `get_finassist_data()` returns correct schema for 3 test users
- [ ] Literacy Agent simplifies one test output to Hindi low-literacy level

### Sprint 2 Exit Criteria (end of Week 7)

- [ ] All 5 agents running end-to-end on 3 test user profiles
- [ ] Conflict detection working for the Budget/Scheme PM-SYM scenario
- [ ] Counterfactual Engine generating 3 scenarios for a test query
- [ ] 464 nudge trigger user-weeks produce nudge notifications (Nudge Agent evaluation)
- [ ] Fraud Guard recall > 0.80 on 455 labeled anomalies
- [ ] LangGraph graph persisting state to checkpoints correctly
- [ ] Response latency < 3 seconds on local machine for a multi-agent query

### Risk Register (Top 5)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Gemini Flash API rate limits slow demo | Medium | High | Cache responses for demo users; Ollama local fallback |
| features.csv not aligned with Budget Agent DB schema | Low | High | Use INTERFACE.md as contract; validate week 3 |
| Scheme rules change before submission | Medium | Medium | Timestamp + version all scheme data; easy to update |
| PDF generation too slow (>3s) | Low | Medium | Generate async (background job) + email; don't block chat response |
| LangGraph fan-out adds >1s latency | Medium | High | Benchmark early (week 3); add Redis for parallel agent caching if needed |

---

## 19. Testing Strategy

### 19.1 Unit Tests — Deterministic Logic (Pytest)

These tests must be deterministic — no LLM calls, no randomness. Run in CI on every commit.

```python
# tests/test_wma_engine.py
def test_wma_4w_basic():
    weekly_income = [2200, 1800, 3100, 2600]
    result = compute_income_wma_4w(weekly_income)
    assert result == 2570.0  # (1*2200 + 2*1800 + 3*3100 + 4*2600) / 10

def test_wma_4w_less_than_4_weeks():
    weekly_income = [2500, 3000]
    result = compute_income_wma_4w(weekly_income)
    assert result == 2750.0  # fallback: simple average

def test_volatility_low():
    weekly_income = [3000, 3100, 2900, 3050, 3000, 2950, 3100, 3000]
    cv = compute_volatility(weekly_income)
    assert cv < 0.05  # very stable income

def test_savings_rate_stable():
    assert savings_rate_recommendation(0.10) == 0.20  # CV < 0.15

def test_savings_rate_moderate():
    assert savings_rate_recommendation(0.22) == 0.10  # CV 15-30%

def test_savings_rate_volatile():
    assert savings_rate_recommendation(0.35) == 0.05  # CV > 30%

def test_low_balance_flag_fires():
    assert compute_low_balance_flag(800, 3000) == True  # 800 < 30% of 3000 = 900

def test_low_balance_flag_clear():
    assert compute_low_balance_flag(1500, 3000) == False  # 1500 > 900
```

```python
# tests/test_scheme_eligibility_boundaries.py
# Tests users 0001-0012 from user_profiles.json — deliberate edge cases

def test_age_15_ineligible():
    user = load_profile("user_0001")  # age=15
    assert not is_eligible_eshram(user)

def test_age_16_eligible():
    user = load_profile("user_0002")  # age=16
    assert is_eligible_eshram(user)

def test_age_59_eligible():
    user = load_profile("user_0003")  # age=59
    assert is_eligible_eshram(user)

def test_age_60_ineligible():
    user = load_profile("user_0004")  # age=60
    assert not is_eligible_eshram(user)

def test_days_active_89_ineligible():
    user = load_profile("user_0005")  # days_active=89
    assert not is_gig_worker_under_code_2020(user["days_active_with_aggregator"], 0)

def test_days_active_90_eligible():
    user = load_profile("user_0006")  # days_active=90
    assert is_gig_worker_under_code_2020(user["days_active_with_aggregator"], 0)

def test_epfo_registered_blocks_eligibility():
    user = load_profile("user_0009")  # epfo_esic_status=True
    assert not is_eligible_eshram(user)
```

### 19.2 Fraud Guard Evaluation

Ground truth: `is_flagged_anomaly` and `anomaly_type` columns in `transactions.csv`.
455 injected anomalies across ~5% of users. Dataset is deliberately imbalanced.

```python
# tests/test_fraud_guard.py
def test_fraud_guard_recall():
    """Recall must be > 0.85 — missing fraud is worse than false positives."""
    transactions = load_test_transactions()  # includes 455 labeled anomalies
    flagged = [t for t in transactions if fraud_guard.is_suspicious(t)]
    true_positives = sum(1 for t in flagged if t["is_flagged_anomaly"])
    all_positives = sum(1 for t in transactions if t["is_flagged_anomaly"])
    recall = true_positives / all_positives
    assert recall > 0.85, f"Fraud Guard recall {recall:.2f} below threshold 0.85"

def test_fraud_guard_never_asks_for_pin():
    """Hard rule: no Fraud Guard output should ever contain a PIN request."""
    suspicious_tx = create_fake_kyc_transaction()
    response = fraud_guard.analyze(suspicious_tx)
    assert "PIN" not in response["alert_message"]
    assert "OTP" not in response["alert_message"]
    assert response["warns_about_pin"] == True  # should warn, not ask
```

### 19.3 Nudge Agent Evaluation

464 user-weeks in `features.csv` have `nudge_trigger_low_balance_before_debit = True`.

```python
# tests/test_nudge_agent.py
def test_nudge_fires_for_all_464_trigger_weeks():
    features = load_features_csv()
    trigger_weeks = features[features["nudge_trigger_low_balance_before_debit"] == True]
    assert len(trigger_weeks) == 464

    fired_nudges = []
    for _, row in trigger_weeks.iterrows():
        nudge = nudge_agent.evaluate_triggers(row.to_dict())
        if nudge:
            fired_nudges.append(nudge)
    
    # All 464 trigger weeks should produce a nudge
    assert len(fired_nudges) == 464

def test_nudge_suppressed_after_low_effectiveness():
    """If a nudge type has been marked not-useful 3+ times, suppress it."""
    nudge_engine = NudgeEngine()
    for _ in range(3):
        nudge_engine.record_outcome("low_balance", effective=False)
    
    nudge = nudge_engine.evaluate({"low_balance_flag": True, "nudge_trigger_low_balance_before_debit": False})
    assert nudge is None  # suppressed
```

### 19.4 Literacy Agent Evaluation

```python
# tests/test_literacy_agent.py
def test_hindi_low_literacy_output():
    """Output must be in Hindi and avoid financial jargon."""
    response = literacy_agent.rewrite(
        text="Your income_wma_4w is ₹2,800 with coefficient of variation 0.31.",
        literacy_level="low",
        language_pref="hi"
    )
    assert "income_wma_4w" not in response       # jargon removed
    assert "coefficient of variation" not in response  # jargon removed
    assert any(c in response for c in "अआइईउऊ")  # Hindi characters present

def test_advisory_disclaimer_present():
    """All scheme outputs must include disclaimer."""
    response = literacy_agent.rewrite(
        text="You are eligible for PM-SYM.",
        literacy_level="medium",
        language_pref="hi",
        has_scheme_content=True
    )
    assert "सामान्य मार्गदर्शन" in response or "general guidance" in response.lower()
```

### 19.5 End-to-End Latency Test

```python
# tests/test_latency.py
import time

def test_end_to_end_latency():
    """Full query must complete in < 3 seconds."""
    start = time.time()
    response = nitisaathi_graph.invoke({
        "user_id": "user_0042",
        "chat_history": [],
        "current_intent": "",
        "message": "How much can I save this week?"
    })
    elapsed = time.time() - start
    assert elapsed < 3.0, f"Latency {elapsed:.2f}s exceeds 3s target"
    assert response["synthesis_result"]["primary_answer"] != ""
```

### 19.6 Running Tests

```bash
cd Nitisaathi/agents/budget_agent/backend

# All unit tests (no LLM)
pytest tests/ -v --ignore=tests/test_latency.py

# Boundary tests for Scheme Agent (requires user_profiles.json in path)
pytest tests/test_scheme_eligibility_boundaries.py -v

# Fraud Guard evaluation (requires transactions.csv)
pytest tests/test_fraud_guard.py -v

# Full integration including latency (requires running server)
pytest tests/test_latency.py -v
```

---

## 20. DPDP Compliance Checklist

The Digital Personal Data Protection Act 2023 (DPDP) applies to this system. The following checklist must be addressed before Week 8 compliance review.

### 20.1 Data Minimization

Each agent must receive only the data fields it needs — not the full user profile.

| Agent | Fields it needs | Fields it must NOT receive |
|---|---|---|
| Budget Agent | user_id, financial transactions, income_tier, has_emi, emi_amount | age, language_pref, aggregator details |
| Scheme Agent | user_id, age, epfo_esic_status, income_tax_payer, days_active_with_aggregator, e_shram_registered | individual transactions, balance data |
| Fraud Guard | transaction details, counterparty, amount, pattern history | age, language_pref, EMI details |
| Nudge Agent | user_id, nudge trigger flags from finassist_data | raw transaction list, scheme details |
| Literacy Agent | output text, literacy_level, language_pref | financial data, eligibility data |

**Implementation:** LangGraph state is the full state. Each agent node receives only its required fields via a scoped state accessor function — not the full `NitisaathiState` dict.

### 20.2 Consent Requirements

Per DPDP, consent must be:
- **Free** — not conditional on using the service for non-essential data
- **Specific** — separate consent for each data processing purpose
- **Informed** — plain language, in the user's language
- **Revocable** — user can withdraw at any time; system must stop processing within reasonable time

**Consent flows to implement:**
- [ ] Transaction data collection (SMS, CSV upload)
- [ ] Scheme eligibility check (requires profile fields: age, income, employment status)
- [ ] Fraud detection (requires transaction history analysis)
- [ ] Nudge notifications (push notifications)
- [ ] PDF report generation and email
- [ ] Periodic analytics (weekly persona update)

### 20.3 Encryption at Rest

- [ ] Database (SQLite dev / PostgreSQL prod) — enable encryption or use encrypted volume
- [ ] PDF reports stored in object storage — enable server-side encryption
- [ ] JWT secret key — stored in environment variable, never in code or DB

### 20.4 Data Retention

Document for compliance write-up:

| Data type | Retention period | Why |
|---|---|---|
| Individual transactions | 3 years | Tax filing support |
| Weekly aggregates | 3 years | PDF report generation |
| Nudge logs | 1 year | Effectiveness analysis |
| Chat history | 90 days | Conversation context |
| LangGraph checkpoints | 7 days | Session resumption |
| PDF reports | As long as user requests | User's right to access |

### 20.5 Synthetic Data Note

The synthetic dataset (`user_profiles.json`, `transactions.csv`, `features.csv`) contains **no real PII**:
- User IDs are synthetic (`user_0001`–`user_1000`)
- No real names, phone numbers, Aadhaar, or bank account numbers
- No real UPI handles
- Income ranges informed by published public research — not from real user data

This must be explicitly stated in the project report and any academic submission.

### 20.6 Right to Erasure

- [ ] `DELETE /api/v1/user/{user_id}` endpoint must cascade-delete all user data
- [ ] Nudge logs, chat history, LangGraph checkpoints, transaction records — all must be deleted
- [ ] PDF reports — link must be invalidated; file deleted from storage

---



## Appendix A: Quick Reference — Key Numbers

| Metric | Value |
|---|---|
| Synthetic users | 1,000 |
| Total transactions | ~984,000 |
| Weekly summaries | 104,940 |
| Features rows | 104,940 |
| Fraud anomalies (labeled) | 455 |
| Nudge trigger user-weeks | 464 (nudge_trigger_low_balance_before_debit = True) |
| Income range | ₹8,000–₹32,000/month |
| WMA window | 4 weeks (income only) |
| Volatility window | 8 weeks |
| Savings rate thresholds | CV < 15% → 20%; 15–30% → 10%; > 30% → 5% |
| Low balance threshold | closing_balance < 30% of income_wma_4w |
| PMSBY nudge window | 14 days before annual debit |
| Response latency target | < 3 seconds (P95) |
| Relevance gate threshold | 0.3 — agents below this are skipped |
| Temporal decay constant λ | 0.05 (default) |
| Significance floor weight | 0.1 for high-significance events |

---

## Appendix B: File Locations Quick Reference

| What | Where |
|---|---|
| LangGraph graph definition | `agents/budget_agent/backend/app/orchestration/graph.py` (to be created) |
| LangGraph state schema | `agents/budget_agent/backend/app/orchestration/state.py` (to be created) |
| Budget Agent WMA engine | `agents/budget_agent/backend/app/services/wma_service.py` (to be created) |
| Scheme knowledge base | `agents/budget_agent/backend/data/schemes_kb.json` (to be created by Amit) |
| Fraud patterns config | `agents/budget_agent/backend/app/agents/fraud_guard/patterns.py` (to be created) |
| Nudge rules config | `agents/budget_agent/backend/app/agents/nudge_agent/rules.py` (to be created) |
| Synthetic data | `data_pipeline/data/` |
| Data pipeline interface | `data_pipeline/INTERFACE.md` |
| Original SRS | `docs/sahai_updated_docs.md` |
| This document | `docs/MASTER_PROJECT_GUIDE.md` |
| Budget Agent frontend | `agents/budget_agent/frontend/` |
| Budget Agent backend | `agents/budget_agent/backend/` |
| Alembic migrations | `agents/budget_agent/backend/alembic/versions/` |
| Test suite | `agents/budget_agent/backend/tests/` |

---

*Last updated: August 2026. Maintained by the nitisaathi team. If you change a schema, formula, or interface, update this document on the same day.*
