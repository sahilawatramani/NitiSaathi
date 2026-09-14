/**
 * SchemeDetailScreen — Details about a specific scheme.
 * Pure single-language loaded dynamically via useTranslation().
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
import { useTranslation } from '../../i18n';

type Props = NativeStackScreenProps<SchemesStackParamList, 'SchemeDetail'>;

const SchemeDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { schemeName } = route.params;
  const { t } = useTranslation();

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
          <Text style={styles.cardTitle}>{t.schemes.title}</Text>
          <Text style={styles.desc}>
            {t.schemes.budgetGuidance} • {t.schemes.verified}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.cta}
          onPress={() => navigation.navigate('Assistant' as any)}
        >
          <Text style={styles.ctaText}>{t.schemes.applyNow}</Text>
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
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  cardTitle: { ...Typography.headlineSm, color: Colors.onSurface },
  desc: { ...Typography.bodyMd, color: Colors.textWarmGray, lineHeight: 22 },
  cta: {
    backgroundColor: Colors.primaryContainer,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  ctaText: { ...Typography.labelLg, color: Colors.onPrimary, fontWeight: '700' },
});

export default SchemeDetailScreen;
