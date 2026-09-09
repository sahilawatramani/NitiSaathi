import { apiDownload, apiFetch, API_BASE_URL, getToken } from './config';

export const downloadWeeklyReport = async () => {
  const token = await getToken();
  return fetch(`${API_BASE_URL}/api/reports/weekly/download`, { headers: { Authorization: `Bearer ${token}` } });
};

export const emailWeeklyReport = async () =>
  apiFetch('/api/reports/weekly/email', { method: 'POST' });

export const downloadMonthlyReport = async (year, month) => {
  const token = await getToken();
  return fetch(`${API_BASE_URL}/api/reports/monthly/download?year=${year}&month=${month}`, { headers: { Authorization: `Bearer ${token}` } });
};

export const downloadQuarterlyReport = async (year, quarter) => {
  const token = await getToken();
  return fetch(`${API_BASE_URL}/api/reports/quarterly/download?year=${year}&quarter=${quarter}`, { headers: { Authorization: `Bearer ${token}` } });
};

export const downloadYearlyReport = async (year) => {
  const token = await getToken();
  return fetch(`${API_BASE_URL}/api/reports/yearly/download?year=${year}`, { headers: { Authorization: `Bearer ${token}` } });
};

export const getReports = async () => {
  const now = new Date();
  return [
    { id: 'weekly', title: 'This Week', generatedDate: now.toLocaleDateString(), status: 'ready', icon: 'check-circle' },
    { id: 'monthly', title: `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`, generatedDate: now.toLocaleDateString(), status: 'ready', icon: 'check-circle' },
  ];
};
