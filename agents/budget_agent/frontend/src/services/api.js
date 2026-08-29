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

export default api;
