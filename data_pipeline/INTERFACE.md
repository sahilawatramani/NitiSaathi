# Data Pipeline — Interface Spec v2 (Krisha)

Handoff doc for the data collection / preprocessing / feature engineering
layer. This is the v2, scaled-up version: 1,000 synthetic users x 2 years
of history, with worker-type/income-tier/volatility diversity, EMI, and
fraud-injection support. Covers what this pipeline produces, so Sahil
(Budget Agent, orchestration state) and Amit (Scheme Agent, Fraud Agent,
database) can build against a fixed schema.

## Scale
- 1,000 users, 104 weeks (2 years) of daily transaction history each
- ~984,000 individual transactions
- 104,940 weekly per-user summary rows

## Calibration note (for the methodology / compliance write-up)
Income tier ranges are grounded in public reporting on Indian gig-worker
income, not arbitrary guesses:
- Delivery partners' median monthly net earnings fall around ₹14,000-18,000
  after fuel/repair costs (industry reporting, 2026)
- ~40% of gig workers report earnings below ₹15,000/month (Economic Survey
  2025-26, cited via NITI Aayog-adjacent reporting)
- A 2024 NITI Aayog report found ~90% of gig workers lack savings, which is
  why balances in this dataset are deliberately kept thin rather than
  accumulating -- see the "informal borrowing" mechanic below.
This is still synthetic data -- these sources informed the *ranges*, not
individual transactions.

## Pipeline stages
1. `generate_mock_data.py` → `data/user_profiles.json`, `data/transactions.csv`,
   `data/transactions_sample.json` (small illustrative sample of the raw
   FinAssist-shaped payload)
2. `preprocessing.py` → `data/weekly_transactions.csv`
3. `feature_engineering.py` → `data/features.csv`

Run in order: `python3 generate_mock_data.py && python3 preprocessing.py && python3 feature_engineering.py`

Note: `data/transactions.csv` is ~91MB uncompressed; a gzipped copy
(`transactions.csv.gz`, ~15MB) is included for easier sharing. Decompress
with `gunzip -k transactions.csv.gz` before running preprocessing.py, or
point `load_transactions()` at the .gz path (pandas reads gzip natively).

## Schema: `user_profiles.json`
| field | type | notes |
|---|---|---|
| user_id | str | e.g. `user_0001` |
| age | int | includes deliberate boundary cases: 15, 16, 59, 60 |
| language_pref | str | `hi` (~50%) / `en` (~20%) / `mr` (~30%) |
| literacy_level | str | `low` / `medium` / `high` -- for explainability tuning |
| worker_type | str | `delivery` / `ride_hailing` / `platform_services` |
| income_tier | str | `low` (₹8k-15k/mo) / `mid` (₹15k-22k/mo) / `high` (₹22k-32k/mo) |
| volatility_band | str | `stable` / `moderate` / `volatile` |
| e_shram_registered | bool | |
| e_shram_registration_date | str (ISO date) or null | drives PMSBY annual-debit prediction |
| epfo_esic_status | bool | eligibility-blocking, FR-5.2 |
| income_tax_payer | bool | eligibility-blocking, FR-5.2 |
| aggregators | list[str] | 1-2 platforms, matched to worker_type |
| days_active_with_aggregator | int | includes deliberate boundary cases at 89/90/91 and 119/120/121 |
| opening_balance | float | |
| base_weekly_income | float | derived from income_tier |
| has_emi | bool | vehicle/tool loan flag |
| emi_amount | float | monthly EMI, 0 if has_emi is false |
| emi_remaining_months | int | |

**For Amit (Scheme Agent):** eligibility fields are `age`, `epfo_esic_status`,
`income_tax_payer`, `days_active_with_aggregator`, `e_shram_registered`.
The first ~12 users (`user_0001`-`user_0012`) are deliberately placed at
eligibility boundaries -- good fixed test cases for your rule engine.

## Schema: `transactions.csv` (raw FinAssist-shaped feed)
| field | type | notes |
|---|---|---|
| transaction_id | str | unique |
| user_id | str | |
| timestamp | str (ISO date) | daily granularity |
| amount | float | always positive; sign carried by `direction` |
| direction | str | `credit` / `debit` |
| category | str | `platform_payout`, `rent`, `fuel`, `recharge`, `food`, `discretionary`, `family_support`, `insurance_premium`, `loan_emi`, `informal_borrowing` |
| counterparty | str | aggregator / merchant / landlord / lender / PMSBY / family / friends |
| payment_mode | str | `UPI` |
| balance_after | float | running balance, kept bounded (roughly -₹10k to +₹22k) |
| is_flagged_anomaly | bool | **for Amit's Fraud Agent** |
| anomaly_type | str | one of `large_atypical_debit`, `rapid_micro_debits`, `new_counterparty_large_debit`, `duplicate_transaction`, or empty |

**For Amit (Fraud Agent):** ~5% of users have 3-6 injected anomalous
transactions each, labeled with ground truth (`is_flagged_anomaly` +
`anomaly_type`). Most users are clean -- deliberately imbalanced, so a
"flag everything" model won't score well. `data/weekly_transactions.csv`
also has an `anomaly_txn_count` rollup per user-week if a weekly-level
signal is more useful than row-level.

**Note on `informal_borrowing`:** this is a synthetic mechanic that
rescues a user's balance when it drops below -₹200, modeling reliance on
family/friends rather than letting balance spiral to an unrealistic
negative (see calibration note above). Frequency of this per user could
itself be a useful financial-stress feature -- flagging as a possible
follow-up.

## Schema: `weekly_transactions.csv` (per user, per week)
`user_id, week_start, total_income, total_expense, closing_balance,
anomaly_txn_count, exp_rent, exp_fuel, exp_recharge, exp_food,
exp_discretionary, exp_family_support, exp_insurance_premium, exp_loan_emi,
net_cashflow`

## Schema: `features.csv` (the one Budget/Nudge Agent should read from)
All `weekly_transactions.csv` columns, plus:

| feature | type | meaning |
|---|---|---|
| income_wma_4w | float | trailing 4-week weighted moving average of income -- FR-4.3 |
| predicted_next_week_income | float | = income_wma_4w |
| income_volatility_pct | float | coefficient of variation, trailing 8 weeks |
| savings_rate_recommendation | float | 0.20 / 0.10 / 0.05, scaled inversely to volatility -- FR-4.4 |
| low_balance_flag | bool | closing_balance < 30% of the user's own WMA income (relative, not a flat rupee amount -- income spans a 4x range across tiers) -- FR-4.5 |
| days_to_next_pmsby_debit | float (days) | countdown to next annual PMSBY debit |
| pmsby_debit_due_soon | bool | within 14 days |
| nudge_trigger_low_balance_before_debit | bool | **Nudge Agent's rule engine (FR-7.1) reads this directly** |
| has_active_emi | bool | from profile |
| monthly_emi_amount | float | from profile |
| emi_burden_pct | float | EMI as % of estimated monthly income |
| worker_type, income_tier, volatility_band, literacy_level, language_pref, age, epfo_esic_status, income_tax_payer, e_shram_registered, days_active_with_aggregator | -- | merged in from the profile, so agents don't need a separate join |

## Open items to confirm with the team
- [ ] Sahil: does `finassist_data` in the LangGraph state need this exact
      column shape, or should I pre-aggregate further?
- [ ] Amit: confirm the eligibility field names/types match your Scheme
      Agent rule engine, and whether the fraud-injection logic
      (`is_flagged_anomaly`/`anomaly_type`) is what your Fraud Agent
      actually needs, or if you want different anomaly categories.
- [ ] Agree on `LOW_BALANCE_RATIO` (currently 0.3, i.e. 30% of a typical
      week's income) as the shared definition of "low balance" across
      Budget and Nudge agents.
- [ ] Decide whether `informal_borrowing` frequency should become an
      official feature (financial-stress signal) or stays a background
      mechanic only.
- [ ] DPDP data-minimization note for the Week 7-8 compliance deliverable
      (NFR-1) -- this dataset carries no PII by construction (synthetic
      IDs only), worth stating explicitly in that write-up.
