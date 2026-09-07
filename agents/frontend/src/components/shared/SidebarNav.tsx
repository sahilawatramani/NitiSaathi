import React from 'react';
import { View, Text, Pressable, Image, ScrollView } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Link, usePathname } from 'expo-router';

const NAV_ITEMS = [
  { name: 'Home', hindi: 'गृह', route: '/', icon: 'home' },
  { name: 'Budget', hindi: 'बजट', route: '/budget', icon: 'payments' },
  { name: 'Assistant', hindi: 'साथी', route: '/assistant', icon: 'chat-bubble' },
  { name: 'Schemes', hindi: 'योजनाएं', route: '/schemes', icon: 'description' },
  { name: 'Fraud Check', hindi: 'धोखाधड़ी जांच', route: '/fraud-check', icon: 'gpp-maybe' },
  { name: 'Nudges', hindi: 'सूचनाएं', route: '/nudges', icon: 'notifications' },
  { name: 'Reports', hindi: 'रिपोर्ट', route: '/reports', icon: 'download' },
];

export function SidebarNav() {
  const pathname = usePathname();

  const isActive = (route: string) => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(route);
  };

  return (
    <View className="w-[260px] bg-background-off-white h-full border-r border-outline-variant shadow-sm z-20 flex-col">
      <View className="px-6 py-8 flex-col items-start justify-center border-b border-outline-variant">
        <Text className="font-headline-md text-headline-md text-primary font-bold tracking-tight">
          nitisaathi
        </Text>
      </View>

      <ScrollView className="flex-1 py-4" showsVerticalScrollIndicator={false}>
        <View className="flex-col space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.route);
            return (
              <Link key={item.route} href={item.route as any} asChild>
                <Pressable
                  className={`flex-row items-center gap-3 px-6 py-3 transition-all duration-200 ${
                    active
                      ? 'bg-primary-container/10 border-l-4 border-primary-container'
                      : 'hover:bg-black/5 border-l-4 border-transparent'
                  }`}
                >
                  <MaterialIcons
                    name={item.icon as any}
                    size={24}
                    color={active ? '#a61c2e' : '#1A1A1A'}
                  />
                  <Text
                    className={`font-label-lg text-label-lg ${
                      active ? 'text-primary-container font-bold' : 'text-[#1A1A1A]'
                    }`}
                  >
                    {item.hindi} / {item.name}
                  </Text>
                </Pressable>
              </Link>
            );
          })}

          <View className="border-t border-outline-variant my-2" />

          <Link href="/settings" asChild>
            <Pressable
              className={`flex-row items-center gap-3 px-6 py-3 transition-all duration-200 ${
                isActive('/settings')
                  ? 'bg-primary-container/10 border-l-4 border-primary-container'
                  : 'hover:bg-black/5 border-l-4 border-transparent'
              }`}
            >
              <MaterialIcons
                name="settings"
                size={24}
                color={isActive('/settings') ? '#a61c2e' : '#1A1A1A'}
              />
              <Text
                className={`font-label-lg text-label-lg ${
                  isActive('/settings') ? 'text-primary-container font-bold' : 'text-[#1A1A1A]'
                }`}
              >
                सेटिंग्स / Settings
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>

      <View className="p-6 border-t border-outline-variant mt-auto">
        <View className="flex-row items-center gap-3 px-2">
          <View className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant">
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCBTqmbzH-gOCdNdGwJ0DRQGIqnk-mqSnkZa3xTE090REW6Fpkvd7jtU-hEEWLhxSFp08MgjMr5GCXmToAla2n9K5zqNk4-8qb8mbuEX6ptVfGqTK6hkZVzjy-aX5rhAxHp2pjHe98Q3NG4srZfta9wL7pktaHCBWLjSFIfxkTdfb-09mC6KQV6SBPbTBX-reAk5hHkuVOrxJmsfC7hj8jvMpNt_pSlPRCPOW1O3hNenwuPYYRbuOINcA' }}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
          <Text className="font-label-lg text-label-lg text-[#1A1A1A] font-semibold">
            राजेश
          </Text>
        </View>
      </View>
    </View>
  );
}
