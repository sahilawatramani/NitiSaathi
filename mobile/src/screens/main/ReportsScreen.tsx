/**
 * ReportsScreen — Download or generate PDF reports.
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

type Props = NativeStackScreenProps<MoreStackParamList, 'Reports'>;

const ReportsScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>{t.reports.title}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.subtitle}>{t.reports.monthlySummary}</Text>

        <View style={styles.card}>
          <View style={styles.iconBg}>
            <Text style={styles.icon}>📄</Text>
          </View>
          <View style={styles.content}>
            <Text style={styles.title}>{t.reports.monthlySummary}</Text>
            <Text style={styles.desc}>August 2026</Text>
          </View>
          <TouchableOpacity style={styles.btn}>
            <Text style={styles.btnText}>⬇</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.iconBg}>
            <Text style={styles.icon}>📄</Text>
          </View>
          <View style={styles.content}>
            <Text style={styles.title}>{t.reports.monthlySummary}</Text>
            <Text style={styles.desc}>July 2026</Text>
          </View>
          <TouchableOpacity style={styles.btn}>
            <Text style={styles.btnText}>⬇</Text>
          </TouchableOpacity>
        </View>
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
  subtitle: { ...Typography.bodyMd, color: Colors.textWarmGray, marginBottom: Spacing.lg },
  card: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    marginBottom: Spacing.md,
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconBg: { padding: Spacing.sm, backgroundColor: Colors.surfaceContainer, borderRadius: 8 },
  icon: { fontSize: 24 },
  content: { flex: 1 },
  title: { ...Typography.labelLg, color: Colors.onSurface },
  desc: { ...Typography.bodyMd, color: Colors.textWarmGray },
  btn: { padding: Spacing.sm, backgroundColor: Colors.primaryContainer, borderRadius: 8 },
  btnText: { color: Colors.onPrimary },
});

export default ReportsScreen;
