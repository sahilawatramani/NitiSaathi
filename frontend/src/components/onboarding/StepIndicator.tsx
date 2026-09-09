import React from 'react';
import { View, Text, Pressable } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
}

export function StepIndicator({ currentStep, totalSteps, onBack }: StepIndicatorProps) {
  return (
    <View className="w-full flex-row items-center justify-between mb-stack-lg">
      <Pressable onPress={onBack} className="p-2 -ml-2 rounded-full hover:bg-surface-container-low transition-colors">
        <MaterialIcons name="arrow-back" size={24} color="#1c1b1b" />
      </Pressable>
      <View className="flex-col items-end">
        <Text className="text-label-sm font-label-sm text-text-warm-gray uppercase tracking-wider mb-1">
          Step {currentStep} of {totalSteps}
        </Text>
        <View className="flex-row gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              className={`w-4 h-1 rounded-full ${
                i + 1 <= currentStep ? 'bg-[#E63946]' : 'bg-surface-variant'
              }`}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
