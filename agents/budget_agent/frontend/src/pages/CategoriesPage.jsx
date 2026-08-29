import { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import { Tag, Plus, Trash2 } from 'lucide-react';
import { getCategories, createCategory, deleteCategory } from '../services/api';

const DEFAULT_GIG_CATEGORIES = [
  { name: 'platform_payout', direction: 'credit', icon: '💰' },
  { name: 'informal_borrowing', direction: 'credit', icon: '🤝' },
  { name: 'fuel', direction: 'debit', icon: '⛽' },
  { name: 'recharge', direction: 'debit', icon: '📱' },
  { name: 'food', direction: 'debit', icon: '🍱' },
  { name: 'rent', direction: 'debit', icon: '🏠' },
  { name: 'loan_emi', direction: 'debit', icon: '🏦' },
  { name: 'insurance_premium', direction: 'debit', icon: '🛡️' },
  { name: 'family_support', direction: 'debit', icon: '👨‍👩‍👧' },
  { name: 'discretionary', direction: 'debit', icon: '🎯' },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', direction: 'debit', icon: '', color: '#6366f1' });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      const res = await getCategories();
      setCategories(res.data || []);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name) return;
    setCreating(true);
    await createCategory({ name: form.name, direction: form.direction, icon: form.icon || null, color: form.color || null });
    setForm({ name: '', direction: 'debit', icon: '', color: '#6366f1' });
    setCreating(false);
    load();
  };

  const handleDelete = async (id) => {
    await deleteCategory(id);
    load();
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Transaction Categories</h1>
        <p className="page-subtitle">Default gig-worker categories plus your custom ones</p>
      </div>

      {/* Default categories */}
      <Motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '15px', marginBottom: '16px', color: 'var(--text-muted)' }}>Built-in Gig Categories</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {DEFAULT_GIG_CATEGORIES.map((c) => (
            <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px',
              borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--bg-dark)', fontSize: '13px' }}>
              <span>{c.icon}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{c.name}</span>
              <span style={{ fontSize: '10px', color: c.direction === 'credit' ? 'var(--success)' : 'var(--danger)',
                padding: '1px 6px', borderRadius: '10px',
                background: c.direction === 'credit' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
                {c.direction}
              </span>
            </div>
          ))}
        </div>
      </Motion.div>

      {/* Custom categories */}
      <Motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <h3 style={{ fontSize: '15px', marginBottom: '16px' }}>
          <Tag size={15} style={{ display: 'inline', marginRight: '6px' }} />
          Custom Categories ({categories.length})
        </h3>

        {categories.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
            No custom categories yet. Add one below.
          </p>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
          {categories.map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px',
              borderRadius: '20px', border: `1px solid ${c.color || 'var(--border)'}44`,
              background: `${c.color || '#6366f1'}11`, fontSize: '13px' }}>
              {c.icon && <span>{c.icon}</span>}
              <span style={{ color: c.color || 'var(--text-secondary)' }}>{c.name}</span>
              <span style={{ fontSize: '10px', color: c.direction === 'credit' ? 'var(--success)' : 'var(--danger)',
                padding: '1px 6px', borderRadius: '10px',
                background: c.direction === 'credit' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
                {c.direction}
              </span>
              <button onClick={() => handleDelete(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Create form */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
          <div className="input-group">
            <label>Category Name</label>
            <input className="input" placeholder="e.g. vehicle_repair" value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="input-group">
            <label>Direction</label>
            <select className="input" value={form.direction}
              onChange={(e) => setForm((p) => ({ ...p, direction: e.target.value }))}>
              <option value="debit">Debit (expense)</option>
              <option value="credit">Credit (income)</option>
            </select>
          </div>
          <div className="input-group">
            <label>Icon (emoji)</label>
            <input className="input" placeholder="🔧" value={form.icon}
              onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))} />
          </div>
          <div className="input-group">
            <label>Color</label>
            <input type="color" value={form.color}
              onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
              style={{ width: '100%', height: '42px', borderRadius: '8px', border: '1px solid var(--border)',
                background: 'var(--bg-dark)', cursor: 'pointer', padding: '4px' }} />
          </div>
        </div>
        <button className="btn btn-primary" style={{ marginTop: '16px' }}
          onClick={handleCreate} disabled={creating || !form.name}>
          {creating ? 'Creating…' : 'Add Category'}
        </button>
      </Motion.div>
    </div>
  );
}
