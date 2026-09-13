/**
 * DetailsScreen — Step 3 of 4 Onboarding
 * Collect basic profile details.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Details'>;

const DetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { language, comfortLevel } = route.params;

  const [age, setAge] = useState('');
  const [income, setIncome] = useState('');
  const [expenses, setExpenses] = useState('');

  const handleContinue = () => {
    // Navigate to Consent with collected profile data
    navigation.navigate('Consent', {
      profile: {
        language_pref: language,
        risk_tolerance: comfortLevel, // simplistic mapping
        age: parseInt(age, 10) || 0,
        monthly_income: parseInt(income, 10) || 0,
        monthly_expenses: parseInt(expenses, 10) || 0,
      },
    });
  };

  const isComplete = age.trim() && income.trim() && expenses.trim();

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.stepRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <View style={styles.stepIndicator}>
              <Text style={styles.stepLabel}>Step 3 of 4</Text>
              <View style={styles.dots}>
                {[0, 1, 2, 3].map((i) => (
                  <View key={i} style={[styles.dot, i === 2 && styles.dotActive]} />
                ))}
              </View>
            </View>
          </View>

          <Text style={styles.title}>
            कुछ बुनियादी जानकारी{'\n'}
            <Text style={styles.subtitle}>A few basic details to personalize your experience.</Text>
          </Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>उम्र / Age</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
                placeholder="25"
                placeholderTextColor={Colors.textWarmGray}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>मासिक आय (₹) / Monthly Income</Text>
              <TextInput
                style={styles.input}
                value={income}
                onChangeText={setIncome}
                keyboardType="number-pad"
                placeholder="15000"
                placeholderTextColor={Colors.textWarmGray}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>मासिक खर्च (₹) / Monthly Expenses</Text>
              <TextInput
                style={styles.input}
                value={expenses}
                onChangeText={setExpenses}
                keyboardType="number-pad"
                placeholder="12000"
                placeholderTextColor={Colors.textWarmGray}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.cta, !isComplete && styles.ctaDisabled]}
            onPress={handleContinue}
            disabled={!isComplete}
          >
            <Text style={styles.ctaText}>आगे बढ़ें / Continue →</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.backgroundOffWhite },
  container: { flexGrow: 1, padding: Spacing.lg },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  backBtn: { padding: Spacing.sm, marginLeft: -Spacing.sm },
  backIcon: { fontSize: 24, color: Colors.onSurface },
  stepIndicator: { alignItems: 'flex-end' },
  stepLabel: { ...Typography.labelSm, color: Colors.textWarmGray, marginBottom: 4, textTransform: 'uppercase' },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 16, height: 4, borderRadius: 2, backgroundColor: Colors.surfaceVariant },
  dotActive: { backgroundColor: Colors.vividRed },
  title: { ...Typography.headlineSm, color: Colors.onSurface, marginBottom: Spacing.xl },
  subtitle: { ...Typography.bodyMd, color: Colors.textWarmGray, fontWeight: '400' },
  form: { flex: 1, gap: Spacing.lg },
  inputGroup: {},
  label: { ...Typography.labelLg, color: Colors.onSurfaceVariant, marginBottom: Spacing.xs },
  input: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    ...Typography.bodyMd,
    color: Colors.onSurface,
  },
  cta: {
    backgroundColor: Colors.secondaryContainer,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  ctaDisabled: { backgroundColor: Colors.surfaceVariant },
  ctaText: { ...Typography.labelLg, color: Colors.onPrimary, fontSize: 16 },
});

export default DetailsScreen;
