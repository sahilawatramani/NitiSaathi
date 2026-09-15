import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { useAuth } from '../../context/AuthContext';
import { useTranslation, Language } from '../../i18n';
import { profileService, UserProfile } from '../../services/profileService';

const SettingsScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'lang' | 'consent'>('consent');

  useEffect(() => {
    let isMounted = true;
    profileService.get().then((p) => {
      if (isMounted && p) setProfile(p);
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const [toggles, setToggles] = useState({
    txData: true,
    schemeEligibility: true,
    fraudDetection: true,
    notifications: false,
    monthlyReport: false,
  });

  const toggleSwitch = (key: keyof typeof toggles) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const LANGUAGES: { key: Language; label: string }[] = [
    { key: 'hi', label: 'हिंदी' },
    { key: 'en', label: 'English' },
    { key: 'mr', label: 'मराठी' },
  ];

  const displayName = profile?.full_name?.trim() || user?.email?.split('@')[0] || t.settings.profileName;
  const nameSlug = (profile?.full_name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'user';
  const personEmail = (user?.email && !user.email.includes('rajesh@'))
    ? user.email
    : `${nameSlug}@nitisaathi.in`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title={t.settings.title} showBack />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarIcon}>👨‍💼</Text>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileRole}>{personEmail}</Text>
          </View>
        </View>

        {/* 2. Menu Items */}
        <View style={styles.menuList}>
          <TouchableOpacity
            style={[styles.menuItem, activeTab === 'lang' && styles.menuItemActive]}
            onPress={() => setActiveTab('lang')}
          >
            <Text style={styles.menuIcon}>🌐</Text>
            <Text style={[styles.menuText, activeTab === 'lang' && styles.menuTextActive]}>
              {t.settings.languageTitle}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, activeTab === 'consent' && styles.menuItemActive]}
            onPress={() => setActiveTab('consent')}
          >
            <Text style={styles.menuIcon}>🛡️</Text>
            <Text style={[styles.menuText, activeTab === 'consent' && styles.menuTextActive]}>
              {t.settings.consentTitle}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Language Selection Card */}
        {activeTab === 'lang' && (
          <View style={styles.consentCard}>
            <Text style={styles.consentTitle}>{t.settings.languageTitle}</Text>
            <View style={styles.langList}>
              {LANGUAGES.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.langOption, language === item.key && styles.langOptionActive]}
                  onPress={() => setLanguage(item.key)}
                >
                  <Text style={[styles.langText, language === item.key && styles.langTextActive]}>
                    {item.label}
                  </Text>
                  {language === item.key && <Text style={styles.checkIcon}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 3. Consent & Privacy Detail Card */}
        {activeTab === 'consent' && (
          <View style={styles.consentCard}>
            <Text style={styles.consentTitle}>{t.settings.consentTitle}</Text>
            <Text style={styles.consentSubtitle}>{t.consent.subtitle}</Text>

            <View style={styles.toggleList}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleTextCol}>
                  <Text style={styles.toggleHeader}>{t.consent.txTitle}</Text>
                  <Text style={styles.toggleSub}>{t.consent.txDesc}</Text>
                </View>
                <Switch
                  value={toggles.txData}
                  onValueChange={() => toggleSwitch('txData')}
                  trackColor={{ false: Colors.surfaceVariant, true: Colors.primaryContainer }}
                  thumbColor={Colors.surfaceContainerLowest}
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleTextCol}>
                  <Text style={styles.toggleHeader}>{t.consent.schemeTitle}</Text>
                  <Text style={styles.toggleSub}>{t.consent.schemeDesc}</Text>
                </View>
                <Switch
                  value={toggles.schemeEligibility}
                  onValueChange={() => toggleSwitch('schemeEligibility')}
                  trackColor={{ false: Colors.surfaceVariant, true: Colors.primaryContainer }}
                  thumbColor={Colors.surfaceContainerLowest}
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleTextCol}>
                  <Text style={styles.toggleHeader}>{t.consent.fraudTitle}</Text>
                  <Text style={styles.toggleSub}>{t.consent.fraudDesc}</Text>
                </View>
                <Switch
                  value={toggles.fraudDetection}
                  onValueChange={() => toggleSwitch('fraudDetection')}
                  trackColor={{ false: Colors.surfaceVariant, true: Colors.primaryContainer }}
                  thumbColor={Colors.surfaceContainerLowest}
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleTextCol}>
                  <Text style={styles.toggleHeader}>{t.consent.notifTitle}</Text>
                  <Text style={styles.toggleSub}>{t.consent.notifDesc}</Text>
                </View>
                <Switch
                  value={toggles.notifications}
                  onValueChange={() => toggleSwitch('notifications')}
                  trackColor={{ false: Colors.surfaceVariant, true: Colors.primaryContainer }}
                  thumbColor={Colors.surfaceContainerLowest}
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleTextCol}>
                  <Text style={styles.toggleHeader}>{t.consent.reportTitle}</Text>
                  <Text style={styles.toggleSub}>{t.consent.reportDesc}</Text>
                </View>
                <Switch
                  value={toggles.monthlyReport}
                  onValueChange={() => toggleSwitch('monthlyReport')}
                  trackColor={{ false: Colors.surfaceVariant, true: Colors.primaryContainer }}
                  thumbColor={Colors.surfaceContainerLowest}
                />
              </View>
            </View>
          </View>
        )}

        {/* 4. Logout Section */}
        <View style={styles.logoutCard}>
          <View style={styles.logoutLeft}>
            <Text style={styles.logoutIcon}>🚪</Text>
            <View>
              <Text style={styles.logoutTitle}>{t.settings.logoutBtn}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutBtnText}>{t.settings.logoutBtn}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.backgroundOffWhite },
  container: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  profileCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '30',
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FDECEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: { alignItems: 'center', justifyContent: 'center' },
  avatarIcon: { fontSize: 32 },
  profileInfo: { flex: 1, gap: 2 },
  profileName: {
    ...Typography.headlineSm,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  profileRole: {
    ...Typography.bodyMd,
    fontSize: 12,
    color: Colors.textWarmGray,
  },
  menuList: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '30',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  menuItemActive: { backgroundColor: '#FDECEE' },
  menuIcon: { fontSize: 16 },
  menuText: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurface,
    fontWeight: '500',
  },
  menuTextActive: {
    color: Colors.primaryContainer,
    fontWeight: '700',
  },
  consentCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '30',
  },
  consentTitle: {
    ...Typography.headlineSm,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  consentSubtitle: {
    ...Typography.bodyMd,
    fontSize: 12,
    color: Colors.textWarmGray,
  },
  langList: { gap: Spacing.sm },
  langOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  langOptionActive: {
    borderColor: Colors.primaryContainer,
    backgroundColor: '#FAF0F2',
  },
  langText: { fontSize: 14, color: Colors.onSurface },
  langTextActive: { color: Colors.primaryContainer, fontWeight: '700' },
  checkIcon: { color: Colors.primaryContainer, fontWeight: '700' },
  toggleList: { gap: Spacing.md },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant + '15',
  },
  toggleTextCol: { flex: 1, gap: 2 },
  toggleHeader: {
    ...Typography.labelLg,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  toggleSub: {
    fontSize: 11,
    color: Colors.textWarmGray,
    lineHeight: 15,
  },
  logoutCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '30',
    marginBottom: Spacing.xl,
  },
  logoutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  logoutIcon: { fontSize: 20 },
  logoutTitle: {
    ...Typography.labelLg,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  logoutBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: '#FAF7F7',
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
});

export default SettingsScreen;
