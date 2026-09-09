# Multi-agent gateway contract

The frontend calls only the authenticated Budget API gateway. Specialist agent
URLs are internal deployment details and must not be called from a browser.

## Chat

`POST /api/chat/`

```json
{
  "message": "Should I join PM-SYM? My income is irregular.",
  "session_id": "optional-stable-chat-id",
  "chat_history": [{"role": "user", "content": "Earlier message"}]
}
```

```json
{
  "response": "…final Literacy Agent output…",
  "intent": "scheme_eligibility",
  "active_agents": ["budget", "scheme"],
  "confidence": 0.92,
  "trust_metadata": {
    "data_freshness": "Based on the latest weekly data (2026-08-10).",
    "confidence_score": 0.92,
    "confidence_label": "High",
    "sensitivity": "This recommendation changes if predicted weekly income drops below ₹2,240.",
    "data_source_tags": ["Budget Agent DB", "Scheme/Fraud microservice response"]
  },
  "nudge_queue": []
}
```

`response` is always the display text. The other fields are optional UI
metadata for showing confidence, freshness and queued proactive nudges.

## Required onboarding fields

`POST /api/profile/` now accepts the existing finance fields plus these
consented fields: `epfo_esic_status`, `income_tax_payer`,
`e_shram_registered`, `days_active_with_aggregator`, `state`,
`savings_bank_account`, `aadhaar_linked`, `language_pref` (`hi`, `en`, `mr`)
and `literacy_level` (`low`, `medium`, `high`). A scheme query is not evaluated
until `days_active_with_aggregator` has been supplied.

## Invocation guarantees

- Relevance below `0.30` means the specialist HTTP call is skipped.
- Scheme receives eligibility fields plus a small affordability projection;
  Fraud receives only the message and transaction-pattern fields; Nudge never
  receives raw transactions; Literacy receives only response text and language
  settings.
- Scheme and Budget conflicts are shown as explicit trade-offs, not silently
  picked by the gateway.
- Every response passes through Literacy. If that service is temporarily down,
  the gateway returns a jargon-cleaned safe fallback and retains the advisory
  disclaimer for financial/scheme advice.
