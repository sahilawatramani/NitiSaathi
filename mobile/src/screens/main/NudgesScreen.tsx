/**
 * NudgesScreen — Notification & Behavioral nudges feed matching video reference.
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

interface NudgeCardItem {
  id: string;
  type: 'urgent' | 'milestone';
  typeLabel: string;
  timeAgo: string;
  title: string;
  hindiText: string;
  englishText: string;
  feedback?: 'useful' | 'not_useful';
}

const INITIAL_NUDGES: NudgeCardItem[] = [
  {
    id: '1',
    type: 'urgent',
    typeLabel: 'Urgent Action Required',
    timeAgo: '2 घंटे पहले / 2 hours ago',
    title: 'PMSBY Insurance Renewal Due',
    hindiText: 'आपका प्रधानमंत्री सुरक्षा बीमा योजना (PMSBY) का प्रीमियम ₹20 कल देय है। कृपया सुनिश्चित करें कि आपके बैंक खाते में पर्याप्त राशि है।',
    englishText: 'Your Pradhan Mantri Suraksha Bima Yojana (PMSBY) premium of ₹20 is due tomorrow. Please ensure you have sufficient balance in your bank account.',
  },
  {
    id: '2',
    type: 'milestone',
    typeLabel: 'Milestone',
    timeAgo: '1 दिन पहले / 1 day ago',
    title: 'Emergency Fund Target Reached',
    hindiText: 'बधाई हो! आपने इस महीने अपने आपातकालीन फंड के लक्ष्य का 50% हासिल कर लिया है। ऐसे ही बचत करते रहें।',
    englishText: "Congratulations! You've reached 50% of your emergency fund goal this month. Keep saving.",
  },
];

const NudgesScreen: React.FC = () => {
  const [nudges, setNudges] = useState<NudgeCardItem[]>(INITIAL_NUDGES);

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
      <AppHeader title="सूचनाएं / Nudges" showBack />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.nudgeList}>
          {nudges.map((n) => (
            <View key={n.id} style={styles.nudgeCard}>
              {/* Header Badge & Time */}
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
                    {n.typeLabel}
                  </Text>
                </View>
                <Text style={styles.timeText}>{n.timeAgo}</Text>
              </View>

              {/* Title */}
              <Text style={styles.nudgeTitle}>{n.title}</Text>

              {/* Bilingual Message */}
              <Text style={styles.hindiBody}>{n.hindiText}</Text>
              <Text style={styles.englishBody}>{n.englishText}</Text>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.feedbackBtn, n.feedback === 'useful' && styles.feedbackBtnActive]}
                  onPress={() => handleFeedback(n.id, 'useful')}
                >
                  <Text style={styles.feedbackText}>👍 उपयोगी / Useful</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.feedbackBtn, n.feedback === 'not_useful' && styles.feedbackBtnActive]}
                  onPress={() => handleFeedback(n.id, 'not_useful')}
                >
                  <Text style={styles.feedbackText}>👎 उपयोगी नहीं / Not useful</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dismissBtn}
                  onPress={() => handleDismiss(n.id)}
                >
                  <Text style={styles.dismissText}>यह हटाएं</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Success Banner at bottom */}
        <View style={styles.successBanner}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successText}>
            आपने अपना लक्ष्य बनाए रखा / You stayed on track with your goal.
          </Text>
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
  timeText: {
    fontSize: 11,
    color: Colors.textWarmGray,
  },
  nudgeTitle: {
    ...Typography.headlineSm,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  hindiBody: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurface,
    lineHeight: 19,
  },
  englishBody: {
    ...Typography.bodyMd,
    fontSize: 12,
    color: Colors.textWarmGray,
    lineHeight: 17,
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

  // Success Banner
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8EE',
    borderWidth: 1,
    borderColor: '#C3E6CB',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  successIcon: {
    fontSize: 14,
    color: '#1E824C',
    fontWeight: '700',
  },
  successText: {
    fontSize: 12,
    color: '#155724',
    fontWeight: '600',
    flex: 1,
  },
});

export default NudgesScreen;
