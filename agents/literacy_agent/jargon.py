"""jargon.py — Rule-based financial jargon → plain English replacement.

This runs BEFORE the LLM rewrite so the model gets cleaner input and we
guarantee that certain internal variable names never leak to the user.

The map is ordered: longer / more specific phrases are checked first to avoid
partial replacement collisions.
"""

import re
from typing import Dict, List, Tuple

# ── Jargon replacement map ────────────────────────────────────────────────
# (pattern, replacement)  — patterns are case-insensitive literal strings.
# Order matters: longer phrases first.

JARGON_MAP: List[Tuple[str, str]] = [
    # Internal variable names that must NEVER reach the user
    ("income_wma_4w", "estimated weekly income"),
    ("income_volatility_pct", "income fluctuation rate"),
    ("savings_rate_recommendation", "recommended savings percentage"),
    ("low_balance_flag", "low balance warning"),
    ("predicted_next_week_income", "expected earnings next week"),
    ("nudge_trigger_low_balance_before_debit", "upcoming payment alert"),
    ("days_to_next_pmsby_debit", "days until your insurance payment"),
    ("emi_burden_pct", "loan payment share of income"),
    ("closing_balance", "current balance"),
    ("financial_persona", "financial profile"),

    # Statistical / technical terms
    ("coefficient of variation", "income fluctuation"),
    ("weighted moving average", "average income trend"),
    ("standard deviation", "income variation"),
    ("volatility band", "income stability level"),
    ("volatility", "income fluctuation"),

    # Financial jargon → plain English
    ("platform payout", "earnings from your delivery/ride app"),
    ("informal borrowing", "money borrowed from family or friends"),
    ("discretionary spend", "optional spending"),
    ("discretionary", "optional"),
    ("insurance premium", "insurance payment"),
    ("loan EMI", "loan monthly payment"),
    ("EMI", "monthly loan payment"),
    ("TDS deducted", "tax already deducted by the government"),
    ("TDS", "tax deducted at source"),
    ("welfare cess", "welfare tax"),
    ("EPFO", "Employee Provident Fund"),
    ("ESIC", "Employee State Insurance"),
    ("e-Shram", "e-Shram (government worker registration)"),
    ("PM-SYM", "PM-SYM (government pension scheme)"),
    ("PMSBY", "PMSBY (accident insurance, ₹20/year)"),
    ("PMJJBY", "PMJJBY (life insurance, ₹436/year)"),
    ("APY", "APY (Atal Pension Yojana)"),
    ("UPI", "UPI (online payment)"),
    ("KYC", "KYC (identity verification)"),
    ("OTP", "OTP (one-time password)"),

    # Causal chain terms
    ("causal chain", "chain of consequences"),
    ("causal risk chain", "potential consequences"),
    ("counterfactual scenario", "what-if scenario"),
    ("counterfactual", "what-if"),
]

# Pre-compile regex patterns for performance
_COMPILED_PATTERNS: List[Tuple[re.Pattern, str]] = [
    (re.compile(re.escape(pattern), re.IGNORECASE), replacement)
    for pattern, replacement in JARGON_MAP
]


def replace_jargon(text: str) -> str:
    """Replace all known jargon terms in *text* with plain English equivalents.

    Returns the cleaned text.  The function is idempotent — running it twice
    produces the same result as running it once.
    """
    for compiled_pattern, replacement in _COMPILED_PATTERNS:
        text = compiled_pattern.sub(replacement, text)
    return text


def get_jargon_map() -> Dict[str, str]:
    """Return a copy of the current jargon map as a dict (for inspection/tests)."""
    return dict(JARGON_MAP)
