/**
 * SettingsScreen — Profile, Preferences & Consent management matching video reference.
 */
import React, { useState } from 'react';
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

const SettingsScreen: React.FC = () => {
  const { logout, language, setLanguage } = useAuth();
  const [activeTab, setActiveTab] = useState<'lang' | 'access' | 'consent' | 'notif'>('consent');

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title="सेटिंग्स / Settings" showBack />

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
            <Text style={styles.profileName}>राजेश</Text>
            <Text style={styles.profileRole}>Gig Worker Profile</Text>
            <TouchableOpacity style={styles.editProfileBtn}>
              <Text style={styles.editProfileText}>
                प्रोफ़ाइल संपादित करें / Edit profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Menu Items */}
        <View style={styles.menuList}>
          <TouchableOpacity
            style={[styles.menuItem, activeTab === 'lang' && styles.menuItemActive]}
            onPress={() => setActiveTab('lang')}
          >
            <Text style={styles.menuIcon}>🌐</Text>
            <Text style={styles.menuText}>भाषा / Language</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, activeTab === 'access' && styles.menuItemActive]}
            onPress={() => setActiveTab('access')}
          >
            <Text style={styles.menuIcon}>♿</Text>
            <Text style={styles.menuText}>पहुंच / Accessibility</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, activeTab === 'consent' && styles.menuItemActive]}
            onPress={() => setActiveTab('consent')}
          >
            <Text style={styles.menuIcon}>🛡️</Text>
            <Text style={[styles.menuText, styles.menuTextActive]}>
              सहमति और गोपनीयता / Consent & Privacy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, activeTab === 'notif' && styles.menuItemActive]}
            onPress={() => setActiveTab('notif')}
          >
            <Text style={styles.menuIcon}>🔔</Text>
            <Text style={styles.menuText}>सूचनाएं / Notifications</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>Version 1.2.0</Text>

        {/* 3. Consent & Privacy Detail Card */}
        <View style={styles.consentCard}>
          <Text style={styles.consentTitle}>
            सहमति और गोपनीयता / Consent & Privacy
          </Text>
          <Text style={styles.consentSubtitle}>
            Manage what data NitiSaathi can access to provide your services.
          </Text>

          <View style={styles.toggleList}>
            {/* Toggle 1 */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextCol}>
                <Text style={styles.toggleHeader}>
                  लेन-देन डेटा / Transaction data
                </Text>
                <Text style={styles.toggleSub}>
                  Allow access to transaction history for budgeting tools.
                </Text>
              </View>
              <Switch
                value={toggles.txData}
                onValueChange={() => toggleSwitch('txData')}
                trackColor={{ false: Colors.surfaceVariant, true: Colors.primaryContainer }}
                thumbColor={Colors.surfaceContainerLowest}
              />
            </View>

            {/* Toggle 2 */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextCol}>
                <Text style={styles.toggleHeader}>
                  योजना पात्रता / Scheme eligibility
                </Text>
                <Text style={styles.toggleSub}>
                  Share profile data to check eligibility for government schemes.
                </Text>
              </View>
              <Switch
                value={toggles.schemeEligibility}
                onValueChange={() => toggleSwitch('schemeEligibility')}
                trackColor={{ false: Colors.surfaceVariant, true: Colors.primaryContainer }}
                thumbColor={Colors.surfaceContainerLowest}
              />
            </View>

            {/* Toggle 3 */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextCol}>
                <Text style={styles.toggleHeader}>
                  धोखाधड़ी का पता लगाना / Fraud detection
                </Text>
                <Text style={styles.toggleSub}>
                  Enable real-time scanning of messages for potential scams.
                </Text>
              </View>
              <Switch
                value={toggles.fraudDetection}
                onValueChange={() => toggleSwitch('fraudDetection')}
                trackColor={{ false: Colors.surfaceVariant, true: Colors.primaryContainer }}
                thumbColor={Colors.surfaceContainerLowest}
              />
            </View>

            {/* Toggle 4 */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextCol}>
                <Text style={styles.toggleHeader}>
                  सूचनाएं / Notifications
                </Text>
                <Text style={styles.toggleSub}>
                  Receive alerts for budget limits and scheme updates.
                </Text>
              </View>
              <Switch
                value={toggles.notifications}
                onValueChange={() => toggleSwitch('notifications')}
                trackColor={{ false: Colors.surfaceVariant, true: Colors.primaryContainer }}
                thumbColor={Colors.surfaceContainerLowest}
              />
            </View>

            {/* Toggle 5 */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextCol}>
                <Text style={styles.toggleHeader}>
                  मासिक रिपोर्ट / Monthly report
                </Text>
                <Text style={styles.toggleSub}>
                  Compile and send a monthly financial health summary.
                </Text>
              </View>
              <Switch
                value={toggles.monthlyReport}
                onValueChange={() => toggleSwitch('monthlyReport')}
                trackColor={{ false: Colors.surfaceVariant, true: Colors.primaryContainer }}
                thumbColor={Colors.surfaceContainerLowest}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.dataUseLink}>
            <Text style={styles.dataUseText}>
              आपका डेटा कैसे उपयोग होता है / How your data is used &gt;
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4. Logout Section */}
        <View style={styles.logoutCard}>
          <View style={styles.logoutLeft}>
            <Text style={styles.logoutIcon}>🚪</Text>
            <View>
              <Text style={styles.logoutTitle}>लॉगआउट / Log out</Text>
              <Text style={styles.logoutSubtitle}>You can log back in at any time.</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutBtnText}>Log out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.backgroundOffWhite },
  container: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },

  // 1. Profile Card
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
  avatarCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  editProfileBtn: { marginTop: 4 },
  editProfileText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryContainer,
  },

  // 2. Menu List
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
  menuItemActive: {
    backgroundColor: '#FDECEE',
  },
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
  versionText: {
    fontSize: 11,
    color: Colors.textWarmGray,
    textAlign: 'center',
    marginVertical: 2,
  },

  // 3. Consent Detail Card
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
  dataUseLink: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  dataUseText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryContainer,
  },

  // 4. Logout Section
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
  logoutSubtitle: {
    fontSize: 11,
    color: Colors.textWarmGray,
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
