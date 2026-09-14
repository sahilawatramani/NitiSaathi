/**
 * DashboardScreen — Main home screen matching video reference.
 * Includes Urgent Low-Balance Banner, Available Balance, WMA Income Forecast, Action Required, and Financial Health.
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
import { analyticsService, BudgetState } from '../../services/analyticsService';

const DashboardScreen: React.FC = () => {
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
      <AppHeader title="गृह / Home" />

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
            <Text style={styles.urgentTitle}>बैलेंस कम है / Low balance</Text>
          </View>

          <Text style={styles.urgentMessage}>
            आपका PMSBY debit 9 दिनों में है, बैलेंस ₹10 है / Your PMSBY debit is in 9 days, balance is ₹10. Please top up to avoid policy lapse.
          </Text>

          <View style={styles.bannerActions}>
            <TouchableOpacity style={styles.topUpBtn} activeOpacity={0.85}>
              <Text style={styles.topUpText}>Top Up Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.remindBtn} activeOpacity={0.85}>
              <Text style={styles.remindText}>Remind Me</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Available Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceLeft}>
            <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
            <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
          </View>
          <View style={styles.bankIconBox}>
            <Text style={styles.bankIcon}>🏛️</Text>
          </View>
        </View>

        {/* 3. Income Forecast Chart Card */}
        <View style={styles.forecastCard}>
          <View style={styles.forecastHeader}>
            <Text style={styles.forecastTitle}>Income Forecast</Text>
            <View style={styles.pillFilter}>
              <Text style={styles.pillText}>Last 4 Weeks</Text>
            </View>
          </View>

          {/* Simple Visual Bar Chart */}
          <View style={styles.chartContainer}>
            {[
              { label: 'W1', height: 45 },
              { label: 'W3', height: 75 },
              { label: 'W5', height: 60 },
              { label: 'W7', height: 90 },
              { label: 'Proj', height: 110, isProj: true },
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
            <Text style={styles.sectionTitle}>Action Required</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>3</Text>
            </View>
          </View>

          <View style={styles.actionList}>
            <View style={styles.actionItem}>
              <View style={[styles.actionIconBox, { backgroundColor: '#FDE8E8' }]}>
                <Text style={styles.actionItemIcon}>🏛️</Text>
              </View>
              <View style={styles.actionTextCol}>
                <Text style={styles.actionItemTitle}>Low Balance Warning</Text>
                <Text style={styles.actionItemDesc}>
                  Your balance is critically low for upcoming auto-debits.
                </Text>
              </View>
              <Text style={styles.actionTime}>Just now</Text>
            </View>

            <View style={styles.actionItem}>
              <View style={[styles.actionIconBox, { backgroundColor: '#FDF2E9' }]}>
                <Text style={styles.actionItemIcon}>📉</Text>
              </View>
              <View style={styles.actionTextCol}>
                <Text style={styles.actionItemTitle}>Earnings Dip</Text>
                <Text style={styles.actionItemDesc}>
                  Earnings down 12% compared to last week
                </Text>
              </View>
              <Text style={styles.actionTime}>2 hours ago</Text>
            </View>

            <View style={styles.actionItem}>
              <View style={[styles.actionIconBox, { backgroundColor: '#EBF5FB' }]}>
                <Text style={styles.actionItemIcon}>🛡️</Text>
              </View>
              <View style={styles.actionTextCol}>
                <Text style={styles.actionItemTitle}>Scheme Eligible</Text>
                <Text style={styles.actionItemDesc}>
                  You qualify for PMJJBY based on your profile.
                </Text>
              </View>
              <Text style={styles.actionTime}>Yesterday</Text>
            </View>
          </View>
        </View>

        {/* 5. Financial Health Gauge Card */}
        <View style={styles.healthCard}>
          <View style={styles.healthIconCircle}>
            <Text style={styles.healthIcon}>🛡️</Text>
          </View>
          <Text style={styles.healthTitle}>Financial Health</Text>
          <View style={styles.healthStatusPill}>
            <Text style={styles.healthStatusText}>⚠️ At Risk</Text>
          </View>
          <Text style={styles.healthDesc}>
            Immediate attention required to stabilize savings and secure policies.
          </Text>
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
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  urgentMessage: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: '#601F28',
    lineHeight: 18,
  },
  bannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  topUpBtn: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  topUpText: {
    color: Colors.onPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  remindBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
  },
  remindText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 13,
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
    fontSize: 11,
    color: Colors.textWarmGray,
    letterSpacing: 0.5,
  },
  balanceAmount: {
    ...Typography.headlineLg,
    fontSize: 32,
    fontWeight: '800',
    color: Colors.onSurface,
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
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  pillFilter: {
    backgroundColor: '#F0EDE9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textWarmGray,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 140,
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
    backgroundColor: '#C56070',
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
    fontSize: 16,
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
  actionTime: {
    fontSize: 10,
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
  healthDesc: {
    ...Typography.bodyMd,
    fontSize: 12,
    color: Colors.textWarmGray,
    textAlign: 'center',
    lineHeight: 17,
  },
});

export default DashboardScreen;
