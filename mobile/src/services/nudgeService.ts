/**
 * Nudge Service — communicates with NitiSaathi Nudge Agent (port 8004 / compose.yaml).
 * Provides live notification feeds, proactive trigger evaluations, and user feedback capture.
 */
import axios from 'axios';
import { Platform } from 'react-native';
import api from './api';

const getNudgeAgentBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8004/nudges';
  }
  return 'http://localhost:8004/nudges';
};

export const NUDGE_API_BASE_URL = getNudgeAgentBaseUrl();

const nudgeApiClient = axios.create({
  baseURL: NUDGE_API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface NudgeItem {
  id: string;
  user_id: string | number;
  trigger_id: string;
  nudge_type?: string;
  title?: string;
  message: string;
  priority?: 'urgent' | 'milestone' | 'advisory';
  action_url?: string;
  action_label?: string;
  language?: string;
  feedback?: 'useful' | 'not_useful' | 'harmful' | null;
  status?: string;
  created_at: string;
}

export interface NudgeLog extends NudgeItem {
  external_nudge_id?: string;
}

export const nudgeService = {
  /**
   * List nudges for current user from Nudge Agent (port 8004) with gateway fallback.
   */
  list: async (userId: string | number = '1', language: string = 'en'): Promise<NudgeItem[]> => {
    // 1. Try Nudge Agent direct endpoint
    try {
      const res = await nudgeApiClient.get<NudgeItem[]>(`/${userId}/list`);
      if (res.data && res.data.length > 0) {
        return res.data;
      }
      const allRes = await nudgeApiClient.get<NudgeItem[]>('/');
      if (allRes.data && allRes.data.length > 0) {
        return allRes.data;
      }
    } catch {
      // Continue to gateway fallback
    }

    // 2. Try Budget Gateway endpoint
    try {
      const res = await api.get<any[]>('/nudges/');
      if (res.data && res.data.length > 0) {
        return res.data.map((item) => ({
          id: String(item.id || item.external_nudge_id || Math.random()),
          user_id: item.user_id || userId,
          trigger_id: item.nudge_type || item.trigger_id || 'general',
          nudge_type: item.nudge_type || 'advisory',
          title: item.title || (item.nudge_type ? item.nudge_type.replace('_', ' ').toUpperCase() : 'Financial Alert'),
          message: item.message,
          priority: item.priority || (item.nudge_type?.includes('low_balance') ? 'urgent' : 'advisory'),
          action_url: item.action_url,
          action_label: item.action_label,
          feedback: item.feedback,
          status: item.status || 'active',
          created_at: item.created_at || new Date().toISOString(),
        }));
      }
    } catch {
      // Continue to offline fallback
    }

    // 3. Multilingual curated default fallbacks
    const isHi = language === 'hi';
    const isMr = language === 'mr';

    return [
      {
        id: 'nudge-pmsby-due',
        user_id: userId,
        trigger_id: 'low_balance_before_debit',
        nudge_type: 'low_balance_before_debit',
        title: isHi ? 'PMSBY ₹20 ऑटो-डेबिट सूचना' : isMr ? 'PMSBY ₹20 ऑटो-डेबिट सूचना' : 'PMSBY ₹20 Auto-Debit Due Soon',
        message: isHi
          ? 'आपका PMSBY ₹20 बीमा ऑटो-डेबिट 7 दिनों में होना है। आपका शेष बैलेंस कम है; ₹2 लाख दुर्घटना बीमा चालू रखने हेतु अगले भुगतान में से ₹20 सुरक्षित रखें।'
          : isMr
          ? 'तुमचा PMSBY ₹20 विमा ऑटो-डेबिट 7 दिवसांत होणार आहे. तुमचे शिल्लक कमी आहे; ₹2 लाख अपघात विमा सुरू ठेवण्यासाठी ₹20 शिल्लक ठेवा.'
          : 'Your PMSBY ₹20 debit is due in 7 days. Your balance is low; set aside ₹20 from your next payout to avoid losing your ₹2 Lakh accident cover.',
        priority: 'urgent',
        action_url: 'nitisaathi://schemes/pmsby',
        action_label: isHi ? 'बीमा विवरण देखें' : isMr ? 'विमा तपशील पहा' : 'View Scheme',
        status: 'active',
        created_at: new Date().toISOString(),
      },
      {
        id: 'nudge-milestone-goal',
        user_id: userId,
        trigger_id: 'savings_milestone',
        nudge_type: 'savings_milestone',
        title: isHi ? 'बचत उपलब्धि पूर्ण!' : isMr ? 'बचत टप्पा पूर्ण झाला!' : 'Savings Milestone Achieved!',
        message: isHi
          ? 'बधाई हो! आपने इस महीने अपना आपातकालीन सुरक्षा फंड सफलतापूर्वक बनाए रखा है। यह बचत आदत जारी रखें!'
          : isMr
          ? 'अभिनंदन! तुम्ही या महिन्यात तुमचा आणीबाणीचा फंड यशस्वीपणे राखला आहे. ही सवय कायम ठेवा!'
          : 'Congratulations! You have consistently maintained your emergency buffer this month. Keep up the disciplined habit!',
        priority: 'milestone',
        action_url: 'nitisaathi://goals',
        action_label: isHi ? 'बचत देखें' : isMr ? 'बचत पहा' : 'View Savings',
        status: 'active',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'nudge-volatility-advisory',
        user_id: userId,
        trigger_id: 'high_volatility_streak',
        nudge_type: 'high_volatility_streak',
        title: isHi ? 'अनियमित आय सावधानी' : isMr ? 'उत्पन्न चढ-उतार सल्ला' : 'High Income Volatility Advisory',
        message: isHi
          ? 'हाल के हफ्तों में आपकी आय में काफी उतार-चढ़ाव आया है। अपनी बचत योजना को लचीला रखें और नई निश्चित EMI लेने से बचें।'
          : isMr
          ? 'गेल्या काही आठवड्यांत तुमच्या कमाईत चढ-उतार झाला आहे. बचतीचे लक्ष्य लवचिक ठेवा आणि नवीन EMI घेणे टाळा.'
          : 'Your earnings have fluctuated significantly over recent weeks. Keep weekly savings targets flexible and avoid new fixed commitments.',
        priority: 'advisory',
        action_url: 'nitisaathi://budget',
        action_label: isHi ? 'बजट देखें' : isMr ? 'बजेट पहा' : 'Adjust Budget',
        status: 'active',
        created_at: new Date(Date.now() - 172800000).toISOString(),
      },
    ];
  },

  /**
   * Post user feedback (useful | not_useful | harmful).
   */
  postFeedback: async (
    nudgeId: string,
    rating: 'useful' | 'not_useful' | 'harmful',
    triggerId: string = 'low_balance_before_debit',
    userId: string | number = '1'
  ): Promise<void> => {
    try {
      await nudgeApiClient.post(`/${nudgeId}/feedback`, {
        user_id: String(userId),
        trigger_id: triggerId,
        rating,
      });
    } catch {
      try {
        await api.post(`/nudges/${nudgeId}/feedback`, { rating });
      } catch {
        // Handled silently
      }
    }
  },

  /**
   * Proactively evaluate user state against all trigger checkers.
   */
  evaluateUserNudges: async (state: {
    user_id: string | number;
    closing_balance?: number;
    low_balance_flag?: boolean;
    pmsby_debit_due_soon?: boolean;
    days_to_next_pmsby_debit?: number;
    nudge_trigger_low_balance_before_debit?: boolean;
    missed_goal?: boolean;
    high_volatility_streak?: boolean;
    high_emi_burden?: boolean;
    savings_milestone?: boolean;
    language_pref?: 'hi' | 'en' | 'mr';
  }): Promise<NudgeItem[]> => {
    try {
      const payload = {
        user_id: String(state.user_id),
        closing_balance: state.closing_balance || 0.0,
        low_balance_flag: !!state.low_balance_flag,
        pmsby_debit_due_soon: !!state.pmsby_debit_due_soon,
        days_to_next_pmsby_debit: state.days_to_next_pmsby_debit,
        nudge_trigger_low_balance_before_debit: !!state.nudge_trigger_low_balance_before_debit,
        missed_goal: !!state.missed_goal,
        high_volatility_streak: !!state.high_volatility_streak,
        high_emi_burden: !!state.high_emi_burden,
        savings_milestone: !!state.savings_milestone,
        language_pref: state.language_pref || 'en',
      };
      const res = await nudgeApiClient.post<{ nudges: NudgeItem[] }>('/evaluate', payload);
      return res.data.nudges || [];
    } catch {
      return [];
    }
  },
};
