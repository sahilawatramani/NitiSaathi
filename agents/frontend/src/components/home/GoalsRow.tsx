import React from 'react';
import { View, Text } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export interface Goal {
  id: number | string;
  title: string;
  current: number;
  target: number;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: 'tertiary' | 'secondary' | 'primary';
  critical?: boolean;
}

export interface GoalsRowProps {
  goals: Goal[];
}

export function GoalsRow({ goals }: GoalsRowProps) {
  return (
    <View className="flex-row flex-wrap gap-6">
      {goals.map(goal => {
        const progressPct = Math.min((goal.current / goal.target) * 100, 100);
        
        let iconBgColor = 'bg-primary-container/30';
        let iconColor = '#a61c2e';
        let barColor = 'bg-primary-container';
        
        if (goal.color === 'tertiary') {
          iconBgColor = 'bg-tertiary-fixed/30';
          iconColor = '#004923';
          barColor = 'bg-tertiary';
        } else if (goal.color === 'secondary') {
          iconBgColor = 'bg-secondary-fixed/30';
          iconColor = '#b7102a';
          barColor = 'bg-secondary';
        }
        
        return (
          <View 
            key={goal.id} 
            className="flex-1 min-w-[250px] bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/30"
          >
            <View className="flex-row items-center gap-4 mb-4">
              <View className={`${iconBgColor} p-2 rounded-lg`}>
                <MaterialIcons name={goal.icon as any} size={24} color={iconColor} />
              </View>
              <Text className="font-headline-sm text-headline-sm text-on-surface flex-1">
                {goal.title}
              </Text>
            </View>
            
            <View className="w-full bg-surface-container-high rounded-full h-2 mb-2 overflow-hidden">
              <View className={`${barColor} h-2 rounded-full`} style={{ width: `${progressPct}%` }} />
            </View>
            
            <View className="flex-row justify-between font-label-sm text-label-sm mt-2">
              {goal.critical ? (
                <Text className="text-error font-medium">Critical</Text>
              ) : (
                <Text className="text-text-warm-gray">₹{goal.current} saved</Text>
              )}
              <Text className="text-text-warm-gray">Goal: ₹{goal.target}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
