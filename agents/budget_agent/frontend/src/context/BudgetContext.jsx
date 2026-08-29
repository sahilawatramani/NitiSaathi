import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import {
  getDailyInsights,
  getGoals,
  getPendingTransactions,
  getRecurringDebits,
  recalculateWeeklyFeatures,
} from '../services/api';

const BudgetContext = createContext();
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const WS_BASE = API_BASE.replace(/^http/, 'ws').replace('/api', '');

export function BudgetProvider({ children }) {
  const { user } = useAuth();
  const [insights, setInsights] = useState(null);
  const [goals, setGoals] = useState([]);
  const [pendingTxns, setPendingTxns] = useState([]);
  const [recurringDebits, setRecurringDebits] = useState([]);
  const [loading, setLoading] = useState(false);
  const wsRef = useRef(null);

  const [classifyModal, setClassifyModal] = useState({ open: false, event: null });

  const refreshInsights = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getDailyInsights();
      setInsights(res.data);
    } catch (err) {
      console.error('Failed to load insights:', err);
    }
  }, [user]);

  const refreshGoals = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getGoals();
      setGoals(res.data || []);
    } catch (err) {
      console.error('Failed to load goals:', err);
    }
  }, [user]);

  const refreshPending = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getPendingTransactions();
      const items = res.data || [];
      setPendingTxns(items);
      if (items.length > 0 && !classifyModal.open) {
        setClassifyModal({ open: true, event: items[0] });
      }
    } catch (err) {
      console.error('Failed to load pending transactions:', err);
    }
  }, [user, classifyModal.open]);

  const refreshRecurringDebits = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getRecurringDebits();
      setRecurringDebits(res.data || []);
    } catch (err) {
      console.error('Failed to load recurring debits:', err);
    }
  }, [user]);

  const triggerRecalculate = useCallback(async () => {
    if (!user) return;
    try {
      const res = await recalculateWeeklyFeatures();
      if (res.data?.updated_state) setInsights(res.data.updated_state);
    } catch (err) {
      console.error('Recalculate failed:', err);
    }
  }, [user]);

  const openClassifyModal = (event) => setClassifyModal({ open: true, event });
  const closeClassifyModal = () => setClassifyModal({ open: false, event: null });
  const updateInsightsFromClassify = (budgetState) => {
    if (budgetState) setInsights(budgetState);
  };

  // ── WebSocket connection ────────────────────────────────────────────
  const connectWS = useCallback(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const ws = new WebSocket(`${WS_BASE}/api/realtime/ws?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'NEW_PENDING_TRANSACTION') {
          const event = msg.payload;
          setPendingTxns((prev) => {
            const exists = prev.find((t) => t.id === event.event_id);
            if (exists) return prev;
            return [{ id: event.event_id, ...event }, ...prev];
          });
          setClassifyModal((prev) =>
            prev.open ? prev : { open: true, event: { id: event.event_id, ...event } }
          );
        } else if (msg.type === 'BUDGET_STATE_UPDATED') {
          setInsights(msg.payload);
        }
      } catch (_) {}
    };

    ws.onclose = () => {
      // Reconnect after 5s if still logged in
      setTimeout(() => {
        if (localStorage.getItem('token')) connectWS();
      }, 5000);
    };

    ws.onerror = () => ws.close();

    // Keep-alive ping every 30s
    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send('ping');
    }, 30000);

    ws._pingInterval = ping;
  }, [user]);

  // Initial load
  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([
        refreshInsights(),
        refreshGoals(),
        refreshPending(),
        refreshRecurringDebits(),
      ]).finally(() => setLoading(false));
      connectWS();
    } else {
      setInsights(null);
      setGoals([]);
      setPendingTxns([]);
      setRecurringDebits([]);
      if (wsRef.current) {
        clearInterval(wsRef.current._pingInterval);
        wsRef.current.close();
        wsRef.current = null;
      }
    }
    return () => {
      if (wsRef.current) {
        clearInterval(wsRef.current._pingInterval);
        wsRef.current.close();
      }
    };
  }, [user]);

  return (
    <BudgetContext.Provider value={{
      insights,
      goals,
      pendingTxns,
      recurringDebits,
      loading,
      classifyModal,
      openClassifyModal,
      closeClassifyModal,
      updateInsightsFromClassify,
      refreshInsights,
      refreshGoals,
      refreshPending,
      refreshRecurringDebits,
      triggerRecalculate,
    }}>
      {children}
    </BudgetContext.Provider>
  );
}

export const useBudget = () => useContext(BudgetContext);
