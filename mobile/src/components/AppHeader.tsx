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
  const [initial, setInitial] = useState<string>(() => (user?.email ? user.email[0] : 'K').toUpperCase());

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
            accessibilityLabel="Go Back"
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
        {/* Nudges / Alerts Bell */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate('Nudges')}
          accessibilityLabel="Open Nudges and Alerts"
          activeOpacity={0.7}
        >
          <Text style={styles.actionIcon}>🔔</Text>
          <View style={styles.badgeDot} />
        </TouchableOpacity>

        {/* Profile Avatar */}
        <TouchableOpacity
          style={styles.avatarCircle}
          onPress={() => navigation.navigate('Profile')}
          accessibilityLabel="Open User Profile"
          activeOpacity={0.7}
        >
          <Text style={styles.avatarText}>{initial}</Text>
        </TouchableOpacity>

        {/* Settings Gear */}
        <TouchableOpacity
          style={styles.gearBtn}
          onPress={() => navigation.navigate('Settings')}
          accessibilityLabel="Open Settings"
          activeOpacity={0.7}
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
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant + '40',
    zIndex: 50,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 1,
  },
  logoBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: Colors.onPrimary,
    fontWeight: '800',
    fontSize: 18,
  },
  backBtn: {
    padding: Spacing.xs,
    marginRight: Spacing.xs,
  },
  backText: {
    fontSize: 22,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  titleText: {
    ...Typography.headlineSm,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.sm + 4,
    minWidth: 120,
    flexShrink: 0,
  },
  iconBtn: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '30',
  },
  actionIcon: {
    fontSize: 18,
  },
  badgeDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: Colors.vividRed,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant + '60',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.onPrimary,
  },
  gearBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '30',
  },
  gearIcon: {
    fontSize: 18,
  },
});
