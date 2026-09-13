/**
 * LoginScreen — Simple email + password login with link to Register.
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

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login } = useAuth();
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
      // AuthContext will flip isAuthenticated → RootNavigator shows MainNavigator
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
            <Text style={styles.subtitle}>
              आपका वित्तीय साथी / Your financial companion
            </Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>लॉग इन करें / Sign In</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ईमेल / Email</Text>
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
              <Text style={styles.label}>पासवर्ड / Password</Text>
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
                <Text style={styles.ctaText}>लॉग इन / Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              style={styles.linkRow}
            >
              <Text style={styles.linkText}>
                खाता नहीं है? / No account?{' '}
                <Text style={styles.linkBold}>Register</Text>
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
    shadowColor: Colors.onBackground,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  title: { ...Typography.headlineSm, color: Colors.onSurface, marginBottom: Spacing.xl },
  inputGroup: { marginBottom: Spacing.md },
  label: { ...Typography.labelLg, color: Colors.onSurfaceVariant, marginBottom: Spacing.xs },
  input: {
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    ...Typography.bodyMd,
    color: Colors.onSurface,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  eyeBtn: { paddingHorizontal: 10, paddingVertical: 14 },
  eyeText: { fontSize: 18 },
  cta: {
    backgroundColor: Colors.secondaryContainer,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
    shadowColor: Colors.secondaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaDisabled: { opacity: 0.7 },
  ctaText: { ...Typography.labelLg, color: Colors.onPrimary, fontSize: 16 },
  linkRow: { alignItems: 'center', marginTop: Spacing.lg },
  linkText: { ...Typography.bodyMd, color: Colors.textWarmGray },
  linkBold: { color: Colors.primaryContainer, fontWeight: '700' },
});

export default LoginScreen;
