import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BudgetStackParamList } from '../../navigation/MainNavigator';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { analyticsService, BudgetState } from '../../services/analyticsService';

type Props = NativeStackScreenProps<BudgetStackParamList, 'BudgetMain'>;

// Palette for category bars
const CAT_COLORS = [
  Colors.primary, Colors.secondary, Colors.tertiary,
  Colors.outline, Colors.outlineVariant, Colors.surfaceVariant,
];

const BudgetScreen: React.FC<Props> = ({ navigation }) => {
  const [budgetState, setBudgetState] = useState<BudgetState | null>(null);
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [bState, anal] = await Promise.all([
        analyticsService.getBudgetState(),
        analyticsService.getAnalytics(),
      ]);
      console.log('Budget API responses:', { bState, anal });
      setBudgetState(bState);
      setAnalytics(anal);
    } catch (err) {
      console.log('Budget fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primaryContainer} />
      </View>
    );
  }

  // Savings rate from API or fallback
  const savingsRatePct = Math.round((budgetState?.savings_rate_recommendation ?? 0.1) * 100);
  const income = budgetState?.income_wma_4w ?? 0;
  const currentSavings = Math.round(income * (savingsRatePct / 100));
  const targetSavings = Math.round(income * 0.2);

  // Expense breakdown — from analytics categories if available, else empty
  const categoryBreakdown = (analytics as { category_breakdown?: Record<string, { total: number; percentage: number }> })?.category_breakdown ?? {};
  const expenses = Object.entries(categoryBreakdown).map(([cat, data], i) => ({
    name: cat,
    pct: data.percentage,
    color: CAT_COLORS[i % CAT_COLORS.length],
  }));

  // Low balance / causal chain warning
  const showWarning = budgetState?.low_balance_flag || budgetState?.nudge_trigger_low_balance_before_debit;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>बजट / Budget</Text>
        <TouchableOpacity
          style={styles.txnBtn}
          onPress={() => navigation.navigate('Transactions')}
        >
          <Text style={styles.txnBtnText}>लेन-देन / Txns</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
      >
        <Text style={styles.subtitle}>Monitor your income, expenses, and financial goals.</Text>

        {/* Savings Rate Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Savings Rate</Text>
          <View style={styles.savingsRow}>
            <View style={styles.circularProgress}>
              <Text style={styles.circularProgressText}>{savingsRatePct}%</Text>
            </View>
            <View style={styles.savingsDetails}>
              <Text style={styles.descText}>
                {savingsRatePct >= 20
                  ? `You're saving ${savingsRatePct}% — great work, above the 20% target!`
                  : `You're saving ${savingsRatePct}% of income. Try to reach the 20% target.`}
              </Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${Math.min(savingsRatePct, 100)}%` }]} />
              </View>
              <View style={styles.savingsValues}>
                <Text style={styles.mutedText}>Current: ₹{currentSavings.toLocaleString('en-IN')}</Text>
                <Text style={styles.mutedText}>Target: ₹{targetSavings.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Expense Breakdown Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Expense Breakdown</Text>
          {expenses.length === 0 ? (
            <Text style={styles.emptyText}>
              No transactions yet. Add transactions to see your expense breakdown.
            </Text>
          ) : (
            <View style={styles.expenseList}>
              {expenses.map((exp, idx) => (
                <View key={idx} style={styles.expenseRow}>
                  <View style={styles.expenseLabelWrap}>
                    <View style={[styles.colorDot, { backgroundColor: exp.color }]} />
                    <Text style={styles.expenseName}>{exp.name}</Text>
                  </View>
                  <Text style={styles.expensePct}>{exp.pct}%</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Warning Card — only shown when API flags it */}
        {showWarning && (
          <View style={styles.warningCard}>
            <View style={styles.warningIconBg}>
              <Text style={styles.warningIcon}>📈</Text>
            </View>
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Low Balance Warning</Text>
              <Text style={styles.warningDesc}>
                {budgetState?.nudge_trigger_low_balance_before_debit
                  ? `Auto-debit due in ${budgetState.days_to_next_pmsby_debit ?? 'a few'} days — balance may be insufficient.`
                  : 'Your balance is running low. Review your recent spending.'}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('CausalChain')}
                style={styles.warningBtn}
              >
                <Text style={styles.warningBtnText}>विस्तार से देखें / See details →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  appBar: {
    height: 64, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant, backgroundColor: Colors.surface,
  },
  appBarTitle: { ...Typography.headlineSm, color: Colors.onSurface },
  txnBtn: {
    backgroundColor: Colors.primaryContainer, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
  },
  txnBtnText: { ...Typography.labelLg, color: Colors.onPrimary },
  container: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  subtitle: { ...Typography.bodyMd, color: Colors.textWarmGray, marginBottom: Spacing.lg },
  card: {
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, marginBottom: Spacing.lg,
    shadowColor: Colors.onBackground, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 20, elevation: 4,
    borderWidth: 1, borderColor: `${Colors.outlineVariant}50`,
  },
  cardTitle: { ...Typography.headlineSm, color: Colors.onSurface, marginBottom: Spacing.md },
  savingsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  circularProgress: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 6,
    borderColor: Colors.surfaceContainerHigh, borderTopColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  circularProgressText: { ...Typography.headlineMd, color: Colors.onSurface },
  savingsDetails: { flex: 1 },
  descText: { ...Typography.bodyMd, fontSize: 14, color: Colors.textWarmGray, marginBottom: Spacing.sm },
  progressBarBg: { height: 8, backgroundColor: Colors.surfaceContainerHigh, borderRadius: 4, marginBottom: 4 },
  progressBarFill: { height: 8, backgroundColor: Colors.primary, borderRadius: 4 },
  savingsValues: { flexDirection: 'row', justifyContent: 'space-between' },
  mutedText: { ...Typography.labelSm, color: Colors.textWarmGray },
  emptyText: { ...Typography.bodyMd, color: Colors.textWarmGray, textAlign: 'center', paddingVertical: Spacing.md },
  expenseList: { marginTop: Spacing.sm },
  expenseRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: Spacing.sm, borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerLow,
  },
  expenseLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  expenseName: { ...Typography.labelLg, color: Colors.onSurface },
  expensePct: { ...Typography.bodyMd, color: Colors.textWarmGray },
  warningCard: {
    backgroundColor: Colors.cautionTint, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, borderWidth: 2, borderColor: Colors.primaryContainer,
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginTop: Spacing.md,
  },
  warningIconBg: { backgroundColor: Colors.primaryContainer, padding: 8, borderRadius: 20 },
  warningIcon: { fontSize: 20 },
  warningContent: { flex: 1 },
  warningTitle: { ...Typography.headlineSm, color: Colors.onSurface, fontSize: 18, marginBottom: Spacing.xs },
  warningDesc: { ...Typography.bodyMd, fontSize: 14, color: Colors.onSurfaceVariant, marginBottom: Spacing.md },
  warningBtn: {},
  warningBtnText: { ...Typography.labelLg, color: Colors.primaryContainer, textDecorationLine: 'underline' },
});

export default BudgetScreen;
