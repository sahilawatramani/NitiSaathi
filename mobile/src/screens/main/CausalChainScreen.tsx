/**
 * CausalChainScreen — Detail view for the high expenditure warning.
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

type Props = NativeStackScreenProps<BudgetStackParamList, 'CausalChain'>;

const CausalChainScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>विस्तृत रिपोर्ट / Details</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.warningCard}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>High Expenditure Warning</Text>
          <Text style={styles.desc}>
            Your 'Fuel' spending has sharply increased, which will impact your 'Emergency Fund' goal.
          </Text>
        </View>

        <View style={styles.chainBox}>
          <View style={styles.chainNode}>
            <Text style={styles.nodeIcon}>⛽</Text>
            <View style={styles.nodeContent}>
              <Text style={styles.nodeTitle}>Fuel Expense</Text>
              <Text style={styles.nodeDesc}>Increased by 40% (₹400 over budget)</Text>
            </View>
          </View>
          <View style={styles.linkLine} />
          <View style={styles.chainNode}>
            <Text style={styles.nodeIcon}>📉</Text>
            <View style={styles.nodeContent}>
              <Text style={styles.nodeTitle}>Total Savings</Text>
              <Text style={styles.nodeDesc}>Projected to drop by 15%</Text>
            </View>
          </View>
          <View style={styles.linkLine} />
          <View style={styles.chainNode}>
            <Text style={styles.nodeIcon}>🏥</Text>
            <View style={styles.nodeContent}>
              <Text style={styles.nodeTitle}>Emergency Fund Goal</Text>
              <Text style={styles.nodeDesc}>Will miss monthly target by ₹1,200</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.cta} onPress={() => navigation.goBack()}>
          <Text style={styles.ctaText}>बजट में वापस जाएँ / Back to Budget</Text>
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
    backgroundColor: Colors.cautionTint,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.primaryContainer,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  icon: { fontSize: 40, marginBottom: Spacing.sm },
  title: { ...Typography.headlineMd, color: Colors.onSurface, marginBottom: Spacing.sm, textAlign: 'center' },
  desc: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center' },
  chainBox: { backgroundColor: Colors.surfaceContainerLowest, padding: Spacing.lg, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.outlineVariant, marginBottom: Spacing.xl },
  chainNode: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  nodeIcon: { fontSize: 24 },
  nodeContent: { flex: 1 },
  nodeTitle: { ...Typography.labelLg, color: Colors.onSurface },
  nodeDesc: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  linkLine: { width: 2, height: 30, backgroundColor: Colors.outlineVariant, marginLeft: 16, marginVertical: Spacing.xs },
  cta: { backgroundColor: Colors.surfaceContainerHigh, padding: Spacing.md, borderRadius: BorderRadius.lg, alignItems: 'center' },
  ctaText: { ...Typography.labelLg, color: Colors.onSurface },
});

export default CausalChainScreen;
