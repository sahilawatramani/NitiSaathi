/**
 * LoginScreen — Simple email + password login with link to Register.
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

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      let msg = 'Login failed. Check your credentials.';
      if (typeof errData === 'string') {
        msg = errData;
      } else if (Array.isArray(errData) && errData.length > 0) {
        msg = errData[0]?.msg ?? msg;
      }
      Alert.alert('Login Failed', msg);
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.brand}>nitisaathi</Text>
            <Text style={styles.subtitle}>{t.welcome.tagline}</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>{t.auth.loginTitle}</Text>

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
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textWarmGray}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeBtn}
                >
                  <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.cta, loading && styles.ctaDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.onPrimary} />
              ) : (
                <Text style={styles.ctaText}>{t.auth.loginBtn} →</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              style={styles.linkRow}
            >
              <Text style={styles.linkText}>
                {t.auth.noAccount}
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
  passwordRow: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  eyeBtn: { position: 'absolute', right: Spacing.md, padding: Spacing.xs },
  eyeText: { fontSize: 18 },
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

export default LoginScreen;
