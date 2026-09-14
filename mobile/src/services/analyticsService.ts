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

export interface MonthlyIncomeHistoryItem {
  month: string;
  income: number;
  source?: string;
}

export interface BudgetPlannerResponse {
  history: MonthlyIncomeHistoryItem[];
  forecast: {
    month: string;
    predicted_income: number;
    upper_bound: number;
    lower_bound: number;
    is_forecast: boolean;
  }[];
  full_trajectory: {
    month: string;
    actual_income: number | null;
    predicted_income: number | null;
    upper_bound: number | null;
    lower_bound: number | null;
    is_forecast: boolean;
  }[];
  wma_income: number;
  forecasted_monthly_income: number;
  current_inflation_rate: number;
  group_label: string;
  spending_guide: {
    total_income: number;
    basic_needs: { name: string; pct: number; amount: number };
    emergency_savings: { name: string; pct: number; amount: number };
    future_growth: { name: string; pct: number; amount: number };
    personal_spending: { name: string; pct: number; amount: number };
  };
  purchasing_power_loss_pct: number;
  inflation_awareness: {
    current_cost: number;
    annual_rate: number;
    cost_5y: number;
    cost_10y: number;
    cost_15y: number;
  };
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

  getBudgetPlanner: async (currentCost = 1000): Promise<BudgetPlannerResponse> => {
    const res = await api.get<BudgetPlannerResponse>(`/analytics/budget-planner?current_cost=${currentCost}`);
    return res.data;
  },

  updateBudgetPlanner: async (history: MonthlyIncomeHistoryItem[], currentCost = 1000): Promise<BudgetPlannerResponse> => {
    const res = await api.post<BudgetPlannerResponse>('/analytics/budget-planner', {
      history,
      current_cost: currentCost,
    });
    return res.data;
  },
};
