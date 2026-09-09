import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable, Image } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { getUserSettings, updateUserSettings } from '../../api/user';
import { ToggleRow } from '../../components/shared/ToggleRow';
import { AppLayout } from '../../components/shared/AppLayout';
import { useAuth } from '../../context/AuthContext';

export default function SettingsScreen() {
  const { logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [consent, setConsent] = useState({
    transaction: false,
    eligibility: false,
    fraud: false,
    notifications: false,
    reports: false
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getUserSettings();
        if (data && data.consents && Array.isArray(data.consents)) {
          const consentMap: any = {
            transaction: false,
            eligibility: false,
            fraud: false,
            notifications: false,
            reports: false
          };
          data.consents.forEach((c: any) => {
            if (consentMap[c.purpose] !== undefined) {
              consentMap[c.purpose] = c.granted;
            }
          });
          setConsent(consentMap);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleToggle = (key: keyof typeof consent) => {
    const newState = { ...consent, [key]: !consent[key] };
    setConsent(newState);
    // Optimistically update backend
    updateUserSettings({ consents: { [key]: newState[key] } });
  };

  if (loading) {
    return (
      <AppLayout title="सेटिंग्स / Settings" hideHeader>
        <View className="flex-1 bg-surface-container-lowest justify-center items-center">
          <ActivityIndicator size="large" color="#a61c2e" />
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="सेटिंग्स / Settings">

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 32, gap: 32 }} className="bg-surface-container-lowest">
        
        {/* Profile Strip */}
        <View className="bg-surface rounded-xl p-6 shadow-sm border border-surface-container-high flex-row flex-wrap sm:flex-nowrap items-center justify-between gap-4">
          <View className="flex-row items-center gap-6">
            <View className="w-16 h-16 rounded-full overflow-hidden border-2 border-surface-container-high shrink-0">
              <Image 
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCBTqmbzH-gOCdNdGwJ0DRQGIqnk-mqSnkZa3xTE090REW6Fpkvd7jtU-hEEWLhxSFp08MgjMr5GCXmToAla2n9K5zqNk4-8qb8mbuEX6ptVfGqTK6hkZVzjy-aX5rhAxHp2pjHe98Q3NG4srZfta9wL7pktaHCBWLjSFIfxkTdfb-09mC6KQV6SBPbTBX-reAk5hHkuVOrxJmsfC7hj8jvMpNt_pSlPRCPOW1O3hNenwuPYYRbuOINcA' }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
            <View>
              <Text className="font-headline-sm text-headline-sm text-on-surface">राजेश</Text>
              <Text className="font-body-md text-body-md text-text-warm-gray mt-1">Gig Worker Profile</Text>
            </View>
          </View>
          <Pressable className="rounded px-3 py-2 active:bg-surface-container-high">
            <Text className="font-label-lg text-label-lg text-primary hover:text-primary-container transition-colors">
              प्रोफाइल संपादित करें / Edit profile
            </Text>
          </Pressable>
        </View>

        {/* Two-Column Settings Layout */}
        <View className="flex-col md:flex-row gap-6 items-start">
          
          {/* Left Sidebar Menu */}
          <View className="w-full md:w-[280px] shrink-0 flex-col gap-2">
            <View className="bg-surface rounded-xl shadow-sm border border-surface-container-high p-2 overflow-hidden flex-col gap-1">
              
              <Pressable className="flex-row items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface-container-low transition-colors">
                <MaterialIcons name="language" size={24} color="#6B6560" />
                <Text className="font-label-lg text-label-lg text-on-surface-variant">भाषा / Language</Text>
              </Pressable>
              
              <Pressable className="flex-row items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface-container-low transition-colors">
                <MaterialIcons name="accessibility-new" size={24} color="#6B6560" />
                <Text className="font-label-lg text-label-lg text-on-surface-variant">पहुंच / Accessibility</Text>
              </Pressable>
              
              {/* Active Tab */}
              <Pressable className="flex-row items-center gap-3 px-4 py-3 rounded-lg bg-[#a61c2e]/10 border-l-4 border-primary transition-colors">
                <MaterialIcons name="shield" size={24} color="#82001b" />
                <Text className="font-label-lg text-label-lg font-bold text-primary">सहमति और गोपनीयता / Consent & Privacy</Text>
              </Pressable>
              
              <Pressable className="flex-row items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface-container-low transition-colors">
                <MaterialIcons name="notifications" size={24} color="#6B6560" />
                <Text className="font-label-lg text-label-lg text-on-surface-variant">सूचनाएं / Notifications</Text>
              </Pressable>
              
            </View>
            <View className="px-4 py-2 mt-2">
              <Text className="font-label-sm text-label-sm text-text-warm-gray">Version 1.2.0</Text>
            </View>
          </View>

          {/* Right Content Panel (Consent & Privacy) */}
          <View className="flex-1 w-full bg-surface rounded-xl shadow-sm border border-surface-container-high overflow-hidden hover:border-primary/10 transition-colors">
            
            <View className="p-8 border-b border-surface-container-high bg-white">
              <Text className="font-headline-sm text-headline-sm text-on-surface mb-2">
                सहमति और गोपनीयता / Consent & Privacy
              </Text>
              <Text className="font-body-md text-body-md text-text-warm-gray">
                Manage what data NitiSaathi can access to provide your services.
              </Text>
            </View>
            
            <View className="flex-col">
              <View className="px-4 py-2 border-b border-surface-container-low bg-surface-bright">
                <ToggleRow 
                  title="लेनदेन डेटा / Transaction data"
                  description="Allow access to transaction history for budgeting tools."
                  value={consent.transaction}
                  onValueChange={() => handleToggle('transaction')}
                />
              </View>
              
              <View className="px-4 py-2 border-b border-surface-container-low bg-background-off-white">
                <ToggleRow 
                  title="योजना पात्रता / Scheme eligibility"
                  description="Share profile data to check eligibility for government schemes."
                  value={consent.eligibility}
                  onValueChange={() => handleToggle('eligibility')}
                />
              </View>
              
              <View className="px-4 py-2 border-b border-surface-container-low bg-surface-bright">
                <ToggleRow 
                  title="धोखाधड़ी का पता लगाना / Fraud detection"
                  description="Enable real-time scanning of messages for potential scams."
                  value={consent.fraud}
                  onValueChange={() => handleToggle('fraud')}
                />
              </View>
              
              <View className="px-4 py-2 border-b border-surface-container-low bg-background-off-white">
                <ToggleRow 
                  title="सूचनाएं / Notifications"
                  description="Receive alerts for budget limits and scheme updates."
                  value={consent.notifications}
                  onValueChange={() => handleToggle('notifications')}
                />
              </View>
              
              <View className="px-4 py-2 border-b border-surface-container-low bg-surface-bright">
                <ToggleRow 
                  title="मासिक रिपोर्ट / Monthly report"
                  description="Compile and send a monthly financial health summary."
                  value={consent.reports}
                  onValueChange={() => handleToggle('reports')}
                />
              </View>
              
              {/* Info Link Row */}
              <Pressable className="px-8 py-5 border-b border-surface-container-high flex-row items-center justify-between bg-white hover:bg-surface-container-low transition-colors group">
                <Text className="font-label-lg text-label-lg text-on-surface group-hover:text-primary transition-colors">
                  आपका डेटा कैसे उपयोग होता है / How your data is used
                </Text>
                <MaterialIcons name="chevron-right" size={24} color="#6B6560" />
              </Pressable>
              
              {/* Log Out — non-destructive, separate from Danger Zone */}
              <View className="bg-surface-container-low border border-outline-variant rounded-xl p-6 flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <MaterialIcons name="logout" size={22} color="#594140" />
                  <View>
                    <Text className="font-label-lg text-label-lg text-on-surface font-semibold">
                      लॉगआउट / Log out
                    </Text>
                    <Text className="font-label-sm text-[12px] text-on-surface-variant mt-0.5">
                      You can log back in at any time.
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={async () => {
                    try {
                      await logout();
                      router.replace('/onboarding' as any);
                    } catch (e) {
                      console.error('Logout error', e);
                    }
                  }}
                  className="bg-surface-container border border-outline-variant rounded-lg px-4 py-2 active:opacity-70"
                >
                  <Text className="font-label-lg text-label-lg text-on-surface">
                    Log out
                  </Text>
                </Pressable>
              </View>

              {/* Danger Zone */}
              <View className="bg-[#FEF2F2] border-t border-[#ba1a1a]/20 p-8">
                <Text className="font-headline-sm text-headline-sm text-[#ba1a1a] mb-4">
                  Danger Zone
                </Text>
                <View className="flex-col gap-4">
                  <Pressable className="active:opacity-70">
                    <Text className="font-label-lg text-label-lg text-[#ba1a1a] hover:underline">
                      मेरा डेटा हटाएं / Delete my data
                    </Text>
                  </Pressable>
                  <Pressable className="active:opacity-70">
                    <Text className="font-label-lg text-label-lg text-[#ba1a1a] hover:underline">
                      मेरा खाता हटाएं / Delete my account
                    </Text>
                  </Pressable>
                </View>
              </View>
              
            </View>
          </View>
          
        </View>
      </ScrollView>
    </AppLayout>
  );
}
