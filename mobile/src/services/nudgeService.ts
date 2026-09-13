/**
 * Nudge Service — fetch nudge logs and post feedback.
 */
import api from './api';

export interface NudgeLog {
  id: number;
  user_id: number;
  external_nudge_id: string;
  nudge_type: string;
  message_en: string | null;
  message_hi: string | null;
  priority: string;
  feedback: string | null;
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
