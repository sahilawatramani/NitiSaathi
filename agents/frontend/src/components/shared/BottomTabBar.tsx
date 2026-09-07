import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Link, usePathname } from 'expo-router';

const NAV_ITEMS = [
  { name: 'Home', hindi: 'गृह', route: '/', icon: 'home' },
  { name: 'Budget', hindi: 'बजट', route: '/budget', icon: 'payments' },
  { name: 'Assistant', hindi: 'साथी', route: '/assistant', icon: 'chat-bubble' },
  { name: 'Schemes', hindi: 'योजनाएं', route: '/schemes', icon: 'description' },
  { name: 'Fraud Check', hindi: 'धोखाधड़ी', route: '/fraud-check', icon: 'gpp-maybe' },
  { name: 'Nudges', hindi: 'सूचनाएं', route: '/nudges', icon: 'notifications' },
  { name: 'Reports', hindi: 'रिपोर्ट', route: '/reports', icon: 'download' },
  { name: 'Settings', hindi: 'सेटिंग्स', route: '/settings', icon: 'settings' },
];

export function BottomTabBar() {
  const pathname = usePathname();

  const isActive = (route: string) => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(route);
  };

  return (
    <View className="bg-background-off-white border-t border-outline-variant shadow-lg z-20 pb-safe">
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 8 }}
      >
        <View className="flex-row items-center space-x-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.route);
            return (
              <Link key={item.route} href={item.route as any} asChild>
                <Pressable
                  className={`flex-col items-center justify-center px-4 py-2 min-w-[72px] rounded-lg transition-all duration-200 ${
                    active ? 'bg-primary-container/10' : ''
                  }`}
                >
                  <View className={`px-4 py-1 rounded-full ${active ? 'bg-primary-container/20' : 'bg-transparent'}`}>
                    <MaterialIcons
                      name={item.icon as any}
                      size={24}
                      color={active ? '#a61c2e' : '#594140'}
                    />
                  </View>
                  <Text
                    className={`font-label-sm text-[10px] mt-1 text-center ${
                      active ? 'text-primary-container font-bold' : 'text-on-surface-variant'
                    }`}
                    numberOfLines={1}
                  >
                    {item.hindi}
                  </Text>
                </Pressable>
              </Link>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
