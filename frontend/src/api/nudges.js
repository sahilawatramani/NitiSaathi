import { apiFetch } from './config';

export const getNotifications = async () => apiFetch('/api/realtime/notifications');

export const markNotificationRead = async (id) =>
  apiFetch(`/api/realtime/notifications/${id}/read`, { method: 'POST' });

export const postNudgeFeedback = async (nudgeId, rating) =>
  apiFetch(`/api/nudges/${nudgeId}/feedback`, { method: 'POST', body: JSON.stringify({ rating }) }).catch(() => null);

export const getNudges = async () => {
  const notifs = await getNotifications();
  return (notifs || []).map(n => ({
    id: n.id, 
    isHighPriority: n.notification_type === 'proactive_nudge',
    tagTitle: n.title, 
    timeAgo: new Date(n.created_at).toLocaleDateString('hi-IN'),
    headline: n.title, 
    bodyHindi: n.message, 
    bodyEnglish: n.message,
    outcomeHindi: null, 
    outcomeEnglish: null, 
    is_read: n.is_read,
  }));
};

export const getRecentNudges = getNudges;
