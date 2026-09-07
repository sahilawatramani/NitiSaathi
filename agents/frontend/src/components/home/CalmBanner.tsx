import React from 'react';
import { View, Text } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export interface CalmBannerProps {
  message: string;
}

export function CalmBanner({ message }: CalmBannerProps) {
  return (
    <View className="bg-tertiary-fixed/30 border-l-4 border-tertiary rounded-r-lg p-4 flex-row items-center gap-3 shadow-sm mb-2">
      <MaterialIcons name="check-circle" size={24} color="#004923" />
      <Text className="font-label-lg text-on-tertiary-fixed-variant text-[14px] font-semibold">
        {message}
      </Text>
    </View>
  );
}
