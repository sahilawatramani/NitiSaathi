/**
 * RegisterScreen — Email + password registration.
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

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { signup } = useAuth();
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
      // Pydantic validation errors return an array of objects
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
            <Text style={styles.subtitle}>आपका वित्तीय साथी / Your financial companion</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>खाता बनाएं / Create Account</Text>

            {[
              { label: 'ईमेल / Email', value: email, onChange: setEmail, placeholder: 'you@example.com', keyboard: 'email-address' as const },
              { label: 'पासवर्ड / Password', value: password, onChange: setPassword, placeholder: '••••••••', secure: true },
              { label: 'पासवर्ड दोहराएं / Confirm', value: confirm, onChange: setConfirm, placeholder: '••••••••', secure: true },
            ].map((field) => (
              <View key={field.label} style={styles.inputGroup}>
                <Text style={styles.label}>{field.label}</Text>
                <TextInput
                  style={styles.input}
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder={field.placeholder}
                  placeholderTextColor={Colors.textWarmGray}
                  keyboardType={field.keyboard ?? 'default'}
                  secureTextEntry={field.secure}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            ))}

            <TouchableOpacity
              style={[styles.cta, loading && styles.ctaDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.onPrimary} />
              ) : (
                <Text style={styles.ctaText}>Register →</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={styles.linkRow}
            >
              <Text style={styles.linkText}>
                पहले से खाता है? / Already have an account?{' '}
                <Text style={styles.linkBold}>Login</Text>
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

export default RegisterScreen;
