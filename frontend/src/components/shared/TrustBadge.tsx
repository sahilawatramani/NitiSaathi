import React from 'react';
import { View, Text } from 'react-native';

interface TrustBadgeProps {
  confidenceLabel: string;
  dataFreshness: string;
  confidenceScore: number;
}

export function TrustBadge({ confidenceLabel, dataFreshness, confidenceScore }: TrustBadgeProps) {
  const getBadgeColor = () => {
    if (confidenceScore > 0.8) return 'bg-green-100 border-green-500 text-green-700';
    if (confidenceScore > 0.5) return 'bg-yellow-100 border-yellow-500 text-yellow-700';
    return 'bg-red-100 border-red-500 text-red-700';
  };

  return (
    <View className={`mt-1 flex-row items-center border rounded-full px-2 py-0.5 self-start ${getBadgeColor().split(' ').slice(0,2).join(' ')}`}>
      <Text className={`text-xs ${getBadgeColor().split(' ')[2]}`}>
        {confidenceLabel} • Data: {dataFreshness}
      </Text>
    </View>
  );
}
