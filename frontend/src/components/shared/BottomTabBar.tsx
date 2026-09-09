import React from 'react';
import { View, Text, Pressable } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Link, usePathname } from 'expo-router';

const NAV_ITEMS = [
  { name: 'Home',       hindi: 'गृह',      route: '/',           icon: 'home'        },
  { name: 'Budget',     hindi: 'बजट',      route: '/budget',     icon: 'payments'    },
  { name: 'Assistant',  hindi: 'साथी',     route: '/assistant',  icon: 'chat-bubble' },
  { name: 'Schemes',    hindi: 'योजनाएं', route: '/schemes',    icon: 'description' },
  { name: 'Fraud Check', hindi: 'जांच',   route: '/fraud-check', icon: 'gpp-maybe'  },
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
      {/*
        No ScrollView — use a plain flex-row so items fill the full width evenly.
        flex:1 on each item ensures 4 equal slots regardless of screen width.
        This eliminates all horizontal overflow on narrow phones (360-390px).
      */}
      <View style={{ flexDirection: 'row' }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.route);
          return (
            <Link key={item.route} href={item.route as any} asChild>
              <Pressable
                style={{ flex: 1 }}
                className={`flex-col items-center justify-center py-2 rounded-lg transition-all duration-200 ${
                  active ? 'bg-primary-container/10' : ''
                }`}
                accessibilityLabel={`${item.name} tab`}
              >
                <View className={`px-3 py-1 rounded-full ${active ? 'bg-primary-container/20' : 'bg-transparent'}`}>
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
    </View>
  );
}

