/**
 * RegisterScreen — Email + password registration.
 * Pure single-language loaded dynamically via useTranslation().
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { useTranslation } from '../../i18n';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { signup } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await signup(email.trim(), password);
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      let msg = 'Registration failed.';
      if (typeof errData === 'string') {
        msg = errData;
      } else if (Array.isArray(errData) && errData.length > 0) {
        msg = errData[0]?.msg ?? msg;
      }
      Alert.alert('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.brand}>nitisaathi</Text>
            <Text style={styles.subtitle}>{t.welcome.tagline}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>{t.auth.registerTitle}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.auth.emailLabel}</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textWarmGray}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.auth.passwordLabel}</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.textWarmGray}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.auth.confirmPasswordLabel}</Text>
              <TextInput
                style={styles.input}
                value={confirm}
                onChangeText={setConfirm}
                placeholder="••••••••"
                placeholderTextColor={Colors.textWarmGray}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.cta, loading && styles.ctaDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.onPrimary} />
              ) : (
                <Text style={styles.ctaText}>{t.auth.registerBtn} →</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={styles.linkRow}
            >
              <Text style={styles.linkText}>
                {t.auth.haveAccount}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.backgroundOffWhite },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    justifyContent: 'center',
  },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  brand: { ...Typography.headlineLg, color: Colors.onSurface, marginBottom: Spacing.xs },
  subtitle: { ...Typography.bodyMd, color: Colors.textWarmGray, textAlign: 'center' },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '30',
    shadowColor: Colors.onBackground,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  title: { ...Typography.headlineSm, color: Colors.onSurface, marginBottom: Spacing.lg, textAlign: 'center' },
  inputGroup: { marginBottom: Spacing.md },
  label: { ...Typography.labelLg, color: Colors.textWarmGray, marginBottom: Spacing.xs },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    ...Typography.bodyMd,
    color: Colors.onSurface,
    backgroundColor: Colors.surface,
  },
  cta: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { ...Typography.labelLg, color: Colors.onPrimary, fontWeight: '700' },
  linkRow: { alignItems: 'center' },
  linkText: { ...Typography.bodyMd, color: Colors.primaryContainer, fontWeight: '600' },
});

export default RegisterScreen;
