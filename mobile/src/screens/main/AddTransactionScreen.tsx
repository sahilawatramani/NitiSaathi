/**
 * AddTransactionScreen — Form to add a new income or expense transaction.
 * Posts to POST /api/transactions/
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BudgetStackParamList } from '../../navigation/MainNavigator';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import api from '../../services/api';

type Props = NativeStackScreenProps<BudgetStackParamList, 'AddTransaction'>;

const CATEGORIES = [
  'Food', 'Transport', 'Fuel', 'Rent', 'EMI', 'Family',
  'Healthcare', 'Education', 'Utilities', 'Shopping', 'Entertainment', 'Other',
];

const AddTransactionScreen: React.FC<Props> = ({ navigation }) => {
  const [direction, setDirection] = useState<'debit' | 'credit'>('debit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [merchantName, setMerchantName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/transactions/', {
        amount: Number(amount),
        description: description.trim(),
        category,
        direction,
        merchant_name: merchantName.trim() || null,
        transaction_date: date,
      });
      // Trigger backend aggregation so analytics refresh immediately
      await api.post('/insights/recalculate');
      Alert.alert('✅ Added', 'Transaction recorded successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'Could not save transaction. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>लेन-देन जोड़ें / Add Transaction</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Income / Expense Toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, direction === 'debit' && styles.toggleBtnDebitActive]}
            onPress={() => setDirection('debit')}
          >
            <Text style={[styles.toggleText, direction === 'debit' && styles.toggleTextActive]}>
              ↑ खर्च / Expense
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, direction === 'credit' && styles.toggleBtnCreditActive]}
            onPress={() => setDirection('credit')}
          >
            <Text style={[styles.toggleText, direction === 'credit' && styles.toggleTextActive]}>
              ↓ आय / Income
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount */}
        <View style={styles.amountCard}>
          <Text style={styles.currencySymbol}>₹</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={Colors.outlineVariant}
            autoFocus
          />
        </View>

        {/* Fields */}
        <View style={styles.card}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>विवरण / Description *</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Swiggy dinner, Petrol"
              placeholderTextColor={Colors.textWarmGray}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>व्यापारी / Merchant (optional)</Text>
            <TextInput
              style={styles.input}
              value={merchantName}
              onChangeText={setMerchantName}
              placeholder="e.g. Swiggy, BPCL"
              placeholderTextColor={Colors.textWarmGray}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>तारीख / Date</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.textWarmGray}
            />
          </View>
        </View>

        {/* Category */}
        <View style={styles.card}>
          <Text style={styles.label}>श्रेणी / Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color={Colors.onPrimary} />
            : <Text style={styles.submitText}>
                {direction === 'debit' ? '↑ खर्च दर्ज करें / Record Expense' : '↓ आय दर्ज करें / Record Income'}
              </Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  appBar: {
    height: 64, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant, backgroundColor: Colors.surface,
  },
  backBtn: { padding: Spacing.sm, marginRight: Spacing.sm },
  backIcon: { fontSize: 24, color: Colors.onSurface },
  appBarTitle: { ...Typography.headlineSm, color: Colors.onSurface },
  container: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  toggleRow: {
    flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg,
  },
  toggleBtn: {
    flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg,
    alignItems: 'center', borderWidth: 2, borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLow,
  },
  toggleBtnDebitActive: {
    borderColor: Colors.error, backgroundColor: `${Colors.error}15`,
  },
  toggleBtnCreditActive: {
    borderColor: Colors.tertiary, backgroundColor: `${Colors.tertiary}15`,
  },
  toggleText: { ...Typography.labelLg, color: Colors.textWarmGray },
  toggleTextActive: { color: Colors.onSurface, fontWeight: '700' },
  amountCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  currencySymbol: { ...Typography.displayLg, color: Colors.primaryContainer, marginRight: 8 },
  amountInput: {
    ...Typography.displayLg, color: Colors.onSurface,
    minWidth: 120, textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  fieldGroup: { marginBottom: Spacing.md },
  label: { ...Typography.labelLg, color: Colors.textWarmGray, marginBottom: Spacing.xs },
  input: {
    backgroundColor: Colors.surfaceContainerLow, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    ...Typography.bodyMd, color: Colors.onSurface,
    borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  categoryChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg, borderWidth: 1.5,
    borderColor: Colors.outlineVariant, backgroundColor: Colors.surfaceContainerLow,
  },
  categoryChipActive: {
    borderColor: Colors.primaryContainer, backgroundColor: `${Colors.primaryContainer}20`,
  },
  categoryText: { ...Typography.labelLg, color: Colors.textWarmGray },
  categoryTextActive: { color: Colors.primaryContainer, fontWeight: '700' },
  submitBtn: {
    backgroundColor: Colors.primaryContainer, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md, alignItems: 'center',
    shadowColor: Colors.primaryContainer, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { ...Typography.labelLg, color: Colors.onPrimary, fontSize: 16 },
});

export default AddTransactionScreen;
