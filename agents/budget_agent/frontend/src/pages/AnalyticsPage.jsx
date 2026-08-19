import { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowRightLeft, PiggyBank, Target, Info, Sparkles } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getForecast, getComparison, getSavings } from '../services/api';

export default function AnalyticsPage() {
  const [forecast, setForecast] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [savings, setSavings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getForecast(6).catch(() => ({ data: null })),
      getComparison().catch(() => ({ data: null })),
      getSavings(50000).catch(() => ({ data: null })),
    ]).then(([f, c, s]) => {
      setForecast(f.data);
      setComparison(c.data);
      setSavings(s.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const forecastData = forecast?.forecast?.map((f) => ({
    month: f.month?.slice(5) || f.month,
    predicted: f.predicted_spend,
  })) || [];

  const mc = comparison?.monthly_comparison;
  const qc = comparison?.quarterly_comparison;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Analytics & Forecasting</h1>
        <p className="page-subtitle">Spending predictions and comparative insights</p>
      </div>

      {/* Forecast */}
      {forecast && (
        <Motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Spending Forecast (Next 6 Months)
              <div title="AI analyzes your past 6-12 months of spending velocity to project future trends using linear regression." style={{ cursor: 'help' }}>
                <Info size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
            </h3>
            {forecast.trend && (
              <span className={`badge ${forecast.trend === 'increasing' ? 'badge-red' : 'badge-green'}`} style={{ boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}>
                {forecast.trend === 'increasing' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                &nbsp;{forecast.trend} ({forecast.trend_change_pct}%)
              </span>
            )}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            <Sparkles size={12} style={{ color: 'var(--primary)', display: 'inline', marginRight: '4px' }}/>
            Based on your uploaded transaction history, our AI expects your spending to {forecast.trend === 'increasing' ? 'rise' : 'fall'} over the next two quarters.
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={forecastData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#22D3EE" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} />
              <Tooltip 
                contentStyle={{ background: 'var(--bg-dark)', border: '1px solid var(--primary)', borderRadius: '12px', color: '#fff', boxShadow: '0 0 20px rgba(34, 211, 238, 0.2)' }} 
                itemStyle={{ color: '#22D3EE', fontWeight: 'bold' }}
                formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Predicted Spend']}
                labelStyle={{ color: 'var(--text-muted)', marginBottom: '4px' }}
              />
              <Area type="monotone" dataKey="predicted" stroke="#22D3EE" strokeWidth={3} fillOpacity={1} fill="url(#colorPredicted)" activeDot={{ r: 6, fill: '#fff', stroke: '#22D3EE', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
          {forecast.avg_monthly_spend && (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '12px' }}>
              Average monthly spend: ₹{forecast.avg_monthly_spend.toLocaleString('en-IN')} · Method: {forecast.methodology}
            </p>
          )}
        </Motion.div>
      )}

      {/* Period Comparisons */}
      <div className="grid-2">
        {mc && (
          <Motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <ArrowRightLeft size={18} style={{ color: 'var(--accent)' }} />
              <h3 style={{ fontSize: '16px' }}>Month over Month</h3>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{mc.previous_month}</div>
                <div style={{ fontSize: '22px', fontWeight: 700 }}>₹{mc.previous_spend.toLocaleString('en-IN')}</div>
              </div>
              <div style={{ fontSize: '24px', color: 'var(--text-muted)' }}>→</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{mc.current_month}</div>
                <div style={{ fontSize: '22px', fontWeight: 700 }}>₹{mc.current_spend.toLocaleString('en-IN')}</div>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <span className={`badge ${mc.direction === 'up' ? 'badge-red' : 'badge-green'}`}>
                {mc.direction === 'up' ? '↑' : '↓'} {Math.abs(mc.change_pct)}%
              </span>
            </div>
          </Motion.div>
        )}

        {qc && (
          <Motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <ArrowRightLeft size={18} style={{ color: 'var(--primary-light)' }} />
              <h3 style={{ fontSize: '16px' }}>Quarter over Quarter</h3>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{qc.previous_quarter}</div>
                <div style={{ fontSize: '22px', fontWeight: 700 }}>₹{qc.previous_spend.toLocaleString('en-IN')}</div>
              </div>
              <div style={{ fontSize: '24px', color: 'var(--text-muted)' }}>→</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{qc.current_quarter}</div>
                <div style={{ fontSize: '22px', fontWeight: 700 }}>₹{qc.current_spend.toLocaleString('en-IN')}</div>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <span className={`badge ${qc.direction === 'up' ? 'badge-red' : 'badge-green'}`}>
                {qc.direction === 'up' ? '↑' : '↓'} {Math.abs(qc.change_pct)}%
              </span>
            </div>
          </Motion.div>
        )}
      </div>

      {/* Savings Tips */}
      {savings && savings.tips?.length > 0 && (
        <Motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <PiggyBank size={20} style={{ color: 'var(--success)' }} />
            <h3 style={{ fontSize: '16px' }}>Savings Potential: ₹{savings.potential_annual_savings?.toLocaleString('en-IN')}/year</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {savings.tips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--border)', transition: '0.3s', cursor: 'default' }} onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'} onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '10px', borderRadius: '12px' }}>
                  <Target size={20} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="badge" style={{ background: 'var(--primary-glow)', color: '#fff', fontSize: '10px' }}>{tip.category}</span>
                    {tip.message.includes('Great job') ? (
                      <span style={{ fontSize: '11px', color: 'var(--success)' }}>On Track</span>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--warning)' }}>Action Needed</span>
                    )}
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-main)', lineHeight: 1.5 }}>{tip.message}</p>
                </div>
              </div>
            ))}
          </div>
        </Motion.div>
      )}
    </div>
  );
}
