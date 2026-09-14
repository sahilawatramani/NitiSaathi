/**
 * BudgetScreen — Budgeting and income forecasting screen matching reference design.
 * Renders editable Income History, Time-Series WMA Predictor Chart, 50/10/25/15 Spending Guide,
 * Purchasing Power Alert, and Inflation Awareness interactive calculator.
 * Pure single-language strings dynamically loaded via useTranslation().
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { useTranslation } from '../../i18n';
import {
  analyticsService,
  BudgetPlannerResponse,
  MonthlyIncomeHistoryItem,
} from '../../services/analyticsService';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const SEASONALITY_PRIORS: Record<string, number> = {
  Jan: 0.98, Feb: 0.96, Mar: 1.02,
  Apr: 1.01, May: 0.99, Jun: 0.97,
  Jul: 0.95, Aug: 0.98, Sep: 1.05,
  Oct: 1.12, Nov: 1.10, Dec: 1.08,
};

const DEFAULT_SEED_HISTORY: MonthlyIncomeHistoryItem[] = [
  { month: 'Jan', income: 23000, source: 'Primary Income' },
  { month: 'Feb', income: 24000, source: 'Primary Income' },
  { month: 'Mar', income: 25500, source: 'Primary Income' },
  { month: 'Apr', income: 25000, source: 'Primary Income' },
  { month: 'May', income: 24500, source: 'Primary Income' },
  { month: 'Jun', income: 26000, source: 'Primary Income' },
];

function computeClientTimeSeries(history: MonthlyIncomeHistoryItem[], inflationRate = 0.051) {
  const items = history && history.length > 0 ? history : DEFAULT_SEED_HISTORY;
  const values = items.map((h) => Number(h.income) || 0);
  const n = values.length;

  let wma = 25000;
  let slope = 0;
  if (n >= 2) {
    const weights = values.map((_, i) => i + 1);
    const weightSum = weights.reduce((a, b) => a + b, 0);
    wma = values.reduce((sum, v, i) => sum + v * weights[i], 0) / weightSum;

    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a, b) => a + b, 0) / n;
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      num += (i - xMean) * (values[i] - yMean);
      den += (i - xMean) * (i - xMean);
    }
    slope = den !== 0 ? num / den : 0;
  } else if (n === 1) {
    wma = values[0];
  }

  const lastMonth = items[items.length - 1]?.month || 'Jun';
  let lastIdx = MONTH_NAMES.indexOf(lastMonth);
  if (lastIdx < 0) lastIdx = 5;

  const lastSeasonPrior = SEASONALITY_PRIORS[lastMonth] || 1.0;
  const forecastMonths = [];

  for (let i = 1; i <= 3; i++) {
    const nextIdx = (lastIdx + i) % 12;
    const monthName = MONTH_NAMES[nextIdx];
    const targetSeasonPrior = SEASONALITY_PRIORS[monthName] || 1.0;
    const seasonalMult = lastSeasonPrior > 0 ? targetSeasonPrior / lastSeasonPrior : 1.0;
    const inflationGrowth = 1 + inflationRate * (i / 12);
    const predicted = Math.max(1000, Math.round((wma + slope * 0.8 * i) * seasonalMult * inflationGrowth));

    forecastMonths.push({
      month: `${monthName} (F)`,
      predicted_income: predicted,
      is_forecast: true,
    });
  }

  const trajectory: any[] = [];
  items.forEach((h, i) => {
    const isLast = i === items.length - 1;
    trajectory.push({
      month: h.month,
      actual_income: h.income,
      predicted_income: isLast ? h.income : null,
      is_forecast: false,
    });
  });

  forecastMonths.forEach((f) => {
    trajectory.push({
      month: f.month,
      actual_income: null,
      predicted_income: f.predicted_income,
      is_forecast: true,
    });
  });

  const forecastedIncome = forecastMonths[0]?.predicted_income || Math.round(wma);

  return {
    trajectory,
    forecastedIncome,
    wmaIncome: Math.round(wma),
  };
}

export const BudgetScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [planner, setPlanner] = useState<BudgetPlannerResponse | null>(null);
  const [history, setHistory] = useState<MonthlyIncomeHistoryItem[]>(DEFAULT_SEED_HISTORY);
  const [currentCost, setCurrentCost] = useState<string>('1000');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const fetchData = useCallback(async (cost = 1000) => {
    try {
      const data = await analyticsService.getBudgetPlanner(cost);
      if (data) {
        setPlanner(data);
        if (data.history && data.history.length > 0) {
          setHistory(data.history);
        }
      }
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(1000);
  }, [fetchData]);

  const handleRecalculate = async () => {
    try {
      setCalculating(true);
      const costNum = parseFloat(currentCost) || 1000;
      const res = await analyticsService.updateBudgetPlanner(history, costNum);
      if (res) {
        setPlanner(res);
      }
    } catch (err) {
      // Offline local computation fallback
    } finally {
      setCalculating(false);
    }
  };

  const handleIncomeChange = (index: number, val: string) => {
    const num = parseFloat(val) || 0;
    const updated = [...history];
    updated[index] = { ...updated[index], income: num };
    setHistory(updated);
  };

  const handleAddMonth = () => {
    const lastMonth = history.length > 0 ? history[history.length - 1].month : 'Jun';
    const lastIdx = MONTH_NAMES.indexOf(lastMonth);
    const nextMonth = MONTH_NAMES[(lastIdx + 1) % 12];
    const lastIncome = history.length > 0 ? history[history.length - 1].income : 25000;

    setHistory([
      ...history,
      { month: nextMonth, income: lastIncome, source: 'Primary Income' },
    ]);
  };

  const handleDeleteMonth = (index: number) => {
    if (history.length <= 1) return;
    const updated = history.filter((_, i) => i !== index);
    setHistory(updated);
  };

  const inflationRate = planner?.current_inflation_rate ?? 5.1;
  const clientComputed = useMemo(() => {
    return computeClientTimeSeries(history, inflationRate / 100);
  }, [history, inflationRate]);

  const trajectory = (planner?.full_trajectory && planner.full_trajectory.length > 0)
    ? planner.full_trajectory
    : clientComputed.trajectory;

  const forecastIncome = planner?.forecasted_monthly_income ?? clientComputed.forecastedIncome;
  const groupLabel = planner?.group_label ?? (
    forecastIncome < 20000 ? 'ESSENTIAL EARNER GROUP' :
    forecastIncome <= 60000 ? 'MIDDLE INCOME GROUP' : 'GROWTH INCOME GROUP'
  );

  const spendingGuide = planner?.spending_guide ?? {
    total_income: forecastIncome,
    basic_needs: { name: 'Basic Needs (50%)', pct: 50, amount: Math.round(forecastIncome * 0.5) },
    emergency_savings: { name: 'Emergency Savings (10%)', pct: 10, amount: Math.round(forecastIncome * 0.1) },
    future_growth: { name: 'Future Growth (25%)', pct: 25, amount: Math.round(forecastIncome * 0.25) },
    personal_spending: { name: 'Personal Spending (15%)', pct: 15, amount: Math.round(forecastIncome * 0.15) },
  };

  // Chart max / min values
  const chartPoints = trajectory.map((tr) => ({
    month: tr.month,
    amount: tr.is_forecast ? (tr.predicted_income ?? 0) : (tr.actual_income ?? 0),
    isForecast: tr.is_forecast,
  }));
  const amounts = chartPoints.map((p) => p.amount).filter((a) => a > 0);
  const maxAmount = amounts.length > 0 ? Math.max(...amounts) : 30000;
  const minAmount = amounts.length > 0 ? Math.min(...amounts) * 0.8 : 0;
  const maxBarHeight = 110;
  const minBarHeight = 24;

  // Dynamic cost projections
  const costNum = parseFloat(currentCost) || 1000;
  const cost5y = Math.round(costNum * Math.pow(1.04, 5));
  const cost10y = Math.round(costNum * Math.pow(1.04, 10));
  const cost15y = Math.round(costNum * Math.pow(1.04, 15));
  const purchasingPowerOneYear = Math.round(forecastIncome / (1 + inflationRate / 100));

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader title={t.nav.budget} />
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primaryContainer} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title={t.nav.budget} />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchData(costNum);
            }}
          />
        }
      >
        {/* Header Persona / Group Badge */}
        <View style={styles.headerRow}>
          <View style={styles.groupBadge}>
            <View style={styles.badgeDot} />
            <Text style={styles.groupBadgeText}>{groupLabel}</Text>
          </View>
          <View style={styles.liveRateBadge}>
            <Text style={styles.liveRateText}>{inflationRate}% {t.budget.liveInflation}</Text>
          </View>
        </View>

        {/* 1. Time Series Income Forecast Chart Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>{t.budget.incomePredictorTitle}</Text>
              <Text style={styles.cardSub}>
                {t.budget.incomePredictorSub}
              </Text>
            </View>
            <View style={styles.forecastPill}>
              <Text style={styles.forecastPillText}>
                ₹{Math.round(forecastIncome).toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          {/* Dynamic Visual Trajectory Chart */}
          <View style={styles.chartBox}>
            <View style={styles.barsRow}>
              {chartPoints.map((pt, i) => {
                const fraction = maxAmount > minAmount ? (pt.amount - minAmount) / (maxAmount - minAmount) : 0.5;
                const barHeight = Math.max(minBarHeight, Math.round(fraction * maxBarHeight));

                return (
                  <View key={pt.month} style={styles.barCol}>
                    <Text style={[styles.barValText, pt.isForecast && styles.barValTextProj]}>
                      ₹{(pt.amount / 1000).toFixed(0)}k
                    </Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { height: barHeight },
                          pt.isForecast ? styles.barFillProj : styles.barFillActual,
                        ]}
                      />
                    </View>
                    <Text style={[styles.barMonthText, pt.isForecast && styles.barMonthTextProj]}>
                      {pt.month}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Legend */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#06b6d4' }]} />
                <Text style={styles.legendText}>{t.budget.pastActuals}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#f59e0b', borderStyle: 'dashed' }]} />
                <Text style={styles.legendText}>{t.budget.forecastTrajectory}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 2. Editable Income History Section */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.cardTitle}>{t.budget.incomeHistoryTitle}</Text>
            <Text style={styles.historySub}>{t.budget.incomeHistorySub}</Text>
          </View>

          <View style={styles.historyTable}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeadCol, { flex: 1.2 }]}>{t.budget.month}</Text>
              <Text style={[styles.tableHeadCol, { flex: 2 }]}>{t.budget.income}</Text>
              <Text style={[styles.tableHeadCol, { flex: 0.8, textAlign: 'center' }]}>{t.budget.action}</Text>
            </View>

            {history.map((row, idx) => (
              <View key={idx} style={styles.tableRow}>
                <View style={[styles.tableCell, { flex: 1.2 }]}>
                  <Text style={styles.monthBadge}>{row.month}</Text>
                </View>

                <View style={[styles.tableCell, { flex: 2 }]}>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.rupeePrefix}>₹</Text>
                    <TextInput
                      style={styles.incomeInput}
                      keyboardType="numeric"
                      value={row.income.toString()}
                      onChangeText={(val) => handleIncomeChange(idx, val)}
                    />
                  </View>
                </View>

                <View style={[styles.tableCell, { flex: 0.8, alignItems: 'center' }]}>
                  <TouchableOpacity
                    onPress={() => handleDeleteMonth(idx)}
                    disabled={history.length <= 1}
                    style={[styles.deleteBtn, history.length <= 1 && styles.deleteBtnDisabled]}
                  >
                    <Text style={styles.deleteBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.addMonthBtn} onPress={handleAddMonth} activeOpacity={0.8}>
            <Text style={styles.addMonthText}>{t.budget.addMonth}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.recalculateBtn}
            onPress={handleRecalculate}
            disabled={calculating}
            activeOpacity={0.85}
          >
            {calculating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.recalculateBtnText}>{t.budget.calculateForecast}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 3. Recommended Spending Guide (50/10/25/15) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>{t.budget.spendingGuideTitle}</Text>
              <Text style={styles.cardSub}>{t.budget.spendingGuideSub} (₹{forecastIncome.toLocaleString('en-IN')})</Text>
            </View>
          </View>

          <View style={styles.spendingList}>
            {/* Basic Needs 50% */}
            <View style={styles.spendingItem}>
              <View style={styles.spendingTopRow}>
                <Text style={styles.spendingCategoryTitle}>{t.budget.basicNeedsTitle}</Text>
                <Text style={[styles.spendingAmount, { color: '#06b6d4' }]}>
                  ₹{Math.round(spendingGuide?.basic_needs?.amount ?? forecastIncome * 0.5).toLocaleString('en-IN')}
                </Text>
              </View>
              <Text style={styles.spendingDesc}>{t.budget.basicNeedsDesc}</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: '50%', backgroundColor: '#06b6d4' }]} />
              </View>
            </View>

            {/* Emergency Savings 10% */}
            <View style={styles.spendingItem}>
              <View style={styles.spendingTopRow}>
                <Text style={styles.spendingCategoryTitle}>{t.budget.emergencySavingsTitle}</Text>
                <Text style={[styles.spendingAmount, { color: '#10b981' }]}>
                  ₹{Math.round(spendingGuide?.emergency_savings?.amount ?? forecastIncome * 0.1).toLocaleString('en-IN')}
                </Text>
              </View>
              <Text style={styles.spendingDesc}>{t.budget.emergencySavingsDesc}</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: '10%', backgroundColor: '#10b981' }]} />
              </View>
            </View>

            {/* Future Growth 25% */}
            <View style={styles.spendingItem}>
              <View style={styles.spendingTopRow}>
                <Text style={styles.spendingCategoryTitle}>{t.budget.futureGrowthTitle}</Text>
                <Text style={[styles.spendingAmount, { color: '#8b5cf6' }]}>
                  ₹{Math.round(spendingGuide?.future_growth?.amount ?? forecastIncome * 0.25).toLocaleString('en-IN')}
                </Text>
              </View>
              <Text style={styles.spendingDesc}>{t.budget.futureGrowthDesc}</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: '25%', backgroundColor: '#8b5cf6' }]} />
              </View>
            </View>

            {/* Personal Spending 15% */}
            <View style={styles.spendingItem}>
              <View style={styles.spendingTopRow}>
                <Text style={styles.spendingCategoryTitle}>{t.budget.personalSpendingTitle}</Text>
                <Text style={[styles.spendingAmount, { color: '#f59e0b' }]}>
                  ₹{Math.round(spendingGuide?.personal_spending?.amount ?? forecastIncome * 0.15).toLocaleString('en-IN')}
                </Text>
              </View>
              <Text style={styles.spendingDesc}>{t.budget.personalSpendingDesc}</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: '15%', backgroundColor: '#f59e0b' }]} />
              </View>
            </View>
          </View>

          {/* Inflation Warning Alert Box */}
          <View style={styles.inflationAlertBox}>
            <Text style={styles.inflationAlertIcon}>⚠️</Text>
            <Text style={styles.inflationAlertText}>
              {t.budget.inflationAlert}
            </Text>
          </View>
        </View>

        {/* 4. Inflation Awareness Interactive Projections */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>{t.budget.inflationAwarenessTitle}</Text>
              <Text style={styles.cardSub}>{t.budget.inflationAwarenessSub}</Text>
            </View>
          </View>

          <View style={styles.costInputRow}>
            <Text style={styles.costInputLabel}>{t.budget.enterItemCost}</Text>
            <View style={styles.costInputWrapper}>
              <Text style={styles.costRupeePrefix}>₹</Text>
              <TextInput
                style={styles.costInput}
                keyboardType="numeric"
                value={currentCost}
                onChangeText={(val) => {
                  setCurrentCost(val);
                }}
              />
            </View>
          </View>

          <View style={styles.projectionGrid}>
            <View style={styles.projectionCard}>
              <Text style={styles.projectionCardTitle}>{t.budget.in5Years}</Text>
              <Text style={styles.projectionCardVal}>₹{cost5y.toLocaleString('en-IN')}</Text>
              <Text style={styles.projectionCardPct}>+21.7%</Text>
            </View>

            <View style={styles.projectionCard}>
              <Text style={styles.projectionCardTitle}>{t.budget.in10Years}</Text>
              <Text style={styles.projectionCardVal}>₹{cost10y.toLocaleString('en-IN')}</Text>
              <Text style={styles.projectionCardPct}>+48.0%</Text>
            </View>

            <View style={styles.projectionCard}>
              <Text style={styles.projectionCardTitle}>{t.budget.in15Years}</Text>
              <Text style={styles.projectionCardVal}>₹{cost15y.toLocaleString('en-IN')}</Text>
              <Text style={[styles.projectionCardPct, { color: '#ef4444' }]}>+80.1%</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default BudgetScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl * 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderWidth: 1,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#06b6d4',
  },
  groupBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#06b6d4',
  },
  liveRateBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  liveRateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  cardSub: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  forecastPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  forecastPillText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ef4444',
  },
  chartBox: {
    marginTop: Spacing.sm,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: Spacing.md,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barValText: {
    fontSize: 10,
    color: '#06b6d4',
    fontWeight: '600',
    marginBottom: 4,
  },
  barValTextProj: {
    color: '#f59e0b',
  },
  barTrack: {
    width: 14,
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  barFillActual: {
    backgroundColor: '#06b6d4',
  },
  barFillProj: {
    backgroundColor: '#f59e0b',
  },
  barMonthText: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginTop: 6,
    fontWeight: '600',
  },
  barMonthTextProj: {
    color: '#f59e0b',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.md,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  sectionHeaderRow: {
    marginBottom: Spacing.sm,
  },
  historySub: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  historyTable: {
    marginTop: Spacing.xs,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
    paddingBottom: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  tableHeadCol: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  tableCell: {
    justifyContent: 'center',
  },
  monthBadge: {
    fontSize: 14,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    paddingHorizontal: Spacing.xs,
    height: 36,
  },
  rupeePrefix: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginRight: 2,
  },
  incomeInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.onSurface,
    padding: 0,
    fontWeight: '600',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnDisabled: {
    opacity: 0.3,
  },
  deleteBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  addMonthBtn: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addMonthText: {
    fontSize: 14,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  recalculateBtn: {
    marginTop: Spacing.sm,
    backgroundColor: '#ef4444',
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  recalculateBtnText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
  },
  spendingList: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  spendingItem: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  spendingTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spendingCategoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  spendingAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  spendingDesc: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginVertical: 4,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  inflationAlertBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
    alignItems: 'flex-start',
  },
  inflationAlertIcon: {
    fontSize: 14,
  },
  inflationAlertText: {
    flex: 1,
    fontSize: 12,
    color: '#b45309',
    lineHeight: 18,
  },
  costInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  costInputLabel: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
  },
  costInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    paddingHorizontal: Spacing.sm,
    height: 36,
    width: 120,
  },
  costRupeePrefix: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginRight: 4,
  },
  costInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.onSurface,
    fontWeight: '700',
    padding: 0,
  },
  projectionGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  projectionCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs + 2,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    alignItems: 'center',
  },
  projectionCardTitle: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginBottom: 2,
  },
  projectionCardVal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  projectionCardPct: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f59e0b',
    marginTop: 2,
  },
});
