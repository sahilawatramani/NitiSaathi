import React from 'react';
import { View, Text, Pressable } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Link } from 'expo-router';

export interface CausalChainAlertProps {
  title: string;
  message: string;
}

export function CausalChainAlert({ title, message }: CausalChainAlertProps) {
  return (
    <View className="bg-[#F8D7DC] rounded-xl p-6 border-2 border-primary-container relative overflow-hidden flex-row items-start gap-4">
      {/* Background Icon */}
      <View className="absolute -right-10 -top-10 opacity-10 pointer-events-none">
        <MaterialIcons name="warning" size={120} color="#000" />
      </View>
      
      {/* Icon */}
      <View className="bg-primary-container rounded-full p-2 flex-shrink-0 mt-1">
        <MaterialIcons name="trending-up" size={24} color="white" />
      </View>
      
      {/* Content */}
      <View className="flex-1">
        <Text className="font-headline-sm text-headline-sm text-on-surface mb-2">
          {title}
        </Text>
        <Text className="font-body-md text-body-md text-on-surface-variant mb-4 max-w-3xl">
          {message}
        </Text>
        
        <Link href="/budget/causal-chain" asChild>
          <Pressable className="flex-row items-center gap-1 self-start active:opacity-70">
            <Text className="font-label-lg text-label-lg text-primary-container font-bold underline decoration-2">
              विस्तार से देखें / See details
            </Text>
            <MaterialIcons name="arrow-forward" size={18} color="#a61c2e" />
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
