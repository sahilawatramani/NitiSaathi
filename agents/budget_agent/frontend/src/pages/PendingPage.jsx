import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle2, Loader2, MessageCircleWarning } from 'lucide-react';
import {
  classifyPendingTransaction,
  getNotifications,
  getPendingTransactions,
  markNotificationRead,
  reclassifyTransaction,
} from '../services/api';

export default function PendingPage() {
  const [pending, setPending] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyEventId, setBusyEventId] = useState(null);
  const [customByEvent, setCustomByEvent] = useState({});
  const [showOptionsByEvent, setShowOptionsByEvent] = useState({});
  const [pickedByEvent, setPickedByEvent] = useState({});
  const [activeReclassByNotification, setActiveReclassByNotification] = useState({});
  const [reclassChoiceByNotification, setReclassChoiceByNotification] = useState({});
  const [reclassCustomByNotification, setReclassCustomByNotification] = useState({});
  const [error, setError] = useState('');

  const defaultReclassOptions = ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Others'];

  const parsePayload = (payload) => {
    if (!payload) return null;
    if (typeof payload === 'object') return payload;
    try {
      return JSON.parse(payload);
    } catch {
      return null;
    }
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications],
  );

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [pendingRes, notificationsRes] = await Promise.all([
        getPendingTransactions(),
        getNotifications(50),
      ]);
      setPending(pendingRes.data || []);
      setNotifications(notificationsRes.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load pending tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClassify = async (eventId, selected, customOverride = null) => {
    const customCategory = customOverride ?? (customByEvent[eventId]?.trim() || null);
    if (selected === 'Others' && !customCategory) {
      setError('Please enter a custom category when choosing Others');
      return;
    }

    setBusyEventId(eventId);
    setError('');
    try {
      await classifyPendingTransaction(eventId, selected, customCategory);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Classification failed');
    } finally {
      setBusyEventId(null);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    } catch {
      setError('Could not mark notification as read');
    }
  };

  const handleReclassify = async (notification) => {
    const payload = parsePayload(notification.payload);
    const transactionId = payload?.transaction_id;
    if (!transactionId) {
      setError('Missing transaction reference for reclassification');
      return;
    }

    const selected = reclassChoiceByNotification[notification.id];
    if (!selected) {
      setError('Please select a category');
      return;
    }

    const custom = (reclassCustomByNotification[notification.id] || '').trim();
    if (selected === 'Others' && !custom) {
      setError('Please enter a custom category when choosing Others');
      return;
    }

    setBusyEventId(`notif-${notification.id}`);
    setError('');
    try {
      await reclassifyTransaction(transactionId, selected, selected === 'Others' ? custom : null);
      await loadData();
      setActiveReclassByNotification((prev) => ({ ...prev, [notification.id]: false }));
    } catch (err) {
      setError(err.response?.data?.detail || 'Reclassification failed');
    } finally {
      setBusyEventId(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Pending Classifications</h1>
        <p className="page-subtitle">Confirm AI suggestions and keep your monthly report accurate</p>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: '16px', borderColor: 'rgba(239,68,68,0.4)' }}>
          <p style={{ color: 'var(--danger)' }}>{error}</p>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>Transactions Awaiting Confirmation</h3>

          {pending.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <CheckCircle2 size={28} style={{ color: 'var(--success)', marginBottom: '10px' }} />
              <p style={{ color: 'var(--text-secondary)' }}>All caught up. No pending transactions.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {pending.map((item) => (
                <div key={item.id} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '12px' }}>
                  {(() => {
                    const suggestions = item.suggested_categories || [];
                    const predicted = suggestions[0] || 'Miscellaneous';
                    const showOptions = !!showOptionsByEvent[item.id];
                    const selected = pickedByEvent[item.id] || '';

                    return (
                      <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.merchant}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                        {new Date(item.txn_date).toLocaleString('en-IN')} | Rs. {Number(item.amount).toFixed(2)}
                      </div>
                    </div>
                    <span className="badge badge-blue">{item.status}</span>
                  </div>

                  {item.description && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '10px' }}>{item.description}</p>
                  )}

                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '10px' }}>
                    AI prediction: <strong>{predicted}</strong>. Is this correct?
                  </p>

                  {!showOptions ? (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-success"
                        onClick={() => handleClassify(item.id, predicted)}
                        disabled={busyEventId === item.id}
                      >
                        {busyEventId === item.id ? <Loader2 size={14} className="spin" /> : null}
                        Yes
                      </button>
                      <button
                        className="btn"
                        onClick={() => setShowOptionsByEvent((prev) => ({ ...prev, [item.id]: true }))}
                        disabled={busyEventId === item.id}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>
                        Choose the right category:
                      </p>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {suggestions.map((cat) => (
                          <button
                            key={cat}
                            className="btn"
                            onClick={() => {
                              if (cat === 'Others') {
                                setPickedByEvent((prev) => ({ ...prev, [item.id]: 'Others' }));
                                return;
                              }
                              handleClassify(item.id, cat);
                            }}
                            disabled={busyEventId === item.id}
                            style={{
                              borderColor: selected === cat ? 'var(--accent)' : 'var(--border)',
                              color: selected === cat ? 'var(--accent)' : 'var(--text-primary)',
                            }}
                          >
                            {busyEventId === item.id ? <Loader2 size={14} className="spin" /> : null}
                            {cat}
                          </button>
                        ))}
                      </div>

                      {selected === 'Others' && (
                        <div style={{ marginTop: '10px', display: 'grid', gap: '8px' }}>
                          <input
                            className="input"
                            placeholder="Type your custom category"
                            value={customByEvent[item.id] || ''}
                            onChange={(e) =>
                              setCustomByEvent((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                          />
                          <button
                            className="btn btn-success"
                            onClick={() => handleClassify(item.id, 'Others')}
                            disabled={busyEventId === item.id}
                          >
                            {busyEventId === item.id ? <Loader2 size={14} className="spin" /> : null}
                            Save custom category
                          </button>
                        </div>
                      )}
                    </>
                  )}
                      </>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={16} /> Notifications
            </h3>
            <span className="badge badge-blue">{unreadCount} unread</span>
          </div>

          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 16px' }}>
              <MessageCircleWarning size={24} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
              <p style={{ color: 'var(--text-secondary)' }}>No notifications yet</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '10px', maxHeight: '520px', overflowY: 'auto' }}>
              {notifications.map((n) => (
                <div key={n.id} style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '10px', opacity: n.is_read ? 0.75 : 1 }}>
                  {(() => {
                    const payload = parsePayload(n.payload);
                    const canReclassify =
                      n.notification_type === 'classification_auto_applied' &&
                      !!payload?.transaction_id;
                    const options = payload?.suggested_categories || defaultReclassOptions;
                    const selected = reclassChoiceByNotification[n.id] || '';
                    const panelOpen = !!activeReclassByNotification[n.id];

                    return (
                      <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <strong style={{ fontSize: '14px' }}>{n.title}</strong>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {canReclassify && (
                        <button
                          className="btn"
                          onClick={() =>
                            setActiveReclassByNotification((prev) => ({ ...prev, [n.id]: !panelOpen }))
                          }
                        >
                          {panelOpen ? 'Cancel' : 'Reclassify'}
                        </button>
                      )}
                      {!n.is_read && (
                        <button className="btn" onClick={() => handleMarkRead(n.id)}>
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                  <p style={{ marginTop: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}>{n.message}</p>
                  <p style={{ marginTop: '6px', color: 'var(--text-muted)', fontSize: '12px' }}>
                    {new Date(n.created_at).toLocaleString('en-IN')}
                  </p>

                  {panelOpen && canReclassify && (
                    <div style={{ marginTop: '10px', display: 'grid', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {options.map((cat) => (
                          <button
                            key={`${n.id}-${cat}`}
                            className="btn"
                            onClick={() =>
                              setReclassChoiceByNotification((prev) => ({ ...prev, [n.id]: cat }))
                            }
                            style={{
                              borderColor: selected === cat ? 'var(--accent)' : 'var(--border)',
                              color: selected === cat ? 'var(--accent)' : 'var(--text-primary)',
                            }}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                      {selected === 'Others' && (
                        <input
                          className="input"
                          placeholder="Type your custom category"
                          value={reclassCustomByNotification[n.id] || ''}
                          onChange={(e) =>
                            setReclassCustomByNotification((prev) => ({
                              ...prev,
                              [n.id]: e.target.value,
                            }))
                          }
                        />
                      )}
                      <button
                        className="btn btn-success"
                        onClick={() => handleReclassify(n)}
                        disabled={busyEventId === `notif-${n.id}`}
                      >
                        {busyEventId === `notif-${n.id}` ? <Loader2 size={14} className="spin" /> : null}
                        Save new category
                      </button>
                    </div>
                  )}
                      </>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
