/**
 * CausalChainScreen — Detail view for budget projection and breakdown.
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
import type { BudgetStackParamList } from '../../navigation/MainNavigator';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { useTranslation } from '../../i18n';

type Props = NativeStackScreenProps<BudgetStackParamList, 'CausalChain'>;

const CausalChainScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>{t.budget.viewDetails}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.warningCard}>
          <Text style={styles.icon}>💡</Text>
          <Text style={styles.title}>{t.budget.causalPlan}</Text>
          <Text style={styles.desc}>{t.budget.steadyIncomeCallout}</Text>
        </View>

        <View style={styles.chainBox}>
          <View style={styles.chainNode}>
            <Text style={styles.nodeIcon}>📊</Text>
            <View style={styles.nodeContent}>
              <Text style={styles.nodeTitle}>{t.budget.safeToSpend}</Text>
              <Text style={styles.nodeDesc}>{t.budget.causal1}</Text>
            </View>
          </View>
          <View style={styles.linkLine} />
          <View style={styles.chainNode}>
            <Text style={styles.nodeIcon}>🎯</Text>
            <View style={styles.nodeContent}>
              <Text style={styles.nodeTitle}>{t.budget.savingsGoal}</Text>
              <Text style={styles.nodeDesc}>{t.budget.causal2}</Text>
            </View>
          </View>
          <View style={styles.linkLine} />
          <View style={styles.chainNode}>
            <Text style={styles.nodeIcon}>📈</Text>
            <View style={styles.nodeContent}>
              <Text style={styles.nodeTitle}>{t.budget.forecastedIncome}</Text>
              <Text style={styles.nodeDesc}>{t.budget.monthlyProjection}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.cta} onPress={() => navigation.goBack()}>
          <Text style={styles.ctaText}>← {t.common.backBtn}</Text>
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
  warningCard: {
    backgroundColor: '#FAF0F2',
    borderColor: Colors.primaryContainer,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  icon: { fontSize: 24 },
  title: { ...Typography.labelLg, color: Colors.primaryContainer, fontWeight: '700' },
  desc: { ...Typography.bodyMd, color: Colors.onSurface },
  chainBox: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    marginBottom: Spacing.xl,
  },
  chainNode: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  nodeIcon: { fontSize: 28 },
  nodeContent: { flex: 1 },
  nodeTitle: { ...Typography.labelLg, color: Colors.onSurface, fontWeight: '700' },
  nodeDesc: { ...Typography.bodySm, color: Colors.textWarmGray },
  linkLine: { width: 2, height: 24, backgroundColor: Colors.outlineVariant, marginLeft: 14, marginVertical: 4 },
  cta: {
    backgroundColor: Colors.primaryContainer,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  ctaText: { ...Typography.labelLg, color: Colors.onPrimary, fontWeight: '700' },
});

export default CausalChainScreen;
