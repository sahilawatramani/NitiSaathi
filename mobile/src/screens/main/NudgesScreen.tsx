/**
 * NudgesScreen — Notification & Behavioral nudges feed matching reference design.
 * Pure single-language strings dynamically loaded via useTranslation().
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { useTranslation } from '../../i18n';

interface NudgeCardItem {
  id: string;
  type: 'urgent' | 'milestone';
  title: string;
  body: string;
  feedback?: 'useful' | 'not_useful';
}

const NudgesScreen: React.FC = () => {
  const { t } = useTranslation();

  const [nudges, setNudges] = useState<NudgeCardItem[]>([
    {
      id: '1',
      type: 'urgent',
      title: t.dashboard.action1Title,
      body: t.dashboard.urgentAlert,
    },
    {
      id: '2',
      type: 'milestone',
      title: t.budget.savingsGoal,
      body: t.budget.steadyIncomeCallout,
    },
  ]);

  const handleFeedback = (id: string, fb: 'useful' | 'not_useful') => {
    setNudges((prev) =>
      prev.map((n) => (n.id === id ? { ...n, feedback: fb } : n))
    );
  };

  const handleDismiss = (id: string) => {
    setNudges((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title={t.nudges.title} showBack />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.nudgeList}>
          {nudges.map((n) => (
            <View key={n.id} style={styles.nudgeCard}>
              {/* Header Badge */}
              <View style={styles.cardHeaderRow}>
                <View style={styles.badgeWrap}>
                  <Text style={styles.badgeDot}>
                    {n.type === 'urgent' ? '🔴' : '🟢'}
                  </Text>
                  <Text
                    style={[
                      styles.badgeText,
                      n.type === 'urgent' ? styles.badgeUrgentText : styles.badgeMilestoneText,
                    ]}
                  >
                    {n.type === 'urgent' ? t.dashboard.urgentActions : t.common.success}
                  </Text>
                </View>
              </View>

              {/* Title */}
              <Text style={styles.nudgeTitle}>{n.title}</Text>

              {/* Body */}
              <Text style={styles.bodyText}>{n.body}</Text>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.feedbackBtn, n.feedback === 'useful' && styles.feedbackBtnActive]}
                  onPress={() => handleFeedback(n.id, 'useful')}
                >
                  <Text style={styles.feedbackText}>👍 {t.nudges.helpful}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.feedbackBtn, n.feedback === 'not_useful' && styles.feedbackBtnActive]}
                  onPress={() => handleFeedback(n.id, 'not_useful')}
                >
                  <Text style={styles.feedbackText}>👎 {t.nudges.notHelpful}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dismissBtn}
                  onPress={() => handleDismiss(n.id)}
                >
                  <Text style={styles.dismissText}>{t.nudges.markRead}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.backgroundOffWhite },
  container: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  nudgeList: { gap: Spacing.md },
  nudgeCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '30',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeDot: { fontSize: 10 },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeUrgentText: { color: Colors.primary },
  badgeMilestoneText: { color: '#1E824C' },
  nudgeTitle: {
    ...Typography.headlineSm,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  bodyText: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurface,
    lineHeight: 19,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  feedbackBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '60',
    backgroundColor: Colors.surfaceContainerLowest,
  },
  feedbackBtnActive: {
    backgroundColor: '#FDECEE',
    borderColor: Colors.primaryContainer,
  },
  feedbackText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  dismissBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginLeft: 'auto',
  },
  dismissText: {
    fontSize: 11,
    color: Colors.textWarmGray,
    textDecorationLine: 'underline',
  },
});

export default NudgesScreen;
