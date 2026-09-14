/**
 * Analytics + Budget State Service
 */
import api from './api';

export interface WeeklyFeature {
  week_start: string;
  total_income: number;
  total_expense: number;
  closing_balance: number;
  savings_rate_actual: number;
  low_balance_flag: boolean;
  had_informal_borrowing: boolean;
  financial_persona: string;
}

export interface UpcomingDebit {
  name: string;
  amount: number;
  category: string;
  due_date?: string;
  days_until_due?: number;
  can_cover?: boolean;
}

export interface BudgetState {
  user_id?: number;
  income_wma_4w: number;
  income_volatility_pct: number;
  savings_rate_recommendation: number;
  low_balance_flag: boolean;
  closing_balance: number;
  safe_to_spend_today: number;
  predicted_next_week_income: number;
  current_savings_streak?: number;
  highest_savings_streak?: number;
  financial_persona?: string;
  pmsby_debit_due_soon?: boolean;
  days_to_next_pmsby_debit?: number | null;
  nudge_trigger_low_balance_before_debit?: boolean;
  upcoming_mandatory_debits?: UpcomingDebit[];
  nudges?: string[];
  active_goals?: any[];
  weekly_features_last4?: WeeklyFeature[];
  goal_progress?: { goal: string; target: number; saved: number; pct: number }[];
  week_start?: string;
}

export const analyticsService = {
  getBudgetState: async (): Promise<BudgetState> => {
    const res = await api.get<BudgetState>('/analytics/budget-state');
    return res.data;
  },

  getAnalytics: async () => {
    const res = await api.get('/analytics/');
    return res.data;
  },

  getForecast: async (months = 3) => {
    const res = await api.get(`/analytics/forecast?months=${months}`);
    return res.data;
  },
};
