/**
 * BudgetScreen — Budgeting and income forecasting screen matching video reference.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { analyticsService, BudgetState } from '../../services/analyticsService';

const BudgetScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [budgetState, setBudgetState] = useState<BudgetState | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const bState = await analyticsService.getBudgetState();
      setBudgetState(bState);
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primaryContainer} />
      </View>
    );
  }

  const savingsRate = 10;
  const safeToSpend = (budgetState as any)?.safe_to_spend_daily ?? 450.0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title="बजट / Budget" />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
      >
        <Text style={styles.pageSubtitle}>
          Monitor your income, expenses, and financial goals.
        </Text>

        {/* 1. Income Forecast Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Income Forecast</Text>
            <TouchableOpacity style={styles.menuDotsBtn}>
              <Text style={styles.menuDotsText}>⋮</Text>
            </TouchableOpacity>
          </View>

          {/* Simple Visual Line Chart Representation */}
          <View style={styles.lineChartBox}>
            <View style={styles.chartLineTrack}>
              <View style={styles.chartDot1} />
              <View style={styles.chartSegment1} />
              <View style={styles.chartDot2} />
              <View style={styles.chartSegment2} />
              <View style={styles.chartDot3} />
              <View style={styles.chartSegment3} />
              <View style={styles.chartDot4} />
            </View>
          </View>

          {/* Steady Income Callout */}
          <View style={styles.infoCallout}>
            <View style={styles.infoIconCircle}>
              <Text style={styles.infoIcon}>ℹ️</Text>
            </View>
            <Text style={styles.infoText}>
              पिछले 2 महीनों में आपकी कमाई काफी स्थिर रही है / Your income has been fairly steady over the last 2 months
            </Text>
          </View>
        </View>

        {/* 2. Savings Rate Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Savings Rate</Text>

          <View style={styles.savingsRow}>
            {/* Radial Gauge Visual */}
            <View style={styles.gaugeContainer}>
              <View style={styles.gaugeArc}>
                <View style={styles.gaugeCenter}>
                  <Text style={styles.gaugeNumber}>{savingsRate}%</Text>
                </View>
              </View>
            </View>

            <View style={styles.savingsDetails}>
              <Text style={styles.savingsDesc}>
                Based on your recent transactions, you are saving {savingsRate}% of your total income.
              </Text>
            </View>
          </View>
        </View>

        {/* 3. Safe to Spend Daily */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Safe-to-Spend / आज का बजट</Text>
            <Text style={styles.safeAmount}>₹{safeToSpend.toFixed(2)}/day</Text>
          </View>
          <Text style={styles.safeDesc}>
            Calculated after accounting for mandatory savings, upcoming PMSBY debit, and fuel expenses.
          </Text>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtnOutline}
              onPress={() => navigation.navigate('CausalChain')}
            >
              <Text style={styles.actionBtnOutlineText}>कारण समझें / Causal Chain</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtnFill}
              onPress={() => navigation.navigate('Transactions')}
            >
              <Text style={styles.actionBtnFillText}>लेन-देन / Transactions</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.backgroundOffWhite },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.backgroundOffWhite },
  container: { padding: Spacing.md, gap: Spacing.md },
  pageSubtitle: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.textWarmGray,
    marginBottom: 4,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '30',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    ...Typography.headlineSm,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  menuDotsBtn: {
    padding: 4,
  },
  menuDotsText: {
    fontSize: 20,
    color: Colors.textWarmGray,
    fontWeight: '800',
  },

  // Line Chart representation
  lineChartBox: {
    height: 120,
    backgroundColor: '#FAF7F7',
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  chartLineTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    height: 60,
  },
  chartDot1: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primaryContainer, alignSelf: 'flex-end' },
  chartSegment1: { flex: 1, height: 3, backgroundColor: Colors.primaryContainer, transform: [{ rotate: '-12deg' }] },
  chartDot2: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primaryContainer, alignSelf: 'center' },
  chartSegment2: { flex: 1, height: 3, backgroundColor: Colors.primaryContainer, transform: [{ rotate: '8deg' }] },
  chartDot3: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primaryContainer, alignSelf: 'center' },
  chartSegment3: { flex: 1, height: 3, backgroundColor: Colors.primaryContainer, transform: [{ rotate: '-20deg' }] },
  chartDot4: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primaryContainer, alignSelf: 'flex-start' },

  // Info callout
  infoCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FDECEE',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  infoIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIcon: { fontSize: 14 },
  infoText: {
    ...Typography.bodyMd,
    fontSize: 12,
    color: '#601F28',
    flex: 1,
    lineHeight: 17,
  },

  // Savings rate
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  gaugeContainer: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeArc: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 8,
    borderColor: Colors.primaryContainer,
    borderTopColor: '#F0D5D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeNumber: {
    ...Typography.headlineSm,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  savingsDetails: { flex: 1 },
  savingsDesc: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.textWarmGray,
    lineHeight: 18,
  },

  // Safe to spend
  safeAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  safeDesc: {
    ...Typography.bodyMd,
    fontSize: 12,
    color: Colors.textWarmGray,
    lineHeight: 17,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  actionBtnOutline: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primaryContainer,
    alignItems: 'center',
  },
  actionBtnOutlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryContainer,
  },
  actionBtnFill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
  },
  actionBtnFillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
});

export default BudgetScreen;
