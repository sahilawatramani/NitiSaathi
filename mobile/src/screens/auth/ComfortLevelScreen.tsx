/**
 * ComfortLevelScreen — Step 2 of 4 Onboarding
 * Financial Comfort Level Picker
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

type Props = NativeStackScreenProps<AuthStackParamList, 'ComfortLevel'>;

const OPTIONS = [
  {
    id: 'beginner',
    title: 'मुझे ज्यादातर शब्द समझ नहीं आते, सरल भाषा में बताएं',
    desc: "I don't understand most terms, keep it simple",
  },
  {
    id: 'intermediate',
    title: 'मुझे कुछ शब्द पता हैं, पर पूरी जानकारी नहीं',
    desc: 'I know some terms but not all the details',
  },
  {
    id: 'advanced',
    title: 'मुझे वित्तीय शब्द अच्छे से समझ आते हैं',
    desc: "I'm comfortable with financial terminology",
  },
];

const ComfortLevelScreen: React.FC<Props> = ({ route, navigation }) => {
  const { language } = route.params;
  const [selected, setSelected] = useState<string>('intermediate');

  const handleContinue = () => {
    if (selected) {
      navigation.navigate('Details', { language, comfortLevel: selected });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.stepRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepLabel}>STEP 2 OF 4</Text>
            <View style={styles.dots}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={[styles.dot, i === 1 && styles.dotActive]} />
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.title}>
          वित्तीय शब्दों के साथ आप कितने सहज हैं?
        </Text>
        <Text style={styles.subtitle}>
          How comfortable are you with financial terms?
        </Text>

        <View style={styles.optionsList}>
          {OPTIONS.map((opt) => {
            const isActive = selected === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setSelected(opt.id)}
                style={[
                  styles.optionCard,
                  isActive && styles.optionCardActive,
                ]}
                activeOpacity={0.8}
              >
                <View style={styles.textContent}>
                  <Text style={[styles.optTitle, isActive && styles.optTitleActive]}>
                    {opt.title}
                  </Text>
                  <Text style={styles.optDesc}>{opt.desc}</Text>
                </View>
                {isActive && (
                  <View style={styles.checkPill}>
                    <Text style={styles.checkIcon}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.cta, !selected && styles.ctaDisabled]}
          onPress={handleContinue}
          disabled={!selected}
        >
          <Text style={styles.ctaText}>आगे बढ़ें / Continue →</Text>
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
  optionsList: { gap: Spacing.md, marginBottom: Spacing.xl },
  optionCard: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  optionCardActive: {
    borderColor: Colors.primaryContainer,
    backgroundColor: '#FFF7F7',
  },
  textContent: { flex: 1 },
  optTitle: { ...Typography.headlineSm, fontSize: 16, color: Colors.onSurface, marginBottom: 4, fontWeight: '600' },
  optTitleActive: { color: Colors.primaryContainer },
  optDesc: { ...Typography.bodyMd, fontSize: 13, color: Colors.textWarmGray },
  checkPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    color: Colors.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  cta: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: 'auto',
  },
  ctaDisabled: { backgroundColor: Colors.surfaceVariant },
  ctaText: { ...Typography.labelLg, color: Colors.onPrimary, fontSize: 16 },
});

export default ComfortLevelScreen;
