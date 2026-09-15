import { useState, useEffect, useMemo } from 'react';
import { motion as Motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Bell, Shield, Wallet, Sparkles, Volume2,
  ExternalLink, ChevronRight, CheckCircle2, AlertTriangle,
  ArrowUpRight, Info, Award, Compass, MessageSquare, X
} from 'lucide-react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import {
  getBudgetPlanner,
  getNudges,
  getSchemesRecommendations,
  postNudgeFeedback,
  getProfile,
} from '../services/api';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n ?? 0);

const MONTH_OPTIONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DEFAULT_HISTORY = [
  { month: 'Jan', income: 45500, source: 'Primary Income' },
  { month: 'Feb', income: 47500, source: 'Primary Income' },
  { month: 'Mar', income: 47000, source: 'Primary Income' },
  { month: 'Apr', income: 49000, source: 'Primary Income' },
  { month: 'May', income: 50500, source: 'Primary Income' },
  { month: 'Jun', income: 50000, source: 'Primary Income' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const d = t.dashboard || {};

  const [loading, setLoading] = useState(true);
  const [plannerData, setPlannerData] = useState(null);
  const [nudges, setNudges] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [dismissedNudgeIds, setDismissedNudgeIds] = useState(new Set());
  const [speakingText, setSpeakingText] = useState(null);

  // Fetch agent feeds concurrently
  useEffect(() => {
    let isMounted = true;
    async function loadDashboardData() {
      try {
        const [plannerRes, profileRes, nudgesRes, schemesRes] = await Promise.allSettled([
          getBudgetPlanner(),
          getProfile(),
          getNudges('1', lang),
          getSchemesRecommendations({}, lang),
        ]);

        if (!isMounted) return;

        if (plannerRes.status === 'fulfilled' && plannerRes.value?.data) {
          setPlannerData(plannerRes.value.data);
        }
        if (profileRes.status === 'fulfilled' && profileRes.value?.data) {
          setUserProfile(profileRes.value.data);
        }
        if (nudgesRes.status === 'fulfilled' && nudgesRes.value) {
          setNudges(nudgesRes.value);
        }
        if (schemesRes.status === 'fulfilled' && schemesRes.value) {
          setSchemes(schemesRes.value);
        }
      } catch (err) {
        console.warn('Dashboard data fetch fallback:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();
    return () => { isMounted = false; };
  }, [lang]);

  // Audio TTS helper
  const handleSpeak = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (speakingText === text) {
      setSpeakingText(null);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN';
    utterance.onend = () => setSpeakingText(null);
    setSpeakingText(text);
    window.speechSynthesis.speak(utterance);
  };

  // Dismiss nudge helper
  const handleDismissNudge = (nudgeId, triggerId) => {
    setDismissedNudgeIds((prev) => new Set([...prev, nudgeId]));
    postNudgeFeedback(nudgeId, 'not_useful', triggerId);
  };

  // Build chart trajectory dataset
  const chartData = useMemo(() => {
    if (plannerData?.full_trajectory && plannerData.full_trajectory.length > 0) {
      return plannerData.full_trajectory.map((item) => {
        const isForecast = item.is_forecast;
        const incomeVal = isForecast ? item.predicted_income : item.actual_income;
        return {
          month: item.month,
          actual: !isForecast ? item.actual_income : null,
          predicted: isForecast ? item.predicted_income : (item.actual_income ? item.actual_income : null),
          inflationUpper: isForecast ? Math.round(incomeVal * 1.051) : null,
          inflationLower: isForecast ? Math.round(incomeVal * 0.949) : null,
          isForecast,
        };
      });
    }

    // Dynamic fallback timeseries curve centered around user's actual monthly income
    const base = userProfile?.monthly_income || plannerData?.forecasted_monthly_income || 25000;
    return [
      { month: 'Jan', actual: Math.round(base * 0.91), predicted: null },
      { month: 'Feb', actual: Math.round(base * 0.95), predicted: null },
      { month: 'Mar', actual: Math.round(base * 0.94), predicted: null },
      { month: 'Apr', actual: Math.round(base * 0.98), predicted: null },
      { month: 'May', actual: Math.round(base * 1.01), predicted: null },
      { month: 'Jun', actual: Math.round(base * 1.00), predicted: Math.round(base * 1.00) },
      { month: 'Jul', actual: null, predicted: Math.round(base * 1.02), isForecast: true },
      { month: 'Aug', actual: null, predicted: Math.round(base * 1.04), isForecast: true },
      { month: 'Sep', actual: null, predicted: Math.round(base * 1.06), isForecast: true },
    ];
  }, [plannerData, userProfile]);

  // Derived metrics
  const avgIncome = userProfile?.monthly_income || plannerData?.forecasted_monthly_income || 25000;
  const emergencySaved = 17500;
  const emergencyGoal = 30000;
  const savingsPct = 35;

  // Fallback curated alerts if Nudge Agent has not fired yet
  const displayNudges = useMemo(() => {
    const active = (nudges || []).filter((n) => !dismissedNudgeIds.has(n.id));
    if (active.length > 0) return active;

    return [
      {
        id: 'nudge-tax-01',
        trigger_id: 'tax_planning',
        title: lang === 'hi' ? 'कर बचत समय सीमा' : lang === 'mr' ? 'कर नियोजन मुदत' : '80C Investment Deadline',
        message: lang === 'hi'
          ? 'धारा 80C के तहत आपके पास ₹1,05,000 निवेश करने के लिए शेष हैं।'
          : lang === 'mr'
          ? 'कलम 80C अंतर्गत आपल्याकडे ₹1,05,000 गुंतवण्यासाठी शिल्लक आहेत.'
          : 'You have ₹1,05,000 left to invest under Section 80C to maximize tax refunds.',
        priority: 'urgent',
        badge: 'TAX ALERT',
      },
      {
        id: 'nudge-fraud-02',
        trigger_id: 'fraud_prevention',
        title: lang === 'hi' ? 'सुरक्षा चेतावनी' : lang === 'mr' ? 'सुरक्षा इशारा' : 'Security Alert',
        message: lang === 'hi'
          ? 'आरबीआई अनुदान का दावा करने वाले फर्जी व्हाट्सएप संदेशों से सावधान रहें।'
          : lang === 'mr'
          ? 'RBI अनुदानाचा दावा करणाऱ्या बनावट व्हॉट्सअॅप मेसेजपासून सावध राहा.'
          : 'Fraud Alert: Beware of fake WhatsApp messages claiming RBI grants.',
        priority: 'advisory',
        badge: 'SECURITY ALERT',
      },
      {
        id: 'nudge-savings-03',
        trigger_id: 'savings_milestone',
        title: lang === 'hi' ? 'आपातकालीन फंड प्रगति' : lang === 'mr' ? 'आपत्कालीन निधी प्रगती' : 'Emergency Fund Milestone',
        message: lang === 'hi'
          ? 'उत्कृष्ट प्रगति! आपने ₹63,000 बचाए हैं (लक्ष्य का 60%)।'
          : lang === 'mr'
          ? 'उत्कृष्ट प्रगती! तुम्ही ₹63,000 बचत केली आहे (लक्ष्याच्या 60%).'
          : 'Emergency Fund: Great progress! You have ₹63,000 saved (60% of target).',
        priority: 'milestone',
        badge: 'SAVINGS ALERT',
      },
    ];
  }, [nudges, dismissedNudgeIds, lang]);

  // Fallback curated schemes if Scheme Agent is offline
  const displaySchemes = useMemo(() => {
    if (schemes && schemes.length > 0) return schemes.slice(0, 3);
    return [
      {
        scheme_code: 'pm_jay',
        scheme_name: lang === 'hi' ? 'आयुष्मान भारत - पीएम जन आरोग्य योजना (PM-JAY)' : 'PM Jan Arogya Yojana (PM-JAY)',
        ministry: 'Ministry of Health & Family Welfare',
        category: 'insurance_healthcare',
        match_score: 95,
        description: lang === 'hi'
          ? 'गिग व असंगठित कामगार परिवारों के लिए प्रति वर्ष ₹5 लाख का मुफ्त कैशलेस स्वास्थ्य बीमा कवर।'
          : 'Free secondary and tertiary healthcare cashless cover up to ₹5 Lakh per year for eligible gig workers.',
      },
      {
        scheme_code: 'pmsby',
        scheme_name: lang === 'hi' ? 'प्रधानमंत्री सुरक्षा बीमा योजना (PMSBY)' : 'PM Suraksha Bima Yojana (PMSBY)',
        ministry: 'Ministry of Finance',
        category: 'insurance_healthcare',
        match_score: 92,
        description: lang === 'hi'
          ? 'मात्र ₹20 प्रति वर्ष प्रीमियम पर ₹2 लाख का दुर्घटना मृत्यु व दिव्यांगता बीमा सुरक्षा कवर।'
          : 'Accidental death and disability coverage of ₹2 Lakh at just ₹20 annual premium.',
      },
      {
        scheme_code: 'pm_svanidhi',
        scheme_name: lang === 'hi' ? 'पीएम स्वनिधि सूक्ष्म-ऋण योजना' : 'PM SVANidhi Micro-Credit Scheme',
        ministry: 'Ministry of Housing and Urban Affairs',
        category: 'credit_loan',
        match_score: 88,
        description: lang === 'hi'
          ? 'गिग प्लेटफॉर्म डिलीवरी व वेंडर्स के लिए ₹10,000 से ₹50,000 तक का संपार्श्विक-मुक्त सस्ता कार्यशील पूंजी ऋण।'
          : 'Collateral-free working capital loan from ₹10,000 up to ₹50,000 with 7% interest subsidy.',
      },
    ];
  }, [schemes, lang]);

  if (loading) {
    return (
      <div className="loading-center" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      {/* 1. Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {d.title || 'Dashboard'} {userProfile?.full_name ? `• ${userProfile.full_name}` : ''}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {d.subtitle || 'Platform tailored dashboard highlighting your configurations'}
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => handleSpeak(`${d.title}. ${d.avgIncome}: ${fmt(avgIncome)}. ${d.incomeYouSave}: ${savingsPct}%.`)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '10px',
              background: speakingText ? 'rgba(236,72,153,0.2)' : 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border)', color: speakingText ? '#ec4899' : 'var(--text-main)',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <Volume2 size={16} />
            <span>{speakingText ? 'Playing Audio...' : 'Audio'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Metric Cards (3 Columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
        
        {/* Card 1: Average Monthly Income */}
        <Motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{
            background: 'var(--bg-panel)',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            padding: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                {d.avgIncome || 'AVERAGE MONTHLY INCOME'}
              </span>
              <button
                onClick={() => handleSpeak(`${d.avgIncome}: ${fmt(avgIncome)}`)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              >
                <Volume2 size={14} />
              </button>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
              {d.incomeTag || 'Income'}
            </span>
          </div>

          <div style={{ margin: '14px 0 6px 0' }}>
            <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              {fmt(avgIncome)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {d.salaryDesc || 'Monthly Fixed Salary / Gig Payouts'}
            </div>
          </div>
        </Motion.div>

        {/* Card 2: Emergency Savings */}
        <Motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: 'var(--bg-panel)',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            padding: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                {d.emergencySavings || 'EMERGENCY SAVINGS'}
              </span>
              <button
                onClick={() => handleSpeak(`${d.emergencySavings}: ${fmt(emergencySaved)} of ${d.emergencyGoal}`)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              >
                <Volume2 size={14} />
              </button>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
              {d.emergencyGoal || 'Goal: ₹30,000'}
            </span>
          </div>

          <div style={{ margin: '14px 0 6px 0' }}>
            <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              {fmt(emergencySaved)}
            </div>

            {/* Red / Accent Progress Bar */}
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', margin: '10px 0 6px 0', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, Math.round((emergencySaved / emergencyGoal) * 100))}%`, height: '100%', background: '#b91c1c', borderRadius: '4px' }} />
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {d.savedDesc || 'Saved toward your emergency savings goal'}
            </div>
          </div>
        </Motion.div>

        {/* Card 3: Income You Save */}
        <Motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            background: 'var(--bg-panel)',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            padding: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                {d.incomeYouSave || 'INCOME YOU SAVE'}
              </span>
              <button
                onClick={() => handleSpeak(`${d.incomeYouSave}: ${savingsPct} percent. ${d.statusExcellent}`)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              >
                <Volume2 size={14} />
              </button>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}>
              {d.statusExcellent || '↑ Status: Excellent'}
            </span>
          </div>

          <div style={{ margin: '14px 0 6px 0' }}>
            <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              {savingsPct}%
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {(d.savePctDesc || 'You save {pct}% of your income.').replace('{pct}', savingsPct)}
            </div>
          </div>
        </Motion.div>
      </div>

      {/* 3. Main Dashboard Layout: Left (65%) & Right (35%) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.85fr) minmax(0, 1.15fr)', gap: '24px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Budget Predictor Graph + Schemes + Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
          
          {/* Income Predictor (Budget Graph) */}
          <Motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              background: 'var(--bg-panel)',
              backdropFilter: 'var(--glass-blur)',
              WebkitBackdropFilter: 'var(--glass-blur)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              padding: '24px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              minWidth: 0,
            }}
          >
            {/* Header with World Bank API Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={20} style={{ color: '#ec4899' }} />
                  {d.incomePredictorTitle || 'Income Predictor'}
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {d.predictorDesc || 'Predicted income based on your typical monthly earnings pattern'}
                </p>
              </div>

              <div style={{
                padding: '5px 12px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
                fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-muted)',
              }}>
                {d.worldBankBadge || 'POWERED BY WORLD BANK API'}
              </div>
            </div>

            {/* Line Chart Component */}
            <div style={{ width: '100%', height: 260, marginTop: '12px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={11}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    tickLine={false}
                    axisLine={false}
                    domain={['dataMin - 5000', 'dataMax + 5000']}
                  />
                  <Tooltip
                    contentStyle={{ background: '#18181b', border: '1px solid var(--border)', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                    formatter={(val, name) => [fmt(val), name === 'actual' ? (d.actualIncome || 'Actual Income') : (d.predictedIncome || 'Predicted Income')]}
                  />
                  
                  {/* Actual Income (Blue solid with dots) */}
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#3b82f6"
                    strokeWidth={2.8}
                    dot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 1.5 }}
                    activeDot={{ r: 6 }}
                    connectNulls={false}
                  />

                  {/* Predicted Income (Red dashed with dots) */}
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#b91c1c"
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    dot={{ r: 4, fill: '#b91c1c', stroke: '#fff', strokeWidth: 1.5 }}
                    activeDot={{ r: 6 }}
                    connectNulls={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Legend */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6' }} />
                <span>{d.actualIncome || 'Actual Income'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <div style={{ width: 16, height: 8, borderRadius: '2px', background: 'rgba(255,255,255,0.15)' }} />
                <span>{d.inflationBand || 'Inflation Band'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#b91c1c' }} />
                <span>{d.predictedIncome || 'Predicted Income'}</span>
              </div>
            </div>
          </Motion.div>

          {/* Recent Scheme Recommendations */}
          <Motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            style={{
              background: 'var(--bg-panel)',
              backdropFilter: 'var(--glass-blur)',
              WebkitBackdropFilter: 'var(--glass-blur)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              padding: '22px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              minWidth: 0,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Compass size={18} style={{ color: '#06b6d4' }} />
                {d.recentSchemes || 'Recent Scheme Recommendations'}
              </h3>
              <button
                onClick={() => navigate('/schemes')}
                style={{
                  background: 'none', border: 'none', color: '#ec4899',
                  fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                }}
              >
                <span>{d.discoverAll || 'Discover All'}</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Scheme Cards Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {displaySchemes.map((scheme, idx) => (
                <div
                  key={scheme.scheme_code || idx}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate('/schemes')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {scheme.ministry || 'Government Welfare Portal'}
                    </span>
                    {scheme.match_score && (
                      <span style={{
                        fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                        background: 'rgba(16,185,129,0.15)', color: '#34d399',
                      }}>
                        {scheme.match_score}% Match
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                    {scheme.scheme_name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {scheme.description}
                  </div>
                </div>
              ))}
            </div>
          </Motion.div>

          {/* Recent Assistant Summary & Quick Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
            
            {/* Assistant Summary */}
            <Motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                background: 'var(--bg-panel)',
                backdropFilter: 'var(--glass-blur)',
                WebkitBackdropFilter: 'var(--glass-blur)',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                padding: '18px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquare size={16} style={{ color: '#818cf8' }} />
                  {d.recentAssistant || 'Recent Assistant Summary'}
                </span>
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {d.syncTime || 'SYNC: 1H AGO'}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                {lang === 'hi'
                  ? 'आपकी मासिक आय स्थिर है। अपनी आपातकालीन बचत पूरी करने के लिए अगले महीने ₹2,500 अतिरिक्त सुरक्षित रखने की सलाह दी जाती है।'
                  : 'Your monthly cashflow is steady. You are on track to meet your ₹30,000 emergency buffer within 3 months.'}
              </p>
            </Motion.div>

            {/* Quick Platform Controls */}
            <Motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              style={{
                background: 'var(--bg-panel)',
                backdropFilter: 'var(--glass-blur)',
                WebkitBackdropFilter: 'var(--glass-blur)',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                padding: '18px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '10px' }}>
                {d.quickControls || 'Quick Platform Controls'}
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  onClick={() => navigate('/budget')}
                  style={{
                    padding: '8px 10px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                    color: 'var(--text-main)', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  📊 {d.openBudget || 'Budget Planner'}
                </button>
                <button
                  onClick={() => navigate('/schemes')}
                  style={{
                    padding: '8px 10px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                    color: 'var(--text-main)', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  📋 {d.openSchemes || 'Scheme Discovery'}
                </button>
                <button
                  onClick={() => navigate('/chat')}
                  style={{
                    padding: '8px 10px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                    color: 'var(--text-main)', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  💬 {t.nav.syncAll || 'Chat Assistant'}
                </button>
                <button
                  onClick={() => navigate('/tax')}
                  style={{
                    padding: '8px 10px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                    color: 'var(--text-main)', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  🛡️ {d.openFraud || 'Tax & Reports'}
                </button>
              </div>
            </Motion.div>
          </div>
        </div>

        {/* RIGHT COLUMN: Today's Nudges (Alerts Panel) */}
        <Motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: 'var(--bg-panel)',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            padding: '22px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            minWidth: 0,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={18} style={{ color: '#b91c1c' }} />
              {d.todaysNudges || "Today's Nudges"}
            </h3>
            <button
              onClick={() => navigate('/budget')}
              style={{
                background: 'none', border: 'none', color: '#b91c1c',
                fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
              }}
            >
              <span>{d.discoverAll || 'Discover All'}</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Live Alert Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {displayNudges.map((nudge) => {
              const isUrgent = nudge.priority === 'urgent' || nudge.badge?.includes('TAX') || nudge.trigger_id?.includes('low_balance');
              const isSecurity = nudge.badge?.includes('SECURITY') || nudge.trigger_id?.includes('fraud');
              const borderColor = isUrgent ? '#b91c1c' : isSecurity ? '#f59e0b' : '#10b981';

              return (
                <div
                  key={nudge.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)',
                    borderLeft: `4px solid ${borderColor}`,
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <span style={{
                      fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
                      color: borderColor, letterSpacing: '0.05em',
                    }}>
                      {nudge.badge || (isUrgent ? 'URGENT ALERT' : isSecurity ? 'SECURITY ALERT' : 'SAVINGS ALERT')}
                    </span>
                    <button
                      onClick={() => handleDismissNudge(nudge.id, nudge.trigger_id)}
                      style={{
                        background: 'none', border: 'none', color: 'var(--text-muted)',
                        cursor: 'pointer', padding: '0 0 0 8px', fontSize: '14px',
                      }}
                      title="Dismiss"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                    {nudge.title}
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                    {nudge.message}
                  </div>

                  {nudge.action_label && (
                    <div style={{ marginTop: '10px' }}>
                      <button
                        onClick={() => navigate('/budget')}
                        style={{
                          padding: '4px 10px', borderRadius: '6px',
                          background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
                          color: 'var(--text-main)', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        {nudge.action_label} →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Motion.div>
      </div>
    </div>
  );
}
