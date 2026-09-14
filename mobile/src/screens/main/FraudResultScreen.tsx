/**
 * FraudResultScreen — Result of the fraud analysis.
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

type Props = NativeStackScreenProps<MoreStackParamList, 'FraudResult'>;

const FraudResultScreen: React.FC<Props> = ({ route, navigation }) => {
  const { analysis } = route.params;
  const { t } = useTranslation();
  const isHighRisk = analysis.riskLevel === 'high';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>{t.fraud.title}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.resultCard, isHighRisk ? styles.riskHigh : styles.riskLow]}>
          <Text style={styles.resultIcon}>{isHighRisk ? '⚠️' : '✅'}</Text>
          <Text style={styles.resultTitle}>
            {isHighRisk ? t.fraud.resultScam : t.fraud.resultSafe}
          </Text>
        </View>

        <TouchableOpacity style={styles.cta} onPress={() => navigation.goBack()}>
          <Text style={styles.ctaText}>{t.fraud.checkBtn}</Text>
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
  resultCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  riskHigh: { backgroundColor: '#FDECEE', borderColor: Colors.error },
  riskLow: { backgroundColor: '#E8F5E9', borderColor: '#2E7D32' },
  resultIcon: { fontSize: 48 },
  resultTitle: { ...Typography.headlineSm, textAlign: 'center', color: Colors.onSurface },
  cta: {
    backgroundColor: Colors.primaryContainer,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  ctaText: { ...Typography.labelLg, color: Colors.onPrimary, fontWeight: '700' },
});

export default FraudResultScreen;
