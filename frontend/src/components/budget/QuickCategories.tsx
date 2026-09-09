import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export function QuickCategories() {
  const categories = [
    { name: 'Fuel', icon: 'local-gas-station' },
    { name: 'Recharge', icon: 'phone-iphone' },
    { name: 'Food', icon: 'restaurant' },
    { name: 'Rent', icon: 'home-work' }
  ];

  return (
    <View className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-transparent">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', gap: 16 }}>
        <Text className="font-label-lg text-label-lg text-on-surface mr-2">Quick Categories:</Text>
        
        <View className="flex-row gap-2 flex-wrap sm:flex-nowrap">
          {categories.map((cat, i) => (
            <Pressable 
              key={i} 
              className="px-3 py-1.5 rounded-full bg-surface-container-low border border-surface-variant flex-row items-center gap-1 active:bg-surface-container"
            >
              <MaterialIcons name={cat.icon.replace('-', '_') as any} size={16} color="#6B6560" />
              <Text className="font-label-sm text-label-sm text-on-surface">{cat.name}</Text>
            </Pressable>
          ))}
          
          <Pressable className="px-3 py-1.5 rounded-full bg-background border border-dashed border-primary flex-row items-center gap-1 active:bg-surface-container-low">
            <MaterialIcons name="add" size={16} color="#82001b" />
            <Text className="font-label-sm text-label-sm text-primary">Manage</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
