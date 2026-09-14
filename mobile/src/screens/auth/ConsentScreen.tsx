/**
 * ConsentScreen — Step 4 of 4 Onboarding
 * Granular consent toggles with single-language text and robust login transition.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Consent'>;

const ConsentScreen: React.FC<Props> = ({ route, navigation }) => {
  const { profile } = route.params;
  const { completeOnboarding } = useAuth();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    txData: true,
    schemeEligibility: true,
    fraudDetection: true,
    notifications: false,
    monthlyReport: false,
  });

  const toggleSwitch = (key: string) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleStart = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await completeOnboarding({ ...profile, consents: toggles });
    } finally {
      setIsSubmitting(false);
    }
  };

  const consentItems = [
    {
      id: 'txData',
      title: t.consent.txTitle,
      desc: t.consent.txDesc,
      enabled: toggles.txData,
    },
    {
      id: 'schemeEligibility',
      title: t.consent.schemeTitle,
      desc: t.consent.schemeDesc,
      enabled: toggles.schemeEligibility,
    },
    {
      id: 'fraudDetection',
      title: t.consent.fraudTitle,
      desc: t.consent.fraudDesc,
      enabled: toggles.fraudDetection,
    },
    {
      id: 'notifications',
      title: t.consent.notifTitle,
      desc: t.consent.notifDesc,
      enabled: toggles.notifications,
    },
    {
      id: 'monthlyReport',
      title: t.consent.reportTitle,
      desc: t.consent.reportDesc,
      enabled: toggles.monthlyReport,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.stepRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepLabel}>{t.common.stepOf} 4 / 4</Text>
            <View style={styles.dots}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={[styles.dot, i === 3 && styles.dotActive]} />
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.title}>{t.consent.title}</Text>
        <Text style={styles.subtitle}>{t.consent.subtitle}</Text>

        <View style={styles.toggleList}>
          {consentItems.map((item) => (
            <View key={item.id} style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>{item.title}</Text>
                <Text style={styles.toggleDesc}>{item.desc}</Text>
              </View>
              <Switch
                value={item.enabled}
                onValueChange={() => toggleSwitch(item.id)}
                trackColor={{ false: Colors.surfaceVariant, true: Colors.primaryContainer }}
                thumbColor={Colors.surfaceContainerLowest}
              />
            </View>
          ))}
        </View>

        <View style={styles.footerBlock}>
          <TouchableOpacity
            style={[styles.cta, isSubmitting && styles.ctaDisabled]}
            onPress={handleStart}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.onPrimary} size="small" />
            ) : (
              <Text style={styles.ctaText}>{t.consent.getStartedBtn}</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.footerNote}>{t.consent.footerNote}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.backgroundOffWhite },
  container: { flexGrow: 1, padding: Spacing.lg },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  backBtn: { padding: Spacing.sm, marginLeft: -Spacing.sm },
  backIcon: { fontSize: 24, color: Colors.onSurface },
  stepIndicator: { alignItems: 'flex-end' },
  stepLabel: { ...Typography.labelSm, color: Colors.textWarmGray, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 16, height: 4, borderRadius: 2, backgroundColor: Colors.surfaceVariant },
  dotActive: { backgroundColor: Colors.vividRed },
  title: { ...Typography.headlineSm, fontSize: 22, color: Colors.onSurface, fontWeight: '700', marginBottom: 4 },
  subtitle: { ...Typography.bodyMd, fontSize: 13, color: Colors.textWarmGray, marginBottom: Spacing.xl },
  toggleList: { gap: Spacing.lg, marginBottom: Spacing.xl },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    gap: Spacing.md,
  },
  toggleInfo: { flex: 1 },
  toggleTitle: { ...Typography.labelLg, fontSize: 15, color: Colors.onSurface, fontWeight: '600', marginBottom: 2 },
  toggleDesc: { ...Typography.bodyMd, fontSize: 12, color: Colors.textWarmGray },
  footerBlock: { marginTop: 'auto', paddingTop: Spacing.lg },
  cta: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  ctaDisabled: {
    opacity: 0.7,
  },
  ctaText: { ...Typography.labelLg, color: Colors.onPrimary, fontSize: 16, fontWeight: '700' },
  footerNote: { ...Typography.labelSm, fontSize: 12, color: Colors.textWarmGray, textAlign: 'center' },
});

export default ConsentScreen;
