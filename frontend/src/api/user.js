import { apiFetch } from './config';

export const createUserProfile = async (profileData) => {
  const payload = {
    age: parseInt(profileData.age) || 28,
    monthly_income: parseFloat(profileData.income) || 15000,
    monthly_expenses: parseFloat(profileData.expenses) || 8000,
    monthly_emi: profileData.emi === 'Yes' ? 1000 : 0,
    current_savings: parseFloat(profileData.current_savings) || 2000,
    has_health_insurance: profileData.has_health_insurance || false,
    target_retirement_age: parseInt(profileData.target_retirement_age) || 60,
    risk_tolerance: profileData.risk_tolerance || 'moderate',
    is_couple: false,
    partner_age: null,
    partner_income: null,
    epfo_esic_status: profileData.epfoEsic === 'Yes',
    income_tax_payer: false,
    e_shram_registered: profileData.eShram === 'Yes',
    language_pref: profileData.language || 'hi',
    literacy_level: profileData.comfortLevel === 'beginner' ? 'low' : profileData.comfortLevel === 'advanced' ? 'high' : 'medium',
    state: profileData.state || 'Maharashtra',
    savings_bank_account: profileData.savings_bank_account !== false,
    aadhaar_linked: profileData.aadhaar_linked !== false,
    days_active_with_aggregator: parseInt(profileData.days_active_with_aggregator) || 120,
  };
  return apiFetch('/api/profile/', { method: 'POST', body: JSON.stringify(payload) });
};

export const getUserProfile = async () => apiFetch('/api/profile/');

export const updateUserProfile = async (partialProfile) =>
  apiFetch('/api/profile/', { method: 'POST', body: JSON.stringify(partialProfile) });

export const getConsents = async () => apiFetch('/api/privacy/consents');

export const setConsent = async (purpose, granted, language = 'en') =>
  apiFetch('/api/privacy/consents', { method: 'PUT', body: JSON.stringify({ purpose, granted, language }) });

export const getUserSettings = async () => {
  const consents = await getConsents();
  return { consents };
};

export const updateUserSettings = async (settings) => {
  const results = await Promise.all(
    Object.entries(settings.consents || {}).map(([purpose, granted]) => setConsent(purpose, granted))
  );
  return { success: true, results };
};
