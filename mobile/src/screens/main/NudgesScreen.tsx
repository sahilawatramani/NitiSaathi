/**
 * NudgesScreen — Notification & Behavioral nudges feed connected to Nudge Agent API.
 * Features live feed loading, filter tabs, interactive 3-way feedback, and action CTAs.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { useTranslation } from '../../i18n';
import { nudgeService, NudgeItem } from '../../services/nudgeService';

type FilterTab = 'all' | 'urgent' | 'milestone';

const NudgesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t, language } = useTranslation();

  const [nudges, setNudges] = useState<NudgeItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<FilterTab>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadNudges = useCallback(async () => {
    try {
      const data = await nudgeService.list('1', language);
      setNudges(data);
    } catch (err) {
      console.error('Failed to load nudges:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [language]);

  useEffect(() => {
    loadNudges();
  }, [loadNudges]);

  const onRefresh = () => {
    setRefreshing(true);
    loadNudges();
  };

  const handleFeedback = async (
    nudgeId: string,
    rating: 'useful' | 'not_useful' | 'harmful',
    triggerId: string = 'low_balance_before_debit'
  ) => {
    // Optimistic UI update
    setNudges((prev) =>
      prev.map((n) => (n.id === nudgeId ? { ...n, feedback: rating } : n))
    );

    if (rating === 'harmful') {
      showToast(
        language === 'hi'
          ? 'सूचना बंद कर दी गई है (Suppressed)।'
          : language === 'mr'
          ? 'सूचना बंद करण्यात आली आहे.'
          : 'Trigger suppressed. You will no longer receive this nudge.'
      );
      // Remove from list after brief delay
      setTimeout(() => {
        setNudges((prev) => prev.filter((n) => n.id !== nudgeId));
      }, 800);
    } else if (rating === 'useful') {
      showToast(
        language === 'hi'
          ? 'धन्यवाद! आपकी प्रतिक्रिया दर्ज की गई।'
          : language === 'mr'
          ? 'धन्यवाद! तुमचा प्रतिसाद नोंदवला गेला.'
          : 'Thank you! Feedback recorded as helpful.'
      );
    } else {
      showToast(
        language === 'hi'
          ? 'प्रतिक्रिया दर्ज की गई।'
          : language === 'mr'
          ? 'प्रतिसाद नोंदवला गेला.'
          : 'Feedback recorded.'
      );
    }

    try {
      await nudgeService.postFeedback(nudgeId, rating, triggerId, '1');
    } catch (err) {
      console.error('Feedback submission error:', err);
    }
  };

  const handleDismiss = (nudgeId: string) => {
    setNudges((prev) => prev.filter((n) => n.id !== nudgeId));
  };

  const handleAction = (nudge: NudgeItem) => {
    if (nudge.action_url?.includes('schemes/pmsby') || nudge.trigger_id?.includes('pmsby')) {
      navigation.navigate('SchemesTab', {
        screen: 'SchemeDetail',
        params: { schemeId: 'pmsby', schemeName: 'PMSBY Insurance' },
      });
    } else if (nudge.action_url?.includes('budget') || nudge.trigger_id?.includes('balance')) {
      navigation.navigate('BudgetTab');
    } else if (nudge.action_url?.includes('goals') || nudge.trigger_id?.includes('goal') || nudge.trigger_id?.includes('milestone')) {
      navigation.navigate('BudgetTab');
    } else {
      navigation.navigate('HomeTab');
    }
  };

  const filteredNudges = nudges.filter((n) => {
    if (selectedTab === 'urgent') return n.priority === 'urgent';
    if (selectedTab === 'milestone') return n.priority === 'milestone';
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title={t.nudges.title} showBack />

      {/* Toast Notification */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, selectedTab === 'all' && styles.tabBtnActive]}
          onPress={() => setSelectedTab('all')}
        >
          <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
            {language === 'hi' ? 'सभी सूचनाएं' : language === 'mr' ? 'सर्व सूचना' : 'All Nudges'} ({nudges.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, selectedTab === 'urgent' && styles.tabBtnActive]}
          onPress={() => setSelectedTab('urgent')}
        >
          <Text style={[styles.tabText, selectedTab === 'urgent' && styles.tabTextActive]}>
            🔴 {language === 'hi' ? 'जरूरी अलर्ट' : language === 'mr' ? 'तातडीचे अलर्ट' : 'Urgent Alerts'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, selectedTab === 'milestone' && styles.tabBtnActive]}
          onPress={() => setSelectedTab('milestone')}
        >
          <Text style={[styles.tabText, selectedTab === 'milestone' && styles.tabTextActive]}>
            🟢 {language === 'hi' ? 'उपलब्धियां' : language === 'mr' ? 'टप्पे' : 'Milestones'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading proactive nudges...</Text>
          </View>
        ) : filteredNudges.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>{t.nudges.emptyNudges || 'No active nudges at this time.'}</Text>
            <Text style={styles.emptySubtitle}>
              {language === 'hi'
                ? 'आपका बजट और सुरक्षा कोष सुरक्षित स्थिति में है।'
                : language === 'mr'
                ? 'तुमचे बजेट आणि फंड स्थिर स्थितीत आहे.'
                : 'Your budget and safety cushion are currently on track.'}
            </Text>
          </View>
        ) : (
          <View style={styles.nudgeList}>
            {filteredNudges.map((n) => {
              const isUrgent = n.priority === 'urgent';
              const isMilestone = n.priority === 'milestone';

              return (
                <View
                  key={n.id}
                  style={[
                    styles.nudgeCard,
                    isUrgent && styles.cardUrgent,
                    isMilestone && styles.cardMilestone,
                  ]}
                >
                  {/* Header Badge */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.badgeWrap}>
                      <Text style={styles.badgeDot}>
                        {isUrgent ? '🔴' : isMilestone ? '🟢' : '💡'}
                      </Text>
                      <Text
                        style={[
                          styles.badgeText,
                          isUrgent ? styles.badgeUrgentText : isMilestone ? styles.badgeMilestoneText : styles.badgeAdvisoryText,
                        ]}
                      >
                        {isUrgent
                          ? t.dashboard.urgentActions || 'URGENT ALERT'
                          : isMilestone
                          ? t.common.success || 'MILESTONE'
                          : 'COACHING ADVISORY'}
                      </Text>
                    </View>

                    <Text style={styles.timeTag}>
                      {n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Active'}
                    </Text>
                  </View>

                  {/* Title */}
                  <Text style={styles.nudgeTitle}>{n.title || n.trigger_id.replace('_', ' ').toUpperCase()}</Text>

                  {/* Body */}
                  <Text style={styles.bodyText}>{n.message}</Text>

                  {/* Action CTA Button */}
                  <TouchableOpacity
                    style={[styles.actionBtn, isUrgent ? styles.actionBtnUrgent : styles.actionBtnDefault]}
                    onPress={() => handleAction(n)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.actionBtnText}>
                      {n.action_label || (isUrgent ? 'Take Action →' : 'View Details →')}
                    </Text>
                  </TouchableOpacity>

                  {/* Feedback Row */}
                  <View style={styles.feedbackSection}>
                    <Text style={styles.feedbackLabel}>
                      {language === 'hi' ? 'क्या यह मददगार था?' : language === 'mr' ? 'हे उपयुक्त होते का?' : 'Was this helpful?'}
                    </Text>

                    <View style={styles.feedbackRow}>
                      <TouchableOpacity
                        style={[styles.feedbackBtn, n.feedback === 'useful' && styles.feedbackBtnActiveUseful]}
                        onPress={() => handleFeedback(n.id, 'useful', n.trigger_id)}
                      >
                        <Text style={[styles.feedbackText, n.feedback === 'useful' && styles.feedbackTextActiveUseful]}>
                          👍 {t.nudges.helpful || 'Helpful'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.feedbackBtn, n.feedback === 'not_useful' && styles.feedbackBtnActiveNotUseful]}
                        onPress={() => handleFeedback(n.id, 'not_useful', n.trigger_id)}
                      >
                        <Text style={[styles.feedbackText, n.feedback === 'not_useful' && styles.feedbackTextActiveNotUseful]}>
                          👎 {t.nudges.notHelpful || 'Not Helpful'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.feedbackBtn, n.feedback === 'harmful' && styles.feedbackBtnActiveHarmful]}
                        onPress={() => handleFeedback(n.id, 'harmful', n.trigger_id)}
                      >
                        <Text style={[styles.feedbackText, n.feedback === 'harmful' && styles.feedbackTextActiveHarmful]}>
                          🛑 {language === 'hi' ? 'बंद करें' : language === 'mr' ? 'थांबवा' : 'Mute'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.dismissBtn} onPress={() => handleDismiss(n.id)}>
                        <Text style={styles.dismissText}>{t.nudges.markRead || 'Dismiss'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.backgroundOffWhite },
  container: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  toastContainer: {
    backgroundColor: '#1E293B',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  toastText: { color: '#F8FAFC', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '40',
  },
  tabBtnActive: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  tabTextActive: {
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  centerBox: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingText: { fontSize: 13, color: Colors.textWarmGray },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '30',
    gap: Spacing.xs,
    marginTop: Spacing.lg,
  },
  emptyIcon: { fontSize: 36, marginBottom: Spacing.xs },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.onSurface },
  emptySubtitle: { fontSize: 13, color: Colors.textWarmGray, textAlign: 'center' },
  nudgeList: { gap: Spacing.md },
  nudgeCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '30',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  cardUrgent: {
    borderLeftColor: '#EF4444',
    backgroundColor: '#FFFDFD',
  },
  cardMilestone: {
    borderLeftColor: '#10B981',
    backgroundColor: '#FAFFFD',
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
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeUrgentText: { color: '#EF4444' },
  badgeMilestoneText: { color: '#10B981' },
  badgeAdvisoryText: { color: Colors.primary },
  timeTag: {
    fontSize: 11,
    color: Colors.textWarmGray,
  },
  nudgeTitle: {
    ...Typography.headlineSm,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
    lineHeight: 22,
  },
  bodyText: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurface,
    lineHeight: 19,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  actionBtnUrgent: {
    backgroundColor: '#FBECEE',
  },
  actionBtnDefault: {
    backgroundColor: '#EBF3FE',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  feedbackSection: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant + '20',
    gap: 6,
  },
  feedbackLabel: {
    fontSize: 11,
    color: Colors.textWarmGray,
    fontWeight: '500',
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  feedbackBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '60',
    backgroundColor: Colors.surfaceContainerLowest,
  },
  feedbackBtnActiveUseful: {
    backgroundColor: '#E8F8EE',
    borderColor: '#10B981',
  },
  feedbackBtnActiveNotUseful: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  feedbackBtnActiveHarmful: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  feedbackText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  feedbackTextActiveUseful: { color: '#047857' },
  feedbackTextActiveNotUseful: { color: '#B45309' },
  feedbackTextActiveHarmful: { color: '#B91C1C' },
  dismissBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginLeft: 'auto',
  },
  dismissText: {
    fontSize: 11,
    color: Colors.textWarmGray,
    textDecorationLine: 'underline',
  },
});

export default NudgesScreen;
