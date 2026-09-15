import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profileService';

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ title, showBack, onBack }) => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [initial, setInitial] = useState<string>(() => (user?.email ? user.email[0] : 'U').toUpperCase());

  useEffect(() => {
    let isMounted = true;
    profileService.get().then((p) => {
      if (isMounted && p?.full_name?.trim()) {
        setInitial(p.full_name.trim()[0].toUpperCase());
      } else if (isMounted && user?.email) {
        setInitial(user.email[0].toUpperCase());
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, [user?.email]);

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftRow}>
        {showBack ? (
          <TouchableOpacity
            onPress={onBack || (() => navigation.goBack())}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>N</Text>
          </View>
        )}
        <Text style={styles.titleText}>{title}</Text>
      </View>

      <View style={styles.rightActions}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate('Nudges')}
        >
          <Text style={styles.actionIcon}>🔔</Text>
          <View style={styles.badgeDot} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.avatarCircle}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.avatarText}>{initial}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gearBtn}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.gearIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant + '40',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: Colors.onPrimary,
    fontWeight: '800',
    fontSize: 16,
  },
  backBtn: {
    padding: Spacing.xs,
    marginRight: Spacing.xs,
  },
  backText: {
    fontSize: 22,
    color: Colors.onSurface,
  },
  titleText: {
    ...Typography.headlineSm,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBtn: {
    position: 'relative',
    padding: 6,
  },
  actionIcon: {
    fontSize: 18,
  },
  badgeDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.vividRed,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0D5D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  gearBtn: {
    padding: 6,
  },
  gearIcon: {
    fontSize: 18,
  },
});
