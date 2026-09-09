import { FRAUD_BASE_URL } from './config';
import { apiFetch } from './config';
import { getConsents } from './user';

// ---------------------------------------------------------------------------
// Consent helper
// ---------------------------------------------------------------------------

/**
 * Throws a typed error if the user hasn't granted fraud_detection consent.
 */
async function assertFraudConsent() {
  const consents = await getConsents().catch(() => []);
  const granted = Array.isArray(consents)
    ? consents.find((c) => c.purpose === 'fraud_detection' && c.granted)
    : null;
  if (!granted) {
    const err = new Error('CONSENT_REQUIRED');
    err.consentPurpose = 'fraud_detection';
    err.userMessage =
      'Fraud detection needs your consent. Please enable it in Settings → Privacy.';
    err.userMessageHindi =
      'धोखाधड़ी सुरक्षा के लिए आपकी सहमति आवश्यक है। Settings → Privacy में चालू करें।';
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function fraudPost(path, body) {
  const res = await fetch(`${FRAUD_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Fraud guard HTTP ${res.status}`);
  }
  return res.json();
}

async function fraudGet(path) {
  const res = await fetch(`${FRAUD_BASE_URL}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Fraud guard HTTP ${res.status}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Adapters
// ---------------------------------------------------------------------------

/**
 * Map backend Transaction shape → fraud-guard Transaction shape.
 * The fraud-guard uses its own schema (see agents/fraud_guard/models/schemas.py).
 */
function toFraudTxn(t) {
  return {
    transaction_id: String(t.id ?? ''),
    amount: Number(t.amount ?? 0),
    direction: t.direction ?? 'debit',
    counterparty: t.merchant ?? '',
    category: t.category ?? 'Uncategorized',
    timestamp: t.date ? new Date(t.date).toISOString() : new Date().toISOString(),
    description: t.description ?? '',
    upi_id: t.upi_id ?? null,
    location: t.location ?? null,
    device_id: t.device_id ?? null,
  };
}

/**
 * Build a minimal UserTransactionHistory from a list of transactions.
 * The batch detect endpoint expects this as a companion to each transaction.
 */
function buildMinimalHistory(transactions) {
  const amounts = transactions.map((t) => Number(t.amount ?? 0));
  const avg = amounts.length ? amounts.reduce((s, a) => s + a, 0) / amounts.length : 0;
  return {
    user_id: 'current',
    avg_transaction_amount_debit: avg,
    std_transaction_amount_debit: 0,
    avg_transaction_amount_credit: 0,
    std_transaction_amount_credit: 0,
    known_counterparties: [...new Set(transactions.map((t) => t.merchant).filter(Boolean))],
    category_distribution: {},
    typical_hours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    historical_fraud_incidents: 0,
  };
}

/**
 * Map a FraudDetectionResult to the flagged-transaction card shape.
 */
function adaptFlaggedTxn(result, sourceTxn) {
  const alert = result.alert ?? {};
  const pattern = alert.pattern_name ?? 'Suspicious activity';
  const hindi = alert.alert_message_hindi ?? 'संदिग्ध लेनदेन';

  const iconMap = {
    unusual_location: 'location_off',
    odd_hours: 'schedule',
    large_amount: 'warning',
    new_counterparty: 'person_add',
    pin_otp_request: 'lock',
    default: 'flag',
  };

  const patternKey = (alert.pattern_id ?? '').toLowerCase().replace(/-/g, '_');
  const icon = iconMap[patternKey] ?? iconMap.default;

  const date = sourceTxn?.date
    ? new Date(sourceTxn.date).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recently';

  return {
    id: sourceTxn?.id ?? String(Math.random()),
    amount: `₹ ${Number(sourceTxn?.amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    merchant: sourceTxn?.merchant ?? 'Unknown',
    date,
    flagTypeHindi: hindi,
    flagTypeEnglish: pattern,
    icon,
    severity: alert.severity ?? 'medium',
    rawResult: result,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch the user's recent transactions from the budget-agent backend,
 * run them through the fraud-guard batch-detect endpoint, and return only
 * the flagged ones in the UI card shape.
 */
export const getFlaggedTransactions = async () => {
  await assertFraudConsent();

  // 1. Get recent transactions from the main backend (last 50)
  let transactions = [];
  try {
    const data = await apiFetch('/api/transactions/?limit=50');
    transactions = Array.isArray(data) ? data : data?.transactions ?? data?.items ?? [];
  } catch {
    return [];
  }

  if (!transactions.length) return [];

  // 2. Build history summary and convert to fraud-guard shape
  const fraudTxns = transactions.map(toFraudTxn);
  const history = buildMinimalHistory(transactions);

  // 3. Run batch detection
  let results = [];
  try {
    results = await fraudPost('/api/v1/fraud-guard/batch-detect', {
      transactions: fraudTxns,
      user_history: history,
    });
  } catch {
    return [];
  }

  // 4. Filter to flagged only and adapt shape
  return results
    .filter((r) => r.is_flagged || r.is_suspicious)
    .map((r, idx) => adaptFlaggedTxn(r, transactions[idx]));
};

/**
 * Check an arbitrary text string (message / UPI request) for fraud signals.
 * Returns a result in the shape the FraudCheckScreen expects.
 */
export const getFraudCheckResult = async (text) => {
  await assertFraudConsent();

  if (!text || !text.trim()) {
    return {
      riskLevel: 'low',
      headlineHindi: 'कोई मैसेज नहीं',
      headlineEnglish: 'No message provided',
      reasonHindi: 'जांचने के लिए कोई मैसेज नहीं है।',
      reasonEnglish: 'No message text was provided for analysis.',
    };
  }

  // First check for PIN/OTP request — hardest rule, always wins
  let pinOtpResult = null;
  try {
    pinOtpResult = await fraudPost('/api/v1/fraud-guard/check-pin-otp-request', {
      text,
    });
  } catch {
    // ignore, fall through
  }

  if (pinOtpResult?.contains_pin_otp_request) {
    return {
      riskLevel: 'high',
      headlineHindi: '🚨 PIN/OTP मांगा जा रहा है — बिल्कुल शेयर न करें',
      headlineEnglish: '🚨 PIN/OTP Request Detected — Never Share',
      reasonHindi: pinOtpResult.alert_message ?? 'यह एक जाना-पहचाना धोखाधड़ी पैटर्न है।',
      reasonEnglish: pinOtpResult.alert_message ?? 'This is a known scam pattern.',
      actionRequired: pinOtpResult.action_required,
    };
  }

  // General pattern check via a dummy transaction with the text as description
  try {
    const dummyTxn = toFraudTxn({
      id: 'manual-check',
      amount: 0,
      direction: 'debit',
      merchant: 'Manual Check',
      description: text,
      date: new Date().toISOString(),
    });
    const emptyHistory = buildMinimalHistory([]);

    const result = await fraudPost('/api/v1/fraud-guard/detect', {
      transaction: dummyTxn,
      user_history: emptyHistory,
      check_description: text,
    });

    const isFlagged = result.is_flagged || result.is_suspicious;
    const alert = result.alert ?? {};

    return {
      riskLevel: isFlagged ? (alert.severity === 'critical' ? 'high' : 'medium') : 'low',
      headlineHindi: isFlagged
        ? (alert.alert_title_hindi ?? 'यह खतरनाक हो सकता है')
        : 'यह सुरक्षित लगता है',
      headlineEnglish: isFlagged
        ? (alert.pattern_name ?? 'This could be risky')
        : 'This looks safe',
      reasonHindi: isFlagged
        ? (alert.alert_message_hindi ?? 'यह मैसेज एक संदिग्ध पैटर्न से मेल खाता है।')
        : 'यह मैसेज किसी भी ज्ञात धोखाधड़ी पैटर्न से मेल नहीं खाता।',
      reasonEnglish: isFlagged
        ? (alert.alert_message ?? alert.pattern_name ?? 'This message matches a suspicious pattern.')
        : 'This message does not match any known scam patterns.',
      detectedPatterns: result.detected_patterns ?? [],
    };
  } catch {
    return {
      riskLevel: 'low',
      headlineHindi: 'जांच नहीं हो सकी',
      headlineEnglish: 'Check unavailable',
      reasonHindi: 'फ्रॉड गार्ड सेवा अभी उपलब्ध नहीं है। बाद में पुनः प्रयास करें।',
      reasonEnglish: 'The fraud guard service is currently unavailable. Please try again later.',
    };
  }
};
