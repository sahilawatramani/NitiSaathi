/**
 * SeedDataScreen — Development helper to quickly populate sample transactions for testing.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import api from '../../services/api';

const SAMPLE_TRANSACTIONS = [
  // 4 weeks ago
  { amount: 14500, description: 'Platform payout - Week 1', category: 'Income', direction: 'credit', days_ago: 28 },
  { amount: 700, description: 'Petrol', category: 'Transport', direction: 'debit', days_ago: 27 },
  { amount: 450, description: 'Groceries', category: 'Food', direction: 'debit', days_ago: 26 },
  { amount: 250, description: 'Mobile recharge', category: 'Utilities', direction: 'debit', days_ago: 25 },
  
  // 3 weeks ago
  { amount: 15000, description: 'Platform payout - Week 2', category: 'Income', direction: 'credit', days_ago: 21 },
  { amount: 800, description: 'Petrol', category: 'Transport', direction: 'debit', days_ago: 20 },
  { amount: 500, description: 'Groceries', category: 'Food', direction: 'debit', days_ago: 19 },
  { amount: 1200, description: 'Rent payment', category: 'Rent', direction: 'debit', days_ago: 18 },
  
  // 2 weeks ago
  { amount: 16500, description: 'Platform payout - Week 3', category: 'Income', direction: 'credit', days_ago: 14 },
  { amount: 600, description: 'Dinner with family', category: 'Food', direction: 'debit', days_ago: 13 },
  { amount: 300, description: 'Electricity bill', category: 'Utilities', direction: 'debit', days_ago: 12 },
  { amount: 750, description: 'Fuel', category: 'Transport', direction: 'debit', days_ago: 11 },
  
  // Last week
  { amount: 17000, description: 'Platform payout - Week 4', category: 'Income', direction: 'credit', days_ago: 7 },
  { amount: 400, description: 'Lunch expenses', category: 'Food', direction: 'debit', days_ago: 6 },
  { amount: 200, description: 'Internet bill', category: 'Utilities', direction: 'debit', days_ago: 5 },
  { amount: 850, description: 'Car service', category: 'Transport', direction: 'debit', days_ago: 4 },
];

const SeedDataScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);

  const clearAllData = async () => {
    setClearing(true);
    try {
      // Fetch all transactions
      const res = await api.get<{ id: number }[]>('/transactions/');
      // Delete each one
      for (const txn of res.data) {
        await api.delete(`/transactions/${txn.id}`);
      }
      // Trigger analytics refresh
      await api.post('/insights/recalculate');
      Alert.alert('✅ Cleared', 'All transactions deleted.');
    } catch (err: any) {
      console.log('Clear error:', err.response?.data || err.message);
      Alert.alert('Error', `Could not clear data: ${err.response?.data?.detail || err.message || 'Unknown error'}`);
    } finally {
      setClearing(false);
    }
  };

  const seedData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      for (const txn of SAMPLE_TRANSACTIONS) {
        const txnDate = new Date(today);
        txnDate.setDate(today.getDate() - txn.days_ago);
        await api.post('/transactions/', {
          amount: txn.amount,
          description: txn.description,
          category: txn.category,
          direction: txn.direction,
          transaction_date: txnDate.toISOString().split('T')[0],
        });
      }
      // Trigger analytics refresh
      await api.post('/insights/recalculate');
      Alert.alert('✅ Done', `Added ${SAMPLE_TRANSACTIONS.length} sample transactions. Go to Dashboard to see live data.`);
    } catch (err: any) {
      console.log('Seed error:', err.response?.data || err.message);
      Alert.alert('Error', `Could not seed data: ${err.response?.data?.detail || err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>🌱 Seed Sample Data</Text>
        <Text style={styles.desc}>
          This will add {SAMPLE_TRANSACTIONS.length} sample transactions to your account for testing the Dashboard and Budget screens with live data.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sample Transactions:</Text>
          {SAMPLE_TRANSACTIONS.map((t, i) => (
            <View key={i} style={styles.txnRow}>
              <Text style={styles.txnText}>
                {t.direction === 'credit' ? '↓' : '↑'} ₹{t.amount} - {t.description}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={seedData}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.onPrimary} />
          ) : (
            <Text style={styles.btnText}>🌱 Add Sample Data</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.clearBtn, clearing && styles.btnDisabled]}
          onPress={clearAllData}
          disabled={clearing}
        >
          {clearing ? (
            <ActivityIndicator color={Colors.error} />
          ) : (
            <Text style={styles.clearBtnText}>🗑️ Clear All Transactions</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.note}>
          ⚠️ This is for testing only. After testing, you can delete these transactions from the Transactions screen.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  container: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  title: { ...Typography.headlineLg, color: Colors.onSurface, marginBottom: Spacing.sm },
  desc: { ...Typography.bodyMd, color: Colors.textWarmGray, marginBottom: Spacing.xl },
  card: {
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, marginBottom: Spacing.xl,
    borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  cardTitle: { ...Typography.labelLg, color: Colors.onSurface, marginBottom: Spacing.md, textTransform: 'uppercase' },
  txnRow: { paddingVertical: Spacing.xs },
  txnText: { ...Typography.bodyMd, color: Colors.textWarmGray },
  btn: {
    backgroundColor: Colors.primaryContainer, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md, alignItems: 'center',
    shadowColor: Colors.primaryContainer, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6, marginBottom: Spacing.lg,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { ...Typography.labelLg, color: Colors.onPrimary, fontSize: 16 },
  clearBtn: {
    backgroundColor: Colors.errorContainer, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md, alignItems: 'center', marginBottom: Spacing.lg,
    borderWidth: 2, borderColor: Colors.error,
  },
  clearBtnText: { ...Typography.labelLg, color: Colors.error, fontSize: 16 },
  note: { ...Typography.labelSm, color: Colors.textWarmGray, textAlign: 'center', fontStyle: 'italic' },
});

export default SeedDataScreen;
