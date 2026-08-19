import { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { IndianRupee, TrendingUp, ShieldCheck, Target, Activity, Zap, AlertTriangle, Award, Flame, Star } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { getAnalytics } from '../services/api';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics()
      .then((res) => {
        if (!res.data.health_score) {
          navigate('/onboarding');
        } else {
          setData(res.data);
        }
      })
      .catch((err) => {
        console.error('Analytics fetch failed, redirecting to onboarding:', err);
        navigate('/onboarding');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!data || !data.health_score) {
    // Safety net: if data is still null after loading, redirect
    navigate('/onboarding');
    return null;
  }

  const { health_score } = data;
  const metrics = health_score.fire_plan;
  const dims = health_score.dimensions;

  // Radar Chart Data for Health Score
  const radarData = [
    { subject: 'Emergency Fund', A: dims.emergency, fullMark: 100 },
    { subject: 'Insurance Cover', A: dims.insurance, fullMark: 100 },
    { subject: 'Investments', A: dims.investments, fullMark: 100 },
    { subject: 'Debt Health', A: dims.debt, fullMark: 100 },
    { subject: 'Tax Efficiency', A: dims.tax, fullMark: 100 },
    { subject: 'FIRE Readiness', A: dims.retirement, fullMark: 100 },
  ];

  // 3D Wealth Simulator Data (Area Chart)
  const generateWealthCurve = () => {
    const years = metrics.years_to_retire;
    const curve = [];
    const sip = metrics.current_monthly_investment;
    let corpus = 0; // Ignoring current savings for the curve shape
    for (let i = 0; i <= years; i++) {
      if (i > 0) corpus = corpus * (1 + 0.10) + (sip * 12);
      curve.push({
        year: `Year ${i}`,
        corpus: Math.round(corpus),
        target: Math.round(metrics.fire_number_adjusted * (i / years)) // Linear target line
      });
    }
    return curve;
  };
  const wealthData = generateWealthCurve();

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">{metrics.is_couple_plan ? "Couple's Wealth Command Center" : "Financial Command Center"}</h1>
          <p className="page-subtitle">{metrics.is_couple_plan ? "Your joint AI-powered roadmap to Financial Independence" : "Your AI-powered roadmap to Financial Independence"}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Overall Health Score</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: health_score.overall_score > 70 ? 'var(--success)' : 'var(--warning)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {health_score.overall_score}/100 <Activity size={24} />
          </div>
        </div>
      </div>

      {/* FIRE Stat Cards */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <Motion.div className="stat-card blue" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <div className="stat-icon blue"><Target size={20} /></div>
          <div className="stat-label">
            {metrics.is_couple_plan ? "Joint FIRE Target" : "FIRE Target (Inflation Adj.)"}
            <span title="The inflation-adjusted corpus required to sustain your current living standards post-retirement." style={{ cursor: 'help', marginLeft: '6px' }}>ⓘ</span>
          </div>
          <div className="stat-value">₹{(metrics.fire_number_adjusted / 100000).toFixed(1)}L</div>
        </Motion.div>
        <Motion.div className="stat-card green" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="stat-icon green"><TrendingUp size={20} /></div>
          <div className="stat-label">Projected Corpus</div>
          <div className="stat-value">₹{(metrics.projected_corpus / 100000).toFixed(1)}L</div>
        </Motion.div>
        <Motion.div className="stat-card yellow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="stat-icon yellow"><IndianRupee size={20} /></div>
          <div className="stat-label">Current SIP</div>
          <div className="stat-value">₹{metrics.current_monthly_investment.toLocaleString('en-IN')}</div>
        </Motion.div>
        <Motion.div className="stat-card red" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="stat-icon red"><AlertTriangle size={20} /></div>
          <div className="stat-label">Required SIP</div>
          <div className="stat-value" style={{ color: metrics.required_monthly_sip > metrics.current_monthly_investment ? 'var(--danger)' : 'var(--success)' }}>
            ₹{metrics.required_monthly_sip.toLocaleString('en-IN')}
          </div>
        </Motion.div>
      </div>

      <div className="grid-2">
        {/* 6-Dimension Health Score */}
        <Motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>6-Dimension Health Check</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Score" dataKey="A" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
              <Tooltip contentStyle={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }} />
            </RadarChart>
          </ResponsiveContainer>
        </Motion.div>

        {/* 3D Wealth Simulator */}
        <Motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px' }}>Wealth Trajectory Simulator</h3>
            <span className="badge badge-blue">{metrics.years_to_retire} Years to go</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={wealthData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCorpus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="year" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={(val) => `₹${(val/100000).toFixed(0)}L`} tickLine={false} axisLine={false} width={50} />
              <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} contentStyle={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }} />
              <Area type="monotone" dataKey="target" stroke="var(--text-muted)" strokeDasharray="5 5" fill="none" />
              <Area type="monotone" dataKey="corpus" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorCorpus)" />
            </AreaChart>
          </ResponsiveContainer>
        </Motion.div>
      </div>

      {/* AI Actionable Insights (Auto-Rebalancer) */}
      <Motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={{ marginTop: '24px', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Zap size={20} style={{ color: 'var(--accent)' }} />
          <h3 style={{ fontSize: '16px' }}>AI Portfolio Action Plan (Next 30 Days)</h3>
        </div>
        
        {health_score.actionable_insights.length === 0 ? (
          <div style={{ padding: '20px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', color: 'var(--success)' }}>
            <ShieldCheck size={20} style={{ marginBottom: '8px' }} />
            <div>Your portfolio is perfectly balanced. Keep up your SIPs!</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {health_score.actionable_insights.map((insight, idx) => {
              // Extract emoji if present at the start of the string
              const emojiMatch = insight.match(/^([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])\s*/);
              const emoji = emojiMatch ? emojiMatch[1] : null;
              const text = emojiMatch ? insight.replace(emojiMatch[0], '') : insight;
              
              return (
                <div key={idx} style={{ padding: '16px', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  {emoji ? (
                    <div style={{ fontSize: '18px', marginTop: '2px', flexShrink: 0 }}>{emoji}</div>
                  ) : (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--warning)', marginTop: '6px', flexShrink: 0 }} />
                  )}
                  <p 
                    style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}
                    dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#fff">$1</strong>') }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Motion.div>

      {/* Gamification / Money Health Badges */}
      <Motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '16px' }}>Money Health Achievements</h3>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Unlock badges by improving your score</span>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          {/* Emergency Badge */}
          <div style={{ flex: '0 0 auto', width: '140px', padding: '16px', borderRadius: '16px', border: `1px solid ${dims.emergency >= 90 ? 'rgba(59, 130, 246, 0.3)' : 'var(--border)'}`, background: dims.emergency >= 90 ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', opacity: dims.emergency >= 90 ? 1 : 0.5, filter: dims.emergency >= 90 ? 'none' : 'grayscale(100%)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', boxShadow: dims.emergency >= 90 ? '0 0 15px rgba(59, 130, 246, 0.5)' : 'none' }}>
              <ShieldCheck size={24} color="#fff" />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>Titanium Shield</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>6 Months Emergency Fund</div>
          </div>

          {/* FIRE Starter Badge */}
          <div style={{ flex: '0 0 auto', width: '140px', padding: '16px', borderRadius: '16px', border: `1px solid ${dims.investments >= 90 ? 'rgba(245, 158, 11, 0.3)' : 'var(--border)'}`, background: dims.investments >= 90 ? 'rgba(245, 158, 11, 0.05)' : 'var(--bg-dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', opacity: dims.investments >= 90 ? 1 : 0.5, filter: dims.investments >= 90 ? 'none' : 'grayscale(100%)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', boxShadow: dims.investments >= 90 ? '0 0 15px rgba(245, 158, 11, 0.5)' : 'none' }}>
              <Flame size={24} color="#fff" />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>FIRE Starter</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Invests {'>'}20% of Income</div>
          </div>

          {/* Tax Ninja Badge */}
          <div style={{ flex: '0 0 auto', width: '140px', padding: '16px', borderRadius: '16px', border: `1px solid ${dims.tax >= 90 ? 'rgba(16, 185, 129, 0.3)' : 'var(--border)'}`, background: dims.tax >= 90 ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', opacity: dims.tax >= 90 ? 1 : 0.5, filter: dims.tax >= 90 ? 'none' : 'grayscale(100%)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', boxShadow: dims.tax >= 90 ? '0 0 15px rgba(16, 185, 129, 0.5)' : 'none' }}>
              <Star size={24} color="#fff" />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>Tax Ninja</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Maxed Section 80C</div>
          </div>
          
          {/* Debt Destroyer Badge */}
          <div style={{ flex: '0 0 auto', width: '140px', padding: '16px', borderRadius: '16px', border: `1px solid ${dims.debt >= 90 ? 'rgba(236, 72, 153, 0.3)' : 'var(--border)'}`, background: dims.debt >= 90 ? 'rgba(236, 72, 153, 0.05)' : 'var(--bg-dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', opacity: dims.debt >= 90 ? 1 : 0.5, filter: dims.debt >= 90 ? 'none' : 'grayscale(100%)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', boxShadow: dims.debt >= 90 ? '0 0 15px rgba(236, 72, 153, 0.5)' : 'none' }}>
              <TrendingUp size={24} color="#fff" />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>Debt Destroyer</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Zero High-Interest EMI</div>
          </div>
        </div>
      </Motion.div>

    </div>
  );
}
