import { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import {
  Wallet, TrendingUp, Shield, Flame, AlertTriangle, Zap,
  RefreshCw, Bell, Target, ChevronRight, Plus, Trash2,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useBudget } from '../context/BudgetContext';
import {
  createGoal, addSavingsToGoal, archiveGoal,
  createRecurringDebit, deleteRecurringDebit,
  downloadWeeklyReport, emailWeeklyReport,
  getCausalChains,
} from '../services/api';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n ?? 0);

const PersonaBadge = ({ persona }) => {
  const map = {
    growth: { color: '#10b981', label: '📈 Growth Mode' },
    moderate: { color: '#f59e0b', label: '⚖️ Moderate' },
    conservative: { color: '#ef4444', label: '🛡️ Survival Mode' },
  };
  const p = map[persona] || map.moderate;
  return (
    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
      background: `${p.color}22`, color: p.color, border: `1px solid ${p.color}44` }}>
      {p.label}
    </span>
  );
};

export default function BudgetPage() {
  const {
    insights, goals, recurringDebits,
    refreshInsights, refreshGoals, refreshRecurringDebits, triggerRecalculate,
  } = useBudget();

  const [chains, setChains] = useState(null);
  const [chainsLoading, setChainsLoading] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', target_amount: '', category: '' });
  const [savingsInput, setSavingsInput] = useState({});
  const [newDebit, setNewDebit] = useState({ name: '', amount: '', category: 'rent', due_day_of_month: '' });
  const [reportMsg, setReportMsg] = useState('');
  const [recalcLoading, setRecalcLoading] = useState(false);

  const handleRecalculate = async () => {
    setRecalcLoading(true);
    await triggerRecalculate();
    setRecalcLoading(false);
  };

  const handleLoadChains = async () => {
    setChainsLoading(true);
    try {
      const res = await getCausalChains();
      setChains(res.data.chains);
    } catch (_) { setChains([]); }
    finally { setChainsLoading(false); }
  };

  const handleCreateGoal = async () => {
    if (!newGoal.name || !newGoal.target_amount) return;
    await createGoal({ ...newGoal, target_amount: Number(newGoal.target_amount) });
    setNewGoal({ name: '', target_amount: '', category: '' });
    refreshGoals();
  };

  const handleAddSavings = async (goalId) => {
    const amt = Number(savingsInput[goalId]);
    if (!amt) return;
    await addSavingsToGoal(goalId, amt);
    setSavingsInput((p) => ({ ...p, [goalId]: '' }));
    refreshGoals();
    refreshInsights();
  };

  const handleArchiveGoal = async (goalId) => {
    await archiveGoal(goalId);
    refreshGoals();
  };

  const handleCreateDebit = async () => {
    if (!newDebit.name || !newDebit.amount) return;
    await createRecurringDebit({ ...newDebit, amount: Number(newDebit.amount), due_day_of_month: newDebit.due_day_of_month ? Number(newDebit.due_day_of_month) : null });
    setNewDebit({ name: '', amount: '', category: 'rent', due_day_of_month: '' });
    refreshRecurringDebits();
  };

  const handleDeleteDebit = async (id) => {
    await deleteRecurringDebit(id);
    refreshRecurringDebits();
  };

  const handleDownloadReport = async () => {
    const res = await downloadWeeklyReport();
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'NitiSaathi_Weekly_Report.pdf';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleEmailReport = async () => {
    const res = await emailWeeklyReport();
    setReportMsg(res.data.message);
    setTimeout(() => setReportMsg(''), 5000);
  };

  if (!insights) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px' }}>
        <p style={{ color: 'var(--text-muted)' }}>No budget data yet. Upload transactions or forward an SMS to get started.</p>
        <button className="btn btn-primary" onClick={handleRecalculate} disabled={recalcLoading}>
          <RefreshCw size={16} /> {recalcLoading ? 'Calculating…' : 'Calculate Now'}
        </button>
      </div>
    );
  }

  const {
    income_wma_4w = 0, income_volatility_pct = 0, savings_rate_recommendation = 0,
    low_balance_flag = false, closing_balance = 0, safe_to_spend_today = 0,
    current_savings_streak = 0, highest_savings_streak = 0,
    financial_persona = 'moderate', nudges = [], upcoming_debit_alerts = [],
  } = insights;

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Gig Budget Dashboard</h1>
          <p className="page-subtitle">Real-time income tracking for variable earners</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <PersonaBadge persona={financial_persona} />
          <button className="btn" style={{ fontSize: '13px', padding: '8px 14px' }}
            onClick={handleRecalculate} disabled={recalcLoading}>
            <RefreshCw size={14} /> {recalcLoading ? 'Updating…' : 'Recalculate'}
          </button>
        </div>
      </div>

      {/* Hero Metrics */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <Motion.div className={`stat-card ${low_balance_flag ? 'red' : 'green'}`}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <div className={`stat-icon ${low_balance_flag ? 'red' : 'green'}`}><Wallet size={20} /></div>
          <div className="stat-label">Safe to Spend Today</div>
          <div className="stat-value">{fmt(safe_to_spend_today)}</div>
          {low_balance_flag && <div style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '4px' }}>⚠️ Low balance</div>}
        </Motion.div>

        <Motion.div className="stat-card blue"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="stat-icon blue"><TrendingUp size={20} /></div>
          <div className="stat-label">Income WMA (4-week)</div>
          <div className="stat-value">{fmt(income_wma_4w)}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Volatility: {income_volatility_pct?.toFixed(1)}%
          </div>
        </Motion.div>

        <Motion.div className="stat-card yellow"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="stat-icon yellow"><Shield size={20} /></div>
          <div className="stat-label">Save This Week</div>
          <div className="stat-value">{(savings_rate_recommendation * 100).toFixed(0)}%</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            = {fmt(income_wma_4w * savings_rate_recommendation)}
          </div>
        </Motion.div>

        <Motion.div className="stat-card blue"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="stat-icon blue"><Flame size={20} /></div>
          <div className="stat-label">Savings Streak</div>
          <div className="stat-value">{current_savings_streak} <span style={{ fontSize: '14px', fontWeight: 400 }}>weeks</span></div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Best: {highest_savings_streak} weeks
          </div>
        </Motion.div>
      </div>

      <div className="grid-2">
        {/* Nudges */}
        {nudges.length > 0 && (
          <Motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Zap size={18} style={{ color: 'var(--accent)' }} />
              <h3 style={{ fontSize: '15px' }}>Smart Nudges</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {nudges.map((n, i) => (
                <div key={i} style={{ padding: '12px', background: 'var(--bg-dark)', borderRadius: '10px',
                  border: '1px solid var(--border)', fontSize: '13px', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                  {n}
                </div>
              ))}
            </div>
          </Motion.div>
        )}

        {/* Debit Radar */}
        {upcoming_debit_alerts.length > 0 && (
          <Motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Bell size={18} style={{ color: 'var(--warning)' }} />
              <h3 style={{ fontSize: '15px' }}>Debit Radar (3 days)</h3>
            </div>
            {upcoming_debit_alerts.map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', borderRadius: '10px', marginBottom: '8px',
                background: d.can_cover ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.07)',
                border: `1px solid ${d.can_cover ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.3)'}` }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{d.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>in {d.days_until_due} days</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: d.can_cover ? 'var(--success)' : 'var(--danger)' }}>{fmt(d.amount)}</div>
                  <div style={{ fontSize: '11px', color: d.can_cover ? 'var(--success)' : 'var(--danger)' }}>
                    {d.can_cover ? '✓ Covered' : '✗ Shortfall'}
                  </div>
                </div>
              </div>
            ))}
          </Motion.div>
        )}
      </div>

      {/* Causal Chain Reasoner */}
      <Motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{ marginTop: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />
            <h3 style={{ fontSize: '15px' }}>Causal Risk Chains</h3>
          </div>
          <button className="btn" style={{ fontSize: '12px', padding: '6px 12px' }}
            onClick={handleLoadChains} disabled={chainsLoading}>
            {chainsLoading ? 'Analysing…' : chains === null ? 'Analyse Risks' : 'Refresh'}
          </button>
        </div>
        {chains === null && (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Click "Analyse Risks" to see what happens if your balance doesn't cover upcoming debits.
          </p>
        )}
        {chains !== null && chains.length === 0 && (
          <p style={{ color: 'var(--success)', fontSize: '13px' }}>✅ No shortfall risks detected for the next 14 days.</p>
        )}
        {chains?.map((chain, i) => (
          <div key={i} style={{ marginBottom: '16px', padding: '16px', borderRadius: '12px',
            background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div style={{ fontWeight: 600, color: 'var(--danger)', marginBottom: '10px', fontSize: '14px' }}>
              ⚡ {chain.trigger}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Consequence chain:</div>
              {chain.consequences.map((c, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px',
                  color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  <ChevronRight size={12} style={{ color: 'var(--danger)', flexShrink: 0 }} /> {c}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Top interventions:</div>
              {chain.interventions.slice(0, 3).map((iv, j) => (
                <div key={j} style={{ fontSize: '13px', padding: '6px 10px', marginBottom: '4px',
                  background: 'rgba(16,185,129,0.07)', borderRadius: '8px', color: 'var(--success)' }}>
                  {j + 1}. {iv.action}
                </div>
              ))}
            </div>
          </div>
        ))}
      </Motion.div>

      {/* Goals */}
      <Motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} style={{ marginTop: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Target size={18} style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '15px' }}>Saving Goals</h3>
        </div>
        {goals.map((g) => (
          <div key={g.id} style={{ marginBottom: '16px', padding: '14px', borderRadius: '12px',
            background: 'var(--bg-dark)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>{g.name}</span>
                {g.category && <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>{g.category}</span>}
              </div>
              <button onClick={() => handleArchiveGoal(g.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <Trash2 size={14} />
              </button>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '8px', height: '8px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ height: '100%', borderRadius: '8px', width: `${g.progress_pct}%`,
                background: g.progress_pct >= 100 ? 'var(--success)' : 'var(--primary)', transition: 'width 0.5s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>{fmt(g.saved_amount)} / {fmt(g.target_amount)} ({g.progress_pct}%)</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input type="number" placeholder="Add ₹" value={savingsInput[g.id] || ''}
                  onChange={(e) => setSavingsInput((p) => ({ ...p, [g.id]: e.target.value }))}
                  style={{ width: '80px', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)',
                    background: 'var(--bg-card)', color: '#fff', fontSize: '12px' }} />
                <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '12px' }}
                  onClick={() => handleAddSavings(g.id)}>Add</button>
              </div>
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
          <input className="input" placeholder="Goal name" value={newGoal.name}
            onChange={(e) => setNewGoal((p) => ({ ...p, name: e.target.value }))}
            style={{ flex: 2, minWidth: '120px' }} />
          <input className="input" type="number" placeholder="Target ₹" value={newGoal.target_amount}
            onChange={(e) => setNewGoal((p) => ({ ...p, target_amount: e.target.value }))}
            style={{ flex: 1, minWidth: '90px' }} />
          <button className="btn btn-primary" onClick={handleCreateGoal}><Plus size={16} /></button>
        </div>
      </Motion.div>

      {/* Recurring Debits */}
      <Motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} style={{ marginTop: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Bell size={18} style={{ color: 'var(--warning)' }} />
          <h3 style={{ fontSize: '15px' }}>EMI / Rent / Subscriptions</h3>
        </div>
        {recurringDebits.map((d) => (
          <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 14px', borderRadius: '10px', marginBottom: '8px',
            background: 'var(--bg-dark)', border: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>{d.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {d.category} · due {d.next_due_date ? `on ${d.next_due_date}` : `day ${d.due_day_of_month}`}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 700 }}>{fmt(d.amount)}</span>
              <button onClick={() => handleDeleteDebit(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
          <input className="input" placeholder="Name (e.g. Room Rent)" value={newDebit.name}
            onChange={(e) => setNewDebit((p) => ({ ...p, name: e.target.value }))}
            style={{ flex: 2, minWidth: '120px' }} />
          <input className="input" type="number" placeholder="Amount ₹" value={newDebit.amount}
            onChange={(e) => setNewDebit((p) => ({ ...p, amount: e.target.value }))}
            style={{ flex: 1, minWidth: '80px' }} />
          <select className="input" value={newDebit.category}
            onChange={(e) => setNewDebit((p) => ({ ...p, category: e.target.value }))}
            style={{ flex: 1, minWidth: '100px' }}>
            {['rent','loan_emi','insurance_premium','recharge','fuel','food','discretionary'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input className="input" type="number" placeholder="Due day" value={newDebit.due_day_of_month}
            onChange={(e) => setNewDebit((p) => ({ ...p, due_day_of_month: e.target.value }))}
            style={{ flex: 1, minWidth: '70px' }} />
          <button className="btn btn-primary" onClick={handleCreateDebit}><Plus size={16} /></button>
        </div>
      </Motion.div>

      {/* Reports */}
      <Motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} style={{ marginTop: '4px' }}>
        <h3 style={{ fontSize: '15px', marginBottom: '16px' }}>📄 Weekly Reports</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleDownloadReport}>Download PDF</button>
          <button className="btn" onClick={handleEmailReport} style={{ background: 'rgba(255,255,255,0.05)' }}>
            Email Report
          </button>
        </div>
        {reportMsg && <p style={{ color: 'var(--success)', fontSize: '13px', marginTop: '10px' }}>{reportMsg}</p>}
      </Motion.div>
    </div>
  );
}
