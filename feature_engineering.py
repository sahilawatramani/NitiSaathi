"""
feature_engineering.py
-----------------------
Turns the weekly per-user summary into the features the Budget Agent
(FR-4.3, FR-4.4, FR-4.5) and Nudge Agent (FR-7.1) actually consume.

Input:  data/weekly_transactions.csv, data/user_profiles.json
Output: data/features.csv
"""

import json
from datetime import timedelta

import numpy as np
import pandas as pd

WMA_WINDOW = 4          # weeks used for the weighted moving average
WMA_WEIGHTS = np.array([0.4, 0.3, 0.2, 0.1])  # most recent week weighted highest
VOLATILITY_WINDOW = 8   # weeks used for the volatility calc
# relative, not flat: income now spans low/mid/high tiers (~4x range), so a
# fixed rupee threshold would almost never fire for high earners. Flag when
# closing balance drops below this fraction of the user's own WMA income.
LOW_BALANCE_RATIO = 0.3


def weighted_moving_average(series, window=WMA_WINDOW, weights=WMA_WEIGHTS):
    """Trailing WMA; returns NaN until `window` weeks of history exist."""
    def _wma(x):
        if len(x) < window:
            return np.nan
        return np.dot(x[-window:], weights)
    return series.rolling(window, min_periods=window).apply(
        lambda x: _wma(x.values), raw=False
    )


def add_budget_features(weekly):
    """
    Adds, per user (sorted chronologically):
      - income_wma_4w: trailing weighted moving average of weekly income
                        (FR-4.3: forecast suited to variable income)
      - income_volatility_pct: coefficient of variation over trailing 8 weeks,
                        i.e. how unpredictable this user's income is
      - predicted_next_week_income: this week's WMA, read as "expected income
                        going into next week"
      - savings_rate_recommendation: adjusted for volatility, not a flat % (FR-4.4)
      - low_balance_flag: closing balance below LOW_BALANCE_THRESHOLD (FR-4.5)
    """
    weekly = weekly.sort_values(["user_id", "week_start"]).copy()
    out_frames = []

    for uid, grp in weekly.groupby("user_id"):
        grp = grp.sort_values("week_start").reset_index(drop=True)

        grp["income_wma_4w"] = weighted_moving_average(grp["total_income"])
        grp["predicted_next_week_income"] = grp["income_wma_4w"]

        rolling_mean = grp["total_income"].rolling(VOLATILITY_WINDOW, min_periods=3).mean()
        rolling_std = grp["total_income"].rolling(VOLATILITY_WINDOW, min_periods=3).std()
        grp["income_volatility_pct"] = (rolling_std / rolling_mean.replace(0, np.nan) * 100).round(1)

        # savings-rate recommendation: lower volatility -> can commit to a
        # higher fixed savings %; higher volatility -> smaller fixed %,
        # user needs the buffer instead of locking money away
        def savings_rate(vol):
            if pd.isna(vol):
                return np.nan
            if vol < 15:
                return 0.20
            if vol < 30:
                return 0.10
            return 0.05
        grp["savings_rate_recommendation"] = grp["income_volatility_pct"].apply(savings_rate)

        grp["low_balance_flag"] = grp["closing_balance"] < (LOW_BALANCE_RATIO * grp["income_wma_4w"])

        out_frames.append(grp)

    return pd.concat(out_frames, ignore_index=True)


def add_recurring_debit_features(weekly, profiles):
    """
    Adds, per user:
      - days_to_next_pmsby_debit: countdown to the next annual PMSBY premium
                        debit date, derived from e-Shram registration date
                        (SRS 5.2 -- named nudge-agent trigger)
      - pmsby_debit_due_soon: True if that debit falls within the next 14 days
    These are the features the Nudge Agent (FR-7.1) reads to fire a
    "low balance before a known recurring expense" alert.
    """
    weekly = weekly.copy()
    prof = profiles.set_index("user_id")

    days_to_debit = []
    due_soon = []
    for _, row in weekly.iterrows():
        uid = row["user_id"]
        week_end = pd.Timestamp(row["week_start"]) + timedelta(days=6)

        reg_date_str = prof.loc[uid, "e_shram_registration_date"] if uid in prof.index else None
        if not reg_date_str:
            days_to_debit.append(np.nan)
            due_soon.append(False)
            continue

        reg_date = pd.Timestamp(reg_date_str)
        # find the next annual anniversary on/after this week
        anniversary = reg_date.replace(year=week_end.year)
        if anniversary < week_end:
            anniversary = anniversary.replace(year=week_end.year + 1)

        delta_days = (anniversary - week_end).days
        days_to_debit.append(delta_days)
        due_soon.append(delta_days <= 14)

    weekly["days_to_next_pmsby_debit"] = days_to_debit
    weekly["pmsby_debit_due_soon"] = due_soon
    return weekly


def add_nudge_trigger_flag(weekly):
    """
    Combines low_balance_flag + pmsby_debit_due_soon into the single
    trigger condition FR-7.1 describes: 'low predicted balance before a
    known recurring expense'. This is the column the Nudge Agent's rule
    engine reads directly.
    """
    weekly = weekly.copy()
    weekly["nudge_trigger_low_balance_before_debit"] = (
        weekly["low_balance_flag"] & weekly["pmsby_debit_due_soon"]
    )
    return weekly


def add_debt_features(weekly, profiles):
    """
    Adds EMI/debt-load context, since ~half of delivery/ride-hailing users
    carry a vehicle EMI in this dataset:
      - has_active_emi: from profile
      - monthly_emi_amount: from profile
      - emi_burden_pct: EMI as a % of estimated monthly income (WMA-based),
                        a signal the Budget Agent can use alongside the
                        savings-rate recommendation
    """
    weekly = weekly.copy()
    prof = profiles.set_index("user_id")[["has_emi", "emi_amount"]]
    weekly = weekly.merge(prof, left_on="user_id", right_index=True, how="left")
    weekly = weekly.rename(columns={"has_emi": "has_active_emi", "emi_amount": "monthly_emi_amount"})

    est_monthly_income = weekly["income_wma_4w"] * 4
    weekly["emi_burden_pct"] = (
        weekly["monthly_emi_amount"] / est_monthly_income.replace(0, np.nan) * 100
    ).round(1)
    return weekly


def add_profile_context(weekly, profiles):
    """Merges in profile fields useful to downstream agents/teammates so
    they don't have to separately join user_profiles.json themselves."""
    cols = ["user_id", "worker_type", "income_tier", "volatility_band",
            "literacy_level", "language_pref", "age", "epfo_esic_status",
            "income_tax_payer", "e_shram_registered", "days_active_with_aggregator"]
    return weekly.merge(profiles[cols], on="user_id", how="left")


def main():
    weekly = pd.read_csv("data/weekly_transactions.csv", parse_dates=["week_start"])
    with open("data/user_profiles.json") as f:
        profiles = pd.DataFrame(json.load(f))

    weekly = add_budget_features(weekly)
    weekly = add_recurring_debit_features(weekly, profiles)
    weekly = add_nudge_trigger_flag(weekly)
    weekly = add_debt_features(weekly, profiles)
    weekly = add_profile_context(weekly, profiles)

    weekly.to_csv("data/features.csv", index=False)
    print(f"Wrote {len(weekly)} feature rows to data/features.csv")

    triggered = weekly[weekly["nudge_trigger_low_balance_before_debit"]]
    print(f"\nNudge trigger fired for {len(triggered)} user-weeks:")
    if len(triggered):
        print(triggered[["user_id", "week_start", "closing_balance", "days_to_next_pmsby_debit"]]
              .to_string(index=False))


if __name__ == "__main__":
    main()
