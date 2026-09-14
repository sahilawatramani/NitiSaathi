import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const signup = (email, password) =>
  api.post('/auth/signup', { email, password }, { timeout: 10000 });

export const login = (email, password) => {
  return api.post('/auth/login', { email, password }, { timeout: 10000 });
};

export const resetPassword = (email, new_password) => api.post('/auth/reset-password', { email, new_password }, { timeout: 10000 });

export const getMe = () => api.get('/auth/me', { timeout: 5000 });

// Transactions
export const uploadCSV = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/transactions/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000, // 5 minutes safety net for very large files
  });
};

export const ingestSmsTransaction = (smsText, sender = 'BANK-SMS', provider = 'bank_sms') =>
  api.post('/realtime/sms/ingest', {
    sms_text: smsText,
    sender,
    provider,
  });

export const getTransactions = (skip = 0, limit = 100) =>
  api.get(`/transactions?skip=${skip}&limit=${limit}`);

// Portfolio
export const uploadPortfolio = (formData) => {
  return api.post('/portfolio/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
};

// Realtime / Pending Classification
export const getPendingTransactions = () => api.get('/realtime/pending');
export const classifyPendingTransaction = (eventId, selectedCategory, customCategory = null) =>
  api.post(`/realtime/pending/${eventId}/classify`, {
    selected_category: selectedCategory,
    custom_category: customCategory,
  });
export const reclassifyTransaction = (transactionId, selectedCategory, customCategory = null) =>
  api.post(`/realtime/transactions/${transactionId}/reclassify`, {
    selected_category: selectedCategory,
    custom_category: customCategory,
  });
export const getNotifications = (limit = 100) => api.get(`/realtime/notifications?limit=${limit}`);
export const markNotificationRead = (notificationId) =>
  api.post(`/realtime/notifications/${notificationId}/read`);

// Analytics
export const getAnalytics = () => api.get('/analytics/');
export const getForecast = (months = 3) => api.get(`/analytics/forecast?months=${months}`);
export const getComparison = () => api.get('/analytics/compare');
export const getSavings = (income = 0) => api.get(`/analytics/savings?monthly_income=${income}`);

// Tax
export const getTaxReport = (income = 0, aiSummary = false) =>
  api.get(`/tax/report?annual_income=${income}&ai_summary=${aiSummary}`);
export const getTaxSuggestions = (income = 0) =>
  api.get(`/tax/suggestions?annual_income=${income}`);

export const sendChatMessage = (message) =>
  api.post('/chat/', { message });

// Profile & Planning
export const getProfile = () => api.get('/profile/');
export const saveProfile = (data) => api.post('/profile/', data);

// ── Budget Agent: Goals ──────────────────────────────────────────────
export const getGoals = (activeOnly = true) =>
  api.get(`/goals/?active_only=${activeOnly}`);
export const createGoal = (data) => api.post('/goals/', data);
export const updateGoal = (goalId, data) => api.put(`/goals/${goalId}`, data);
export const addSavingsToGoal = (goalId, amount) =>
  api.post(`/goals/${goalId}/add-savings`, { amount });
export const archiveGoal = (goalId) => api.delete(`/goals/${goalId}`);

// ── Budget Agent: Categories ─────────────────────────────────────────
export const getCategories = () => api.get('/categories/');
export const createCategory = (data) => api.post('/categories/', data);
export const deleteCategory = (categoryId) =>
  api.delete(`/categories/${categoryId}`);

// ── Budget Agent: Insights ───────────────────────────────────────────
export const getDailyInsights = () => api.get('/insights/daily');
export const getCausalChains = () => api.get('/insights/causal-chains');
export const recalculateWeeklyFeatures = () => api.post('/insights/recalculate');

// ── Budget Agent: Reports ────────────────────────────────────────────
export const downloadWeeklyReport = () =>
  api.get('/reports/weekly/download', { responseType: 'blob' });
export const emailWeeklyReport = () => api.post('/reports/weekly/email');

// ── Budget Agent: Recurring Debits ───────────────────────────────────
export const getRecurringDebits = (activeOnly = true) =>
  api.get(`/recurring-debits/?active_only=${activeOnly}`);
export const createRecurringDebit = (data) => api.post('/recurring-debits/', data);
export const updateRecurringDebit = (id, data) => api.put(`/recurring-debits/${id}`, data);
export const deleteRecurringDebit = (id) => api.delete(`/recurring-debits/${id}`);

// ── Budget Agent: Budget Planner (Time-Series Forecast & Inflation) ──
export const getBudgetPlanner = (currentCost = 1000) =>
  api.get(`/analytics/budget-planner?current_cost=${currentCost}`);
export const updateBudgetPlanner = (history, currentCost = 1000) =>
  api.post('/analytics/budget-planner', { history, current_cost: currentCost });

// ── Nudge Agent (Port 8004) ──────────────────────────────────────────
const NUDGE_API_BASE = 'http://localhost:8004/nudges';
export const getNudges = async (userId = '1', language = 'en') => {
  try {
    const res = await axios.get(`${NUDGE_API_BASE}/${userId}/list`, { timeout: 3000 });
    if (res.data && res.data.length > 0) return res.data;
  } catch {
    // fallback to run-check or gateway
  }
  try {
    const res = await axios.get(`${NUDGE_API_BASE}/run-check?language_pref=${language}`, { timeout: 3000 });
    if (res.data && res.data.length > 0) return res.data;
  } catch {
    // fallback
  }
  try {
    const res = await api.get('/nudges/');
    if (res.data && res.data.length > 0) return res.data;
  } catch {
    // fallback
  }
  return [];
};

export const postNudgeFeedback = async (nudgeId, rating, triggerId = 'low_balance_before_debit', userId = '1') => {
  try {
    return await axios.post(`${NUDGE_API_BASE}/${nudgeId}/feedback`, {
      user_id: String(userId),
      trigger_id: triggerId,
      rating,
    }, { timeout: 3000 });
  } catch {
    try {
      return await api.post(`/nudges/${nudgeId}/feedback`, { rating });
    } catch {
      return null;
    }
  }
};

// ── Scheme Agent (Port 8001) ─────────────────────────────────────────
const SCHEME_API_BASE = 'http://localhost:8001/api/v1/schemes';
export const getSchemesRecommendations = async (profile = {}, language = 'en') => {
  try {
    const payload = {
      profile: {
        age: profile.age || 28,
        occupation: profile.occupation || 'delivery_partner',
        monthly_income: profile.monthly_income || 25000,
        state: profile.state || 'Maharashtra',
        ...profile,
      },
      language_pref: language,
      limit: 6,
    };
    const res = await axios.post(`${SCHEME_API_BASE}/filter`, payload, { timeout: 3000 });
    if (res.data && (res.data.schemes || res.data.items)) {
      return res.data.schemes || res.data.items;
    }
  } catch {
    // fallback
  }
  return [];
};

export default api;
