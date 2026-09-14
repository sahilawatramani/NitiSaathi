/**
 * MoreHomeScreen — The root screen of the "More" tab, providing navigation to other tools.
 * Pure single-language loaded dynamically via useTranslation().
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
import { useTranslation } from '../../i18n';

type Props = NativeStackScreenProps<MoreStackParamList, 'MoreHome'>;

const MoreHomeScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();

  const MENU_ITEMS = [
    { title: t.more.profile, screen: 'Profile', icon: '👤' },
    { title: t.more.seedData, screen: 'SeedData', icon: '🧪' },
    { title: t.more.fraudCheck, screen: 'FraudCheck', icon: '🛡️' },
    { title: t.more.nudges, screen: 'Nudges', icon: '🔔' },
    { title: t.more.reports, screen: 'Reports', icon: '📊' },
    { title: t.more.settings, screen: 'Settings', icon: '⚙️' },
  ] as const;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>{t.more.title}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.menuGrid}>
          {MENU_ITEMS.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.menuCard}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Text style={styles.icon}>{item.icon}</Text>
              <Text style={styles.title}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  appBar: {
    height: 64,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
  },
  appBarTitle: { ...Typography.headlineSm, color: Colors.onSurface },
  container: { padding: Spacing.lg },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  menuCard: {
    width: '47%',
    backgroundColor: Colors.surfaceContainerLowest,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.onBackground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  icon: { fontSize: 32, marginBottom: Spacing.sm },
  title: { ...Typography.labelLg, color: Colors.onSurface, textAlign: 'center' },
});

export default MoreHomeScreen;
