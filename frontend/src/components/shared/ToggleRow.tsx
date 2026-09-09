import React from 'react';
import { View, Text, Pressable } from 'react-native';

export interface ToggleRowProps {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
}

export function ToggleRow({ title, description, value, onValueChange }: ToggleRowProps) {
  return (
    <Pressable 
      onPress={() => onValueChange(!value)}
      className="flex-row items-center justify-between p-4 rounded-lg border border-transparent hover:border-primary-container/10 hover:bg-surface-container-low transition-all duration-200 group"
    >
      <View className="flex-col flex-1 pr-4">
        <Text className="font-label-lg text-label-lg text-on-background mb-1 group-hover:text-primary transition-colors">
          {title}
        </Text>
        <Text className="font-body-md text-body-md text-on-surface-variant text-[14px] leading-tight">
          {description}
        </Text>
      </View>
      <View className={`w-12 h-6 rounded-full flex-row items-center px-1 transition-colors ${value ? 'bg-primary-container' : 'bg-surface-container-highest'}`}>
        <View className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-6' : 'translate-x-0'}`} />
      </View>
    </Pressable>
  );
}
