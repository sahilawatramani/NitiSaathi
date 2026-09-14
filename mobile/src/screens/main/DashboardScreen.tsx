/**
 * DashboardScreen — Main home screen matching reference design.
 * Pure single-language strings dynamically loaded via useTranslation().
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { useTranslation } from '../../i18n';
import { analyticsService, BudgetState } from '../../services/analyticsService';

const DashboardScreen: React.FC = () => {
  const { t } = useTranslation();
  const [budgetState, setBudgetState] = useState<BudgetState | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const bState = await analyticsService.getBudgetState();
      setBudgetState(bState);
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primaryContainer} />
      </View>
    );
  }

  const balance = budgetState?.closing_balance ?? 10.0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title={t.nav.home} />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 1. Urgent Low Balance Banner */}
        <View style={styles.urgentBanner}>
          <View style={styles.urgentHeaderRow}>
            <View style={styles.alertIconBox}>
              <Text style={styles.alertIcon}>⚠️</Text>
            </View>
            <Text style={styles.urgentTitle}>{t.dashboard.urgentAlert}</Text>
          </View>

          <View style={styles.bannerActions}>
            <TouchableOpacity style={styles.topUpBtn} activeOpacity={0.85}>
              <Text style={styles.topUpText}>{t.dashboard.action1Title}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Available Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceLeft}>
            <Text style={styles.balanceLabel}>{t.dashboard.availableBalance}</Text>
            <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
            <Text style={styles.savingsPillText}>{t.dashboard.savingsRate}</Text>
          </View>
          <View style={styles.bankIconBox}>
            <Text style={styles.bankIcon}>🏛️</Text>
          </View>
        </View>

        {/* 3. Income Forecast Chart Card */}
        <View style={styles.forecastCard}>
          <View style={styles.forecastHeader}>
            <Text style={styles.forecastTitle}>{t.dashboard.weeklyTrend}</Text>
          </View>

          {/* Visual Bar Chart */}
          <View style={styles.chartContainer}>
            {[
              { label: 'W1', height: 45 },
              { label: 'W2', height: 75 },
              { label: 'W3', height: 60 },
              { label: 'W4', height: 90 },
              { label: 'W5', height: 110, isProj: true },
            ].map((bar) => (
              <View key={bar.label} style={styles.barCol}>
                <View
                  style={[
                    styles.barFill,
                    { height: bar.height },
                    bar.isProj ? styles.barProj : styles.barSolid,
                  ]}
                />
                <Text style={styles.barLabel}>{bar.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 4. Action Required Section */}
        <View style={styles.actionSection}>
          <View style={styles.actionHeader}>
            <Text style={styles.sectionTitle}>{t.dashboard.urgentActions}</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>2</Text>
            </View>
          </View>

          <View style={styles.actionList}>
            <View style={styles.actionItem}>
              <View style={[styles.actionIconBox, { backgroundColor: '#FDE8E8' }]}>
                <Text style={styles.actionItemIcon}>🏛️</Text>
              </View>
              <View style={styles.actionTextCol}>
                <Text style={styles.actionItemTitle}>{t.dashboard.action1Title}</Text>
                <Text style={styles.actionItemDesc}>{t.dashboard.action1Desc}</Text>
              </View>
            </View>

            <View style={styles.actionItem}>
              <View style={[styles.actionIconBox, { backgroundColor: '#EBF5FB' }]}>
                <Text style={styles.actionItemIcon}>🛡️</Text>
              </View>
              <View style={styles.actionTextCol}>
                <Text style={styles.actionItemTitle}>{t.dashboard.action2Title}</Text>
                <Text style={styles.actionItemDesc}>{t.dashboard.action2Desc}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 5. Financial Health Gauge Card */}
        <View style={styles.healthCard}>
          <View style={styles.healthIconCircle}>
            <Text style={styles.healthIcon}>🛡️</Text>
          </View>
          <Text style={styles.healthTitle}>{t.dashboard.financialHealth}</Text>
          <View style={styles.healthStatusPill}>
            <Text style={styles.healthStatusText}>⚠️ {t.dashboard.healthAtRisk}</Text>
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

  // 1. Urgent Banner
  urgentBanner: {
    backgroundColor: '#FBECEE',
    borderWidth: 1,
    borderColor: '#F5C6CB',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  urgentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  alertIconBox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertIcon: { fontSize: 16 },
  urgentTitle: {
    ...Typography.headlineSm,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    flex: 1,
  },
  bannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  topUpBtn: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  topUpText: {
    color: Colors.onPrimary,
    fontWeight: '700',
    fontSize: 12,
  },

  // 2. Available Balance
  balanceCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '30',
  },
  balanceLeft: { gap: 4 },
  balanceLabel: {
    ...Typography.labelSm,
    fontSize: 12,
    color: Colors.textWarmGray,
    fontWeight: '600',
  },
  balanceAmount: {
    ...Typography.headlineLg,
    fontSize: 32,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  savingsPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryContainer,
    marginTop: 2,
  },
  bankIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F3F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankIcon: { fontSize: 20 },

  // 3. Forecast Chart
  forecastCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '30',
  },
  forecastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  forecastTitle: {
    ...Typography.headlineSm,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 130,
    paddingTop: 10,
  },
  barCol: {
    alignItems: 'center',
    gap: 6,
    width: 40,
  },
  barFill: {
    width: 24,
    borderRadius: 4,
  },
  barSolid: {
    backgroundColor: '#D1828E',
  },
  barProj: {
    backgroundColor: '#A61C2E',
  },
  barLabel: {
    fontSize: 11,
    color: Colors.textWarmGray,
    fontWeight: '500',
  },

  // 4. Action Required
  actionSection: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '30',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    ...Typography.headlineSm,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  countBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: Colors.onPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  actionList: { gap: Spacing.md },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant + '20',
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionItemIcon: { fontSize: 16 },
  actionTextCol: { flex: 1, gap: 2 },
  actionItemTitle: {
    ...Typography.labelLg,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  actionItemDesc: {
    ...Typography.bodyMd,
    fontSize: 12,
    color: Colors.textWarmGray,
  },

  // 5. Financial Health
  healthCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '30',
    marginBottom: Spacing.xl,
  },
  healthIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  healthIcon: { fontSize: 24 },
  healthTitle: {
    ...Typography.headlineSm,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  healthStatusPill: {
    backgroundColor: '#FDE8E8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  healthStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
});

export default DashboardScreen;
