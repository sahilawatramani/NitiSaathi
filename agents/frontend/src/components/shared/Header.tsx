import React from 'react';
import { View, Text, Pressable } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';

interface HeaderProps {
  title: string;
  backTo?: string;
}

export function Header({ title, backTo }: HeaderProps) {
  const router = useRouter();

  return (
    <View className="bg-white border-b border-surface-container-high h-16 px-4 md:px-12 w-full flex-row justify-between items-center z-10">
      <View className="flex-row items-center gap-3">
        {backTo && (
          <Pressable 
            onPress={() => router.push(backTo as any)}
            className="p-2 -ml-2 rounded-full active:bg-surface-container-low"
          >
            <MaterialIcons name="arrow-back" size={24} color="#1A1A1A" />
          </Pressable>
        )}
        <Text className="font-headline-sm text-headline-sm text-[#1A1A1A] font-semibold">
          {title}
        </Text>
      </View>
      
      <View className="flex-row items-center">
        <Pressable className="p-2 rounded-full active:bg-surface-container-low active:opacity-70">
          <MaterialIcons name="notifications" size={24} color="#594140" />
        </Pressable>
      </View>
    </View>
  );
}
