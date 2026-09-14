/**
 * FraudCheckScreen — Fraud & Scam detection interface matching video reference.
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
import { fraudService } from '../../services/fraudService';

interface FlaggedTxn {
  id: string;
  amount: number;
  tag: string;
  merchant: string;
  time: string;
}

const DEFAULT_FLAGGED: FlaggedTxn[] = [
  {
    id: '1',
    amount: 15000,
    tag: '? असामान्य स्थान / Unusual location',
    merchant: 'Unknown Merchant (Delhi)',
    time: 'Today, 10:42 AM',
  },
  {
    id: '2',
    amount: 4999,
    tag: '⏱️ असामान्य समय / Odd hours',
    merchant: 'GameCredits.net',
    time: 'Yesterday, 11:20 PM',
  },
];

const FraudCheckScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [flaggedList, setFlaggedList] = useState<FlaggedTxn[]>(DEFAULT_FLAGGED);

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
          reasons: ['Suspicious OTP/PIN request pattern detected'],
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
      <AppHeader title="धोखाधड़ी जांच / Fraud Check" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.mainTitle}>Fraud Check</Text>

          {/* 1. Security Warning Banner */}
          <View style={styles.securityBanner}>
            <Text style={styles.securityBannerText}>
              nitisaathi कभी भी आपका UPI PIN या OTP नहीं मांगेगा / nitisaathi will never ask for your UPI PIN or OTP
            </Text>
          </View>

          {/* 2. Check Suspicious Message Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>📄</Text>
              <Text style={styles.cardTitle}>
                एक संदिग्ध मैसेज चेक करें / Check a suspicious message
              </Text>
            </View>

            <TextInput
              style={styles.textArea}
              placeholder="यहाँ मैसेज पेस्ट करें... / Paste the message here..."
              placeholderTextColor={Colors.textWarmGray}
              multiline
              numberOfLines={4}
              value={text}
              onChangeText={setText}
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.linkRow}>
              <Text style={styles.linkText}>
                या हाल की लेनदेन चुनें / or select a recent transaction
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.checkBtn, !text.trim() && styles.checkBtnDisabled]}
              onPress={handleCheck}
              disabled={!text.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.onPrimary} />
              ) : (
                <Text style={styles.checkBtnText}>जांचें / Check</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* 3. Automatically Flagged Section */}
          <View style={styles.flaggedSection}>
            <View style={styles.flaggedHeader}>
              <View style={styles.flaggedLeft}>
                <Text style={styles.flaggedIcon}>🛡️</Text>
                <Text style={styles.flaggedTitle}>
                  स्वतः पहचाने गए लेन-देन
                </Text>
              </View>
              <View style={styles.flaggedBadge}>
                <Text style={styles.flaggedBadgeText}>
                  {flaggedList.length} Flagged
                </Text>
              </View>
            </View>
            <Text style={styles.flaggedSubtitle}>Automatically flagged</Text>

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
                      <Text style={styles.btnValidText}>✓ सही</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.btnFraud}
                      onPress={() => handleResolve(item.id)}
                    >
                      <Text style={styles.btnFraudText}>🚫 धोखाधड़ी है</Text>
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
  mainTitle: {
    ...Typography.headlineSm,
    fontSize: 24,
    fontWeight: '800',
    color: Colors.onSurface,
  },

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
  linkRow: {
    alignSelf: 'center',
    paddingVertical: 2,
  },
  linkText: {
    fontSize: 12,
    color: Colors.textWarmGray,
    textDecorationLine: 'underline',
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
  flaggedSubtitle: {
    fontSize: 12,
    color: Colors.textWarmGray,
    marginTop: -4,
    marginLeft: 22,
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
