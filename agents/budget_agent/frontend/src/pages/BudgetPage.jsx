import { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import {
  Wallet, TrendingUp, Shield, Flame, AlertTriangle, Zap,
  RefreshCw, Bell, Target, ChevronRight, Plus, Trash2,
  Calculator, CheckCircle2, Globe
} from 'lucide-react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useBudget } from '../context/BudgetContext';
import { useLanguage } from '../context/LanguageContext';
import {
  getBudgetPlanner, updateBudgetPlanner,
  createGoal, addSavingsToGoal, archiveGoal,
  createRecurringDebit, deleteRecurringDebit,
  downloadWeeklyReport, emailWeeklyReport,
  getCausalChains,
} from '../services/api';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n ?? 0);

const MONTH_OPTIONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function BudgetPage() {
  const {
    insights, goals, recurringDebits,
    refreshInsights, refreshGoals, refreshRecurringDebits, triggerRecalculate,
  } = useBudget();

  const { lang, changeLanguage, t } = useLanguage();

  // Budget Planner State
  const [plannerData, setPlannerData] = useState(null);
  const [incomeHistory, setIncomeHistory] = useState([]);
  const [currentCostItem, setCurrentCostItem] = useState(1000);
  const [plannerLoading, setPlannerLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Other Sections State
  const [activeTab, setActiveTab] = useState('planner'); // 'planner' | 'goals_debits' | 'risks'
  const [chains, setChains] = useState(null);
  const [chainsLoading, setChainsLoading] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', target_amount: '', category: '' });
  const [savingsInput, setSavingsInput] = useState({});
  const [newDebit, setNewDebit] = useState({ name: '', amount: '', category: 'rent', due_day_of_month: '' });
  const [reportMsg, setReportMsg] = useState('');
  const [recalcLoading, setRecalcLoading] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Load initial budget planner data
  useEffect(() => {
    loadPlannerData(currentCostItem);
  }, []);

  const loadPlannerData = async (cost = 1000) => {
    try {
      setPlannerLoading(true);
      const res = await getBudgetPlanner(cost);
      if (res && res.data) {
        setPlannerData(res.data);
        setIncomeHistory(res.data.history || []);
      }
    } catch (err) {
      console.error('Failed to load budget planner data:', err);
    } finally {
      setPlannerLoading(false);
    }
  };

  const handleCalculateForecast = async () => {
    try {
      setCalculating(true);
      const res = await updateBudgetPlanner(incomeHistory, currentCostItem);
      if (res && res.data) {
        setPlannerData(res.data);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
      }
      refreshInsights();
    } catch (err) {
      console.error('Failed to recalculate budget forecast:', err);
    } finally {
      setCalculating(false);
    }
  };

  const handleHistoryChange = (index, field, value) => {
    const updated = [...incomeHistory];
    updated[index] = { ...updated[index], [field]: field === 'income' ? (parseFloat(value) || 0) : value };
    setIncomeHistory(updated);
  };

  const handleAddMonth = () => {
    const lastMonth = incomeHistory.length > 0 ? incomeHistory[incomeHistory.length - 1].month : 'Jun';
    const lastIdx = MONTH_OPTIONS.indexOf(lastMonth);
    const nextMonth = MONTH_OPTIONS[(lastIdx + 1) % 12];
    const lastIncome = incomeHistory.length > 0 ? incomeHistory[incomeHistory.length - 1].income : 25000;
    
    setIncomeHistory([
      ...incomeHistory,
      { month: nextMonth, income: lastIncome, source: 'Primary Income' }
    ]);
  };

  const handleDeleteMonth = (index) => {
    if (incomeHistory.length <= 1) return;
    const updated = incomeHistory.filter((_, i) => i !== index);
    setIncomeHistory(updated);
  };

  const handleCostInputChange = (val) => {
    const num = parseFloat(val) || 0;
    setCurrentCostItem(num);
  };

  const handleRecalculateInsights = async () => {
    setRecalcLoading(true);
    await triggerRecalculate();
    await loadPlannerData(currentCostItem);
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

  // Inflation Awareness dynamic calculations
  const costVal = currentCostItem > 0 ? currentCostItem : 1000;
  const cost5y = Math.round(costVal * Math.pow(1.04, 5));
  const cost10y = Math.round(costVal * Math.pow(1.04, 10));
  const cost15y = Math.round(costVal * Math.pow(1.04, 15));

  const trajectoryData = plannerData?.full_trajectory || [];
  const spendingGuide = plannerData?.spending_guide;
  const forecastIncome = plannerData?.forecasted_monthly_income || 25000;
  const groupLabel = plannerData?.group_label || 'MIDDLE INCOME GROUP';
  const inflationRate = plannerData?.current_inflation_rate || 5.1;
  const purchasingPowerOneYear = Math.round(forecastIncome / (1 + (inflationRate / 100)));

  // SVG Chart Dimensions & Computations for robust visual rendering
  const svgWidth = 520;
  const svgHeight = 220;
  const padX = 40;
  const padY = 30;
  const chartW = svgWidth - padX * 2;
  const chartH = svgHeight - padY * 2;

  const validAmounts = trajectoryData.map((d) => (d.is_forecast ? d.predicted_income : d.actual_income) || 0).filter((v) => v > 0);
  const maxVal = validAmounts.length > 0 ? Math.max(...validAmounts) * 1.15 : 30000;
  const minVal = validAmounts.length > 0 ? Math.max(0, Math.min(...validAmounts) * 0.85) : 0;

  const getX = (idx) => padX + (idx / Math.max(1, trajectoryData.length - 1)) * chartW;
  const getY = (val) => svgHeight - padY - ((val - minVal) / Math.max(1, maxVal - minVal)) * chartH;

  const actualPoints = trajectoryData.filter((d) => !d.is_forecast);
  const forecastPoints = trajectoryData.filter((d) => d.is_forecast);
  const lastActualIdx = actualPoints.length - 1;

  let actualPath = '';
  actualPoints.forEach((d, i) => {
    const x = getX(i);
    const y = getY(d.actual_income);
    actualPath += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  });

  let forecastPath = '';
  if (lastActualIdx >= 0 && forecastPoints.length > 0) {
    const startX = getX(lastActualIdx);
    const startY = getY(actualPoints[lastActualIdx].actual_income);
    forecastPath = `M ${startX} ${startY}`;
    forecastPoints.forEach((d, i) => {
      const idx = lastActualIdx + 1 + i;
      const x = getX(idx);
      const y = getY(d.predicted_income);
      forecastPath += ` L ${x} ${y}`;
    });
  }

  // Source display labels mapping
  const sourceLabels = {
    'Primary Income': t.history.sources.primary,
    'Gig / Freelance': t.history.sources.gig,
    'Bonus / Incentive': t.history.sources.bonus,
    'Other': t.history.sources.other,
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header Banner */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '28px', background: 'linear-gradient(135deg, #fff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {t.header.title}
          </h1>
          <p className="page-subtitle" style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {t.header.subtitle}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Language Switcher in Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'rgba(255,255,255,0.06)', borderRadius: '10px',
            padding: '6px 12px', border: '1px solid var(--border)'
          }}>
            <Globe size={16} style={{ color: 'var(--accent)' }} />
            <select
              value={lang}
              onChange={(e) => changeLanguage(e.target.value)}
              style={{
                background: 'transparent', border: 'none', color: '#fff',
                fontSize: '13px', outline: 'none', cursor: 'pointer', fontWeight: 600
              }}
            >
              <option value="hi" style={{ background: '#18181b', color: '#fff' }}>🇮🇳 हिंदी</option>
              <option value="en" style={{ background: '#18181b', color: '#fff' }}>🇬🇧 English</option>
              <option value="mr" style={{ background: '#18181b', color: '#fff' }}>🇮🇳 मराठी</option>
            </select>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px',
            background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '20px', fontSize: '13px', color: '#06b6d4', fontWeight: 600
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06b6d4', boxShadow: '0 0 8px #06b6d4' }} />
            {groupLabel}
          </div>

          <button
            className="btn"
            style={{ fontSize: '13px', padding: '8px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)' }}
            onClick={handleRecalculateInsights}
            disabled={recalcLoading}
          >
            <RefreshCw size={14} className={recalcLoading ? 'spin-anim' : ''} />
            {recalcLoading ? t.nav.recalculating : t.nav.syncAll}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveTab('planner')}
          style={{
            padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            background: activeTab === 'planner' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'planner' ? '#fff' : 'var(--text-muted)',
            fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <TrendingUp size={16} /> {t.nav.budgetPlanner}
        </button>

        <button
          onClick={() => setActiveTab('goals_debits')}
          style={{
            padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            background: activeTab === 'goals_debits' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'goals_debits' ? '#fff' : 'var(--text-muted)',
            fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <Target size={16} /> {t.nav.goalsDebits}
        </button>

        <button
          onClick={() => setActiveTab('risks')}
          style={{
            padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            background: activeTab === 'risks' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'risks' ? '#fff' : 'var(--text-muted)',
            fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <AlertTriangle size={16} /> {t.nav.riskAnalysis}
        </button>
      </div>

      {/* TAB 1: MAIN BUDGET PLANNER & PREDICTOR */}
      {activeTab === 'planner' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '24px' }}>
          
          {/* LEFT PANEL: Income History Table */}
          <Motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'var(--bg-panel)',
              backdropFilter: 'var(--glass-blur)',
              WebkitBackdropFilter: 'var(--glass-blur)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              minWidth: 0,
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Wallet size={20} style={{ color: '#06b6d4' }} /> {t.history.title}
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {t.history.subtitle}
                  </p>
                </div>
              </div>

              {/* Editable Income Table */}
              <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 8px', fontWeight: 600 }}>{t.history.month}</th>
                      <th style={{ padding: '10px 8px', fontWeight: 600 }}>{t.history.income}</th>
                      <th style={{ padding: '10px 8px', fontWeight: 600 }}>{t.history.source}</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600 }}>{t.history.action}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomeHistory.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                        {/* Month Select */}
                        <td style={{ padding: '8px' }}>
                          <select
                            value={row.month}
                            onChange={(e) => handleHistoryChange(idx, 'month', e.target.value)}
                            style={{
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid var(--border)',
                              borderRadius: '8px',
                              padding: '8px 10px',
                              color: '#fff',
                              fontSize: '13px',
                              width: '100%',
                              outline: 'none'
                            }}
                          >
                            {MONTH_OPTIONS.map((m) => (
                              <option key={m} value={m} style={{ background: '#18181b', color: '#fff' }}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Income Input */}
                        <td style={{ padding: '8px' }}>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <span style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)', fontSize: '13px' }}>₹</span>
                            <input
                              type="number"
                              value={row.income}
                              onChange={(e) => handleHistoryChange(idx, 'income', e.target.value)}
                              style={{
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                padding: '8px 10px 8px 24px',
                                color: '#fff',
                                fontSize: '13px',
                                width: '100%',
                                outline: 'none'
                              }}
                            />
                          </div>
                        </td>

                        {/* Source Select */}
                        <td style={{ padding: '8px' }}>
                          <select
                            value={row.source || 'Primary Income'}
                            onChange={(e) => handleHistoryChange(idx, 'source', e.target.value)}
                            style={{
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid var(--border)',
                              borderRadius: '8px',
                              padding: '8px 10px',
                              color: '#fff',
                              fontSize: '13px',
                              width: '100%',
                              outline: 'none'
                            }}
                          >
                            <option value="Primary Income" style={{ background: '#18181b', color: '#fff' }}>{t.history.sources.primary}</option>
                            <option value="Gig / Freelance" style={{ background: '#18181b', color: '#fff' }}>{t.history.sources.gig}</option>
                            <option value="Bonus / Incentive" style={{ background: '#18181b', color: '#fff' }}>{t.history.sources.bonus}</option>
                            <option value="Other" style={{ background: '#18181b', color: '#fff' }}>{t.history.sources.other}</option>
                          </select>
                        </td>

                        {/* Delete Action */}
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleDeleteMonth(idx)}
                            disabled={incomeHistory.length <= 1}
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              color: '#ef4444',
                              borderRadius: '6px',
                              padding: '6px',
                              cursor: incomeHistory.length <= 1 ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: incomeHistory.length <= 1 ? 0.4 : 1
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Month Button */}
              <button
                onClick={handleAddMonth}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px dashed rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '20px',
                  transition: 'all 0.2s'
                }}
              >
                <Plus size={16} /> {t.history.addMonth}
              </button>
            </div>

            {/* Bottom Actions & Inflation Badge */}
            <div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={16} style={{ color: '#f59e0b' }} />
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t.history.currentInflationRate}</span>
                </div>
                <div style={{
                  padding: '4px 10px', borderRadius: '20px',
                  background: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                  {inflationRate}% Live
                </div>
              </div>

              <button
                onClick={handleCalculateForecast}
                disabled={calculating}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: calculating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)',
                  transition: 'all 0.2s'
                }}
              >
                <Calculator size={18} className={calculating ? 'spin-anim' : ''} />
                {calculating ? t.history.calculating : t.history.calculateForecast}
              </button>

              {saveSuccess && (
                <div style={{
                  marginTop: '10px', padding: '8px 12px', borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#10b981', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  <CheckCircle2 size={14} /> {t.history.savedSuccess}
                </div>
              )}
            </div>
          </Motion.div>

          {/* RIGHT PANEL: Income Predictor & Spending Guide */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
            
            {/* Predictor Chart Card */}
            <Motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                background: 'var(--bg-panel)',
                backdropFilter: 'var(--glass-blur)',
                WebkitBackdropFilter: 'var(--glass-blur)',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                padding: '24px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                minWidth: 0,
              }}
            >
              <div style={{ marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={20} style={{ color: '#ec4899' }} /> {t.predictor.title}
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {t.predictor.subtitle}
                </p>
              </div>

              {/* Time Series Dual-Rendering Chart (SVG + Recharts) */}
              <div style={{ width: '100%', minHeight: '230px', position: 'relative', marginTop: '10px' }}>
                {plannerLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px' }}>
                    <div className="spinner" />
                  </div>
                ) : (
                  <div style={{ width: '100%' }}>
                    {/* Native SVG Trajectory Chart */}
                    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                      <defs>
                        <linearGradient id="svgActualGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="svgForecastGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Grid Lines */}
                      {[0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
                        const y = padY + chartH * (1 - frac);
                        const val = Math.round(minVal + frac * (maxVal - minVal));
                        return (
                          <g key={idx}>
                            <line x1={padX} y1={y} x2={svgWidth - padX} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                            <text x={padX - 8} y={y + 3} fill="#64748b" fontSize="10" textAnchor="end">
                              ₹{(val / 1000).toFixed(0)}k
                            </text>
                          </g>
                        );
                      })}

                      {/* Actual Income Line */}
                      {actualPath && (
                        <path d={actualPath} fill="none" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      )}

                      {/* Forecasted Line (Dashed) */}
                      {forecastPath && (
                        <path d={forecastPath} fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="6 6" strokeLinecap="round" strokeLinejoin="round" />
                      )}

                      {/* Interactive Data Dots */}
                      {trajectoryData.map((d, i) => {
                        const val = d.is_forecast ? d.predicted_income : d.actual_income;
                        const x = getX(i);
                        const y = getY(val);
                        const isForecast = d.is_forecast;
                        const color = isForecast ? '#f59e0b' : '#06b6d4';
                        const isHovered = hoveredPoint === i;

                        return (
                          <g key={i} onMouseEnter={() => setHoveredPoint(i)} onMouseLeave={() => setHoveredPoint(null)} style={{ cursor: 'pointer' }}>
                            <circle cx={x} cy={y} r={isHovered ? 7 : 5} fill={color} stroke="#fff" strokeWidth={isHovered ? 2.5 : 1.5} />
                            <text x={x} y={svgHeight - 8} fill={isForecast ? '#f59e0b' : '#94a3b8'} fontSize="11" textAnchor="middle" fontWeight={isForecast ? '700' : '500'}>
                              {d.month}
                            </text>
                            {/* Hover tooltip bubble */}
                            {isHovered && (
                              <g>
                                <rect x={x - 45} y={y - 34} width="90" height="24" rx="6" fill="#18181b" stroke={color} strokeWidth="1" />
                                <text x={x} y={y - 18} fill="#fff" fontSize="11" textAnchor="middle" fontWeight="700">
                                  {fmt(val)}
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}
                    </svg>

                    {/* Chart Legend */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <span style={{ width: '12px', height: '3px', background: '#06b6d4', borderRadius: '2px' }} />
                        {t.predictor.pastActuals}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#f59e0b' }}>
                        <span style={{ width: '12px', height: '3px', background: '#f59e0b', borderRadius: '2px', borderStyle: 'dashed' }} />
                        {t.predictor.forecastTrajectory}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Motion.div>

            {/* Recommended Spending Guide Card */}
            <Motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              style={{
                background: 'var(--bg-panel)',
                backdropFilter: 'var(--glass-blur)',
                WebkitBackdropFilter: 'var(--glass-blur)',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                padding: '24px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                minWidth: 0,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em',
                      padding: '3px 8px', borderRadius: '6px',
                      background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8',
                      border: '1px solid rgba(99, 102, 241, 0.4)'
                    }}>
                      {groupLabel}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, marginTop: '6px' }}>
                    {t.spendingGuide.title}
                  </h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.predictor.totalForecastIncome}</span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                    {fmt(forecastIncome)}
                  </div>
                </div>
              </div>

              {/* 4 Allocation Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* 1. Basic Needs (50%) */}
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: '#fff' }}>{t.spendingGuide.basicNeeds}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>{t.spendingGuide.basicNeedsDesc}</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#06b6d4' }}>
                      {fmt(spendingGuide?.basic_needs?.amount || forecastIncome * 0.5)}
                    </span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{ width: '50%', height: '100%', background: '#06b6d4', borderRadius: '6px' }} />
                  </div>
                </div>

                {/* 2. Emergency Savings (10%) */}
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: '#fff' }}>{t.spendingGuide.emergencySavings}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>{t.spendingGuide.emergencySavingsDesc}</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#10b981' }}>
                      {fmt(spendingGuide?.emergency_savings?.amount || forecastIncome * 0.1)}
                    </span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{ width: '10%', height: '100%', background: '#10b981', borderRadius: '6px' }} />
                  </div>
                </div>

                {/* 3. Future Growth (25%) */}
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: '#fff' }}>{t.spendingGuide.futureGrowth}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>{t.spendingGuide.futureGrowthDesc}</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#8b5cf6' }}>
                      {fmt(spendingGuide?.future_growth?.amount || forecastIncome * 0.25)}
                    </span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{ width: '25%', height: '100%', background: '#8b5cf6', borderRadius: '6px' }} />
                  </div>
                </div>

                {/* 4. Personal Spending (15%) */}
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: '#fff' }}>{t.spendingGuide.personalSpending}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>{t.spendingGuide.personalSpendingDesc}</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#f59e0b' }}>
                      {fmt(spendingGuide?.personal_spending?.amount || forecastIncome * 0.15)}
                    </span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{ width: '15%', height: '100%', background: '#f59e0b', borderRadius: '6px' }} />
                  </div>
                </div>

              </div>

              {/* Purchasing Power Warning Alert */}
              <div style={{
                marginTop: '16px', padding: '12px 16px', borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)',
                display: 'flex', alignItems: 'flex-start', gap: '10px'
              }}>
                <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '12px', color: '#fbbf24', lineHeight: 1.5 }}>
                  At <strong>{inflationRate}% inflation</strong>, {fmt(forecastIncome)} will have the purchasing power of approximately <strong>{fmt(purchasingPowerOneYear)}</strong> in one year. Consider investing surplus to beat inflation.
                </div>
              </div>
            </Motion.div>

            {/* Inflation Awareness Interactive Card */}
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
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                minWidth: 0,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={18} style={{ color: '#f59e0b' }} /> {t.inflation.title}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {t.inflation.subtitle}
                  </p>
                </div>

                {/* Cost Input Box */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.inflation.enterCost}</span>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '120px' }}>
                    <span style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)', fontSize: '13px' }}>₹</span>
                    <input
                      type="number"
                      value={currentCostItem}
                      onChange={(e) => handleCostInputChange(e.target.value)}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        padding: '6px 8px 6px 22px',
                        color: '#fff',
                        fontSize: '13px',
                        width: '100%',
                        outline: 'none',
                        fontWeight: 600
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 3 Projected Time Horizon Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                
                {/* 5 Years */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '14px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{t.inflation.in5Years}</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>{fmt(cost5y)}</div>
                  <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600, marginTop: '2px' }}>+21.7%</div>
                </div>

                {/* 10 Years */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '14px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{t.inflation.in10Years}</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>{fmt(cost10y)}</div>
                  <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600, marginTop: '2px' }}>+48.0%</div>
                </div>

                {/* 15 Years */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '14px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{t.inflation.in15Years}</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>{fmt(cost15y)}</div>
                  <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600, marginTop: '2px' }}>+80.1%</div>
                </div>

              </div>
            </Motion.div>

          </div>

        </div>
      )}

      {/* TAB 2: GOALS & RECURRING DEBITS */}
      {activeTab === 'goals_debits' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          {/* Goals */}
          <Motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Target size={18} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{t.goals.title}</h3>
            </div>
            {goals.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>{t.goals.noGoals}</p>
            ) : (
              goals.map((g) => (
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
                        onClick={() => handleAddSavings(g.id)}>{t.goals.addSavings}</button>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
              <input className="input" placeholder={t.goals.goalName} value={newGoal.name}
                onChange={(e) => setNewGoal((p) => ({ ...p, name: e.target.value }))}
                style={{ flex: 2, minWidth: '120px' }} />
              <input className="input" type="number" placeholder={t.goals.targetAmount} value={newGoal.target_amount}
                onChange={(e) => setNewGoal((p) => ({ ...p, target_amount: e.target.value }))}
                style={{ flex: 1, minWidth: '90px' }} />
              <button className="btn btn-primary" onClick={handleCreateGoal}><Plus size={16} /></button>
            </div>
          </Motion.div>

          {/* Recurring Debits */}
          <Motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Bell size={18} style={{ color: 'var(--warning)' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{t.debits.title}</h3>
            </div>
            {recurringDebits.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>{t.debits.noDebits}</p>
            ) : (
              recurringDebits.map((d) => (
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
              ))
            )}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
              <input className="input" placeholder={t.debits.name} value={newDebit.name}
                onChange={(e) => setNewDebit((p) => ({ ...p, name: e.target.value }))}
                style={{ flex: 2, minWidth: '120px' }} />
              <input className="input" type="number" placeholder={t.debits.amount} value={newDebit.amount}
                onChange={(e) => setNewDebit((p) => ({ ...p, amount: e.target.value }))}
                style={{ flex: 1, minWidth: '80px' }} />
              <select className="input" value={newDebit.category}
                onChange={(e) => setNewDebit((p) => ({ ...p, category: e.target.value }))}
                style={{ flex: 1, minWidth: '100px' }}>
                {['rent','loan_emi','insurance_premium','recharge','fuel','food','discretionary'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input className="input" type="number" placeholder={t.debits.dueDay} value={newDebit.due_day_of_month}
                onChange={(e) => setNewDebit((p) => ({ ...p, due_day_of_month: e.target.value }))}
                style={{ flex: 1, minWidth: '70px' }} />
              <button className="btn btn-primary" onClick={handleCreateDebit}><Plus size={16} /></button>
            </div>
          </Motion.div>
        </div>
      )}

      {/* TAB 3: RISKS & REPORTS */}
      {activeTab === 'risks' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          {/* Causal Risk Chains */}
          <Motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{t.risks.title}</h3>
              </div>
              <button className="btn" style={{ fontSize: '12px', padding: '6px 12px' }}
                onClick={handleLoadChains} disabled={chainsLoading}>
                {chainsLoading ? t.history.calculating : chains === null ? t.risks.analyseBtn : t.risks.refreshBtn}
              </button>
            </div>
            {chains === null && (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                {t.risks.analyseBtn} to see what happens if your balance doesn't cover upcoming debits.
              </p>
            )}
            {chains !== null && chains.length === 0 && (
              <p style={{ color: 'var(--success)', fontSize: '13px' }}>✅ {t.risks.noRisks}</p>
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

          {/* Weekly Reports */}
          <Motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>📄 {t.reports.title}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
              {t.reports.desc}
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={handleDownloadReport}>{t.reports.downloadPdf}</button>
              <button className="btn" onClick={handleEmailReport} style={{ background: 'rgba(255,255,255,0.05)' }}>
                {t.reports.emailReport}
              </button>
            </div>
            {reportMsg && <p style={{ color: 'var(--success)', fontSize: '13px', marginTop: '10px' }}>{reportMsg}</p>}
          </Motion.div>
        </div>
      )}

    </div>
  );
}
