/**
 * SchemeDetailScreen — Detailed personalized scheme elaboration dossier.
 * Fetches criteria breakdown, document checklist, steps, and verified official portal URL.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SchemesStackParamList } from '../../navigation/MainNavigator';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { useTranslation } from '../../i18n';
import { schemeService, SchemeElaborationItem } from '../../services/schemeService';

type Props = NativeStackScreenProps<SchemesStackParamList, 'SchemeDetail'>;

const SchemeDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { schemeId, schemeName } = route.params;
  const { t, language } = useTranslation();

  const [elaboration, setElaboration] = useState<SchemeElaborationItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchElaboration = async () => {
      setLoading(true);
      try {
        const data = await schemeService.elaborateScheme(
          schemeId,
          undefined,
          undefined,
          language
        );
        if (isMounted) {
          setElaboration(data);
        }
      } catch (err) {
        console.error('Failed to elaborate scheme:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchElaboration();
    return () => {
      isMounted = false;
    };
  }, [schemeId, language]);

  const handleOpenPortal = () => {
    if (elaboration?.official_portal_url) {
      Linking.openURL(elaboration.official_portal_url).catch((err) =>
        console.error('Failed to open official portal:', err)
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.appBarTitle} numberOfLines={1}>
          {schemeName || elaboration?.scheme_name || 'Scheme Details'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Generating personalized dossier...</Text>
        </View>
      ) : elaboration ? (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header Card */}
          <View style={styles.card}>
            <View style={styles.categoryRow}>
              <Text style={styles.categoryBadge}>
                {elaboration.category?.toUpperCase().replace('_', ' ')}
              </Text>
              <Text style={styles.freshnessBadge}>{elaboration.data_freshness || '✓ Verified'}</Text>
            </View>

            <Text style={styles.schemeTitle}>{elaboration.scheme_name}</Text>
            <Text style={styles.ministryText}>Ministry / Authority: {elaboration.ministry}</Text>

            {/* Match Score Banner */}
            <View style={styles.scoreBanner}>
              <View>
                <Text style={styles.scoreValue}>{elaboration.match_score_pct}%</Text>
                <Text style={styles.scoreLabel}>Profile Match Score</Text>
              </View>
              <View style={[styles.statusTag, elaboration.eligible ? styles.statusEligible : styles.statusIneligible]}>
                <Text style={[styles.statusTagText, elaboration.eligible ? styles.textEligible : styles.textIneligible]}>
                  {elaboration.eligible ? '✓ Eligible' : '✗ Action Required'}
                </Text>
              </View>
            </View>
          </View>

          {/* Budget Affordability Note */}
          {elaboration.budget_affordability_note && (
            <View style={styles.budgetCard}>
              <Text style={styles.sectionHeaderTitle}>💡 Budget Agent Affordability</Text>
              <Text style={styles.budgetNoteText}>{elaboration.budget_affordability_note}</Text>
            </View>
          )}

          {/* Eligibility Criteria Breakdown */}
          {elaboration.criteria_breakdown && elaboration.criteria_breakdown.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionHeaderTitle}>📋 Criteria Breakdown</Text>
              <View style={styles.criteriaContainer}>
                {elaboration.criteria_breakdown.map((item, idx) => (
                  <View key={idx} style={[styles.criteriaRow, item.met ? styles.criteriaMet : styles.criteriaUnmet]}>
                    <Text style={styles.criteriaIcon}>{item.met ? '✓' : '✗'}</Text>
                    <Text style={[styles.criteriaText, item.met ? styles.textMet : styles.textUnmet]}>
                      {item.criterion}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Required Documents Checklist */}
          {elaboration.required_documents && elaboration.required_documents.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionHeaderTitle}>📑 Required Documents Checklist</Text>
              <View style={styles.docsList}>
                {elaboration.required_documents.map((doc, idx) => {
                  const name = typeof doc === 'string' ? doc : doc.name;
                  const purpose = typeof doc === 'object' ? doc.purpose : null;
                  return (
                    <View key={idx} style={styles.docItem}>
                      <Text style={styles.docCheck}>✓</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.docName}>{name}</Text>
                        {purpose && <Text style={styles.docPurpose}>{purpose}</Text>}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Step-by-Step Application Guide */}
          {elaboration.step_by_step_process && elaboration.step_by_step_process.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionHeaderTitle}>🚀 Step-by-Step Application Guide</Text>
              <View style={styles.stepsContainer}>
                {elaboration.step_by_step_process.map((step, idx) => (
                  <View key={idx} style={styles.stepItem}>
                    <View style={styles.stepNumberBadge}>
                      <Text style={styles.stepNumberText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Key Benefits */}
          {elaboration.benefits && elaboration.benefits.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionHeaderTitle}>✨ Key Benefits</Text>
              {elaboration.benefits.map((benefit, idx) => (
                <Text key={idx} style={styles.benefitItem}>
                  • {benefit}
                </Text>
              ))}
            </View>
          )}

          {/* Official Portal Action Button */}
          {elaboration.official_portal_url && (
            <TouchableOpacity style={styles.cta} onPress={handleOpenPortal} activeOpacity={0.85}>
              <Text style={styles.ctaText}>🔗 {t.schemes.applyNow || 'Apply on Official Portal'}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      ) : (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Scheme details unavailable.</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  appBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant + '40',
    backgroundColor: Colors.surface,
  },
  backBtn: { padding: Spacing.sm, marginRight: Spacing.xs },
  backIcon: { fontSize: 22, color: Colors.onSurface, fontWeight: '700' },
  appBarTitle: { ...Typography.headlineSm, fontSize: 17, color: Colors.onSurface, flex: 1, fontWeight: '700' },
  container: { padding: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.md },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  loadingText: { marginTop: Spacing.sm, fontSize: 13, color: Colors.textWarmGray },
  emptyText: { fontSize: 14, color: Colors.textWarmGray },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '30',
    gap: Spacing.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    backgroundColor: '#FDECEE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    letterSpacing: 0.5,
  },
  freshnessBadge: {
    fontSize: 11,
    color: '#1E824C',
    fontWeight: '600',
  },
  schemeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.onSurface,
    lineHeight: 26,
    marginTop: 2,
  },
  ministryText: {
    fontSize: 12,
    color: Colors.textWarmGray,
  },
  scoreBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '30',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
  },
  scoreLabel: {
    fontSize: 11,
    color: Colors.textWarmGray,
    fontWeight: '600',
  },
  statusTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusEligible: { backgroundColor: '#E8F8EE' },
  statusIneligible: { backgroundColor: '#FBECEE' },
  statusTagText: { fontSize: 12, fontWeight: '700' },
  textEligible: { color: '#1E824C' },
  textIneligible: { color: Colors.primary },
  budgetCard: {
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
    marginBottom: 4,
  },
  budgetNoteText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
  criteriaContainer: {
    gap: 6,
  },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 8,
  },
  criteriaMet: { backgroundColor: '#E8F8EE' },
  criteriaUnmet: { backgroundColor: '#FBECEE' },
  criteriaIcon: { fontSize: 14, fontWeight: '700' },
  criteriaText: { fontSize: 12, flex: 1, lineHeight: 16 },
  textMet: { color: '#1E824C', fontWeight: '500' },
  textUnmet: { color: Colors.primary, fontWeight: '500' },
  docsList: {
    gap: 8,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
  },
  docCheck: { fontSize: 13, color: '#1E824C', fontWeight: '700', marginTop: 1 },
  docName: { fontSize: 13, fontWeight: '600', color: Colors.onSurface },
  docPurpose: { fontSize: 11, color: Colors.textWarmGray },
  stepsContainer: {
    gap: 10,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  stepText: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    flex: 1,
    lineHeight: 18,
  },
  benefitItem: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
  },
  cta: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.xs,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: { ...Typography.labelLg, color: Colors.onPrimary, fontWeight: '700', fontSize: 15 },
});

export default SchemeDetailScreen;
