/**
 * NudgesScreen — Dedicated notification feed for nudges.
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
import type { MoreStackParamList } from '../../navigation/MainNavigator';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

type Props = NativeStackScreenProps<MoreStackParamList, 'Nudges'>;

const MOCK_NUDGES = [
  { id: 1, title: 'Low Balance', desc: 'Your balance is critically low for auto-debit.', type: 'urgent' },
  { id: 2, title: 'Earnings Dip', desc: 'Your earnings are down 12% compared to last week.', type: 'warning' },
  { id: 3, title: 'Scheme Eligible', desc: 'You qualify for PMJJBY based on your profile.', type: 'info' },
];

const NudgesScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>सूचनाएं / Nudges</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        {MOCK_NUDGES.map(nudge => {
          let bgColor: string = Colors.surfaceContainerLow;
          let iconColor: string = Colors.onSurfaceVariant;
          let iconBg: string = Colors.surfaceVariant;
          if (nudge.type === 'urgent') {
            bgColor = Colors.errorContainer;
            iconColor = Colors.error;
            iconBg = `${Colors.error}40`;
          } else if (nudge.type === 'warning') {
            bgColor = Colors.cautionTint;
            iconColor = Colors.secondary;
            iconBg = `${Colors.secondary}40`;
          }

          return (
            <View key={nudge.id} style={[styles.nudgeCard, { backgroundColor: bgColor }]}>
              <View style={[styles.iconBg, { backgroundColor: iconBg }]}>
                <Text style={styles.icon}>🔔</Text>
              </View>
              <View style={styles.content}>
                <Text style={styles.title}>{nudge.title}</Text>
                <Text style={styles.desc}>{nudge.desc}</Text>
              </View>
            </View>
          );
        })}
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
  nudgeCard: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    gap: Spacing.md,
  },
  iconBg: { padding: Spacing.sm, borderRadius: 24, height: 48, width: 48, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 24 },
  content: { flex: 1 },
  title: { ...Typography.headlineSm, fontSize: 18, color: Colors.onSurface, marginBottom: 4 },
  desc: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
});

export default NudgesScreen;
