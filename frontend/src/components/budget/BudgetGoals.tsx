import React from 'react';
import { View, Text, Pressable } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export interface BudgetGoalsProps {
  goals: any[];
}

export function BudgetGoals({ goals }: BudgetGoalsProps) {
  return (
    <View className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-transparent">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="font-headline-sm text-headline-sm text-on-surface">Financial Goals</Text>
        <Pressable className="bg-vivid-red py-2 px-4 rounded-lg flex-row items-center gap-1 shadow-sm active:opacity-80">
          <MaterialIcons name="add" size={18} color="white" />
          <Text className="text-white font-label-lg text-label-lg">नया लक्ष्य</Text>
        </Pressable>
      </View>
      
      <View className="flex-col gap-3">
        {goals.map((goal, i) => (
          <Pressable 
            key={i}
            className="border border-surface-variant rounded-lg p-4 bg-[#F7F5F2] hover:border-primary-fixed-dim"
          >
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-row items-center gap-2">
                <MaterialIcons 
                  name={goal.icon.replace('-', '_') as any} 
                  size={20} 
                  color={
                    goal.color === 'primary' ? '#a61c2e' : 
                    goal.color === 'secondary' ? '#b7102a' : 
                    goal.color === 'tertiary' ? '#004923' : '#6B6560'
                  } 
                />
                <Text className="font-label-lg text-label-lg text-on-surface">{goal.title}</Text>
              </View>
              <Text className="font-label-sm text-label-sm font-bold">{goal.percentage}%</Text>
            </View>
            
            <View className="w-full bg-surface-container-high rounded-full h-2 mb-1 overflow-hidden flex-row">
              <View className={`h-2 rounded-l-full bg-${goal.color}`} style={{ width: `${goal.percentage}%` }} />
            </View>
            
            <Text className="font-label-sm text-label-sm text-text-warm-gray text-right">
              ₹{goal.current} / ₹{goal.target}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
