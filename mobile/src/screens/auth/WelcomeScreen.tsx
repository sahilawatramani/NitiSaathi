/**
 * WelcomeScreen — Step 1 of 4 Onboarding
 * Pure single-language welcome + dynamic language picker (हिंदी / English / मराठी)
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAuth } from '../../context/AuthContext';
import { useTranslation, Language } from '../../i18n';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const LANGUAGES: { key: Language; native: string; label: string }[] = [
  { key: 'hi', native: 'हिंदी', label: 'Hindi' },
  { key: 'en', native: 'A', label: 'English' },
  { key: 'mr', native: 'म', label: 'मराठी' },
];

const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const { language, setLanguage } = useAuth();
  const { t } = useTranslation();

  const handleSelectLanguage = (lang: Language) => {
    setLanguage(lang);
  };

  const handleContinue = () => {
    navigation.navigate('ComfortLevel', { language });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.backgroundOffWhite} />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Step progress */}
        <View style={styles.stepRow}>
          <Text style={styles.stepLabel}>{t.common.stepOf} 1 / 4</Text>
          <View style={styles.dots}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[styles.dot, i === 0 && styles.dotActive]}
              />
            ))}
          </View>
        </View>

        {/* Logo illustration placeholder */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>₹</Text>
          </View>
        </View>

        {/* Brand name */}
        <View style={styles.brandBlock}>
          <Text style={styles.brandName}>{t.common.appNameDisplay}</Text>
          <Text style={styles.brandTagline}>{t.welcome.tagline}</Text>
        </View>

        {/* Language selection */}
        <Text style={styles.sectionTitle}>{t.welcome.chooseLanguage}</Text>
        <View style={styles.langGrid}>
          {LANGUAGES.map((lang) => {
            const isActive = language === lang.key;
            return (
              <TouchableOpacity
                key={lang.key}
                onPress={() => handleSelectLanguage(lang.key)}
                style={[styles.langCard, isActive && styles.langCardActive]}
                accessibilityRole="radio"
                accessibilityState={{ selected: isActive }}
              >
                {isActive && (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                )}
                <Text
                  style={[
                    styles.langNative,
                    isActive && styles.langNativeActive,
                  ]}
                >
                  {lang.native}
                </Text>
                <Text
                  style={[
                    styles.langLabel,
                    isActive && styles.langLabelActive,
                  ]}
                >
                  {lang.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.cta} onPress={handleContinue} activeOpacity={0.85}>
          <Text style={styles.ctaText}>{t.welcome.continueBtn}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundOffWhite,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  stepRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  stepLabel: {
    ...Typography.labelSm,
    color: Colors.textWarmGray,
    marginRight: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 16,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surfaceVariant,
  },
  dotActive: {
    backgroundColor: Colors.vividRed,
  },
  logoContainer: {
    marginBottom: Spacing.lg,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primaryContainer,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  logoText: {
    fontSize: 56,
    color: Colors.primaryContainer,
    fontWeight: '700',
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  brandName: {
    ...Typography.displayLg,
    color: Colors.onSurface,
    marginBottom: Spacing.xs,
  },
  brandTagline: {
    ...Typography.bodyMd,
    color: Colors.textWarmGray,
    textAlign: 'center',
  },
  sectionTitle: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  langGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
    width: '100%',
  },
  langCard: {
    flex: 1,
    height: 112,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.surfaceVariant,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  langCardActive: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.primaryContainer,
  },
  checkBadge: {
    position: 'absolute',
    top: -12,
    right: -12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  checkMark: {
    fontSize: 14,
    color: Colors.primaryContainer,
    fontWeight: '700',
  },
  langNative: {
    ...Typography.headlineMd,
    color: Colors.textWarmGray,
    marginBottom: 4,
  },
  langNativeActive: {
    color: Colors.onPrimary,
  },
  langLabel: {
    ...Typography.labelSm,
    color: Colors.textWarmGray,
  },
  langLabelActive: {
    color: Colors.onPrimary,
    opacity: 0.9,
  },
  cta: {
    width: '100%',
    backgroundColor: Colors.secondaryContainer,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    shadowColor: Colors.secondaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaText: {
    ...Typography.labelLg,
    color: Colors.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default WelcomeScreen;
