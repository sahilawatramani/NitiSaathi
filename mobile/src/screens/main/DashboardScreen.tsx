/**
 * DashboardScreen — Main home screen showing budget summary, nudges, and goals.
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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList } from '../../navigation/MainNavigator';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { analyticsService, BudgetState } from '../../services/analyticsService';
import { nudgeService, NudgeLog } from '../../services/nudgeService';
import { goalsService, Goal } from '../../services/goalsService';
import api from '../../services/api';

type Props = NativeStackScreenProps<MainTabParamList, 'HomeTab'>;

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [budgetState, setBudgetState] = useState<BudgetState | null>(null);
  const [nudges, setNudges] = useState<NudgeLog[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [bState, nList, gList] = await Promise.all([
        analyticsService.getBudgetState(),
        nudgeService.list(),
        goalsService.list(),
      ]);
      console.log('Dashboard API responses:', { bState, nList: nList.slice(0, 3), gList });
      setBudgetState(bState);
      setNudges(nList.slice(0, 3));
      setGoals(gList.filter((g) => g.is_active).slice(0, 2));
    } catch (error) {
      console.log('Error fetching dashboard data:', error);
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

  // Fallback defaults if API fails
  const balance = budgetState?.closing_balance ?? 0;
  const income = budgetState?.predicted_next_week_income ?? 0;
  const spend = budgetState?.goal_progress?.reduce((acc, g) => acc + g.saved, 0) ?? 0;
  const persona = budgetState?.financial_persona ?? 'Saver';
  const urgentNudges = nudges.filter((n) => n.priority === 'urgent');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* App Bar */}
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>होम / Home</Text>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={async () => {
            try {
              await api.post('/insights/recalculate');
              onRefresh();
            } catch {}
          }}
        >
          <Text style={styles.icon}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Urgent Banner */}
        {budgetState?.low_balance_flag && (
          <View style={[styles.banner, styles.bannerUrgent]}>
            <Text style={styles.bannerIcon}>⚠️</Text>
            <Text style={styles.bannerText}>Low balance warning for auto-debits</Text>
          </View>
        )}
        {!budgetState?.low_balance_flag && (
          <View style={styles.banner}>
            <Text style={styles.bannerIcon}>✅</Text>
            <Text style={styles.bannerText}>सब कुछ ठीक है / Everything looks good</Text>
          </View>
        )}

        {/* Balance Card */}
        <View style={styles.card}>
          <View style={styles.balanceHeader}>
            <View>
              <Text style={styles.label}>AVAILABLE BALANCE</Text>
              <Text style={styles.balanceText}>₹{balance}</Text>
            </View>
            <View style={styles.balanceIconBg}>
              <Text style={styles.balanceIcon}>💰</Text>
            </View>
          </View>
          <View style={styles.progressRow}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.min((balance / 6400) * 100, 100)}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {Math.round((balance / 6400) * 100)}% of recommended monthly buffer (Goal: ₹6,400)
            </Text>
          </View>

          {/* Simple Forecast Stats */}
          <View style={styles.forecastSection}>
            <Text style={styles.sectionTitle}>Income Forecast</Text>
            <View style={styles.statsRow}>
              <View>
                <Text style={styles.label}>PREDICTED INCOME</Text>
                <Text style={styles.statIncome}>₹{income}</Text>
              </View>
              <View>
                <Text style={styles.label}>PREDICTED SPEND</Text>
                <Text style={styles.statSpend}>₹{spend}</Text>
              </View>
            </View>
            <View style={styles.chartPlaceholder}>
              <Text style={styles.chartText}>[Chart visualization]</Text>
            </View>
          </View>
        </View>

        {/* Goals */}
        <View style={styles.goalsRow}>
          {goals.length === 0 ? (
            <View style={[styles.card, { flex: 1 }]}>
              <Text style={styles.emptyText}>No active goals. Add one from the Budget tab.</Text>
            </View>
          ) : (
            goals.map((goal) => (
              <View key={goal.id} style={[styles.card, styles.goalCard]}>
                <View style={styles.goalIconBg}>
                  <Text style={styles.goalIcon}>🎯</Text>
                </View>
                <Text style={styles.goalTitle} numberOfLines={1}>{goal.name}</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${Math.min(goal.progress_pct, 100)}%` }]} />
                </View>
                <View style={styles.goalStats}>
                  <Text style={styles.goalStatText}>₹{goal.saved_amount.toLocaleString('en-IN')} saved</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Nudges */}
        <View style={styles.card}>
          <View style={styles.nudgesHeader}>
            <Text style={styles.sectionTitle}>Action Required</Text>
            {urgentNudges.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{urgentNudges.length}</Text>
              </View>
            )}
          </View>

          {nudges.length === 0 ? (
            <Text style={styles.emptyText}>No notifications at this time.</Text>
          ) : (
            nudges.map((nudge) => (
              <TouchableOpacity key={nudge.id} style={styles.nudgeItem}>
                <View style={styles.nudgeIconBg}>
                  <Text style={styles.nudgeIcon}>🔔</Text>
                </View>
                <View style={styles.nudgeContent}>
                  <Text style={styles.nudgeTitle}>{nudge.nudge_type.replace('_', ' ')}</Text>
                  <Text style={styles.nudgeDesc} numberOfLines={2}>
                    {nudge.message_hi || nudge.message_en}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Persona Indicator */}
        <View style={styles.personaCard}>
          <View style={styles.personaIconWrap}>
            <Text style={styles.personaIcon}>📈</Text>
          </View>
          <Text style={styles.personaTitle}>Financial Health</Text>
          <View style={styles.personaBadge}>
            <Text style={styles.personaBadgeText}>{persona}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  appBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
  },
  appBarTitle: { ...Typography.headlineSm, color: Colors.onSurface },
  iconBtn: { padding: Spacing.sm },
  icon: { fontSize: 24, color: Colors.onSurfaceVariant },
  container: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.tertiaryFixed}40`, // approx 30% opacity
    borderLeftWidth: 4,
    borderLeftColor: Colors.tertiary,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  bannerUrgent: {
    backgroundColor: `${Colors.errorContainer}80`,
    borderLeftColor: Colors.error,
  },
  bannerIcon: { fontSize: 20, marginRight: Spacing.sm },
  bannerText: { ...Typography.labelLg, color: Colors.onTertiaryFixedVariant },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: Colors.onBackground,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: `${Colors.outlineVariant}50`,
  },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  label: { ...Typography.labelSm, color: Colors.textWarmGray, marginBottom: 4 },
  balanceText: { ...Typography.displayLg, color: Colors.primaryContainer },
  balanceIconBg: { backgroundColor: Colors.surfaceContainer, padding: Spacing.sm, borderRadius: 24 },
  balanceIcon: { fontSize: 24 },
  progressRow: { marginBottom: Spacing.lg },
  progressBarBg: { height: 8, backgroundColor: Colors.surfaceContainerHigh, borderRadius: 4, marginBottom: 4 },
  progressBarFill: { height: 8, backgroundColor: Colors.tertiary, borderRadius: 4 },
  progressText: { ...Typography.labelSm, color: Colors.textWarmGray },
  forecastSection: { borderTopWidth: 1, borderTopColor: Colors.surfaceContainerHigh, paddingTop: Spacing.lg },
  sectionTitle: { ...Typography.headlineSm, color: Colors.onSurface, marginBottom: Spacing.md },
  statsRow: { flexDirection: 'row', gap: Spacing.xl, marginBottom: Spacing.lg },
  statIncome: { ...Typography.headlineSm, color: Colors.tertiary },
  statSpend: { ...Typography.headlineSm, color: Colors.primary },
  chartPlaceholder: { height: 160, backgroundColor: Colors.surfaceContainerLow, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  chartText: { ...Typography.bodyMd, color: Colors.textWarmGray },
  goalsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  goalCard: { flex: 1, padding: Spacing.md, marginBottom: 0 },
  goalIconBg: { backgroundColor: `${Colors.tertiaryFixed}40`, alignSelf: 'flex-start', padding: Spacing.xs, borderRadius: BorderRadius.md, marginBottom: Spacing.sm },
  goalIcon: { fontSize: 20 },
  goalTitle: { ...Typography.headlineSm, fontSize: 16, color: Colors.onSurface, marginBottom: Spacing.sm },
  goalStats: { marginTop: Spacing.xs },
  goalStatText: { ...Typography.labelSm, color: Colors.textWarmGray },
  nudgesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  badge: { backgroundColor: Colors.error, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeText: { ...Typography.labelSm, color: Colors.white, fontWeight: 'bold' },
  emptyText: { ...Typography.bodyMd, color: Colors.textWarmGray, textAlign: 'center', padding: Spacing.md },
  nudgeItem: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${Colors.outlineVariant}50`,
    marginBottom: Spacing.sm,
    alignItems: 'center',
    gap: Spacing.md,
  },
  nudgeIconBg: { backgroundColor: `${Colors.error}20`, padding: Spacing.xs, borderRadius: 20 },
  nudgeIcon: { fontSize: 20 },
  nudgeContent: { flex: 1 },
  nudgeTitle: { ...Typography.labelLg, color: Colors.onSurface, textTransform: 'capitalize' },
  nudgeDesc: { ...Typography.bodyMd, fontSize: 14, color: Colors.textWarmGray },
  personaCard: { backgroundColor: Colors.backgroundOffWhite, borderRadius: BorderRadius.xl, padding: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: `${Colors.outlineVariant}50` },
  personaIconWrap: { width: 64, height: 64, backgroundColor: Colors.surface, borderRadius: 32, borderWidth: 2, borderColor: Colors.tertiary, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  personaIcon: { fontSize: 32 },
  personaTitle: { ...Typography.headlineSm, color: Colors.onSurface, marginBottom: Spacing.xs },
  personaBadge: { backgroundColor: `${Colors.tertiaryFixed}40`, paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: 16, marginBottom: Spacing.md },
  personaBadgeText: { ...Typography.labelLg, color: Colors.tertiary },
  personaDesc: { ...Typography.bodyMd, fontSize: 14, color: Colors.textWarmGray, textAlign: 'center' },
});

export default DashboardScreen;
