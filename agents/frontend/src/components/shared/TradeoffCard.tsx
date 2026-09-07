import React from 'react';
import { View, Text } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export interface TradeoffCardProps {
  headerText: string;
  reasoningBody: string;
  icon?: string;
}

export function TradeoffCard({ headerText, reasoningBody, icon = 'balance' }: TradeoffCardProps) {
  return (
    <View className="bg-[#F8D7DC]/40 border border-caution-tint rounded-lg p-3 mb-4">
      <View className="flex-row items-center gap-2 mb-2">
        <MaterialIcons name={icon as any} size={16} color="#b7102a" />
        <Text className="font-label-lg text-label-lg text-on-background shrink">
          {headerText}
        </Text>
      </View>
      <Text className="font-body-md text-body-md text-on-surface-variant">
        {reasoningBody}
      </Text>
    </View>
  );
}
