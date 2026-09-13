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
    isHighPriority: n.notification_type === 'proactive_nudge' || n.priority === 'urgent',
    tagTitle: n.title || 'Nudge', 
    timeAgo: n.created_at ? new Date(n.created_at).toLocaleDateString('hi-IN') : 'हाल ही में',
    headline: n.title || 'सूचना', 
    message: n.message,
    is_read: n.is_read,
  }));
};

export const getRecentNudges = getNudges;
