/**
 * DetailsScreen — Step 3 of 4 Onboarding
 * Collect gig worker profile details in the active single language.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useTranslation } from '../../i18n';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Details'>;

const PLATFORMS = ['Swiggy', 'Zomato', 'Ola', 'Uber', 'Rapido', 'Other'];

const DetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { language, comfortLevel } = route.params;
  const { t } = useTranslation();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [age, setAge] = useState('');
  const [income, setIncome] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['Swiggy']);
  const [hasEmi, setHasEmi] = useState<'Yes' | 'No'>('No');
  const [eShram, setEShram] = useState<'Yes' | 'No' | 'Not sure'>('Not sure');
  const [epfoEsic, setEpfoEsic] = useState<'Yes' | 'No' | 'Not sure'>('Not sure');

  const handleNameChange = (val: string) => {
    setFullName(val);
    if (!emailTouched) {
      const slug = val
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      setEmail(slug ? `${slug}@nitisaathi.in` : '');
    }
  };

  const togglePlatform = (p: string) => {
    if (selectedPlatforms.includes(p)) {
      setSelectedPlatforms(selectedPlatforms.filter((item) => item !== p));
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const handleContinue = () => {
    const emailSlug = fullName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    const finalEmail =
      email.trim() || (emailSlug ? `${emailSlug}@nitisaathi.in` : 'user@nitisaathi.in');

    navigation.navigate('Consent', {
      profile: {
        language_pref: language,
        risk_tolerance: comfortLevel,
        full_name: fullName.trim() || 'User',
        email: finalEmail,
        gender,
        age: parseInt(age, 10) || 30,
        monthly_income: parseInt(income, 10) || 25000,
        platforms: selectedPlatforms,
        has_emi: hasEmi === 'Yes',
        is_registered_eshram: eShram === 'Yes',
        is_registered_epfo: epfoEsic === 'Yes',
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Header Progress */}
          <View style={styles.stepRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <View style={styles.stepIndicator}>
              <Text style={styles.stepLabel}>{t.common.stepOf} 3 / 4</Text>
              <View style={styles.dots}>
                {[0, 1, 2, 3].map((i) => (
                  <View key={i} style={[styles.dot, i === 2 && styles.dotActive]} />
                ))}
              </View>
            </View>
          </View>

          <Text style={styles.title}>{t.details.title}</Text>
          <Text style={styles.subtitle}>{t.details.subtitle}</Text>

          <View style={styles.form}>
            {/* 1. Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.details.nameLabel}</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={handleNameChange}
                placeholder={t.details.namePlaceholder}
                placeholderTextColor={Colors.textWarmGray}
              />
            </View>

            {/* 2. Email ID */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.details.emailLabel}</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  setEmailTouched(true);
                }}
                placeholder={t.details.emailPlaceholder}
                placeholderTextColor={Colors.textWarmGray}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* 3. Gender */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.details.genderLabel}</Text>
              <View style={styles.segmentRow}>
                {[
                  { key: 'male', label: t.details.genderMale },
                  { key: 'female', label: t.details.genderFemale },
                  { key: 'other', label: t.details.genderOther },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setGender(opt.key as any)}
                    style={[styles.segmentBtn, gender === opt.key && styles.segmentBtnActive]}
                  >
                    <Text style={[styles.segmentText, gender === opt.key && styles.segmentTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 3. Age */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.details.ageLabel}</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
                placeholder="e.g. 32"
                placeholderTextColor={Colors.textWarmGray}
              />
            </View>

            {/* 4. Monthly Income */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.details.incomeLabel}</Text>
              <View style={styles.currencyInputRow}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.currencyInput}
                  value={income}
                  onChangeText={setIncome}
                  keyboardType="number-pad"
                  placeholder="25000"
                  placeholderTextColor={Colors.textWarmGray}
                />
              </View>
            </View>

            {/* 3. Platforms */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.details.platformsLabel}</Text>
              <View style={styles.chipsRow}>
                {PLATFORMS.map((p) => {
                  const isSelected = selectedPlatforms.includes(p);
                  return (
                    <TouchableOpacity
                      key={p}
                      onPress={() => togglePlatform(p)}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {p}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 4. Ongoing EMI */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.details.emiLabel}</Text>
              <View style={styles.segmentRow}>
                {[
                  { key: 'Yes', label: t.details.yes },
                  { key: 'No', label: t.details.no },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setHasEmi(opt.key as any)}
                    style={[styles.segmentBtn, hasEmi === opt.key && styles.segmentBtnActive]}
                  >
                    <Text style={[styles.segmentText, hasEmi === opt.key && styles.segmentTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 5. e-Shram Registration */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.details.eShramLabel}</Text>
              <View style={styles.segmentRow}>
                {[
                  { key: 'Yes', label: t.details.yes },
                  { key: 'No', label: t.details.no },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setEShram(opt.key as any)}
                    style={[styles.segmentBtn, eShram === opt.key && styles.segmentBtnActive]}
                  >
                    <Text style={[styles.segmentText, eShram === opt.key && styles.segmentTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 6. EPFO / ESIC Registration */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.details.epfoLabel}</Text>
              <View style={styles.segmentRow}>
                {[
                  { key: 'Yes', label: t.details.yes },
                  { key: 'No', label: t.details.no },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setEpfoEsic(opt.key as any)}
                    style={[styles.segmentBtn, epfoEsic === opt.key && styles.segmentBtnActive]}
                  >
                    <Text style={[styles.segmentText, epfoEsic === opt.key && styles.segmentTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.cta} onPress={handleContinue} activeOpacity={0.85}>
            <Text style={styles.ctaText}>{t.details.continueBtn}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  subtitle: { ...Typography.bodyMd, fontSize: 13, color: Colors.textWarmGray, marginBottom: Spacing.lg },
  form: { flex: 1, gap: Spacing.lg },
  inputGroup: { gap: 6 },
  label: { ...Typography.labelLg, fontSize: 14, color: Colors.onSurfaceVariant, fontWeight: '600' },
  input: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    ...Typography.bodyMd,
    color: Colors.onSurface,
  },
  currencyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  currencyPrefix: {
    fontSize: 16,
    color: Colors.onSurface,
    fontWeight: '600',
    marginRight: 6,
  },
  currencyInput: {
    flex: 1,
    paddingVertical: 12,
    ...Typography.bodyMd,
    color: Colors.onSurface,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  chipActive: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.primaryContainer,
  },
  chipText: {
    ...Typography.labelLg,
    fontSize: 13,
    color: Colors.onSurface,
  },
  chipTextActive: {
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  segmentBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  segmentBtnActive: {
    backgroundColor: Colors.cautionTint,
    borderColor: Colors.primaryContainer,
  },
  segmentText: {
    ...Typography.labelLg,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
  },
  segmentTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  cta: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  ctaText: { ...Typography.labelLg, color: Colors.onPrimary, fontSize: 16, fontWeight: '700' },
});

export default DetailsScreen;
