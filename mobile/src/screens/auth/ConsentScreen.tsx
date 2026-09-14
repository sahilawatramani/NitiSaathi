/**
 * ConsentScreen — Step 4 of 4 Onboarding
 * Granular consent toggles matching video reference.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Consent'>;

interface ConsentItem {
  id: string;
  title: string;
  desc: string;
  enabled: boolean;
}

const ConsentScreen: React.FC<Props> = ({ route, navigation }) => {
  const { profile } = route.params;
  const { login } = useAuth();

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
    try {
      // Create session or login demo user to access dashboard immediately
      await login('rajesh@nitisaathi.in', 'password123');
    } catch {
      // If offline or mock mode, AuthContext fallback takes user into main app
    }
  };

  const CONSENT_ITEMS: ConsentItem[] = [
    {
      id: 'txData',
      title: 'लेन-देन जानकारी / Transaction data',
      desc: 'आपकी income और खर्च ट्रैक करने के लिए',
      enabled: toggles.txData,
    },
    {
      id: 'schemeEligibility',
      title: 'योजना पात्रता जांच / Scheme eligibility check',
      desc: 'सही सरकारी योजनाएं दिखाने के लिए आपकी प्रोफाइल का उपयोग',
      enabled: toggles.schemeEligibility,
    },
    {
      id: 'fraudDetection',
      title: 'धोखाधड़ी सुरक्षा / Fraud detection',
      desc: 'संदिग्ध लेन-देन की जांच के लिए',
      enabled: toggles.fraudDetection,
    },
    {
      id: 'notifications',
      title: 'सूचनाएं / Push notifications',
      desc: 'समय पर अलर्ट भेजने के लिए',
      enabled: toggles.notifications,
    },
    {
      id: 'monthlyReport',
      title: 'मासिक रिपोर्ट / Monthly PDF report + email',
      desc: 'आपकी मासिक रिपोर्ट ईमेल पर भेजने के लिए',
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
            <Text style={styles.stepLabel}>STEP 4 OF 4</Text>
            <View style={styles.dots}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={[styles.dot, i === 3 && styles.dotActive]} />
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.title}>आपकी सहमति / Your Consent</Text>
        <Text style={styles.subtitle}>
          आप हर एक को अलग से चालू या बंद कर सकते हैं, कभी भी बदल सकते हैं / You can turn each on or off separately, anytime in Settings.
        </Text>

        <View style={styles.toggleList}>
          {CONSENT_ITEMS.map((item) => (
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
          <TouchableOpacity style={styles.cta} onPress={handleStart} activeOpacity={0.85}>
            <Text style={styles.ctaText}>शुरू करें / Get Started</Text>
          </TouchableOpacity>
          <Text style={styles.footerNote}>
            आप बाद में इन्हें चालू कर सकते हैं / You can turn these on later
          </Text>
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
  ctaText: { ...Typography.labelLg, color: Colors.onPrimary, fontSize: 16, fontWeight: '700' },
  footerNote: { ...Typography.labelSm, fontSize: 12, color: Colors.textWarmGray, textAlign: 'center' },
});

export default ConsentScreen;
