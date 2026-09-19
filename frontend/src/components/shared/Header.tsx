import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, useWindowDimensions, Platform } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { getUserProfile } from '../../api/user';

interface HeaderProps {
  title: string;
  backTo?: string;
}

export function Header({ title, backTo }: HeaderProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === 'web' && width >= 768;
  const [initial, setInitial] = useState('U');

  useEffect(() => {
    let isMounted = true;
    getUserProfile()
      .then((p) => {
        if (isMounted && p?.full_name?.trim()) {
          setInitial(p.full_name.trim()[0].toUpperCase());
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  if (isWideWeb) {
    // ── Desktop web: title / back-arrow on left, bell + profile on right ─────
    return (
      <View className="bg-white border-b border-surface-container-high h-16 px-4 md:px-12 w-full flex-row justify-between items-center z-10">
        <View className="flex-row items-center gap-3">
          {backTo && (
            <Pressable
              onPress={() => router.push(backTo as any)}
              className="p-2 -ml-2 rounded-full active:bg-surface-container-low"
            >
              <MaterialIcons name="arrow-back" size={24} color="#1A1A1A" />
            </Pressable>
          )}
          <Text className="font-headline-sm text-headline-sm text-[#1A1A1A] font-semibold">
            {title}
          </Text>
        </View>

        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.push('/nudges' as any)}
            className="p-2 rounded-full active:bg-surface-container-low active:opacity-70 flex-row items-center gap-1"
          >
            <MaterialIcons name="notifications" size={24} color="#594140" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/settings' as any)}
            className="w-8 h-8 rounded-full bg-primary-container items-center justify-center border border-outline-variant active:opacity-70"
            accessibilityLabel="Open settings"
          >
            <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>
              {initial}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Native / narrow web: logo mark + title on left, bell + avatar on right ─
  return (
    <View className="bg-white border-b border-surface-container-high h-16 px-4 w-full flex-row justify-between items-center z-10">
      {/* Left side */}
      <View className="flex-row items-center gap-2 flex-1 mr-4" style={{ minWidth: 0 }}>
        {backTo ? (
          <Pressable
            onPress={() => router.push(backTo as any)}
            className="p-1 -ml-1 rounded-full active:bg-surface-container-low"
          >
            <MaterialIcons name="arrow-back" size={24} color="#1A1A1A" />
          </Pressable>
        ) : (
          /* Logo mark — icon-only brand mark */
          <View
            className="w-8 h-8 bg-primary rounded-lg items-center justify-center"
            style={{ flexShrink: 0 }}
          >
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800', lineHeight: 20 }}>
              N
            </Text>
          </View>
        )}
        <Text
          className="font-headline-sm text-headline-sm text-[#1A1A1A] font-semibold"
          numberOfLines={1}
          style={{ flexShrink: 1 }}
        >
          {title}
        </Text>
      </View>

      {/* Right side: bell + avatar */}
      <View className="flex-row items-center gap-1">
        <Pressable
          onPress={() => router.push('/nudges' as any)}
          className="p-2 rounded-full active:bg-surface-container-low active:opacity-70"
        >
          <MaterialIcons name="notifications" size={24} color="#594140" />
        </Pressable>

        {/* Profile avatar — tapping navigates to /settings */}
        <Pressable
          onPress={() => router.push('/settings' as any)}
          className="ml-1 active:opacity-70"
          accessibilityLabel="Open settings"
        >
          <View className="w-8 h-8 rounded-full bg-primary-container border border-outline-variant items-center justify-center">
            <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>
              {initial}
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}
