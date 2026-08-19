import { useState, useEffect, useCallback } from 'react';
import { motion as Motion } from 'framer-motion';
import { Receipt, AlertTriangle, CheckCircle, ChevronRight, IndianRupee, Lightbulb } from 'lucide-react';
import { getTaxReport } from '../services/api';

export default function TaxPage() {
  const [income, setIncome] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async (incomeValue) => {
    setLoading(true);
    try {
      const res = await getTaxReport(Number(incomeValue) || 0, false);
      setReport(res.data.report);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport('');
  }, [fetchReport]);

  const r = report?.report_summary;
  const sections = report?.section_breakdown || {};
  const regime = report?.regime_comparison;
  const suggestions = report?.optimization_suggestions || [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Tax Intelligence</h1>
        <p className="page-subtitle">AI-powered tax deduction analysis & regime comparison</p>
      </div>

      {/* Income Input */}
      <Motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Annual Income (for regime comparison)</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input className="input" type="number" placeholder="e.g. 1000000" value={income} onChange={(e) => setIncome(e.target.value)} style={{ flex: 1 }} />
          <button className="btn btn-primary" onClick={() => fetchReport(income)} disabled={loading}>
            {loading ? 'Analyzing...' : 'Generate Report'}
          </button>
        </div>
      </Motion.div>

      {r && (
        <>
          {/* Summary Stats */}
          <div className="stat-grid">
            <div className="stat-card green">
              <div className="stat-icon green"><CheckCircle size={20} /></div>
              <div className="stat-label">Total Deductions</div>
              <div className="stat-value">₹{r.total_deductions_claimed?.toLocaleString('en-IN')}</div>
            </div>
            <div className="stat-card blue">
              <div className="stat-icon blue"><Receipt size={20} /></div>
              <div className="stat-label">Deductible Transactions</div>
              <div className="stat-value">{r.deductible_transactions} / {r.total_transactions}</div>
            </div>
            <div className="stat-card yellow">
              <div className="stat-icon yellow"><IndianRupee size={20} /></div>
              <div className="stat-label">Total Spending</div>
              <div className="stat-value">₹{r.total_spending?.toLocaleString('en-IN')}</div>
            </div>
          </div>

          {/* Regime Comparison */}
          {regime && (
            <Motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>Old vs New Regime Comparison</h3>
              <div className="grid-2" style={{ marginBottom: 0 }}>
                <div style={{ padding: '20px', background: regime.recommended === 'Old Regime' ? 'rgba(16,185,129,0.08)' : 'var(--bg-dark)', borderRadius: 'var(--radius-sm)', border: `2px solid ${regime.recommended === 'Old Regime' ? 'var(--success)' : 'var(--border)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '15px' }}>Old Regime</h4>
                    {regime.recommended === 'Old Regime' && <span className="badge badge-green">Recommended</span>}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div>Deductions: ₹{regime.old_regime.total_deductions.toLocaleString('en-IN')}</div>
                    <div>Taxable: ₹{regime.old_regime.taxable_income.toLocaleString('en-IN')}</div>
                    <div style={{ fontFamily: 'Poppins', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>Tax: ₹{regime.old_regime.tax_payable.toLocaleString('en-IN')}</div>
                  </div>
                </div>
                <div style={{ padding: '20px', background: regime.recommended === 'New Regime' ? 'rgba(16,185,129,0.08)' : 'var(--bg-dark)', borderRadius: 'var(--radius-sm)', border: `2px solid ${regime.recommended === 'New Regime' ? 'var(--success)' : 'var(--border)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '15px' }}>New Regime</h4>
                    {regime.recommended === 'New Regime' && <span className="badge badge-green">Recommended</span>}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div>Deductions: ₹{regime.new_regime.total_deductions.toLocaleString('en-IN')}</div>
                    <div>Taxable: ₹{regime.new_regime.taxable_income.toLocaleString('en-IN')}</div>
                    <div style={{ fontFamily: 'Poppins', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>Tax: ₹{regime.new_regime.tax_payable.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'center', marginTop: '16px', padding: '12px', background: 'rgba(16,185,129,0.1)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>{regime.explanation}</span>
              </div>
            </Motion.div>
          )}

          {/* Section Breakdown */}
          {Object.keys(sections).length > 0 && (
            <Motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Section-wise Deduction Breakdown</h3>
              <div className="table-container">
                <table>
                  <thead><tr><th>Section</th><th>Transactions</th><th>Total Spent</th><th>Claimable</th><th>Limit</th></tr></thead>
                  <tbody>
                    {Object.entries(sections).map(([section, d]) => (
                      <tr key={section}>
                        <td style={{ color: 'var(--primary-light)', fontWeight: 600 }}>{section}</td>
                        <td>{d.count}</td>
                        <td>₹{d.total_spent.toLocaleString('en-IN')}</td>
                        <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{d.claimable.toLocaleString('en-IN')}</td>
                        <td>{typeof d.limit === 'number' ? `₹${d.limit.toLocaleString('en-IN')}` : d.limit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Motion.div>
          )}

          {/* Optimization Suggestions */}
          {suggestions.length > 0 && (
            <Motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Lightbulb size={20} style={{ color: 'var(--warning)' }} />
                <h3 style={{ fontSize: '16px' }}>Tax Optimization Suggestions</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {suggestions.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px', background: 'var(--bg-dark)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <AlertTriangle size={18} style={{ color: s.priority === 'HIGH' ? 'var(--danger)' : s.priority === 'MEDIUM' ? 'var(--warning)' : 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                        <span className={`badge ${s.priority === 'HIGH' ? 'badge-red' : s.priority === 'MEDIUM' ? 'badge-yellow' : 'badge-blue'}`}>{s.priority}</span>
                        <span className="badge badge-blue">{s.section}</span>
                      </div>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{s.message}</p>
                      {s.potential_saving > 0 && (
                        <p style={{ fontSize: '13px', color: 'var(--success)', marginTop: '4px' }}>Potential saving: ₹{s.potential_saving.toLocaleString('en-IN')}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Motion.div>
          )}
        </>
      )}
    </div>
  );
}
