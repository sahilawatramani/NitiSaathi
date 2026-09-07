import React from 'react';
import { View, Text, Pressable } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export interface UrgentBannerProps {
  title: string;
  message: string;
  actionText: string;
  secondaryActionText: string;
  onAction: () => void;
  onSecondaryAction: () => void;
}

export function UrgentBanner({ title, message, actionText, secondaryActionText, onAction, onSecondaryAction }: UrgentBannerProps) {
  return (
    <View className="bg-caution-tint border-l-4 border-primary-container rounded-r-lg p-6 shadow-sm flex-row items-start gap-4 w-full">
      <View className="bg-error/10 p-2 rounded-full mt-1">
        <MaterialIcons name="warning" size={24} color="#ba1a1a" />
      </View>
      <View className="flex-1">
        <Text className="font-headline-sm text-headline-sm text-error mb-1">{title}</Text>
        <Text className="font-body-md text-body-md text-on-surface">{message}</Text>
        <View className="mt-4 flex-row gap-4 flex-wrap">
          <Pressable onPress={onAction} className="bg-vivid-red px-6 py-2 rounded active:opacity-80">
            <Text className="text-white font-label-lg text-label-lg">{actionText}</Text>
          </Pressable>
          <Pressable onPress={onSecondaryAction} className="px-2 py-2">
            <Text className="text-on-surface-variant font-label-lg text-label-lg">{secondaryActionText}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
