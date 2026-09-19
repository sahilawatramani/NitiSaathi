import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Link, usePathname, useRouter } from 'expo-router';
import { getUserProfile } from '../../api/user';

const NAV_ITEMS = [
  { name: 'Home',        hindi: 'गृह',           route: '/',           icon: 'home'         },
  { name: 'Budget',      hindi: 'बजट',           route: '/budget',     icon: 'payments'     },
  { name: 'Assistant',   hindi: 'साथी',          route: '/assistant',  icon: 'chat-bubble'  },
  { name: 'Schemes',     hindi: 'योजनाएं',      route: '/schemes',    icon: 'description'  },
  { name: 'Nudges',      hindi: 'सूचनाएं',      route: '/nudges',     icon: 'notifications'},
  { name: 'Fraud Check', hindi: 'धोखाधड़ी जांच', route: '/fraud-check', icon: 'gpp-maybe'  },
  { name: 'Reports',     hindi: 'रिपोर्ट',       route: '/reports',    icon: 'download'     },
  { name: 'Profile',     hindi: 'प्रोफ़ाइल',     route: '/settings',   icon: 'person'       },
];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [profileName, setProfileName] = useState('User');

  useEffect(() => {
    let isMounted = true;
    getUserProfile()
      .then((p) => {
        if (isMounted && p?.full_name?.trim()) {
          setProfileName(p.full_name.trim());
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const isActive = (route: string) => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(route);
  };

  const initial = (profileName ? profileName[0] : 'U').toUpperCase();

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
        </View>
      </ScrollView>

      {/* Profile block at bottom */}
      <Pressable
        onPress={() => router.push('/settings' as any)}
        className={`p-6 border-t border-outline-variant mt-auto active:opacity-70 ${
          isActive('/settings') ? 'bg-primary-container/10' : 'hover:bg-black/5'
        }`}
        accessibilityLabel="Open settings"
      >
        <View className="flex-row items-center gap-3 px-2">
          <View className="w-8 h-8 rounded-full bg-primary-container items-center justify-center border border-outline-variant">
            <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>
              {initial}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="font-label-lg text-label-lg text-[#1A1A1A] font-semibold" numberOfLines={1}>
              {profileName}
            </Text>
            <Text className="font-label-sm text-[11px] text-on-surface-variant">
              प्रोफ़ाइल व सेटिंग्स →
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}
