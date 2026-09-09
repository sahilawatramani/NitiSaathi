import React from 'react';
import { View, Text } from 'react-native';

export interface IncomeMiniChartProps {
  data: { label: string; value: number }[];
}

export function IncomeMiniChart({ data }: IncomeMiniChartProps) {
  const maxVal = Math.max(...data.map(d => d.value), 5000);
  
  return (
    <View className="mt-8 border-t border-surface-container-high pt-8">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="font-headline-sm text-headline-sm text-on-surface">Income Forecast</Text>
        <View className="bg-surface-container-low px-4 py-2 rounded-lg">
          <Text className="text-label-lg font-label-lg text-on-surface">Last 4 Weeks</Text>
        </View>
      </View>
      
      <View className="h-48 w-full flex-row items-end justify-around relative pt-4 pb-8">
        {data.map((item, index) => {
          const heightPct = Math.max((item.value / maxVal) * 100, 5); // min height 5%
          const isPrediction = item.label === 'Prediction';
          return (
            <View key={index} className="items-center flex-1 h-full justify-end">
              <View className="w-full flex-1 justify-end items-center mb-2">
                <View 
                  className={`w-8 rounded-t-sm ${isPrediction ? 'bg-vivid-red opacity-80' : 'bg-primary-container opacity-50'}`} 
                  style={{ height: `${heightPct}%` }}
                />
              </View>
              <Text className="text-label-sm text-text-warm-gray font-label-sm absolute bottom-0">
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
