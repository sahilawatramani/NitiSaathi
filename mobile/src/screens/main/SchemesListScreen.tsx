/**
 * SchemesListScreen — List of government schemes.
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

type Props = NativeStackScreenProps<SchemesStackParamList, 'SchemesList'>;

const SCHEMES = [
  {
    id: 'pmsym',
    title: 'PM-SYM (पेंशन योजना)',
    desc: '₹3000/month pension for unorganized sector workers.',
    eligible: true,
  },
  {
    id: 'pmjjby',
    title: 'PMJJBY (जीवन ज्योति)',
    desc: 'Life insurance cover of ₹2 Lakhs.',
    eligible: true,
  },
  {
    id: 'pmsby',
    title: 'PMSBY (सुरक्षा बीमा)',
    desc: 'Accident insurance cover of ₹2 Lakhs.',
    eligible: true,
  },
];

const SchemesListScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>योजनाएं / Schemes</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.subtitle}>
          Discover and track government schemes suitable for you.
        </Text>
        <View style={styles.list}>
          {SCHEMES.map((scheme) => (
            <TouchableOpacity
              key={scheme.id}
              style={styles.card}
              onPress={() => navigation.navigate('SchemeDetail', { schemeId: scheme.id, schemeName: scheme.title })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{scheme.title}</Text>
                {scheme.eligible && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Eligible</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardDesc}>{scheme.desc}</Text>
              <Text style={styles.cardLink}>View Details →</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  appBar: {
    height: 64,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
  },
  appBarTitle: { ...Typography.headlineSm, color: Colors.onSurface },
  container: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  subtitle: { ...Typography.bodyMd, color: Colors.textWarmGray, marginBottom: Spacing.lg },
  list: { gap: Spacing.md },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    shadowColor: Colors.onBackground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  cardTitle: { ...Typography.headlineSm, fontSize: 18, color: Colors.onSurface, flex: 1 },
  badge: { backgroundColor: Colors.tertiaryContainer, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { ...Typography.labelSm, color: Colors.onTertiary },
  cardDesc: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, marginBottom: Spacing.md },
  cardLink: { ...Typography.labelLg, color: Colors.primary },
});

export default SchemesListScreen;
