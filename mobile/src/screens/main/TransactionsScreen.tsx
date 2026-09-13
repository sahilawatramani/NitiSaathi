/**
 * TransactionsScreen — List all user transactions with pull-to-refresh.
 * Data from GET /api/transactions/
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BudgetStackParamList } from '../../navigation/MainNavigator';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import api from '../../services/api';

export interface Transaction {
  id: number;
  amount: number;
  description: string;
  category: string | null;
  direction: 'credit' | 'debit';
  transaction_date: string;
  merchant_name: string | null;
}

type Props = NativeStackScreenProps<BudgetStackParamList, 'Transactions'>;

const TransactionsScreen: React.FC<Props> = ({ navigation }) => {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [filtered, setFiltered] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await api.get<Transaction[]>('/transactions/');
      setTxns(res.data);
      setFiltered(res.data);
    } catch {
      // silently fail — empty state handles it
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(txns);
    } else {
      const q = search.toLowerCase();
      setFiltered(
        txns.filter(
          (t) =>
            t.description?.toLowerCase().includes(q) ||
            t.category?.toLowerCase().includes(q) ||
            t.merchant_name?.toLowerCase().includes(q)
        )
      );
    }
  }, [search, txns]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const renderItem = ({ item }: { item: Transaction }) => (
    <View style={styles.txnRow}>
      <View style={[styles.txnIconBg, item.direction === 'credit' ? styles.creditBg : styles.debitBg]}>
        <Text style={styles.txnIcon}>{item.direction === 'credit' ? '↓' : '↑'}</Text>
      </View>
      <View style={styles.txnDetails}>
        <Text style={styles.txnDesc} numberOfLines={1}>
          {item.merchant_name || item.description || 'Transaction'}
        </Text>
        <Text style={styles.txnMeta}>
          {item.category ?? 'Uncategorised'} • {formatDate(item.transaction_date)}
        </Text>
      </View>
      <Text style={[styles.txnAmount, item.direction === 'credit' ? styles.creditText : styles.debitText]}>
        {item.direction === 'credit' ? '+' : '-'}₹{Math.abs(item.amount).toLocaleString('en-IN')}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primaryContainer} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>लेन-देन / Transactions</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddTransaction')}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="खोजें / Search transactions..."
          placeholderTextColor={Colors.textWarmGray}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchTransactions(); }}
            colors={[Colors.primaryContainer]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💸</Text>
            <Text style={styles.emptyTitle}>कोई लेन-देन नहीं / No transactions yet</Text>
            <Text style={styles.emptyDesc}>Tap "+ Add" to record your first transaction.</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('AddTransaction')}
            >
              <Text style={styles.emptyBtnText}>+ Add Transaction</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  appBar: {
    height: 64, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant, backgroundColor: Colors.surface,
  },
  backBtn: { padding: Spacing.sm, marginRight: Spacing.sm },
  backIcon: { fontSize: 24, color: Colors.onSurface },
  appBarTitle: { ...Typography.headlineSm, color: Colors.onSurface, flex: 1 },
  addBtn: {
    backgroundColor: Colors.primaryContainer, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
  },
  addBtnText: { ...Typography.labelLg, color: Colors.onPrimary },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', margin: Spacing.md,
    backgroundColor: Colors.surfaceContainerLow, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  searchIcon: { fontSize: 16, marginRight: Spacing.sm },
  searchInput: {
    flex: 1, ...Typography.bodyMd, color: Colors.onSurface, paddingVertical: 12,
  },
  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl },
  txnRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: `${Colors.outlineVariant}50`,
    elevation: 1,
  },
  txnIconBg: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  creditBg: { backgroundColor: `${Colors.tertiary}20` },
  debitBg: { backgroundColor: `${Colors.error}15` },
  txnIcon: { fontSize: 18, fontWeight: 'bold' },
  txnDetails: { flex: 1 },
  txnDesc: { ...Typography.labelLg, color: Colors.onSurface },
  txnMeta: { ...Typography.labelSm, color: Colors.textWarmGray, marginTop: 2 },
  txnAmount: { ...Typography.headlineSm, fontSize: 16 },
  creditText: { color: Colors.tertiary },
  debitText: { color: Colors.error },
  emptyState: { flex: 1, alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 56, marginBottom: Spacing.md },
  emptyTitle: { ...Typography.headlineSm, color: Colors.onSurface, marginBottom: Spacing.sm },
  emptyDesc: { ...Typography.bodyMd, color: Colors.textWarmGray, marginBottom: Spacing.xl },
  emptyBtn: {
    backgroundColor: Colors.primaryContainer, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  emptyBtnText: { ...Typography.labelLg, color: Colors.onPrimary },
});

export default TransactionsScreen;
