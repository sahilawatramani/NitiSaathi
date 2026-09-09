"""
SMS Parser Service — Parses Indian bank & UPI transaction SMS messages.

Covers all major Indian banks and UPI apps:
  - HDFC, SBI, ICICI, Axis, Kotak, PNB, BOB, Canara, Union, IndusInd
  - PhonePe, Google Pay, Paytm, Amazon Pay, BHIM
  - Credit card spend alerts
  - Gig platform payouts (Swiggy, Zomato, Ola, Uber, Rapido, Dunzo)

Returns a structured dict with:
  direction   : "credit" | "debit"
  amount      : float
  merchant    : str
  balance     : float | None   (available/closing balance if present)
  upi_ref     : str | None     (UPI transaction reference)
  account_last4: str | None    (last 4 digits of account/card)
  txn_date    : datetime
  description : str            (original SMS text)
  bank        : str | None     (detected bank name)
"""
from __future__ import annotations

import hashlib
import re
from datetime import datetime
from typing import Optional

from app.utils.time import utcnow


# ─── Amount Parsing ───────────────────────────────────────────────────────────

_AMOUNT_PATTERNS = [
    # Rs.1,234.56 / INR 1234 / Rs 500
    r"(?:rs\.?|inr)\s*([0-9,]+(?:\.\d{1,2})?)",
    # 1,234.56 Rs / 500INR
    r"([0-9,]+(?:\.\d{1,2})?)\s*(?:rs\.?|inr)",
    # debited/credited for Rs.500
    r"(?:for|of)\s+(?:rs\.?|inr)?\s*([0-9,]+(?:\.\d{1,2})?)",
    # Amount: 500.00
    r"(?:amount|amt)[:\s]+(?:rs\.?|inr)?\s*([0-9,]+(?:\.\d{1,2})?)",
]


def _parse_amount(text: str) -> Optional[float]:
    for pattern in _AMOUNT_PATTERNS:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            try:
                return float(m.group(1).replace(",", ""))
            except ValueError:
                continue
    return None


def _parse_balance(text: str) -> Optional[float]:
    """Extract available/closing balance from SMS."""
    patterns = [
        r"(?:avl\.?\s*bal|available\s+bal(?:ance)?|closing\s+bal(?:ance)?|bal(?:ance)?)[:\s]+(?:rs\.?|inr)?\s*([0-9,]+(?:\.\d{1,2})?)",
        r"(?:a/c\s+bal|ac\s+bal)[:\s]+(?:rs\.?|inr)?\s*([0-9,]+(?:\.\d{1,2})?)",
    ]
    for pattern in patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            try:
                return float(m.group(1).replace(",", ""))
            except ValueError:
                continue
    return None


# ─── Date Parsing ─────────────────────────────────────────────────────────────

_DATE_FMT = [
    "%d-%m-%Y %H:%M:%S",
    "%d-%m-%Y %H:%M",
    "%d-%m-%Y",
    "%d/%m/%Y %H:%M:%S",
    "%d/%m/%Y %H:%M",
    "%d/%m/%Y",
    "%d %b %Y %H:%M:%S",  # 15 Jan 2024 14:30:00  (HDFC/ICICI)
    "%d %b %Y %H:%M",
    "%d %b %Y",
    "%d-%b-%Y %H:%M:%S",  # 15-Jan-2024 14:30:00
    "%d-%b-%Y %H:%M",
    "%d-%b-%Y",
    "%d/%b/%Y",
    "%d%b%Y",              # 15Jan2024  (some HDFC alerts)
    "%Y-%m-%d %H:%M:%S",  # ISO format
    "%Y-%m-%d",
]

_DATE_REGEX = re.compile(
    r"""
    (?:
        \d{1,2}[-/]\d{1,2}[-/]\d{2,4}          # dd-mm-yyyy or dd/mm/yyyy
        (?:\s+\d{1,2}:\d{2}(?::\d{2})?)?        # optional time
      |
        \d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|    # dd Mon yyyy
                     Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}
        (?:\s+\d{1,2}:\d{2}(?::\d{2})?)?
      |
        \d{1,2}-(?:Jan|Feb|Mar|Apr|May|Jun|      # dd-Mon-yyyy
                   Jul|Aug|Sep|Oct|Nov|Dec)-\d{4}
        (?:\s+\d{1,2}:\d{2}(?::\d{2})?)?
      |
        \d{4}-\d{2}-\d{2}                        # yyyy-mm-dd
        (?:\s+\d{1,2}:\d{2}(?::\d{2})?)?
    )
    """,
    re.IGNORECASE | re.VERBOSE,
)


def _parse_date(text: str) -> Optional[datetime]:
    m = _DATE_REGEX.search(text)
    if not m:
        return None
    raw = m.group(0).strip()
    for fmt in _DATE_FMT:
        try:
            parsed = datetime.strptime(raw, fmt)
            if parsed.year < 100:
                parsed = parsed.replace(year=2000 + parsed.year)
            return parsed
        except ValueError:
            continue
    return None


# ─── Direction Detection ──────────────────────────────────────────────────────

_DEBIT_TOKENS = re.compile(
    r"\b(?:debited|debit|withdrawn|dr\b|spent|purchase|paid|payment|sent|"
    r"transferred\s+(?:to|from\s+your)|used\s+at|charged|deducted)\b",
    re.IGNORECASE,
)

_CREDIT_TOKENS = re.compile(
    r"\b(?:credited|credit|cr\b|received|deposited|refund(?:ed)?|"
    r"reversed|cashback|added\s+to|transferred\s+to\s+your|"
    r"payout|payment\s+received|money\s+received|imps\s+cr|neft\s+cr)\b",
    re.IGNORECASE,
)


def _detect_direction(text: str) -> str:
    has_debit = bool(_DEBIT_TOKENS.search(text))
    has_credit = bool(_CREDIT_TOKENS.search(text))
    if has_credit and not has_debit:
        return "credit"
    if has_debit and not has_credit:
        return "debit"
    if has_debit and has_credit:
        # "debited" takes priority if both present (e.g. cashback + spend SMS)
        return "debit"
    return "unknown"


# ─── Merchant / Sender Parsing ────────────────────────────────────────────────

# Gig platform payout senders (treated as income)
_GIG_SENDERS = re.compile(
    r"swiggy|zomato|ola(?:\s*money)?|uber|rapido|dunzo|"
    r"blinkit|zepto|bigbasket|grofers|meesho|shadowfax",
    re.IGNORECASE,
)

# UPI VPA patterns — extract the handle
_UPI_VPA = re.compile(
    r"(?:to|from|at)\s+([a-z0-9._\-]+@[a-z0-9]+)",
    re.IGNORECASE,
)

_MERCHANT_PATTERNS = [
    # "at MERCHANT_NAME on" / "at MERCHANT_NAME via"
    r"\bat\s+([A-Za-z0-9@&._\-\s]{2,40}?)(?:\s+on\b|\s+via\b|\s+txn\b|\s+ref\b|\s+for\b|$)",
    # "to MERCHANT_NAME"
    r"\bto\s+([A-Za-z0-9@&._\-\s]{2,40}?)(?:\s+on\b|\s+via\b|\s+txn\b|\s+ref\b|\s+for\b|$)",
    # "from MERCHANT_NAME"
    r"\bfrom\s+([A-Za-z0-9@&._\-\s]{2,40}?)(?:\s+on\b|\s+via\b|\s+txn\b|\s+ref\b|\s+for\b|$)",
    # UPI/<VPA>
    r"\bUPI[/\s]+([a-z0-9@._\-]+)",
    # towards / for <merchant>
    r"\b(?:towards|for)\s+([A-Za-z0-9@&._\-\s]{2,40}?)(?:\s+on\b|\s+txn\b|$)",
]

# Stop words — these aren't merchants
_MERCHANT_STOPWORDS = {
    "your", "the", "a", "an", "this", "that", "is", "was", "be",
    "upi", "imps", "neft", "rtgs", "atm", "bank", "account", "card",
    "debit", "credit", "transaction", "payment", "transfer", "fund",
    "net", "mobile", "banking", "hdfc", "sbi", "icici", "axis", "kotak",
    "paytm", "gpay", "phonepe", "bhim", "amazon", "bajaj",
}


def _parse_merchant(text: str, sender: str = "") -> str:
    # Check UPI VPA first — most reliable
    vpa_match = _UPI_VPA.search(text)
    if vpa_match:
        vpa = vpa_match.group(1).strip()
        # Extract readable name from VPA (e.g. swiggy.12345@icici → Swiggy)
        name_part = vpa.split("@")[0].rstrip("0123456789._-")
        if name_part and name_part.lower() not in _MERCHANT_STOPWORDS:
            return name_part.replace(".", " ").replace("-", " ").title()

    # Try structural patterns
    for pattern in _MERCHANT_PATTERNS:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            candidate = m.group(1).strip(" .:-\n\t")
            words = candidate.split()
            # Drop trailing stop words
            while words and words[-1].lower() in _MERCHANT_STOPWORDS:
                words.pop()
            candidate = " ".join(words)
            if candidate and len(candidate) > 1 and candidate.lower() not in _MERCHANT_STOPWORDS:
                return candidate.title()

    # Fall back to sender name if it's a known gig platform
    if sender and _GIG_SENDERS.search(sender):
        return sender.split("-")[-1].strip().title()

    return "Unknown Merchant"


# ─── Bank Detection ───────────────────────────────────────────────────────────

_BANK_PATTERNS = {
    "HDFC Bank": re.compile(r"\bhdfc\b|hdfcbk|hdfcbank", re.IGNORECASE),
    "SBI": re.compile(r"\bsbi\b|state\s+bank", re.IGNORECASE),
    "ICICI Bank": re.compile(r"\bicici\b", re.IGNORECASE),
    "Axis Bank": re.compile(r"\baxis\b", re.IGNORECASE),
    "Kotak Bank": re.compile(r"\bkotak\b", re.IGNORECASE),
    "PNB": re.compile(r"\bpnb\b|punjab\s+national", re.IGNORECASE),
    "Bank of Baroda": re.compile(r"\bbob\b|bank\s+of\s+baroda", re.IGNORECASE),
    "Canara Bank": re.compile(r"\bcanara\b", re.IGNORECASE),
    "IndusInd Bank": re.compile(r"\bindusind\b", re.IGNORECASE),
    "Yes Bank": re.compile(r"\byes\s*bank\b", re.IGNORECASE),
    "Union Bank": re.compile(r"\bunion\s+bank\b", re.IGNORECASE),
    "PhonePe": re.compile(r"\bphonepe\b", re.IGNORECASE),
    "Google Pay": re.compile(r"\bgpay\b|google\s*pay", re.IGNORECASE),
    "Paytm": re.compile(r"\bpaytm\b", re.IGNORECASE),
    "Amazon Pay": re.compile(r"\bamazon\s*pay\b", re.IGNORECASE),
}


def _detect_bank(text: str, sender: str = "") -> Optional[str]:
    combined = f"{sender} {text}"
    for bank_name, pattern in _BANK_PATTERNS.items():
        if pattern.search(combined):
            return bank_name
    return None


# ─── Account / Card Last 4 ────────────────────────────────────────────────────

def _parse_account_last4(text: str) -> Optional[str]:
    patterns = [
        r"(?:a/c|acct?|account|card)[^\d]*(?:ending|no\.?|num(?:ber)?)?[^\d]*(\d{4})\b",
        r"[xX*]{4,}\s*(\d{4})\b",
        r"\b(\d{4})\s+(?:debited|credited)\b",
    ]
    for pattern in patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            return m.group(1)
    return None


def _parse_upi_ref(text: str) -> Optional[str]:
    patterns = [
        r"(?:upi\s*ref(?:\.?\s*no\.?)?|ref(?:\.?\s*no\.?)?)[:\s]+([A-Z0-9]{8,20})\b",
        r"\b(UPI\d{10,20})\b",
        r"\btxn\s*(?:id|ref)[:\s]+([A-Z0-9]{8,20})\b",
    ]
    for pattern in patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            return m.group(1)
    return None


# ─── Non-transaction Filter ───────────────────────────────────────────────────

_IGNORE_PATTERNS = re.compile(
    r"\b(?:otp|one.time.password|password|login|verify|verification|"
    r"offer|discount|promo|cashback\s+earned|reward\s+point|"
    r"due\s+date|minimum\s+due|statement\s+ready|e-statement|"
    r"kyc|nominee|interest\s+rate|emi\s+reminder|loan\s+approved)\b",
    re.IGNORECASE,
)


def _is_non_transaction(text: str) -> bool:
    return bool(_IGNORE_PATTERNS.search(text))


# ─── Main Parser ─────────────────────────────────────────────────────────────

def parse_bank_sms(sms_text: str, sender: str = "") -> dict:
    """Parse a bank/UPI SMS and return a structured transaction dict.

    Returns:
        {
            "is_transaction": bool,
            "direction": "credit" | "debit" | "unknown",
            "amount": float,
            "merchant": str,
            "balance": float | None,
            "account_last4": str | None,
            "upi_ref": str | None,
            "bank": str | None,
            "txn_date": datetime,
            "description": str,
            "reason": str   (only when is_transaction=False)
        }
    """
    normalized = re.sub(r"\s+", " ", sms_text.strip())
    lower = normalized.lower()

    # Fast-fail on known non-transaction SMS types
    if _is_non_transaction(lower):
        return {"is_transaction": False, "reason": "Non-transaction SMS (OTP/promo/statement)"}

    amount = _parse_amount(normalized)
    if amount is None or amount <= 0:
        return {"is_transaction": False, "reason": "No valid amount found"}

    direction = _detect_direction(lower)
    if direction == "unknown":
        return {"is_transaction": False, "reason": "Cannot determine debit/credit direction"}

    return {
        "is_transaction": True,
        "direction": direction,
        "amount": amount,
        "merchant": _parse_merchant(normalized, sender),
        "balance": _parse_balance(normalized),
        "account_last4": _parse_account_last4(normalized),
        "upi_ref": _parse_upi_ref(normalized),
        "bank": _detect_bank(normalized, sender),
        "txn_date": _parse_date(normalized) or utcnow(),
        "description": normalized,
    }


def build_sms_external_txn_id(sender: str, sms_text: str, received_at: Optional[datetime] = None) -> str:
    """Generate a stable dedup ID for an SMS transaction."""
    timestamp = (received_at or utcnow()).isoformat()
    raw = f"{sender}|{sms_text}|{timestamp}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:24]
