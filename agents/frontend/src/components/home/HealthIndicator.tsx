import React from 'react';
import { View, Text } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export interface HealthIndicatorProps {
  type: 'urgent' | 'calm';
  status: string;
  message: string;
}

export function HealthIndicator({ type, status, message }: HealthIndicatorProps) {
  const isUrgent = type === 'urgent';
  
  const borderColor = isUrgent ? 'border-primary-container' : 'border-tertiary';
  const iconColor = isUrgent ? '#a61c2e' : '#004923';
  const badgeBg = isUrgent ? 'bg-error/10' : 'bg-tertiary-fixed/30';
  const badgeIcon = isUrgent ? 'warning' : 'savings';
  const badgeIconColor = isUrgent ? '#ba1a1a' : '#004923';
  const badgeTextColor = isUrgent ? 'text-error' : 'text-tertiary';

  return (
    <View className="bg-background-off-white rounded-xl p-6 border border-outline-variant/30 flex-col items-center text-center mt-8">
      <View className={`w-16 h-16 bg-surface rounded-full shadow-sm flex items-center justify-center mb-4 border-2 ${borderColor}`}>
        <MaterialIcons name="speed" size={32} color={iconColor} />
      </View>
      <Text className="font-headline-sm text-headline-sm text-on-surface mb-2">
        Financial Health
      </Text>
      <View className={`flex-row items-center gap-2 ${badgeBg} px-4 py-1.5 rounded-full`}>
        <MaterialIcons name={badgeIcon as any} size={18} color={badgeIconColor} />
        <Text className={`${badgeTextColor} font-label-lg text-label-lg`}>{status}</Text>
      </View>
      <Text className="font-body-md text-sm text-text-warm-gray mt-4 text-center">
        {message}
      </Text>
    </View>
  );
}
