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
    id: 'struggling',
    icon: 'sentiment_dissatisfied',
    title: 'काफी मुश्किल है / Struggling',
    desc: 'महीने के अंत में पैसे कम पड़ जाते हैं / Not enough money at month end',
    color: Colors.error,
  },
  {
    id: 'managing',
    icon: 'sentiment_neutral',
    title: 'काम चल रहा है / Managing',
    desc: 'खर्चे निकल जाते हैं, लेकिन बचत नहीं होती / Covering expenses, but no savings',
    color: Colors.vividRed,
  },
  {
    id: 'comfortable',
    icon: 'sentiment_satisfied',
    title: 'आरामदायक / Comfortable',
    desc: 'खर्चे के बाद कुछ बचत हो जाती है / Able to save some money after expenses',
    color: Colors.tertiary,
  },
];

const ComfortLevelScreen: React.FC<Props> = ({ route, navigation }) => {
  const { language } = route.params;
  const [selected, setSelected] = useState<string | null>(null);

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
            <Text style={styles.stepLabel}>Step 2 of 4</Text>
            <View style={styles.dots}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={[styles.dot, i === 1 && styles.dotActive]} />
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.title}>
          आजकल आपका खर्च कैसा चल रहा है?{'\n'}
          <Text style={styles.subtitle}>How comfortable are you financially?</Text>
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
                  isActive && { borderColor: opt.color, backgroundColor: Colors.surface },
                ]}
              >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: isActive ? `${opt.color}20` : Colors.surfaceContainerHigh },
                  ]}
                >
                  <Text style={[styles.icon, { color: isActive ? opt.color : Colors.onSurfaceVariant }]}>
                    {/* Placeholder for material symbol */}
                    O
                  </Text>
                </View>
                <View style={styles.textContent}>
                  <Text style={styles.optTitle}>{opt.title}</Text>
                  <Text style={styles.optDesc}>{opt.desc}</Text>
                </View>
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
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.surfaceVariant,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 24 },
  textContent: { flex: 1 },
  optTitle: { ...Typography.headlineMd, fontSize: 18, color: Colors.onSurface, marginBottom: 2 },
  optDesc: { ...Typography.bodyMd, fontSize: 14, color: Colors.textWarmGray },
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

export default ComfortLevelScreen;
