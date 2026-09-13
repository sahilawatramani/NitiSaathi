/**
 * SettingsScreen — Manage profile and language.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '../../navigation/MainNavigator';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';

const LANGUAGES: Array<{ code: 'hi' | 'en' | 'mr'; label: string; native: string }> = [
  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  { code: 'en', label: 'English', native: 'English' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
];

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { logout, user, language, setLanguage } = useAuth();
  const [showLangPicker, setShowLangPicker] = React.useState(false);

  const handleSelectLang = async (lang: 'hi' | 'en' | 'mr') => {
    setLanguage(lang);
    setShowLangPicker(false);
    try {
      const { profileService } = await import('../../services/profileService');
      await profileService.upsert({ language_pref: lang });
    } catch (e) {
      console.log('Error updating language pref:', e);
    }
  };

  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>सेटिंग्स / Settings</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>R</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>राजेश / Rajesh</Text>
            <Text style={styles.email}>{user?.email || 'rajesh@example.com'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => setShowLangPicker(!showLangPicker)}
          >
            <Text style={styles.menuText}>भाषा / Language ({currentLangObj.native})</Text>
            <Text style={styles.chevron}>{showLangPicker ? '▼' : '→'}</Text>
          </TouchableOpacity>

          {showLangPicker && (
            <View style={styles.langPickerContainer}>
              {LANGUAGES.map((item) => (
                <TouchableOpacity
                  key={item.code}
                  style={[
                    styles.langOption,
                    language === item.code && styles.langOptionSelected,
                  ]}
                  onPress={() => handleSelectLang(item.code)}
                >
                  <Text style={[
                    styles.langOptionText,
                    language === item.code && styles.langOptionTextSelected,
                  ]}>
                    {item.native} ({item.label})
                  </Text>
                  {language === item.code && <Text style={{ color: Colors.primary }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>लॉग आउट / Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  appBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
  },
  backBtn: { padding: Spacing.sm, marginRight: Spacing.sm },
  backIcon: { fontSize: 24, color: Colors.onSurface },
  appBarTitle: { ...Typography.headlineSm, color: Colors.onSurface, flex: 1 },
  container: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primaryContainer, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  avatarText: { ...Typography.headlineMd, color: Colors.onPrimary },
  profileInfo: { flex: 1 },
  name: { ...Typography.headlineSm, color: Colors.onSurface },
  email: { ...Typography.bodyMd, color: Colors.textWarmGray },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { ...Typography.labelLg, color: Colors.textWarmGray, marginBottom: Spacing.sm, textTransform: 'uppercase' },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  menuText: { ...Typography.bodyMd, color: Colors.onSurface },
  chevron: { ...Typography.bodyMd, color: Colors.textWarmGray },
  langPickerContainer: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    overflow: 'hidden',
  },
  langOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  langOptionSelected: {
    backgroundColor: `${Colors.primary}10`,
  },
  langOptionText: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
  },
  langOptionTextSelected: {
    fontWeight: '700',
    color: Colors.primary,
  },
  logoutBtn: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.errorContainer,
    alignItems: 'center',
  },
  logoutText: { ...Typography.labelLg, color: Colors.error },
});

export default SettingsScreen;
