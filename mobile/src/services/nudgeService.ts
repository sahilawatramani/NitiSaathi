/**
 * Nudge Service — fetch nudge logs and post feedback.
 */
import api from './api';

export interface NudgeLog {
  id: number | string;
  user_id: number | string;
  external_nudge_id?: string;
  trigger_id?: string;
  nudge_type?: string;
  message: string;
  priority?: string;
  feedback?: string | null;
  status?: string;
  created_at: string;
}

export const nudgeService = {
  list: async (): Promise<NudgeLog[]> => {
    const res = await api.get<NudgeLog[]>('/nudges/');
    return res.data;
  },

  postFeedback: async (
    nudgeId: string,
    rating: 'useful' | 'not_useful' | 'harmful'
  ): Promise<void> => {
    await api.post(`/nudges/${nudgeId}/feedback`, { rating });
  },
};
