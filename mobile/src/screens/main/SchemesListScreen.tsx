/**
 * SchemesListScreen — List of government schemes matching video reference.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { AppHeader } from '../../components/AppHeader';

interface SchemeItem {
  id: string;
  name: string;
  status: 'eligible' | 'needs_info' | 'not_eligible';
  statusLabel: string;
  hasBudgetGuidance?: boolean;
  desc: string;
  verifiedDate?: string;
}

const SCHEMES: SchemeItem[] = [
  {
    id: 'eshram',
    name: 'e-Shram',
    status: 'eligible',
    statusLabel: 'योग्य / Eligible',
    desc: 'National Database for Unorganized Workers offering accidental insurance cover.',
    verifiedDate: '1 जुलाई 2026 / 1 July 2026',
  },
  {
    id: 'pmsym',
    name: 'PM-SYM',
    status: 'needs_info',
    statusLabel: 'अधिक जानकारी चाहिए / Needs more info',
    hasBudgetGuidance: true,
    desc: 'Pradhan Mantri Shram Yogi Maan-dhan. Pension scheme for unorganized workers.',
    verifiedDate: '1 जुलाई 2026 / 1 July 2026',
  },
  {
    id: 'pmsby',
    name: 'PMSBY',
    status: 'eligible',
    statusLabel: 'योग्य / Eligible',
    desc: 'Pradhan Mantri Suraksha Bima Yojana.',
  },
  {
    id: 'pmjjby',
    name: 'PMJJBY',
    status: 'not_eligible',
    statusLabel: 'योग्य नहीं / Not eligible',
    desc: 'Pradhan Mantri Jeevan Jyoti Bima Yojana. Life insurance scheme.',
    verifiedDate: '1 जुलाई 2026 / 1 July 2026',
  },
  {
    id: 'apy',
    name: 'APY',
    status: 'needs_info',
    statusLabel: 'अधिक जानकारी चाहिए / Needs more info',
    hasBudgetGuidance: true,
    desc: 'Atal Pension Yojana. Guaranteed pension scheme for citizens of India.',
    verifiedDate: '1 जुलाई 2026 / 1 July 2026',
  },
  {
    id: 'state_welfare',
    name: 'State Welfare Board',
    status: 'eligible',
    statusLabel: 'योग्य / Eligible',
    desc: 'State-specific welfare board registration and benefits for gig workers.',
  },
];

const SchemesListScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title="योजनाएं / Schemes" />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <Text style={styles.mainTitle}>योजनाएं / Schemes</Text>
          <Text style={styles.subtitle}>
            आपकी जानकारी के आधार पर / Based on your details
          </Text>
        </View>

        <View style={styles.list}>
          {SCHEMES.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={styles.card}
              onPress={() => navigation.navigate('SchemeDetail', { schemeId: s.id, schemeName: s.name })}
              activeOpacity={0.85}
            >
              <View style={styles.cardTopRow}>
                <Text style={styles.schemeName}>{s.name}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    s.status === 'eligible' && styles.badgeEligible,
                    s.status === 'needs_info' && styles.badgeNeedsInfo,
                    s.status === 'not_eligible' && styles.badgeNotEligible,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      s.status === 'eligible' && styles.textEligible,
                      s.status === 'needs_info' && styles.textNeedsInfo,
                      s.status === 'not_eligible' && styles.textNotEligible,
                    ]}
                  >
                    {s.statusLabel}
                  </Text>
                </View>
              </View>

              {/* Optional Budget Guidance Chip */}
              {s.hasBudgetGuidance && (
                <View style={styles.budgetChip}>
                  <Text style={styles.budgetChipText}>
                    💡 बजट सलाह उपलब्ध है / Budget guidance available
                  </Text>
                </View>
              )}

              <Text style={styles.schemeDesc}>{s.desc}</Text>

              {s.verifiedDate && (
                <View style={styles.verifiedRow}>
                  <Text style={styles.verifiedIcon}>✓</Text>
                  <Text style={styles.verifiedText}>
                    अंतिम सत्यापित: {s.verifiedDate}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.backgroundOffWhite },
  container: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  headerBlock: { gap: 2, marginBottom: Spacing.xs },
  mainTitle: {
    ...Typography.headlineSm,
    fontSize: 24,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  subtitle: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.textWarmGray,
  },
  list: { gap: Spacing.md },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '30',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  schemeName: {
    ...Typography.headlineSm,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeEligible: {
    backgroundColor: '#E8F8EE',
  },
  badgeNeedsInfo: {
    backgroundColor: '#F3EFEF',
  },
  badgeNotEligible: {
    backgroundColor: '#FBECEE',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textEligible: { color: '#1E824C' },
  textNeedsInfo: { color: Colors.textWarmGray },
  textNotEligible: { color: Colors.primary },

  budgetChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#FDECEE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 2,
  },
  budgetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  schemeDesc: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  verifiedIcon: {
    fontSize: 12,
    color: '#1E824C',
    fontWeight: '700',
  },
  verifiedText: {
    fontSize: 11,
    color: Colors.textWarmGray,
  },
});

export default SchemesListScreen;
