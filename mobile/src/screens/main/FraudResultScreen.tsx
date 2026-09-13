/**
 * FraudResultScreen — Result of the fraud analysis.
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

type Props = NativeStackScreenProps<MoreStackParamList, 'FraudResult'>;

const FraudResultScreen: React.FC<Props> = ({ route, navigation }) => {
  const { analysis } = route.params;
  const isHighRisk = analysis.riskLevel === 'high';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>परिणाम / Result</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.resultCard, isHighRisk ? styles.riskHigh : styles.riskLow]}>
          <Text style={styles.resultIcon}>{isHighRisk ? '⚠️' : '✅'}</Text>
          <Text style={styles.resultTitle}>
            {isHighRisk ? 'खतरा! (High Risk)' : 'सुरक्षित (Safe)'}
          </Text>
          <Text style={styles.resultDesc}>
            {isHighRisk
              ? 'यह संदेश धोखाधड़ी हो सकता है। कृपया किसी भी लिंक पर क्लिक न करें या अपनी जानकारी साझा न करें।'
              : 'यह संदेश सुरक्षित प्रतीत होता है।'}
          </Text>
        </View>

        <TouchableOpacity style={styles.cta} onPress={() => navigation.goBack()}>
          <Text style={styles.ctaText}>एक और जाँच करें / Check Another</Text>
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
  container: { padding: Spacing.lg, paddingBottom: Spacing.xxl, alignItems: 'center' },
  resultCard: {
    width: '100%',
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  riskHigh: {
    backgroundColor: Colors.errorContainer,
    borderColor: Colors.error,
  },
  riskLow: {
    backgroundColor: Colors.tertiaryFixed,
    borderColor: Colors.tertiary,
  },
  resultIcon: { fontSize: 48, marginBottom: Spacing.md },
  resultTitle: { ...Typography.headlineMd, color: Colors.onSurface, marginBottom: Spacing.sm },
  resultDesc: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center' },
  cta: {
    width: '100%',
    backgroundColor: Colors.primaryContainer,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  ctaText: { ...Typography.labelLg, color: Colors.onPrimary },
});

export default FraudResultScreen;
