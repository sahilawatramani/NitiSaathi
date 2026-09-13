/**
 * ProfileScreen — View and edit the user's financial profile.
 * Loads from GET /api/profile/ and saves with POST /api/profile/
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '../../navigation/MainNavigator';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { profileService, UserProfile } from '../../services/profileService';

type Props = NativeStackScreenProps<MoreStackParamList, 'Profile'>;

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    profileService.get()
      .then((p) => { if (p) setProfile(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await profileService.upsert(profile);
      setProfile(saved);
      setEditing(false);
      Alert.alert('✅ Saved', 'Profile updated successfully.');
    } catch {
      Alert.alert('Error', 'Could not save profile. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const Field = ({
    label, value, onChange, keyboardType = 'default', isSwitch = false,
  }: {
    label: string;
    value: string | boolean;
    onChange: (v: string | boolean) => void;
    keyboardType?: 'default' | 'numeric';
    isSwitch?: boolean;
  }) => (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isSwitch ? (
        <Switch
          value={Boolean(value)}
          onValueChange={onChange}
          disabled={!editing}
          trackColor={{ true: Colors.primaryContainer, false: Colors.outlineVariant }}
          thumbColor={value ? Colors.onPrimary : Colors.textWarmGray}
        />
      ) : (
        <TextInput
          style={[styles.fieldInput, !editing && styles.fieldInputReadOnly]}
          value={String(value ?? '')}
          onChangeText={(t) => onChange(t)}
          editable={editing}
          keyboardType={keyboardType}
          placeholderTextColor={Colors.textWarmGray}
        />
      )}
    </View>
  );

  const avatarLetter = (user?.email ?? 'U')[0].toUpperCase();

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primaryContainer} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>प्रोफ़ाइल / Profile</Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => editing ? handleSave() : setEditing(true)}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator size="small" color={Colors.primaryContainer} />
            : <Text style={styles.editBtnText}>{editing ? 'Save' : 'Edit'}</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Avatar + Email */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{avatarLetter}</Text>
          </View>
          <Text style={styles.emailText}>{user?.email}</Text>
          {!profile.age && !editing && (
            <TouchableOpacity onPress={() => setEditing(true)} style={styles.setupHint}>
              <Text style={styles.setupHintText}>
                ✏️ सेट अप करें / Tap Edit to set up your profile
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Personal Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>व्यक्तिगत जानकारी / Personal Info</Text>
          <Field
            label="उम्र / Age"
            value={String(profile.age ?? '')}
            onChange={(v) => setProfile((p) => ({ ...p, age: Number(v) }))}
            keyboardType="numeric"
          />
          <Field
            label="राज्य / State"
            value={profile.state ?? ''}
            onChange={(v) => setProfile((p) => ({ ...p, state: String(v) }))}
          />
        </View>

        {/* Financial Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>वित्तीय जानकारी / Financial Info</Text>
          <Field
            label="मासिक आय / Monthly Income (₹)"
            value={String(profile.monthly_income ?? '')}
            onChange={(v) => setProfile((p) => ({ ...p, monthly_income: Number(v) }))}
            keyboardType="numeric"
          />
          <Field
            label="मासिक खर्च / Monthly Expenses (₹)"
            value={String(profile.monthly_expenses ?? '')}
            onChange={(v) => setProfile((p) => ({ ...p, monthly_expenses: Number(v) }))}
            keyboardType="numeric"
          />
          <Field
            label="EMI (₹)"
            value={String(profile.monthly_emi ?? '')}
            onChange={(v) => setProfile((p) => ({ ...p, monthly_emi: Number(v) }))}
            keyboardType="numeric"
          />
          <Field
            label="वर्तमान बचत / Current Savings (₹)"
            value={String(profile.current_savings ?? '')}
            onChange={(v) => setProfile((p) => ({ ...p, current_savings: Number(v) }))}
            keyboardType="numeric"
          />
          <Field
            label="जोखिम सहनशीलता / Risk Tolerance"
            value={profile.risk_tolerance ?? ''}
            onChange={(v) => setProfile((p) => ({ ...p, risk_tolerance: String(v) }))}
          />
        </View>

        {/* Government Schemes Eligibility */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>सरकारी पात्रता / Gov. Eligibility</Text>
          <Field
            label="EPFO/ESIC पंजीकृत"
            value={profile.epfo_esic_status ?? false}
            onChange={(v) => setProfile((p) => ({ ...p, epfo_esic_status: Boolean(v) }))}
            isSwitch
          />
          <Field
            label="आयकर दाता / Income Tax Payer"
            value={profile.income_tax_payer ?? false}
            onChange={(v) => setProfile((p) => ({ ...p, income_tax_payer: Boolean(v) }))}
            isSwitch
          />
          <Field
            label="e-Shram पंजीकृत"
            value={profile.e_shram_registered ?? false}
            onChange={(v) => setProfile((p) => ({ ...p, e_shram_registered: Boolean(v) }))}
            isSwitch
          />
          <Field
            label="आधार लिंक्ड / Aadhaar Linked"
            value={profile.aadhaar_linked ?? true}
            onChange={(v) => setProfile((p) => ({ ...p, aadhaar_linked: Boolean(v) }))}
            isSwitch
          />
          <Field
            label="बचत खाता / Savings Bank Account"
            value={profile.savings_bank_account ?? true}
            onChange={(v) => setProfile((p) => ({ ...p, savings_bank_account: Boolean(v) }))}
            isSwitch
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>🚪 लॉग आउट / Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  appBar: {
    height: 64, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant, backgroundColor: Colors.surface,
  },
  backBtn: { padding: Spacing.sm, marginRight: Spacing.sm },
  backIcon: { fontSize: 24, color: Colors.onSurface },
  appBarTitle: { ...Typography.headlineSm, color: Colors.onSurface, flex: 1 },
  editBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  editBtnText: { ...Typography.labelLg, color: Colors.primaryContainer },
  container: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  avatarCard: {
    alignItems: 'center', marginBottom: Spacing.xl,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl, padding: Spacing.xl,
    borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  avatarLetter: { ...Typography.displaySm, color: Colors.onPrimary },
  emailText: { ...Typography.bodyMd, color: Colors.textWarmGray },
  setupHint: {
    marginTop: Spacing.sm, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs, backgroundColor: `${Colors.primaryContainer}20`,
    borderRadius: BorderRadius.md,
  },
  setupHintText: { ...Typography.labelLg, color: Colors.primaryContainer },
  section: {
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  sectionTitle: {
    ...Typography.labelLg, color: Colors.textWarmGray,
    textTransform: 'uppercase', marginBottom: Spacing.md,
  },
  fieldRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerLow,
  },
  fieldLabel: { ...Typography.bodyMd, color: Colors.onSurface, flex: 1 },
  fieldInput: {
    ...Typography.bodyMd, color: Colors.onSurface,
    textAlign: 'right', flex: 1, paddingVertical: 4,
  },
  fieldInputReadOnly: { color: Colors.textWarmGray },
  logoutBtn: {
    backgroundColor: Colors.errorContainer, borderRadius: BorderRadius.lg,
    padding: Spacing.md, alignItems: 'center', marginTop: Spacing.md,
  },
  logoutText: { ...Typography.labelLg, color: Colors.error },
});

export default ProfileScreen;
