import React from 'react';
import { View, Text } from 'react-native';

export interface SavingsRateCardProps {
  percentage: number;
  message: string;
  current: number;
  target: number;
}

export function SavingsRateCard({ percentage, message, current, target }: SavingsRateCardProps) {
  return (
    <View className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-transparent hover:shadow-md hover:border-primary-container/10 transition-all">
      <Text className="font-headline-sm text-headline-sm text-on-surface mb-4">Savings Rate</Text>
      
      <View className="flex-row items-center gap-6">
        <View 
          className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-8 border-surface-container-high flex items-center justify-center"
          style={{ borderTopColor: '#82001b' }} // primary color for the top border
        >
          <Text className="font-display-lg text-[32px] sm:text-[48px] font-black text-on-surface">{percentage}%</Text>
        </View>
        
        <View className="flex-1">
          <Text className="font-body-md text-body-md text-text-warm-gray mb-2">
            {message}
          </Text>
          
          <View className="w-full bg-surface-container rounded-full h-2.5 mb-1 overflow-hidden flex-row">
            <View className="bg-primary h-2.5 rounded-l-full" style={{ width: `${percentage}%` }} />
          </View>
          
          <View className="flex-row justify-between mt-1">
            <Text className="font-label-sm text-label-sm text-text-warm-gray">Current: ₹{current}</Text>
            <Text className="font-label-sm text-label-sm text-text-warm-gray">Target: ₹{target}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
