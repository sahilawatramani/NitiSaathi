import { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { Target, Plus, Trash2, PiggyBank } from 'lucide-react';
import { useBudget } from '../context/BudgetContext';
import { createGoal, addSavingsToGoal, archiveGoal, updateGoal } from '../services/api';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n ?? 0);

export default function GoalsPage() {
  const { goals, refreshGoals } = useBudget();
  const [form, setForm] = useState({ name: '', target_amount: '', category: '', target_date: '' });
  const [savingsInput, setSavingsInput] = useState({});
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!form.name || !form.target_amount) return;
    setCreating(true);
    await createGoal({
      name: form.name,
      target_amount: Number(form.target_amount),
      category: form.category || null,
      target_date: form.target_date || null,
    });
    setForm({ name: '', target_amount: '', category: '', target_date: '' });
    setCreating(false);
    refreshGoals();
  };

  const handleAddSavings = async (goalId) => {
    const amt = Number(savingsInput[goalId]);
    if (!amt) return;
    await addSavingsToGoal(goalId, amt);
    setSavingsInput((p) => ({ ...p, [goalId]: '' }));
    refreshGoals();
  };

  const handleArchive = async (goalId) => {
    await archiveGoal(goalId);
    refreshGoals();
  };

  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.saved_amount, 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Saving Goals</h1>
        <p className="page-subtitle">Track your financial targets — emergency fund, bike repair, festival budget</p>
      </div>

      {/* Summary */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <Motion.div className="stat-card blue" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="stat-icon blue"><Target size={20} /></div>
          <div className="stat-label">Active Goals</div>
          <div className="stat-value">{goals.length}</div>
        </Motion.div>
        <Motion.div className="stat-card green" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="stat-icon green"><PiggyBank size={20} /></div>
          <div className="stat-label">Total Saved</div>
          <div className="stat-value">{fmt(totalSaved)}</div>
        </Motion.div>
        <Motion.div className="stat-card yellow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="stat-icon yellow"><Target size={20} /></div>
          <div className="stat-label">Total Target</div>
          <div className="stat-value">{fmt(totalTarget)}</div>
        </Motion.div>
      </div>

      {/* Goals list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        {goals.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)' }}>
            No goals yet. Create your first one below.
          </div>
        )}
        {goals.map((g, i) => (
          <Motion.div key={g.id} className="card" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '16px' }}>{g.name}</div>
                {g.category && <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '8px' }}>{g.category}</span>}
                {g.target_date && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>🗓 {g.target_date}</span>}
              </div>
              <button onClick={() => handleArchive(g.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <Trash2 size={16} />
              </button>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '8px', height: '10px', overflow: 'hidden', marginBottom: '10px' }}>
              <div style={{ height: '100%', borderRadius: '8px', width: `${Math.min(g.progress_pct, 100)}%`,
                background: g.progress_pct >= 100 ? 'var(--success)' : 'linear-gradient(90deg, var(--primary), var(--accent))',
                transition: 'width 0.6s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {fmt(g.saved_amount)} of {fmt(g.target_amount)}
                <span style={{ marginLeft: '8px', fontWeight: 700, color: g.progress_pct >= 100 ? 'var(--success)' : 'var(--primary)' }}>
                  {g.progress_pct}%
                </span>
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input type="number" placeholder="Add ₹" value={savingsInput[g.id] || ''}
                  onChange={(e) => setSavingsInput((p) => ({ ...p, [g.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSavings(g.id)}
                  style={{ width: '90px', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border)',
                    background: 'var(--bg-dark)', color: '#fff', fontSize: '13px' }} />
                <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }}
                  onClick={() => handleAddSavings(g.id)}>Add</button>
              </div>
            </div>
          </Motion.div>
        ))}
      </div>

      {/* Create form */}
      <Motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <h3 style={{ fontSize: '15px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> New Goal
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
          <div className="input-group">
            <label>Goal Name</label>
            <input className="input" placeholder="e.g. Emergency Fund" value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="input-group">
            <label>Target Amount (₹)</label>
            <input className="input" type="number" placeholder="10000" value={form.target_amount}
              onChange={(e) => setForm((p) => ({ ...p, target_amount: e.target.value }))} />
          </div>
          <div className="input-group">
            <label>Category (optional)</label>
            <input className="input" placeholder="emergency, bike, festival…" value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
          </div>
          <div className="input-group">
            <label>Target Date (optional)</label>
            <input className="input" type="date" value={form.target_date}
              onChange={(e) => setForm((p) => ({ ...p, target_date: e.target.value }))} />
          </div>
        </div>
        <button className="btn btn-primary" style={{ marginTop: '16px' }}
          onClick={handleCreate} disabled={creating || !form.name || !form.target_amount}>
          {creating ? 'Creating…' : 'Create Goal'}
        </button>
      </Motion.div>
    </div>
  );
}
