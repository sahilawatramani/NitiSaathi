/**
 * ProfileScreen — View and edit user financial & scheme profile.
 * Provides direct editable input boxes for each section, stored in the backend database.
 * Strictly 100% single-language rendering dynamically powered by useTranslation().
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '../../navigation/MainNavigator';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { profileService, UserProfile } from '../../services/profileService';
import { useTranslation, Language } from '../../i18n';
import { AppHeader } from '../../components/AppHeader';

type Props = NativeStackScreenProps<MoreStackParamList, 'Profile'>;

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useTranslation();

  const [profile, setProfile] = useState<Partial<UserProfile>>({
    age: 28,
    state: 'Maharashtra',
    monthly_income: 25000,
    monthly_expenses: 16000,
    monthly_emi: 3500,
    current_savings: 12000,
    target_retirement_age: 60,
    days_active_with_aggregator: 180,
    risk_tolerance: 'moderate',
    epfo_esic_status: false,
    income_tax_payer: false,
    e_shram_registered: true,
    aadhaar_linked: true,
    savings_bank_account: true,
    has_health_insurance: false,
  });

  const [extraNotes, setExtraNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccessBanner, setSaveSuccessBanner] = useState(false);

  useEffect(() => {
    profileService
      .get()
      .then((p) => {
        if (p) {
          setProfile((prev) => ({ ...prev, ...p }));
          if (p.language_pref && (p.language_pref === 'hi' || p.language_pref === 'en' || p.language_pref === 'mr')) {
            setLanguage(p.language_pref as Language);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccessBanner(false);
    try {
      const payload = {
        ...profile,
        age: Number(profile.age) || 28,
        monthly_income: Number(profile.monthly_income) || 0,
        monthly_expenses: Number(profile.monthly_expenses) || 0,
        monthly_emi: Number(profile.monthly_emi) || 0,
        current_savings: Number(profile.current_savings) || 0,
        target_retirement_age: Number(profile.target_retirement_age) || 60,
        days_active_with_aggregator: Number(profile.days_active_with_aggregator) || 180,
        language_pref: language,
      };

      const saved = await profileService.upsert(payload);
      if (saved) {
        setProfile((prev) => ({ ...prev, ...saved }));
      }
      setSaveSuccessBanner(true);
      Alert.alert('✅', t.profile.savedSuccess);
      setTimeout(() => setSaveSuccessBanner(false), 4000);
    } catch {
      Alert.alert('❌', t.profile.saveError);
    } finally {
      setSaving(false);
    }
  };

  const LANGUAGES: { key: Language; label: string }[] = [
    { key: 'hi', label: 'हिंदी' },
    { key: 'en', label: 'English' },
    { key: 'mr', label: 'मराठी' },
  ];

  const RISK_OPTIONS: { key: string; label: string }[] = [
    { key: 'low', label: t.profile.lowRisk },
    { key: 'moderate', label: t.profile.medRisk },
    { key: 'high', label: t.profile.highRisk },
  ];

  const avatarLetter = (user?.email ?? 'R')[0].toUpperCase();

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader title={t.profile.title} showBack />
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primaryContainer} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title={t.profile.title} showBack />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Save Success Banner */}
          {saveSuccessBanner && (
            <View style={styles.successBanner}>
              <Text style={styles.successBannerIcon}>✅</Text>
              <Text style={styles.successBannerText}>{t.profile.savedSuccess}</Text>
            </View>
          )}

          {/* User Account & Language Card */}
          <View style={styles.accountCard}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>{avatarLetter}</Text>
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.emailText}>{user?.email || 'rajesh@nitisaathi.in'}</Text>
                <Text style={styles.subtitleText}>{t.profile.subtitle}</Text>
              </View>
            </View>

            {/* Language Selector Chips */}
            <View style={styles.langSelectorWrap}>
              <Text style={styles.langSectionTitle}>{t.profile.languageSection}</Text>
              <View style={styles.langChipsRow}>
                {LANGUAGES.map((l) => {
                  const isActive = language === l.key;
                  return (
                    <TouchableOpacity
                      key={l.key}
                      style={[styles.langChip, isActive && styles.langChipActive]}
                      onPress={() => {
                        setLanguage(l.key);
                        setProfile((p) => ({ ...p, language_pref: l.key }));
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.langChipText, isActive && styles.langChipTextActive]}>
                        {l.label}
                      </Text>
                      {isActive && <Text style={styles.langCheckMark}> ✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Section 1: Personal Information */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t.profile.personalSection}</Text>
              <Text style={styles.sectionDesc}>{t.profile.personalDesc}</Text>
            </View>

            {/* Age Input Box */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.profile.ageLabel}</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  value={profile.age !== undefined && profile.age !== null ? String(profile.age) : ''}
                  onChangeText={(val) => {
                    const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
                    setProfile((p) => ({ ...p, age: isNaN(num) ? 0 : num }));
                  }}
                  keyboardType="numeric"
                  placeholder="28"
                  placeholderTextColor={Colors.textWarmGray}
                />
              </View>
            </View>

            {/* State Input Box */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.profile.stateLabel}</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  value={profile.state ?? ''}
                  onChangeText={(val) => setProfile((p) => ({ ...p, state: val }))}
                  placeholder="Maharashtra"
                  placeholderTextColor={Colors.textWarmGray}
                />
              </View>
            </View>

            {/* Platform Days Active Input Box */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.profile.aggregatorLabel}</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  value={
                    profile.days_active_with_aggregator !== undefined && profile.days_active_with_aggregator !== null
                      ? String(profile.days_active_with_aggregator)
                      : ''
                  }
                  onChangeText={(val) => {
                    const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
                    setProfile((p) => ({ ...p, days_active_with_aggregator: isNaN(num) ? 0 : num }));
                  }}
                  keyboardType="numeric"
                  placeholder="180"
                  placeholderTextColor={Colors.textWarmGray}
                />
              </View>
            </View>
          </View>

          {/* Section 2: Financial Details */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t.profile.financialSection}</Text>
              <Text style={styles.sectionDesc}>{t.profile.financialDesc}</Text>
            </View>

            {/* Monthly Income Input Box */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.profile.incomeLabel}</Text>
              <View style={styles.currencyInputBox}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.currencyTextInput}
                  value={
                    profile.monthly_income !== undefined && profile.monthly_income !== null
                      ? String(profile.monthly_income)
                      : ''
                  }
                  onChangeText={(val) => {
                    const num = parseFloat(val.replace(/[^0-9.]/g, ''));
                    setProfile((p) => ({ ...p, monthly_income: isNaN(num) ? 0 : num }));
                  }}
                  keyboardType="numeric"
                  placeholder="25000"
                  placeholderTextColor={Colors.textWarmGray}
                />
              </View>
            </View>

            {/* Monthly Expenses Input Box */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.profile.expensesLabel}</Text>
              <View style={styles.currencyInputBox}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.currencyTextInput}
                  value={
                    profile.monthly_expenses !== undefined && profile.monthly_expenses !== null
                      ? String(profile.monthly_expenses)
                      : ''
                  }
                  onChangeText={(val) => {
                    const num = parseFloat(val.replace(/[^0-9.]/g, ''));
                    setProfile((p) => ({ ...p, monthly_expenses: isNaN(num) ? 0 : num }));
                  }}
                  keyboardType="numeric"
                  placeholder="16000"
                  placeholderTextColor={Colors.textWarmGray}
                />
              </View>
            </View>

            {/* Monthly EMI Input Box */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.profile.emiLabel}</Text>
              <View style={styles.currencyInputBox}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.currencyTextInput}
                  value={
                    profile.monthly_emi !== undefined && profile.monthly_emi !== null
                      ? String(profile.monthly_emi)
                      : ''
                  }
                  onChangeText={(val) => {
                    const num = parseFloat(val.replace(/[^0-9.]/g, ''));
                    setProfile((p) => ({ ...p, monthly_emi: isNaN(num) ? 0 : num }));
                  }}
                  keyboardType="numeric"
                  placeholder="3500"
                  placeholderTextColor={Colors.textWarmGray}
                />
              </View>
            </View>

            {/* Current Savings Input Box */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.profile.savingsLabel}</Text>
              <View style={styles.currencyInputBox}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.currencyTextInput}
                  value={
                    profile.current_savings !== undefined && profile.current_savings !== null
                      ? String(profile.current_savings)
                      : ''
                  }
                  onChangeText={(val) => {
                    const num = parseFloat(val.replace(/[^0-9.]/g, ''));
                    setProfile((p) => ({ ...p, current_savings: isNaN(num) ? 0 : num }));
                  }}
                  keyboardType="numeric"
                  placeholder="12000"
                  placeholderTextColor={Colors.textWarmGray}
                />
              </View>
            </View>

            {/* Target Retirement Age */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.profile.retirementLabel}</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  value={
                    profile.target_retirement_age !== undefined && profile.target_retirement_age !== null
                      ? String(profile.target_retirement_age)
                      : ''
                  }
                  onChangeText={(val) => {
                    const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
                    setProfile((p) => ({ ...p, target_retirement_age: isNaN(num) ? 0 : num }));
                  }}
                  keyboardType="numeric"
                  placeholder="60"
                  placeholderTextColor={Colors.textWarmGray}
                />
              </View>
            </View>

            {/* Risk Tolerance Chips */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.profile.riskLabel}</Text>
              <View style={styles.riskRow}>
                {RISK_OPTIONS.map((opt) => {
                  const isSelected = (profile.risk_tolerance || 'moderate').toLowerCase() === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.riskChip, isSelected && styles.riskChipActive]}
                      onPress={() => setProfile((p) => ({ ...p, risk_tolerance: opt.key }))}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.riskChipText, isSelected && styles.riskChipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Section 3: Government Scheme Eligibility */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t.profile.govSection}</Text>
              <Text style={styles.sectionDesc}>{t.profile.govDesc}</Text>
            </View>

            {/* EPFO/ESIC */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextCol}>
                <Text style={styles.toggleLabel}>{t.profile.epfoLabel}</Text>
              </View>
              <Switch
                value={Boolean(profile.epfo_esic_status)}
                onValueChange={(val) => setProfile((p) => ({ ...p, epfo_esic_status: val }))}
                trackColor={{ false: Colors.outlineVariant, true: Colors.primaryContainer }}
                thumbColor={profile.epfo_esic_status ? Colors.onPrimary : Colors.textWarmGray}
              />
            </View>

            {/* Income Tax Payer */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextCol}>
                <Text style={styles.toggleLabel}>{t.profile.taxLabel}</Text>
              </View>
              <Switch
                value={Boolean(profile.income_tax_payer)}
                onValueChange={(val) => setProfile((p) => ({ ...p, income_tax_payer: val }))}
                trackColor={{ false: Colors.outlineVariant, true: Colors.primaryContainer }}
                thumbColor={profile.income_tax_payer ? Colors.onPrimary : Colors.textWarmGray}
              />
            </View>

            {/* e-Shram */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextCol}>
                <Text style={styles.toggleLabel}>{t.profile.eShramLabel}</Text>
              </View>
              <Switch
                value={Boolean(profile.e_shram_registered)}
                onValueChange={(val) => setProfile((p) => ({ ...p, e_shram_registered: val }))}
                trackColor={{ false: Colors.outlineVariant, true: Colors.primaryContainer }}
                thumbColor={profile.e_shram_registered ? Colors.onPrimary : Colors.textWarmGray}
              />
            </View>

            {/* Aadhaar Linked Bank */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextCol}>
                <Text style={styles.toggleLabel}>{t.profile.aadhaarLabel}</Text>
              </View>
              <Switch
                value={profile.aadhaar_linked !== false}
                onValueChange={(val) => setProfile((p) => ({ ...p, aadhaar_linked: val }))}
                trackColor={{ false: Colors.outlineVariant, true: Colors.primaryContainer }}
                thumbColor={profile.aadhaar_linked !== false ? Colors.onPrimary : Colors.textWarmGray}
              />
            </View>

            {/* Savings Bank Account */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextCol}>
                <Text style={styles.toggleLabel}>{t.profile.bankLabel}</Text>
              </View>
              <Switch
                value={profile.savings_bank_account !== false}
                onValueChange={(val) => setProfile((p) => ({ ...p, savings_bank_account: val }))}
                trackColor={{ false: Colors.outlineVariant, true: Colors.primaryContainer }}
                thumbColor={profile.savings_bank_account !== false ? Colors.onPrimary : Colors.textWarmGray}
              />
            </View>

            {/* Health Insurance */}
            <View style={[styles.toggleRow, styles.lastToggleRow]}>
              <View style={styles.toggleTextCol}>
                <Text style={styles.toggleLabel}>{t.profile.healthInsLabel}</Text>
              </View>
              <Switch
                value={Boolean(profile.has_health_insurance)}
                onValueChange={(val) => setProfile((p) => ({ ...p, has_health_insurance: val }))}
                trackColor={{ false: Colors.outlineVariant, true: Colors.primaryContainer }}
                thumbColor={profile.has_health_insurance ? Colors.onPrimary : Colors.textWarmGray}
              />
            </View>
          </View>

          {/* Section 4: Additional Notes / Information Box */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t.profile.extraNotesLabel}</Text>
              <Text style={styles.sectionDesc}>{t.profile.extraNotesDesc}</Text>
            </View>
            <View style={styles.multilineInputBox}>
              <TextInput
                style={styles.multilineTextInput}
                value={extraNotes}
                onChangeText={setExtraNotes}
                placeholder={t.profile.extraNotesPlaceholder}
                placeholderTextColor={Colors.textWarmGray}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Save Profile Button */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <View style={styles.btnRow}>
                <ActivityIndicator size="small" color={Colors.onPrimary} />
                <Text style={styles.saveBtnText}>{t.profile.saving}</Text>
              </View>
            ) : (
              <View style={styles.btnRow}>
                <Text style={styles.btnIcon}>💾</Text>
                <Text style={styles.saveBtnText}>{t.profile.saveBtn}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
            <Text style={styles.logoutText}>🚪 {t.profile.logoutBtn}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  keyboardContainer: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl * 2,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderColor: '#81C784',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  successBannerIcon: {
    fontSize: 18,
  },
  successBannerText: {
    ...Typography.bodyMd,
    color: '#2E7D32',
    fontWeight: '600',
    flex: 1,
  },
  accountCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '60',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    ...Typography.headlineMd,
    color: Colors.onPrimary,
    fontWeight: '800',
  },
  accountInfo: {
    flex: 1,
  },
  emailText: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    fontWeight: '700',
    fontSize: 16,
  },
  subtitleText: {
    ...Typography.bodySm,
    color: Colors.textWarmGray,
    marginTop: 2,
  },
  langSelectorWrap: {
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant + '40',
    paddingTop: Spacing.md,
  },
  langSectionTitle: {
    ...Typography.labelLg,
    color: Colors.textWarmGray,
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  langChipsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  langChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  langChipActive: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.primaryContainer,
  },
  langChipText: {
    ...Typography.labelLg,
    color: Colors.onSurface,
    fontWeight: '600',
    fontSize: 13,
  },
  langChipTextActive: {
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  langCheckMark: {
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '60',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant + '30',
    paddingBottom: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.headlineSm,
    color: Colors.primaryContainer,
    fontWeight: '800',
    fontSize: 15,
  },
  sectionDesc: {
    ...Typography.bodySm,
    color: Colors.textWarmGray,
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.labelLg,
    color: Colors.onSurface,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  inputBox: {
    backgroundColor: Colors.surface,
    borderWidth: 1.2,
    borderColor: Colors.outlineVariant,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 48,
    justifyContent: 'center',
  },
  textInput: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    paddingVertical: 0,
    fontSize: 15,
  },
  currencyInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.2,
    borderColor: Colors.outlineVariant,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  currencyPrefix: {
    ...Typography.headlineSm,
    color: Colors.primaryContainer,
    fontWeight: '700',
    marginRight: Spacing.xs,
    fontSize: 17,
  },
  currencyTextInput: {
    flex: 1,
    ...Typography.bodyMd,
    color: Colors.onSurface,
    paddingVertical: 0,
    fontSize: 15,
  },
  riskRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  riskChip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    alignItems: 'center',
  },
  riskChipActive: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.primaryContainer,
  },
  riskChipText: {
    ...Typography.labelSm,
    color: Colors.onSurface,
    fontWeight: '600',
    fontSize: 12,
  },
  riskChipTextActive: {
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant + '30',
  },
  lastToggleRow: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  toggleTextCol: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  toggleLabel: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    fontWeight: '500',
  },
  multilineInputBox: {
    backgroundColor: Colors.surface,
    borderWidth: 1.2,
    borderColor: Colors.outlineVariant,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    minHeight: 80,
  },
  multilineTextInput: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    paddingVertical: 0,
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    shadowColor: Colors.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  btnIcon: {
    fontSize: 18,
  },
  saveBtnText: {
    ...Typography.headlineSm,
    color: Colors.onPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  logoutBtn: {
    backgroundColor: '#FFEBEE',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  logoutText: {
    ...Typography.labelLg,
    color: Colors.error,
    fontWeight: '700',
  },
});

export default ProfileScreen;
