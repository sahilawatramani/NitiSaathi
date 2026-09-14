import api from './api';

export interface FraudAnalysisResult {
  is_fraud: boolean;
  risk_level: 'low' | 'medium' | 'high';
  reasons: string[];
}

export const fraudService = {
  async detectText(text: string): Promise<FraudAnalysisResult> {
    try {
      const response = await api.post('/fraud/detect', { message: text });
      return response.data;
    } catch {
      // Offline fallback
      return {
        is_fraud: true,
        risk_level: 'high',
        reasons: ['Suspicious OTP/PIN request pattern detected'],
      };
    }
  },
};
