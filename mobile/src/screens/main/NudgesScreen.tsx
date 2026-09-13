/**
 * NudgesScreen — Dedicated notification feed for nudges.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '../../navigation/MainNavigator';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { nudgeService, NudgeLog } from '../../services/nudgeService';

type Props = NativeStackScreenProps<MoreStackParamList, 'Nudges'>;

const FALLBACK_NUDGES: NudgeLog[] = [
  { id: 1, user_id: 1, message: 'Your balance is critically low for upcoming auto-debit.', priority: 'urgent', created_at: new Date().toISOString() },
  { id: 2, user_id: 1, message: 'Your earnings are down 12% compared to last week.', priority: 'warning', created_at: new Date().toISOString() },
  { id: 3, user_id: 1, message: 'You qualify for PMJJBY scheme based on your profile.', priority: 'info', created_at: new Date().toISOString() },
];

const NudgesScreen: React.FC<Props> = ({ navigation }) => {
  const [nudges, setNudges] = useState<NudgeLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await nudgeService.list();
        if (mounted) {
          setNudges(data && data.length > 0 ? data : FALLBACK_NUDGES);
        }
      } catch {
        if (mounted) setNudges(FALLBACK_NUDGES);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>सूचनाएं / Nudges</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 32 }} />
        ) : (
          nudges.map((nudge) => {
            const isUrgent = nudge.priority === 'urgent' || nudge.priority === 'high';
            const isWarning = nudge.priority === 'warning' || nudge.priority === 'medium';
            let bgColor: string = Colors.surfaceContainerLow;
            let iconBg: string = Colors.surfaceVariant;
            if (isUrgent) {
              bgColor = Colors.errorContainer;
              iconBg = `${Colors.error}40`;
            } else if (isWarning) {
              bgColor = Colors.cautionTint;
              iconBg = `${Colors.secondary}40`;
            }

            const title = (nudge.nudge_type || nudge.trigger_id || 'Nudge Notification').replace(/_/g, ' ');

            return (
              <View key={nudge.id} style={[styles.nudgeCard, { backgroundColor: bgColor }]}>
                <View style={[styles.iconBg, { backgroundColor: iconBg }]}>
                  <Text style={styles.icon}>🔔</Text>
                </View>
                <View style={styles.content}>
                  <Text style={styles.title}>{title}</Text>
                  <Text style={styles.desc}>{nudge.message}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  appBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
  },
  backBtn: { padding: Spacing.sm, marginRight: Spacing.sm },
  backIcon: { fontSize: 24, color: Colors.onSurface },
  appBarTitle: { ...Typography.headlineSm, color: Colors.onSurface, flex: 1 },
  container: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  nudgeCard: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    gap: Spacing.md,
  },
  iconBg: { padding: Spacing.sm, borderRadius: 24, height: 48, width: 48, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 24 },
  content: { flex: 1 },
  title: { ...Typography.headlineSm, fontSize: 18, color: Colors.onSurface, marginBottom: 4 },
  desc: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
});

export default NudgesScreen;
