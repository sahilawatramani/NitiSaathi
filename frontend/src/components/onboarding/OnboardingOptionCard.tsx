import React from 'react';
import { View, Text, Pressable } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface OnboardingOptionCardProps {
  value: string;
  title: string;
  subtitle: string;
  isSelected: boolean;
  onSelect: (value: string) => void;
  variant?: 'language' | 'literacy';
}

export function OnboardingOptionCard({
  value,
  title,
  subtitle,
  isSelected,
  onSelect,
  variant = 'language'
}: OnboardingOptionCardProps) {
  
  if (variant === 'literacy') {
    return (
      <Pressable
        onPress={() => onSelect(value)}
        className={`relative flex-row items-center p-4 border rounded-lg transition-all ${
          isSelected
            ? "bg-caution-tint border-primary-container"
            : "bg-surface-container-lowest border-outline-variant hover:border-primary-container hover:shadow-sm"
        }`}
      >
        <View className="flex-1">
          <Text className={`font-body-md text-body-md font-medium ${isSelected ? "text-primary" : "text-on-surface"}`}>
            {title}
          </Text>
          <Text className={`font-label-sm text-label-sm mt-1 ${isSelected ? "text-primary/80" : "text-on-surface-variant"}`}>
            {subtitle}
          </Text>
        </View>
        <MaterialIcons 
          name="check-circle" 
          size={24} 
          color="#a61c2e" 
          style={{ opacity: isSelected ? 1 : 0, marginLeft: 16 }} 
        />
      </Pressable>
    );
  }

  // Default: 'language' variant
  return (
    <Pressable
      onPress={() => onSelect(value)}
      className={`relative group rounded-lg p-stack-md flex-col items-center justify-center transition-all h-28 border-2 ${
        isSelected
          ? "bg-primary-container border-primary-container shadow-[0px_4px_12px_rgba(166,28,46,0.15)] ring-2 ring-primary-container ring-offset-2 ring-offset-surface-container-lowest"
          : "bg-surface border-surface-variant hover:border-outline hover:bg-surface-container-low hover:shadow-sm"
      }`}
    >
      <Text className={`font-headline-md text-headline-md mb-1 ${isSelected ? "text-on-primary" : "text-text-warm-gray group-hover:text-on-surface transition-colors"}`}>
        {title}
      </Text>
      <Text className={`font-label-sm text-label-sm ${isSelected ? "text-on-primary opacity-90" : "text-text-warm-gray"}`}>
        {subtitle}
      </Text>
      {isSelected && (
        <View className="absolute -top-3 -right-3 bg-surface-container-lowest border border-surface-variant rounded-full w-7 h-7 flex items-center justify-center shadow-sm">
          <MaterialIcons name="check" size={16} color="#a61c2e" />
        </View>
      )}
    </Pressable>
  );
}
