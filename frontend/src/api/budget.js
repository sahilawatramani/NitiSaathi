import { apiFetch } from './config';

// ---------------------------------------------------------------------------
// Adapters
// ---------------------------------------------------------------------------

/**
 * Primary path: map /api/analytics/budget-state (WMA-computed state bridge)
 * into the shape the BudgetScreen and its child components consume.
 *
 * budget-state returns pre-computed income_wma_4w, low_balance_flag,
 * savings_rate_recommendation, closing_balance, active_goals, and
 * weekly_features_last4 — the same values the LangGraph orchestrator uses.
 */
function adaptBudgetState(state, forecast) {
  const hasHistory = !!(
    state &&
    (state.income_wma_4w > 0 ||
      (state.weekly_features_last4 && state.weekly_features_last4.length > 0) ||
      (state.active_goals && state.active_goals.length > 0))
  );

  if (!hasHistory) {
    return { hasHistory: false };
  }

  const income = state.income_wma_4w ?? 0;
  const balance = state.closing_balance ?? 0;
  const savingsRatePct = Math.round((state.savings_rate_recommendation ?? 0.1) * 100);
  const saved = Math.round(income * (state.savings_rate_recommendation ?? 0.1));
  const target = Math.round(income * 0.2);

  // --- Savings rate ---------------------------------------------------------
  const savingsRate = {
    percentage: savingsRatePct,
    current: saved,
    target,
    message:
      savingsRatePct >= 20
        ? `आप अपनी income का ${savingsRatePct}% बचा रहे हैं — 20% लक्ष्य पर सही राह पर हैं।`
        : `आप अपनी income का ${savingsRatePct}% बचा रहे हैं। अनुशंसित लक्ष्य 20% है।`,
  };

  // --- Expense breakdown from weekly features -------------------------------
  const CATEGORY_COLORS = [
    'bg-primary', 'bg-secondary', 'bg-tertiary',
    'bg-outline', 'bg-outline-variant', 'bg-surface-variant',
  ];

  // Last week's total expense from weekly features
  const latestWeek = state.weekly_features_last4?.[0];
  const totalSpent = latestWeek?.total_expense ?? 0;

  // We don't have per-category breakdown from state bridge, so use a
  // simplified view from the forecast's category_forecast if available
  const categoryData = forecast?.category_forecast ?? {};
  const categories = Object.entries(categoryData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, amount], idx) => ({
      name,
      percentage:
        totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
    }));

  const expenseBreakdown = {
    total: Math.round(totalSpent),
    categories,
  };

  // --- Goals from active_goals ---------------------------------------------
  const GOAL_ICONS = ['savings', 'home', 'medical-services', 'two-wheeler', 'school'];
  const GOAL_COLORS = ['primary', 'secondary', 'tertiary'];
  const budgetGoals = (state.active_goals ?? []).slice(0, 3).map((g, idx) => ({
    id: g.id,
    title: g.name,
    current: g.saved_amount,
    target: g.target_amount,
    percentage: g.progress_pct ?? Math.round((g.saved_amount / g.target_amount) * 100),
    icon: GOAL_ICONS[idx % GOAL_ICONS.length],
    color: GOAL_COLORS[idx % GOAL_COLORS.length],
    critical: g.progress_pct < 20,
  }));

  // --- Income forecast chart -----------------------------------------------
  // Build chart from weekly_features_last4 (actuals) + forecast (projections)
  const weeklyActuals = (state.weekly_features_last4 ?? [])
    .slice(0, 4)
    .reverse()
    .map((w, idx) => ({
      label: `W${idx + 1}`,
      value: Math.round(w.total_income ?? 0),
      isProj: false,
    }));

  const forecastPoints = (forecast?.forecast ?? []).slice(0, 2).map((pt, idx) => ({
    label: `Proj${idx + 1}`,
    value: Math.round(pt.predicted_spend),
    isProj: true,
  }));

  const incomeForecast = [...weeklyActuals, ...forecastPoints];

  const incomeStats = {
    predictedIncome: Math.round(income),
    predictedSpend: Math.round(forecast?.forecast?.[0]?.predicted_spend ?? totalSpent),
    message:
      forecast?.trend === 'increasing'
        ? `खर्च ${forecast.trend_change_pct}% बढ़ रहा है — बजट पर ध्यान दें।`
        : forecast?.trend === 'decreasing'
        ? `खर्च ${forecast.trend_change_pct}% घट रहा है — अच्छी प्रगति!`
        : 'पिछले हफ्तों में आपकी कमाई काफी स्थिर रही है।',
  };

  // --- Low balance / urgency -----------------------------------------------
  const lowBalance = state.low_balance_flag ?? false;
  const pmsby = state.pmsby_debit_due_soon ?? false;
  const daysToDebit = state.days_to_next_pmsby_debit;

  const health = {
    type: lowBalance ? 'urgent' : savingsRatePct >= 20 ? 'calm' : 'moderate',
    status: lowBalance
      ? 'At Risk'
      : savingsRatePct >= 20
      ? 'Saver / बचतकर्ता'
      : 'On Track',
    message: lowBalance
      ? 'खर्च स्थिर करने के लिए तुरंत ध्यान दें।'
      : savingsRatePct >= 20
      ? 'आप बचत में आगे हैं।'
      : 'थोड़े बदलाव से 20% लक्ष्य हासिल हो सकता है।',
  };

  let urgentAlert = null;
  if (pmsby && daysToDebit != null) {
    urgentAlert = {
      title: 'PMSBY debit आने वाला है / PMSBY debit due soon',
      message: `आपका PMSBY का ₹20 का debit ${daysToDebit} दिनों में है। balance: ₹${Math.round(balance)}। कृपया top up करें।`,
      action: 'Top up Now',
      secondaryAction: 'Remind Me',
    };
  } else if (lowBalance) {
    urgentAlert = {
      title: 'बैलेंस कम है / Low balance',
      message: `आपका balance ₹${Math.round(balance)} है। आने वाले खर्चों के लिए कृपया top up करें।`,
      action: 'Top up Now',
      secondaryAction: 'Remind Me',
    };
  }

  const riskCondition = lowBalance || state.nudge_trigger_low_balance_before_debit;
  const causalChainData = riskCondition
    ? {
        title: 'Financial Risk Detected',
        message: `आपकी savings rate ${savingsRatePct}% है। balance ₹${Math.round(balance)} — इस महीने अनियोजित खर्च जोखिम बढ़ा सकता है।`,
      }
    : null;

  return {
    hasHistory: true,
    savingsRate,
    expenseBreakdown,
    budgetGoals,
    incomeForecast,
    incomeStats,
    health,
    low_balance_flag: lowBalance,
    balance,
    urgentAlert,
    riskCondition,
    causalChainData,
    ...(lowBalance ? {} : { calmMessage: health.message }),
    // Pass through raw state for getCausalRiskChain
    _raw: state,
  };
}

/**
 * Fallback adapter when budget-state has no weekly features yet
 * (new user with transactions but no weekly aggregation run).
 * Uses the live /api/analytics/ response instead.
 */
function adaptAnalyticsFallback(analytics, goals, forecast) {
  const hasHistory = !!(analytics && analytics.total_transactions > 0);
  if (!hasHistory) return { hasHistory: false };

  const income = analytics.monthly_income ?? analytics.avg_monthly_income ?? 0;
  const totalSpent = analytics.total_amount ?? analytics.total_spent ?? 0;
  const saved = income > 0 ? Math.max(0, income - totalSpent) : 0;
  const savingsPct = income > 0 ? Math.round((saved / income) * 100) : 0;

  const CATEGORY_COLORS = ['bg-primary', 'bg-secondary', 'bg-tertiary', 'bg-outline', 'bg-outline-variant', 'bg-surface-variant'];
  const categoryData = analytics.category_breakdown ?? analytics.spending_by_category ?? {};
  const categories = Object.entries(categoryData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, amount], idx) => ({
      name,
      percentage: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
    }));

  const GOAL_ICONS = ['savings', 'home', 'medical-services', 'two-wheeler', 'school'];
  const GOAL_COLORS = ['primary', 'secondary', 'tertiary'];
  const budgetGoals = (goals ?? []).slice(0, 3).map((g, idx) => ({
    id: g.id, title: g.name,
    current: g.saved_amount, target: g.target_amount,
    percentage: g.progress_pct ?? Math.round((g.saved_amount / g.target_amount) * 100),
    icon: GOAL_ICONS[idx % GOAL_ICONS.length],
    color: GOAL_COLORS[idx % GOAL_COLORS.length],
  }));

  const forecastPoints = (forecast?.forecast ?? []).slice(0, 4);
  const incomeForecast = forecastPoints.map((pt, idx) => ({
    label: `M+${idx + 1}`, value: Math.round(pt.predicted_spend), isProj: true,
  }));
  if (forecast?.avg_monthly_spend) {
    incomeForecast.unshift({ label: 'Avg', value: Math.round(forecast.avg_monthly_spend), isProj: false });
  }

  const lowBalance = analytics.health_score?.low_balance_flag ?? false;
  return {
    hasHistory: true,
    savingsRate: {
      percentage: savingsPct,
      current: Math.round(saved),
      target: Math.round(income * 0.2),
      message: `Saving ${savingsPct}% of income. Target: 20%.`,
    },
    expenseBreakdown: { total: Math.round(totalSpent), categories },
    budgetGoals,
    incomeForecast,
    incomeStats: {
      predictedIncome: income,
      predictedSpend: Math.round(forecastPoints[0]?.predicted_spend ?? totalSpent),
      message: forecast?.trend === 'increasing' ? `Spending up ${forecast.trend_change_pct}%.` : 'Spending stable.',
    },
    health: {
      type: lowBalance ? 'urgent' : savingsPct >= 20 ? 'calm' : 'moderate',
      status: lowBalance ? 'At Risk' : savingsPct >= 20 ? 'Saver / बचतकर्ता' : 'On Track',
      message: lowBalance ? 'Immediate attention required.' : savingsPct >= 20 ? "You're ahead on savings." : 'Keep going.',
    },
    low_balance_flag: lowBalance,
    balance: analytics.health_score?.current_balance ?? null,
    urgentAlert: null,
    riskCondition: lowBalance || savingsPct < 5,
    causalChainData: null,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const getDashboardData = async () => {
  // Fire all three in parallel
  const [budgetState, analyticsData, goals, forecast] = await Promise.all([
    apiFetch('/api/analytics/budget-state').catch(() => null),
    apiFetch('/api/analytics/').catch(() => null),
    apiFetch('/api/goals/').catch(() => []),
    apiFetch('/api/analytics/forecast').catch(() => null),
  ]);

  // Prefer WMA state bridge; fall back to live analytics if no weekly data yet
  const hasWmaData =
    budgetState &&
    (budgetState.income_wma_4w > 0 ||
      (budgetState.weekly_features_last4 && budgetState.weekly_features_last4.length > 0));

  if (hasWmaData) {
    // Merge goals from /api/goals/ into budget state's active_goals
    // (state bridge may have stale goal cache; /api/goals/ is authoritative)
    if (goals?.length) {
      budgetState.active_goals = goals;
    }
    return adaptBudgetState(budgetState, forecast);
  }

  return adaptAnalyticsFallback(analyticsData, goals, forecast);
};

export const getCausalRiskChain = async () => {
  const [budgetState, forecast] = await Promise.all([
    apiFetch('/api/analytics/budget-state').catch(() => null),
    apiFetch('/api/analytics/forecast').catch(() => null),
  ]);

  const income = budgetState?.income_wma_4w ?? 0;
  const balance = budgetState?.closing_balance ?? 0;
  const avgSpend = forecast?.avg_monthly_spend ?? 0;
  const trend = forecast?.trend ?? 'stable';

  const topCategory =
    Object.entries(forecast?.category_forecast ?? {}).sort(([, a], [, b]) => b - a)[0] ??
    ['खर्च', 0];

  return {
    trigger: {
      titleHindi: `आपका अनुमानित साप्ताहिक income ₹${Math.round(income).toLocaleString('hi-IN')} है`,
      titleEnglish: `Your predicted weekly income is ₹${Math.round(income).toLocaleString('en-IN')}`,
      dueInHindi: trend === 'increasing' ? 'खर्च बढ़ रहा है' : 'स्थिर है',
      dueInEnglish: trend === 'increasing' ? 'Spending trending up' : 'Spending stable',
    },
    steps: [
      { stepNum: 1, titleHindi: `${topCategory[0]} पर सबसे ज़्यादा खर्च`, titleEnglish: `Highest spend: ${topCategory[0]}` },
      { stepNum: 2, titleHindi: 'बचत लक्ष्य पर असर', titleEnglish: 'Impact on savings goals' },
      { stepNum: 3, titleHindi: 'आपातकालीन निधि जोखिम', titleEnglish: 'Emergency fund at risk' },
    ],
    recommendations: [
      { id: 1, isTopChoice: true, titleHindi: `${topCategory[0]} खर्च कम करें`, titleEnglish: `Reduce ${topCategory[0]} spending`, icon: 'trending-down' },
      { id: 2, isTopChoice: false, titleHindi: 'बचत बढ़ाएं', titleEnglish: 'Increase savings contribution', icon: 'savings' },
      { id: 3, isTopChoice: false, titleHindi: 'बजट बनाएं', titleEnglish: 'Set a spending budget', icon: 'account-balance' },
    ],
  };
};
