import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import ExpenseDonut from './ExpenseDonut';

export interface ExpenseBreakdownProps {
  total: number;
  categories: { name: string; percentage: number; color: string }[];
}

export function ExpenseBreakdown({ total, categories }: ExpenseBreakdownProps) {
  return (
    <View className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-transparent flex-1 min-h-[400px]">
      <Text className="font-headline-sm text-headline-sm text-on-surface mb-6">
        Expense Breakdown
      </Text>
      
      {/* Donut Chart */}
      <View className="flex-row justify-center mb-6">
        <ExpenseDonut total={total} categories={categories} />
      </View>
      
      {/* Category List */}
      <ScrollView className="flex-1" contentContainerStyle={{ gap: 8 }}>
        {categories.map((cat, i) => (
          <View key={i} className="flex-row justify-between items-center p-2 rounded hover:bg-surface-container-low">
            <View className="flex-row items-center gap-3">
              <View className={`w-3 h-3 rounded-full ${cat.color}`} />
              <Text className="font-label-lg text-label-lg text-on-surface">
                {cat.name}
              </Text>
            </View>
            <Text className="font-body-md text-body-md text-on-surface">
              {cat.percentage}%
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
