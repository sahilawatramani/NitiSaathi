/**
 * FraudCheckScreen — Fraud & Scam detection interface matching reference design.
 * Pure single-language strings dynamically loaded via useTranslation().
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { useTranslation } from '../../i18n';
import { fraudService } from '../../services/fraudService';

interface FlaggedTxn {
  id: string;
  amount: number;
  tag: string;
  merchant: string;
  time: string;
}

const FraudCheckScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [flaggedList, setFlaggedList] = useState<FlaggedTxn[]>([
    {
      id: '1',
      amount: 15000,
      tag: '⚠️ ' + t.fraud.riskScore + ': High',
      merchant: 'Unknown Merchant (Delhi)',
      time: 'Today, 10:42 AM',
    },
    {
      id: '2',
      amount: 4999,
      tag: '⏱️ ' + t.fraud.riskScore + ': Medium',
      merchant: 'GameCredits.net',
      time: 'Yesterday, 11:20 PM',
    },
  ]);

  const handleCheck = async () => {
    if (!text.trim()) return;
    setLoading(true);

    try {
      const res = await fraudService.detectText(text);
      navigation.navigate('FraudResult', { analysis: res });
    } catch {
      navigation.navigate('FraudResult', {
        analysis: {
          is_fraud: true,
          risk_level: 'high',
          reasons: [t.fraud.resultScam],
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = (id: string) => {
    setFlaggedList((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title={t.nav.fraud} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Security Warning Banner */}
          <View style={styles.securityBanner}>
            <Text style={styles.securityBannerText}>{t.fraud.bannerText}</Text>
          </View>

          {/* 2. Check Suspicious Message Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>📄</Text>
              <Text style={styles.cardTitle}>{t.fraud.checkTitle}</Text>
            </View>

            <TextInput
              style={styles.textArea}
              placeholder={t.fraud.checkPlaceholder}
              placeholderTextColor={Colors.textWarmGray}
              multiline
              numberOfLines={4}
              value={text}
              onChangeText={setText}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.checkBtn, !text.trim() && styles.checkBtnDisabled]}
              onPress={handleCheck}
              disabled={!text.trim() || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.onPrimary} />
              ) : (
                <Text style={styles.checkBtnText}>{t.fraud.checkBtn}</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* 3. Automatically Flagged Section */}
          <View style={styles.flaggedSection}>
            <View style={styles.flaggedHeader}>
              <View style={styles.flaggedLeft}>
                <Text style={styles.flaggedIcon}>🛡️</Text>
                <Text style={styles.flaggedTitle}>{t.fraud.flaggedTitle}</Text>
              </View>
              <View style={styles.flaggedBadge}>
                <Text style={styles.flaggedBadgeText}>
                  {flaggedList.length} Flagged
                </Text>
              </View>
            </View>

            <View style={styles.flaggedList}>
              {flaggedList.map((item) => (
                <View key={item.id} style={styles.txnCard}>
                  <View style={styles.txnTopRow}>
                    <Text style={styles.txnAmount}>
                      ₹ {item.amount.toLocaleString('en-IN')}.00
                    </Text>
                    <View style={styles.tagPill}>
                      <Text style={styles.tagText}>{item.tag}</Text>
                    </View>
                  </View>

                  <Text style={styles.merchantText}>{item.merchant}</Text>
                  <Text style={styles.timeText}>{item.time}</Text>

                  <View style={styles.txnActions}>
                    <TouchableOpacity
                      style={styles.btnValid}
                      onPress={() => handleResolve(item.id)}
                    >
                      <Text style={styles.btnValidText}>{t.fraud.legitBtn}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.btnFraud}
                      onPress={() => handleResolve(item.id)}
                    >
                      <Text style={styles.btnFraudText}>{t.fraud.fraudBtn}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.backgroundOffWhite },
  container: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },

  // 1. Security Banner
  securityBanner: {
    backgroundColor: '#FDECEE',
    borderWidth: 1,
    borderColor: '#F5C6CB',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  securityBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#82001B',
    textAlign: 'center',
    lineHeight: 17,
  },

  // 2. Card
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '30',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cardIcon: { fontSize: 18 },
  cardTitle: {
    ...Typography.headlineSm,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
    flex: 1,
  },
  textArea: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '50',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 100,
    fontSize: 13,
    color: Colors.onSurface,
  },
  checkBtn: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  checkBtnDisabled: {
    backgroundColor: Colors.surfaceVariant,
  },
  checkBtnText: {
    color: Colors.onPrimary,
    fontWeight: '700',
    fontSize: 14,
  },

  // 3. Flagged Section
  flaggedSection: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  flaggedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flaggedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flaggedIcon: { fontSize: 16 },
  flaggedTitle: {
    ...Typography.headlineSm,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  flaggedBadge: {
    backgroundColor: '#FDECEE',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  flaggedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },

  flaggedList: { gap: Spacing.md, marginTop: Spacing.xs },
  txnCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '30',
  },
  txnTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  txnAmount: {
    ...Typography.headlineSm,
    fontSize: 20,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  tagPill: {
    backgroundColor: '#FEF3D6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A6000',
  },
  merchantText: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  timeText: {
    fontSize: 11,
    color: Colors.textWarmGray,
  },
  txnActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  btnValid: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
  },
  btnValidText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  btnFraud: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primaryContainer,
    alignItems: 'center',
    backgroundColor: '#FDF2F3',
  },
  btnFraudText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryContainer,
  },
});

export default FraudCheckScreen;
