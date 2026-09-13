/**
 * ConsentScreen — Step 4 of 4 Onboarding
 * Show consent details and navigate to register.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Consent'>;

const ConsentScreen: React.FC<Props> = ({ route, navigation }) => {
  const { profile } = route.params;
  const [agreed, setAgreed] = useState(false);

  const handleContinue = () => {
    // Navigate to Register to create account.
    // In a real app, we'd pass the profile data along to save after registration.
    navigation.navigate('Register');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.stepRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepLabel}>Step 4 of 4</Text>
            <View style={styles.dots}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={[styles.dot, i === 3 && styles.dotActive]} />
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.title}>
          डेटा सुरक्षा और सहमति{'\n'}
          <Text style={styles.subtitle}>Data Privacy & Consent</Text>
        </Text>

        <View style={styles.card}>
          <View style={styles.iconRow}>
            <Text style={styles.icon}>🔒</Text>
            <Text style={styles.cardTitle}>आपका डेटा सुरक्षित है / Your data is safe</Text>
          </View>
          <Text style={styles.desc}>
            हम आपकी जानकारी का उपयोग केवल आपको बेहतर वित्तीय सलाह और योजनाएं देने के लिए करते हैं। हम इसे किसी और को नहीं बेचते।
          </Text>
          <Text style={[styles.desc, { marginTop: Spacing.sm }]}>
            We only use your info to provide better financial advice and schemes. We do not sell it to anyone else.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAgreed(!agreed)}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
            {agreed && <Text style={styles.checkIcon}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            मैं सहमत हूँ / I agree to the terms and privacy policy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cta, !agreed && styles.ctaDisabled]}
          onPress={handleContinue}
          disabled={!agreed}
        >
          <Text style={styles.ctaText}>खाता बनाएँ / Create Account →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.backgroundOffWhite },
  container: { flexGrow: 1, padding: Spacing.lg },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  backBtn: { padding: Spacing.sm, marginLeft: -Spacing.sm },
  backIcon: { fontSize: 24, color: Colors.onSurface },
  stepIndicator: { alignItems: 'flex-end' },
  stepLabel: { ...Typography.labelSm, color: Colors.textWarmGray, marginBottom: 4, textTransform: 'uppercase' },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 16, height: 4, borderRadius: 2, backgroundColor: Colors.surfaceVariant },
  dotActive: { backgroundColor: Colors.vividRed },
  title: { ...Typography.headlineSm, color: Colors.onSurface, marginBottom: Spacing.xl },
  subtitle: { ...Typography.bodyMd, color: Colors.textWarmGray, fontWeight: '400' },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    marginBottom: Spacing.xl,
  },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  icon: { fontSize: 24 },
  cardTitle: { ...Typography.headlineMd, fontSize: 18, color: Colors.onSurface },
  desc: { ...Typography.bodyMd, fontSize: 14, color: Colors.onSurfaceVariant },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xl, paddingRight: Spacing.xl },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.primaryContainer,
  },
  checkIcon: { color: Colors.onPrimary, fontSize: 16, fontWeight: 'bold' },
  checkboxLabel: { ...Typography.bodyMd, color: Colors.onSurface, flex: 1 },
  cta: {
    backgroundColor: Colors.secondaryContainer,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: 'auto',
  },
  ctaDisabled: { backgroundColor: Colors.surfaceVariant },
  ctaText: { ...Typography.labelLg, color: Colors.onPrimary, fontSize: 16 },
});

export default ConsentScreen;
