"""
preprocessing.py
-----------------
Loads the raw (mock) FinAssist-style transaction feed, cleans it, and
resamples it into weekly per-user summaries. This is the step that turns
a raw daily transaction stream into something the Budget Agent's
weighted-moving-average forecast (FR-4.3) can actually consume.

Input:  data/transactions.csv, data/user_profiles.json
Output: data/weekly_transactions.csv
"""

import json

import pandas as pd

EXPENSE_CATS = ["rent", "fuel", "recharge", "food", "discretionary",
                 "family_support", "insurance_premium", "loan_emi"]


def load_transactions(path="data/transactions.csv"):
    df = pd.read_csv(path, parse_dates=["timestamp"], dtype={"anomaly_type": str})
    df["is_flagged_anomaly"] = df["is_flagged_anomaly"].astype(bool)
    df["anomaly_type"] = df["anomaly_type"].fillna("")
    return df


def load_profiles(path="data/user_profiles.json"):
    with open(path) as f:
        raw = json.load(f)
    return pd.DataFrame(raw)


def clean_transactions(df):
    """Basic data-quality pass: drop exact dupes, drop nulls in required
    fields, drop non-positive amounts, and sanity-check direction values."""
    before = len(df)

    df = df.drop_duplicates(subset="transaction_id")
    required = ["transaction_id", "user_id", "timestamp", "amount", "direction", "category"]
    df = df.dropna(subset=required)
    df = df[df["amount"] > 0]
    df = df[df["direction"].isin(["credit", "debit"])]

    dropped = before - len(df)
    if dropped:
        print(f"clean_transactions: dropped {dropped} invalid/duplicate rows")
    return df.reset_index(drop=True)


def categorize(df):
    """Adds a coarse income/expense flag on top of the fine-grained category."""
    df = df.copy()
    df["flow_type"] = df["direction"].map({"credit": "income", "debit": "expense"})
    return df


def resample_weekly(df):
    """
    Aggregates cleaned transactions into one row per (user_id, week_start).
    Produces total income, total expense, net cash flow, closing balance,
    and a per-category expense breakdown -- the shape the Budget/Nudge
    agents will consume.
    """
    df = df.copy()
    # anchor weeks to a fixed weekday so all users share aligned week_start bins
    df["week_start"] = df["timestamp"].dt.to_period("W-SUN").apply(lambda p: p.start_time)

    income = (
        df[df["flow_type"] == "income"]
        .groupby(["user_id", "week_start"])["amount"]
        .sum()
        .rename("total_income")
    )
    expense = (
        df[df["flow_type"] == "expense"]
        .groupby(["user_id", "week_start"])["amount"]
        .sum()
        .rename("total_expense")
    )

    # per-category expense breakdown, pivoted into columns
    cat_pivot = (
        df[df["flow_type"] == "expense"]
        .groupby(["user_id", "week_start", "category"])["amount"]
        .sum()
        .unstack("category", fill_value=0)
        .reindex(columns=EXPENSE_CATS, fill_value=0)
        .add_prefix("exp_")
    )

    # closing balance = balance_after of the last transaction in that week
    df_sorted = df.sort_values("timestamp")
    closing_balance = (
        df_sorted.groupby(["user_id", "week_start"])["balance_after"]
        .last()
        .rename("closing_balance")
    )

    # weekly anomaly rollup -- row-level flags still live in transactions.csv
    # for Amit's Fraud Agent; this is just a convenience summary column
    anomaly_count = (
        df.groupby(["user_id", "week_start"])["is_flagged_anomaly"]
        .sum()
        .rename("anomaly_txn_count")
    )

    weekly = pd.concat([income, expense, closing_balance, anomaly_count], axis=1).fillna(0)
    weekly = weekly.join(cat_pivot, how="left").fillna(0)
    weekly["net_cashflow"] = weekly["total_income"] - weekly["total_expense"]
    weekly = weekly.reset_index().sort_values(["user_id", "week_start"])
    return weekly


def main():
    txns = load_transactions()
    txns = clean_transactions(txns)
    txns = categorize(txns)
    weekly = resample_weekly(txns)
    weekly.to_csv("data/weekly_transactions.csv", index=False)
    print(f"Wrote {len(weekly)} weekly rows across {weekly['user_id'].nunique()} users "
          f"to data/weekly_transactions.csv")


if __name__ == "__main__":
    main()
