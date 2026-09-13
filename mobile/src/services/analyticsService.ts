/**
 * Analytics + Budget State Service
 */
import api from './api';

export interface BudgetState {
  income_wma_4w: number;
  income_volatility_pct: number;
  savings_rate_recommendation: number;
  low_balance_flag: boolean;
  closing_balance: number;
  predicted_next_week_income: number;
  pmsby_debit_due_soon: boolean;
  days_to_next_pmsby_debit: number | null;
  nudge_trigger_low_balance_before_debit: boolean;
  goal_progress: { goal: string; target: number; saved: number; pct: number }[];
  financial_persona: string;
  week_start: string;
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
