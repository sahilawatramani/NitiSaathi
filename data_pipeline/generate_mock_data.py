"""
generate_mock_data.py (v2)
---------------------------
Generates mock FinAssist-style data for SahAI at a scale + diversity
meant to actually stress-test the Budget/Nudge/Scheme/Fraud agents,
not just produce a demo snapshot.

Income tiers and typical monthly earnings are calibrated against public
reporting on Indian gig-worker income (NITI Aayog 2024, Economic Survey
2025-26) -- see INTERFACE.md for sources and caveats. This is still
synthetic data; the calibration just keeps the *ranges* realistic.

Output:
  data/user_profiles.json     (1,000 rows -- small, kept as JSON)
  data/transactions.csv       (bulk feed -- CSV, streamed to control memory)
  data/transactions_sample.json  (first ~50 records, illustrates raw
                                   FinAssist-shaped payload for docs)
"""

import csv
import json
import random
from datetime import date, timedelta

import numpy as np

random.seed(42)
np.random.seed(42)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
NUM_USERS = 1000
SIM_WEEKS = 104  # 2 years of history
SIM_START = date.today() - timedelta(weeks=SIM_WEEKS)
TODAY = date.today()

LANGUAGES = ["hi", "hi", "hi", "hi", "hi", "en", "en", "mr", "mr", "mr"]  # ~50/20/30 weighted
LITERACY_LEVELS = ["low"] * 35 + ["medium"] * 45 + ["high"] * 20  # weighted pool

WORKER_TYPES = {
    "delivery": {"aggregators": ["Zomato", "Swiggy", "Blinkit", "Zepto"], "share": 0.50},
    "ride_hailing": {"aggregators": ["Ola", "Uber", "Rapido"], "share": 0.30},
    "platform_services": {"aggregators": ["Urban Company"], "share": 0.20},
}

# monthly net-income ranges (INR), calibrated against public reporting
INCOME_TIERS = {
    "low": {"monthly_range": (8000, 15000), "share": 0.40},
    "mid": {"monthly_range": (15000, 22000), "share": 0.40},
    "high": {"monthly_range": (22000, 32000), "share": 0.20},
}

VOLATILITY_BANDS = {
    "stable": {"weekly_std_pct": 0.18, "zero_week_prob": 0.03, "share": 0.30},
    "moderate": {"weekly_std_pct": 0.30, "zero_week_prob": 0.07, "share": 0.45},
    "volatile": {"weekly_std_pct": 0.45, "zero_week_prob": 0.15, "share": 0.25},
}

TXN_FIELDS = [
    "transaction_id", "user_id", "timestamp", "amount", "direction", "category",
    "counterparty", "payment_mode", "balance_after", "is_flagged_anomaly", "anomaly_type",
]


def weighted_choice(options_with_share):
    """options_with_share: dict {key: {..., 'share': float}} -> picks a key."""
    keys = list(options_with_share.keys())
    weights = [options_with_share[k]["share"] for k in keys]
    return random.choices(keys, weights=weights, k=1)[0]


# ---------------------------------------------------------------------------
# 1. User profiles
# ---------------------------------------------------------------------------
def generate_user_profiles(n=NUM_USERS):
    """
    Builds user profiles with worker-type, income-tier, and volatility-band
    tags (drive transaction generation), plus the eligibility fields Scheme
    Agent needs, plus a literacy_level tag for explainability testing.

    A block of users at the front is reserved for deliberate eligibility
    edge cases (age/EPFO/tax-payer/days-active boundaries) so Amit's rule
    engine has guaranteed edge cases to test against, not just random luck.
    """
    profiles = []

    # --- deliberate edge cases (first 12 users) ---
    edge_cases = [
        dict(age=15, epfo=False, tax_payer=False, days_active=200),   # under age-16 floor
        dict(age=16, epfo=False, tax_payer=False, days_active=95),    # just eligible (age)
        dict(age=59, epfo=False, tax_payer=False, days_active=95),    # just eligible (age)
        dict(age=60, epfo=False, tax_payer=False, days_active=95),    # age-ineligible
        dict(age=34, epfo=True, tax_payer=False, days_active=150),    # EPFO-ineligible
        dict(age=34, epfo=False, tax_payer=True, days_active=150),    # tax-payer-ineligible
        dict(age=30, epfo=False, tax_payer=False, days_active=89),    # just under 90-day rule
        dict(age=30, epfo=False, tax_payer=False, days_active=90),    # exactly at 90-day rule
        dict(age=30, epfo=False, tax_payer=False, days_active=91),    # just over 90-day rule
        dict(age=30, epfo=False, tax_payer=False, days_active=119),   # just under 120-day rule
        dict(age=30, epfo=False, tax_payer=False, days_active=120),   # exactly at 120-day rule
        dict(age=30, epfo=False, tax_payer=False, days_active=121),   # just over 120-day rule
    ]

    for i in range(1, n + 1):
        uid = f"user_{i:04d}"

        worker_type = weighted_choice(WORKER_TYPES)
        income_tier = weighted_choice(INCOME_TIERS)
        volatility_band = weighted_choice(VOLATILITY_BANDS)

        if i <= len(edge_cases):
            ec = edge_cases[i - 1]
            age, epfo, tax_payer, days_active = ec["age"], ec["epfo"], ec["tax_payer"], ec["days_active"]
        else:
            age = random.randint(18, 58)
            epfo = random.random() < 0.10
            tax_payer = random.random() < 0.08
            days_active = random.randint(10, 700)

        e_shram_registered = random.random() < 0.6
        e_shram_registration_date = None
        if e_shram_registered:
            reg_days_ago = random.randint(30, SIM_WEEKS * 7)
            e_shram_registration_date = (TODAY - timedelta(days=reg_days_ago)).isoformat()

        # first user is guaranteed a PMSBY anniversary inside the sim window
        # (kept from v1) so there's always at least one clean nudge test case
        if i == 1:
            e_shram_registered = True
            e_shram_registration_date = (TODAY - timedelta(days=400)).isoformat()

        wt = WORKER_TYPES[worker_type]
        has_emi = random.random() < (0.55 if worker_type in ("delivery", "ride_hailing") else 0.20)
        emi_amount = round(random.uniform(1500, 4000), 2) if has_emi else 0.0
        emi_remaining_months = random.randint(3, 36) if has_emi else 0

        monthly_income = random.uniform(*INCOME_TIERS[income_tier]["monthly_range"])

        profiles.append({
            "user_id": uid,
            "age": age,
            "language_pref": random.choice(LANGUAGES),
            "literacy_level": random.choice(LITERACY_LEVELS),
            "worker_type": worker_type,
            "income_tier": income_tier,
            "volatility_band": volatility_band,
            "e_shram_registered": e_shram_registered,
            "e_shram_registration_date": e_shram_registration_date,
            "epfo_esic_status": epfo,
            "income_tax_payer": tax_payer,
            "aggregators": random.sample(wt["aggregators"], k=min(2, len(wt["aggregators"]))),
            "days_active_with_aggregator": days_active,
            "opening_balance": round(random.uniform(1000, 5000), 2),
            "base_weekly_income": round(monthly_income * 12 / 52, 2),
            "has_emi": has_emi,
            "emi_amount": emi_amount,
            "emi_remaining_months": emi_remaining_months,
        })
    return profiles


# ---------------------------------------------------------------------------
# 2. Seasonal effects (fixed approximate windows; real festival dates shift
#    with the lunar calendar, this is a reasonable synthetic approximation)
# ---------------------------------------------------------------------------
def seasonal_multiplier(d, worker_type):
    month, day = d.month, d.day
    is_diwali_window = (month == 10 and day >= 15) or (month == 11 and day <= 5)
    is_holi_window = (month == 3 and day <= 15)
    is_monsoon = (month == 6) or (month == 7) or (month == 8) or (month == 9 and day <= 15)

    mult = 1.0
    if is_diwali_window or is_holi_window:
        mult *= 1.25 if worker_type in ("delivery", "ride_hailing") else 1.10
    if is_monsoon:
        mult *= 0.85 if worker_type in ("delivery", "ride_hailing") else 1.05
    return mult


# ---------------------------------------------------------------------------
# 3. Transaction feed
# ---------------------------------------------------------------------------
def generate_transactions(profile):
    uid = profile["user_id"]
    worker_type = profile["worker_type"]
    vol = VOLATILITY_BANDS[profile["volatility_band"]]
    txns = []
    balance = profile["opening_balance"]
    txn_counter = 0

    base_weekly_income = profile["base_weekly_income"]
    buffer_target = base_weekly_income * random.uniform(0.6, 1.2)  # thin reserve, scales with income
    next_rent_in_days = random.randint(1, 30)
    next_emi_in_days = random.randint(1, 30)
    emi_months_left = profile["emi_remaining_months"]

    pmsby_debit_date = None
    if profile["e_shram_registered"]:
        reg_date = date.fromisoformat(profile["e_shram_registration_date"])
        anniversary = reg_date.replace(year=reg_date.year + 1)
        if SIM_START <= anniversary <= TODAY:
            pmsby_debit_date = anniversary

    def add_txn(txn_date, amount, direction, category, counterparty):
        nonlocal balance, txn_counter
        amount = round(amount, 2)
        if direction == "credit":
            balance += amount
        else:
            balance -= amount
        txn_counter += 1
        txns.append({
            "transaction_id": f"{uid}_txn_{txn_counter:05d}",
            "user_id": uid,
            "timestamp": txn_date.isoformat(),
            "amount": amount,
            "direction": direction,
            "category": category,
            "counterparty": counterparty,
            "payment_mode": "UPI",
            "balance_after": round(balance, 2),
            "is_flagged_anomaly": False,
            "anomaly_type": "",
        })

    for week in range(SIM_WEEKS):
        week_start = SIM_START + timedelta(weeks=week)

        if random.random() < vol["zero_week_prob"]:
            week_factor = random.uniform(0.0, 0.15)
        else:
            week_factor = np.clip(np.random.normal(1.0, vol["weekly_std_pct"]), 0.5, 1.6)
        season_mult = seasonal_multiplier(week_start, worker_type)
        week_income_target = base_weekly_income * week_factor * season_mult

        working_days = random.sample(range(7), k=random.randint(4, 6))
        per_day_share = week_income_target / max(len(working_days), 1)

        for d in range(7):
            txn_date = week_start + timedelta(days=d)

            if d in working_days:
                amount = max(per_day_share * random.uniform(0.7, 1.3), 0)
                if amount > 0:
                    add_txn(txn_date, amount, "credit", "platform_payout", random.choice(profile["aggregators"]))

            if d == 2:
                add_txn(txn_date, random.uniform(200, 600), "debit",
                         random.choice(["fuel", "recharge"]), "merchant")

            if random.random() < 0.35:
                add_txn(txn_date, random.uniform(100, 500), "debit",
                         random.choice(["food", "discretionary", "family_support"]), "merchant")

            next_rent_in_days -= 1
            if next_rent_in_days <= 0:
                add_txn(txn_date, random.uniform(3000, 6000), "debit", "rent", "landlord")
                next_rent_in_days = 30

            if emi_months_left > 0:
                next_emi_in_days -= 1
                if next_emi_in_days <= 0:
                    add_txn(txn_date, profile["emi_amount"], "debit", "loan_emi", "lender")
                    next_emi_in_days = 30
                    emi_months_left -= 1

            if pmsby_debit_date and txn_date == pmsby_debit_date:
                add_txn(txn_date, 20.0, "debit", "insurance_premium", "PMSBY")

        # end-of-week leveling, in both directions:
        # - surplus above the buffer gets sent home/spent (as before)
        # - a deep shortfall gets rescued by informal borrowing (family/
        #   friends), rather than spiraling to an unrealistic negative
        #   balance -- this matches the "90% lack savings, rely on informal
        #   support" pattern from the calibration research, not an overdraft
        if balance > buffer_target:
            add_txn(week_start + timedelta(days=6), balance - buffer_target,
                     "debit", "family_support", "family/savings")
        elif balance < -200:
            rescue_amount = (-balance) + random.uniform(50, 300)
            add_txn(week_start + timedelta(days=6), rescue_amount,
                     "credit", "informal_borrowing", "family/friends")

    return txns


def inject_fraud(profile, txns):
    """
    ~5% of users get 3-6 injected anomalous transactions scattered across
    their history, labeled for Amit's Fraud Agent. Kept as a minority
    pattern deliberately -- a Fraud Agent that flags everything isn't
    useful, so most users stay clean.
    """
    if random.random() >= 0.05 or len(txns) < 20:
        return txns

    n_anomalies = random.randint(3, 6)
    anomaly_types = ["large_atypical_debit", "rapid_micro_debits",
                      "new_counterparty_large_debit", "duplicate_transaction"]

    for _ in range(n_anomalies):
        atype = random.choice(anomaly_types)
        idx = random.randint(10, len(txns) - 5)
        base_txn = txns[idx]

        if atype == "large_atypical_debit":
            base_txn["amount"] = round(base_txn["amount"] * random.uniform(6, 12), 2)
            base_txn["direction"] = "debit"
            base_txn["category"] = "discretionary"
            base_txn["counterparty"] = "unknown_merchant"
            base_txn["is_flagged_anomaly"] = True
            base_txn["anomaly_type"] = atype

        elif atype == "rapid_micro_debits":
            ts = base_txn["timestamp"]
            for k in range(random.randint(4, 6)):
                txns.insert(idx + k, {
                    "transaction_id": f"{profile['user_id']}_fraud_{idx}_{k}",
                    "user_id": profile["user_id"],
                    "timestamp": ts,
                    "amount": round(random.uniform(20, 90), 2),
                    "direction": "debit",
                    "category": "discretionary",
                    "counterparty": "unknown_merchant",
                    "payment_mode": "UPI",
                    "balance_after": base_txn["balance_after"],
                    "is_flagged_anomaly": True,
                    "anomaly_type": atype,
                })

        elif atype == "new_counterparty_large_debit":
            base_txn["amount"] = round(base_txn["amount"] * random.uniform(4, 8), 2)
            base_txn["direction"] = "debit"
            base_txn["counterparty"] = "new_unverified_payee"
            base_txn["is_flagged_anomaly"] = True
            base_txn["anomaly_type"] = atype

        elif atype == "duplicate_transaction" and idx + 1 < len(txns):
            dup = dict(base_txn)
            dup["transaction_id"] = base_txn["transaction_id"] + "_dup"
            dup["is_flagged_anomaly"] = True
            dup["anomaly_type"] = atype
            base_txn["is_flagged_anomaly"] = True
            base_txn["anomaly_type"] = atype
            txns.insert(idx + 1, dup)

    return txns


def force_low_balance_scenario(profile, txns):
    """Guarantees user_0001 has a visible income dip right before their
    PMSBY debit date, kept as a reliable nudge-agent demo case."""
    if profile["user_id"] != "user_0001":
        return txns
    pmsby_txns = [t for t in txns if t["category"] == "insurance_premium"]
    if not pmsby_txns:
        return txns
    debit_dt = date.fromisoformat(pmsby_txns[0]["timestamp"])
    window_start = debit_dt - timedelta(days=14)
    for t in txns:
        t_date = date.fromisoformat(t["timestamp"])
        if window_start <= t_date < debit_dt and t["direction"] == "credit":
            t["amount"] = round(t["amount"] * 0.2, 2)
    return txns


# ---------------------------------------------------------------------------
# Main -- streams transactions to CSV to keep memory bounded at 1000 users
# ---------------------------------------------------------------------------
def main():
    profiles = generate_user_profiles()

    with open("data/user_profiles.json", "w") as f:
        json.dump(profiles, f, indent=2)

    total_txns = 0
    sample_records = []

    with open("data/transactions.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=TXN_FIELDS)
        writer.writeheader()

        for profile in profiles:
            txns = generate_transactions(profile)
            txns = force_low_balance_scenario(profile, txns)
            txns = inject_fraud(profile, txns)

            for t in txns:
                writer.writerow(t)
            total_txns += len(txns)

            if len(sample_records) < 50:
                sample_records.extend(txns[:5])

    with open("data/transactions_sample.json", "w") as f:
        json.dump(sample_records[:50], f, indent=2)

    print(f"Generated {len(profiles)} user profiles and {total_txns} transactions.")


if __name__ == "__main__":
    main()
