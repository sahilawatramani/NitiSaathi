/**
 * Profile Service — get and upsert user profile for onboarding.
 */
import api from './api';

export interface UserProfile {
  id: number;
  user_id: number;
  age: number;
  monthly_income: number;
  monthly_expenses: number;
  monthly_emi: number;
  current_savings: number;
  has_health_insurance: boolean;
  target_retirement_age: number;
  risk_tolerance: string;
  is_couple: boolean;
  partner_age: number | null;
  partner_income: number | null;
  epfo_esic_status: boolean;
  income_tax_payer: boolean;
  e_shram_registered: boolean;
  days_active_with_aggregator: number | null;
  state: string | null;
  savings_bank_account: boolean;
  aadhaar_linked: boolean;
  language_pref: 'hi' | 'en' | 'mr';
  literacy_level: 'low' | 'medium' | 'high';
}

export type ProfileUpdatePayload = Omit<UserProfile, 'id' | 'user_id'>;

export const profileService = {
  get: async (): Promise<UserProfile | null> => {
    const res = await api.get<UserProfile | null>('/profile/');
    return res.data;
  },

  upsert: async (payload: Partial<ProfileUpdatePayload>): Promise<UserProfile> => {
    const res = await api.post<UserProfile>('/profile/', payload);
    return res.data;
  },
};
