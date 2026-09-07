import React from 'react';
import { View, Text } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export interface BalanceDisplayProps {
  balance: number;
}

export function BalanceDisplay({ balance }: BalanceDisplayProps) {
  return (
    <View className="flex-row justify-between items-start mb-6">
      <View>
        <Text className="font-label-lg text-label-lg text-text-warm-gray uppercase tracking-wider mb-2">
          Available Balance
        </Text>
        <Text className="font-display-lg text-display-lg text-primary-container group-hover:text-vivid-red transition-colors">
          ₹{balance.toFixed(2)}
        </Text>
      </View>
      <View className="bg-surface-container p-3 rounded-full">
        <MaterialIcons name="account-balance" size={28} color="#594140" />
      </View>
    </View>
  );
}
