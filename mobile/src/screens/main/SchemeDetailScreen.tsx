/**
 * SchemeDetailScreen — Details about a specific scheme.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SchemesStackParamList } from '../../navigation/MainNavigator';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

type Props = NativeStackScreenProps<SchemesStackParamList, 'SchemeDetail'>;

const SchemeDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { schemeName } = route.params;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>{schemeName}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>What is this scheme?</Text>
          <Text style={styles.desc}>
            This is a government-backed scheme designed to provide financial security. Based on your profile, you are eligible to enroll.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Contribution</Text>
          <Text style={styles.desc}>₹55 / month</Text>
          <Text style={styles.muted}>This amount will be auto-debited from your bank account.</Text>
        </View>

        <TouchableOpacity style={styles.cta}>
          <Text style={styles.ctaText}>साथी से पूछें / Ask Assistant</Text>
        </TouchableOpacity>
      </ScrollView>
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
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    marginBottom: Spacing.md,
  },
  cardTitle: { ...Typography.headlineSm, fontSize: 18, color: Colors.onSurface, marginBottom: Spacing.sm },
  desc: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  muted: { ...Typography.labelSm, color: Colors.textWarmGray, marginTop: Spacing.xs },
  cta: {
    backgroundColor: Colors.primaryContainer,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  ctaText: { ...Typography.labelLg, color: Colors.onPrimary },
});

export default SchemeDetailScreen;
