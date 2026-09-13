/**
 * Goals Service — CRUD for saving goals.
 */
import api from './api';

export interface Goal {
  id: number;
  user_id: number;
  name: string;
  target_amount: number;
  saved_amount: number;
  category: string | null;
  target_date: string | null;
  is_active: boolean;
  progress_pct: number;
  created_at: string;
  updated_at: string;
}

export interface GoalCreate {
  name: string;
  target_amount: number;
  category?: string;
  target_date?: string;
}

export const goalsService = {
  list: async (): Promise<Goal[]> => {
    const res = await api.get<Goal[]>('/goals/');
    return res.data;
  },

  create: async (payload: GoalCreate): Promise<Goal> => {
    const res = await api.post<Goal>('/goals/', payload);
    return res.data;
  },

  addSavings: async (goalId: number, amount: number): Promise<Goal> => {
    const res = await api.post<Goal>(`/goals/${goalId}/add-savings`, { amount });
    return res.data;
  },

  archive: async (goalId: number): Promise<void> => {
    await api.delete(`/goals/${goalId}`);
  },
};
