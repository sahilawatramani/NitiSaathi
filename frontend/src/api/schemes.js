import { SCHEME_BASE_URL } from './config';
import { getUserProfile, getConsents } from './user';

// ---------------------------------------------------------------------------
// Consent helper
// ---------------------------------------------------------------------------

/**
 * Throws a typed error if the user hasn't granted scheme_eligibility consent.
 * The backend orchestrator enforces this for chat; we enforce it here for
 * direct microservice calls so DPDP compliance is consistent.
 */
async function assertSchemeConsent() {
  const consents = await getConsents().catch(() => []);
  const granted = Array.isArray(consents)
    ? consents.find((c) => c.purpose === 'scheme_eligibility' && c.granted)
    : null;
  if (!granted) {
    const err = new Error('CONSENT_REQUIRED');
    err.consentPurpose = 'scheme_eligibility';
    err.userMessage =
      'Scheme eligibility check needs your consent. Please enable it in Settings → Privacy.';
    err.userMessageHindi =
      'योजना पात्रता जांच के लिए आपकी सहमति आवश्यक है। Settings → Privacy में चालू करें।';
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * POST to the scheme-agent. No JWT needed — the scheme-agent is a public
 * microservice that accepts a user-profile body.
 */
async function schemePost(path, body) {
  const res = await fetch(`${SCHEME_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Scheme agent HTTP ${res.status}`);
  }
  return res.json();
}

async function schemeGet(path) {
  const res = await fetch(`${SCHEME_BASE_URL}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Scheme agent HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Map the backend UserProfile (from /api/profile/) to the UserProfile shape
 * the scheme-agent expects.
 */
function toSchemeAgentProfile(profile) {
  if (!profile) return null;
  return {
    age: profile.age ?? 30,
    monthly_income: profile.monthly_income ?? 0,
    monthly_expenses: profile.monthly_expenses ?? 0,
    monthly_emi: profile.monthly_emi ?? 0,
    is_gig_worker: true, // NitiSaathi targets gig workers
    epfo_esic_status: profile.epfo_esic_status ?? false,
    e_shram_registered: profile.e_shram_registered ?? false,
    income_tax_payer: profile.income_tax_payer ?? false,
    savings_bank_account: profile.savings_bank_account ?? true,
    aadhaar_linked: profile.aadhaar_linked ?? true,
    state: profile.state ?? null,
    language_pref: profile.language_pref ?? 'hi',
  };
}

// ---------------------------------------------------------------------------
// Response adapters — normalise scheme-agent output → UI data contract
// ---------------------------------------------------------------------------

const STATUS_LABEL_MAP = {
  eligible: { hindi: 'योग्य', english: 'Eligible' },
  not_eligible: { hindi: 'योग्य नहीं', english: 'Not eligible' },
  needs_info: { hindi: 'अधिक जानकारी चाहिए', english: 'Needs more info' },
  conditionally_eligible: { hindi: 'शर्तों के साथ योग्य', english: 'Conditionally eligible' },
};

/** Map a single EligibilityResult to the card shape used by SchemesListScreen */
function adaptSchemeCard(result, overrideId = null) {
  const status = result.is_eligible
    ? 'eligible'
    : result.needs_more_info
    ? 'needs_info'
    : 'not_eligible';

  const labels = STATUS_LABEL_MAP[status] ?? STATUS_LABEL_MAP.needs_info;
  const scheme = result.scheme_details ?? {};

  return {
    id: overrideId ?? result.scheme_code ?? scheme.scheme_code ?? 'unknown',
    name: scheme.short_name ?? scheme.full_name ?? result.scheme_name ?? overrideId,
    status,
    statusLabelHindi: labels.hindi,
    statusLabelEnglish: labels.english,
    description: scheme.description ?? result.recommendation ?? '',
    lastVerified: scheme.last_verified
      ? new Date(scheme.last_verified).toLocaleDateString('hi-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'Recently verified',
    hasBudgetGuidance: !!(result.affordability_note || result.budget_guidance),
  };
}

/** Map a SchemeRecommendation (full check-eligibility response) to a list of cards */
function adaptRecommendationToList(recommendation) {
  const results = recommendation?.eligibility_results ?? [];
  return results.map((r) => adaptSchemeCard(r));
}

/** Map a single EligibilityResult to the detail page shape */
function adaptSchemeDetail(result, id) {
  const card = adaptSchemeCard(result, id);
  const scheme = result.scheme_details ?? {};

  return {
    ...card,
    description: scheme.description ?? result.recommendation ?? '',
    benefits: {
      amount: scheme.benefit_amount ?? scheme.pension_amount ?? '',
      subtext: scheme.benefit_subtext ?? 'government benefit',
    },
    contribution: {
      amount: scheme.contribution_amount ?? '',
      subtext: scheme.contribution_subtext ?? 'estimated starting amount',
    },
    budgetGuidance: result.affordability_note
      ? {
          headerText: 'बजट सलाह / Budget guidance',
          reasoningBody: result.affordability_note,
          icon: 'balance',
        }
      : null,
    enrollmentNote:
      'nitisaathi सीधे दाखिला नहीं करता / nitisaathi does not enroll you directly. You must visit the official government portal to complete registration.',
    portalUrl: scheme.official_url ?? scheme.enrollment_url ?? 'https://india.gov.in',
    requirements: result.missing_requirements ?? [],
    reasonsEligible: result.reasons ?? [],
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch all scheme eligibility for the current logged-in user.
 * Falls back to the public schemes list if the user has no profile yet.
 */
export const getSchemes = async () => {
  await assertSchemeConsent();

  let profile = null;
  try {
    profile = await getUserProfile();
  } catch {
    // no profile yet — fall through to list endpoint
  }

  if (profile) {
    const schemeProfile = toSchemeAgentProfile(profile);
    // The scheme-agent endpoint expects { user_profile, budget_state }
    const recommendation = await schemePost('/api/v1/schemes/check-eligibility', {
      user_profile: schemeProfile,
      budget_state: null,
    });
    return adaptRecommendationToList(recommendation);
  }

  // No profile — fetch metadata list without personalisation
  const listData = await schemeGet('/api/v1/schemes/schemes/list');
  return (listData.schemes ?? []).map((s) => ({
    id: s.scheme_code ?? s.scheme_id,
    name: s.full_name ?? s.scheme_code,
    status: 'needs_info',
    statusLabelHindi: 'अधिक जानकारी चाहिए',
    statusLabelEnglish: 'Needs more info',
    description: s.ministry ? `Ministry: ${s.ministry}` : '',
    lastVerified: s.last_verified
      ? new Date(s.last_verified).toLocaleDateString('hi-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'Recently verified',
    hasBudgetGuidance: false,
  }));
};

/**
 * Fetch eligibility detail for one specific scheme.
 */
export const getSchemeDetail = async (id) => {
  await assertSchemeConsent();

  let profile = null;
  try {
    profile = await getUserProfile();
  } catch {
    // ignore
  }

  const schemeCodeMap = {
    e_shram: 'e_shram',
    pmsym: 'pm_sym',
    pm_sym: 'pm_sym',
    pmsby: 'pmsby',
    pmjjby: 'pmjjby',
    apy: 'apy',
    s1: 'e_shram',
    s3: 'pmsby',
    s4: 'pmjjby',
    s5: 'apy',
  };

  const schemeCode = schemeCodeMap[id] ?? id;

  if (profile) {
    const schemeProfile = toSchemeAgentProfile(profile);
    const result = await schemePost(
      `/api/v1/schemes/check-scheme/${schemeCode}`,
      { user_profile: schemeProfile, budget_state: null },
    );
    return adaptSchemeDetail(result, id);
  }

  // No profile — return minimal info from the list
  const listData = await schemeGet('/api/v1/schemes/schemes/list');
  const found = (listData.schemes ?? []).find(
    (s) => s.scheme_code === schemeCode || s.scheme_id === schemeCode,
  );
  return {
    id,
    name: found?.full_name ?? id,
    status: 'needs_info',
    statusLabelHindi: 'अधिक जानकारी चाहिए',
    statusLabelEnglish: 'Needs more info',
    description: 'Complete your profile to see personalised eligibility.',
    lastVerified: 'Recently verified',
    hasBudgetGuidance: false,
    enrollmentNote:
      'nitisaathi सीधे दाखिला नहीं करता / nitisaathi does not enroll you directly.',
    portalUrl: 'https://india.gov.in',
  };
};
