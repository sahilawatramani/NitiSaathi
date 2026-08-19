import hashlib
import re
from datetime import datetime
from app.utils.time import utcnow


DATE_PATTERNS = [
    "%d-%m-%Y %H:%M:%S",
    "%d-%m-%Y %H:%M",
    "%d-%m-%Y",
    "%d/%m/%Y %H:%M:%S",
    "%d/%m/%Y %H:%M",
    "%d/%m/%Y",
]


def _parse_amount(text: str) -> float | None:
    amount_patterns = [
        r"(?:rs\.?|inr)\s*([0-9,]+(?:\.\d{1,2})?)",
        r"([0-9,]+(?:\.\d{1,2})?)\s*(?:rs\.?|inr)",
    ]

    for pattern in amount_patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if not match:
            continue
        try:
            return float(match.group(1).replace(",", ""))
        except ValueError:
            continue
    return None


def _parse_date(text: str) -> datetime | None:
    date_match = re.search(
        r"(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})(?:\s+(\d{1,2}:\d{2}(?::\d{2})?))?",
        text,
    )
    if not date_match:
        return None

    date_part = date_match.group(1)
    time_part = date_match.group(2)
    datetime_text = f"{date_part} {time_part}".strip()

    for pattern in DATE_PATTERNS:
        try:
            parsed = datetime.strptime(datetime_text, pattern)
            if parsed.year < 100:
                parsed = parsed.replace(year=2000 + parsed.year)
            return parsed
        except ValueError:
            continue
    return None


def _parse_merchant(text: str) -> str:
    merchant_patterns = [
        r"\bat\s+([a-z0-9@&._\- ]+?)(?:\s+(?:on|via|txn|ref|avl|info|bal)\b|$)",
        r"\bto\s+([a-z0-9@&._\- ]+?)(?:\s+(?:on|via|txn|ref|avl|info|bal)\b|$)",
        r"\bupi\s*/\s*([a-z0-9@._\-]+)",
    ]

    for pattern in merchant_patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            merchant = match.group(1).strip(" .:-")
            if merchant:
                return merchant.title()

    return "Unknown Merchant"


def _is_debit(text: str) -> bool:
    debit_tokens = ["debited", "spent", "purchase", "paid", "dr", "sent"]
    return any(token in text.lower() for token in debit_tokens)


def _is_credit(text: str) -> bool:
    credit_tokens = ["credited", "received", "cr"]
    return any(token in text.lower() for token in credit_tokens)


def parse_bank_sms(sms_text: str) -> dict:
    normalized = re.sub(r"\s+", " ", sms_text.strip())
    lower = normalized.lower()

    amount = _parse_amount(normalized)
    if amount is None:
        return {
            "is_transaction": False,
            "reason": "No amount found",
        }

    if _is_credit(lower) and not _is_debit(lower):
        direction = "credit"
    elif _is_debit(lower):
        direction = "debit"
    else:
        direction = "unknown"

    return {
        "is_transaction": True,
        "direction": direction,
        "amount": amount,
        "merchant": _parse_merchant(normalized),
        "txn_date": _parse_date(normalized) or utcnow(),
        "description": normalized,
    }


def build_sms_external_txn_id(sender: str, sms_text: str, received_at: datetime | None = None) -> str:
    timestamp = (received_at or utcnow()).isoformat()
    raw = f"{sender}|{sms_text}|{timestamp}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:24]
