import React from 'react';
import { View, Text } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export interface Nudge {
  id: number | string;
  type: 'urgent' | 'warning' | 'info';
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  message: string;
  time: string;
}

export interface RecentNudgesProps {
  nudges: Nudge[];
}

export function RecentNudges({ nudges }: RecentNudgesProps) {
  return (
    <View className="bg-surface-container-lowest rounded-xl p-stack-md shadow-sm border border-outline-variant/30 flex-1">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="font-headline-sm text-headline-sm text-on-surface">Action Required</Text>
        {nudges.length > 0 && (
          <View className="bg-error px-2 py-1 rounded-full">
            <Text className="text-white text-xs font-bold leading-none">{nudges.length}</Text>
          </View>
        )}
      </View>
      
      <View className="flex-col gap-4">
        {nudges.map(nudge => {
          let bgClass = 'bg-surface-variant';
          let iconColor = '#594140';
          
          if (nudge.type === 'urgent') {
            bgClass = 'bg-error/10';
            iconColor = '#ba1a1a'; // error
          } else if (nudge.type === 'warning') {
            bgClass = 'bg-secondary-fixed/50';
            iconColor = '#b7102a'; // secondary
          }
          
          return (
            <View 
              key={nudge.id} 
              className="bg-surface-container-low rounded-lg p-4 border border-outline-variant/50 hover:bg-surface-container transition-colors flex-row gap-4"
            >
              <View className={`${bgClass} p-2 rounded-full h-10 w-10 items-center justify-center`}>
                <MaterialIcons name={nudge.icon as any} size={20} color={iconColor} />
              </View>
              <View className="flex-1">
                <Text className="font-label-lg text-label-lg text-on-surface mb-1">
                  {nudge.title}
                </Text>
                <Text className="font-body-md text-sm text-text-warm-gray leading-tight">
                  {nudge.message}
                </Text>
                <Text className="font-label-sm text-xs text-text-warm-gray mt-2">
                  {nudge.time}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
