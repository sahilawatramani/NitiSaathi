/**
 * FraudCheckScreen — Check message/call for fraud.
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '../../navigation/MainNavigator';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

type Props = NativeStackScreenProps<MoreStackParamList, 'FraudCheck'>;

const FraudCheckScreen: React.FC<Props> = ({ navigation }) => {
  const [text, setText] = useState('');

  const handleCheck = () => {
    if (!text.trim()) return;
    // In real app, call API here. For now navigate to mock result.
    navigation.navigate('FraudResult', { analysis: { riskLevel: 'high' } });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.appBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>धोखाधड़ी जांच / Fraud Check</Text>
        </View>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.subtitle}>
            Paste a suspicious message, link, or number below to check if it's safe.
          </Text>

          <View style={styles.inputCard}>
            <TextInput
              style={styles.input}
              placeholder="यहाँ पेस्ट करें / Paste here..."
              placeholderTextColor={Colors.textWarmGray}
              multiline
              numberOfLines={6}
              value={text}
              onChangeText={setText}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.cta, !text.trim() && styles.ctaDisabled]}
            onPress={handleCheck}
            disabled={!text.trim()}
          >
            <Text style={styles.ctaText}>जांच करें / Check →</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  subtitle: { ...Typography.bodyMd, color: Colors.textWarmGray, marginBottom: Spacing.lg },
  inputCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  input: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    minHeight: 120,
  },
  cta: {
    backgroundColor: Colors.primaryContainer,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  ctaDisabled: { backgroundColor: Colors.surfaceVariant },
  ctaText: { ...Typography.labelLg, color: Colors.onPrimary },
});

export default FraudCheckScreen;
