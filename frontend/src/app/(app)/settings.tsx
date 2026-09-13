import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable, Image } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { getUserSettings, updateUserSettings, getUserProfile, updateUserProfile } from '../../api/user';
import { ToggleRow } from '../../components/shared/ToggleRow';
import { AppLayout } from '../../components/shared/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

type SettingsTab = 'privacy' | 'language' | 'accessibility' | 'notifications';

export default function SettingsScreen() {
  const { logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SettingsTab>('privacy');
  const [profileName, setProfileName] = useState('राजेश / Rajesh');
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
        const [settingsData, userProfile] = await Promise.all([
          getUserSettings().catch(() => null),
          getUserProfile().catch(() => null),
        ]);

        if (settingsData && settingsData.consents && Array.isArray(settingsData.consents)) {
          const consentMap: any = {
            transaction: false,
            eligibility: false,
            fraud: false,
            notifications: false,
            reports: false
          };
          settingsData.consents.forEach((c: any) => {
            if (consentMap[c.purpose] !== undefined) {
              consentMap[c.purpose] = c.granted;
            }
          });
          setConsent(consentMap);
        }

        if (userProfile && userProfile.language_pref) {
          setLanguage(userProfile.language_pref);
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

  const handleLanguageChange = async (lang: 'hi' | 'en' | 'mr') => {
    setLanguage(lang);
    try {
      await updateUserProfile({ language_pref: lang });
    } catch (e) {
      console.error('Failed to sync language preference:', e);
    }
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
              <Text className="font-headline-sm text-headline-sm text-on-surface">{profileName}</Text>
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
              
              <Pressable 
                onPress={() => setActiveTab('language')}
                className={`flex-row items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'language' ? 'bg-[#a61c2e]/10 border-l-4 border-primary' : 'hover:bg-surface-container-low'}`}
              >
                <MaterialIcons name="language" size={24} color={activeTab === 'language' ? '#82001b' : '#6B6560'} />
                <Text className={`font-label-lg text-label-lg ${activeTab === 'language' ? 'font-bold text-primary' : 'text-on-surface-variant'}`}>भाषा / Language</Text>
              </Pressable>
              
              <Pressable 
                onPress={() => setActiveTab('accessibility')}
                className={`flex-row items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'accessibility' ? 'bg-[#a61c2e]/10 border-l-4 border-primary' : 'hover:bg-surface-container-low'}`}
              >
                <MaterialIcons name="accessibility-new" size={24} color={activeTab === 'accessibility' ? '#82001b' : '#6B6560'} />
                <Text className={`font-label-lg text-label-lg ${activeTab === 'accessibility' ? 'font-bold text-primary' : 'text-on-surface-variant'}`}>पहुंच / Accessibility</Text>
              </Pressable>
              
              <Pressable 
                onPress={() => setActiveTab('privacy')}
                className={`flex-row items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'privacy' ? 'bg-[#a61c2e]/10 border-l-4 border-primary' : 'hover:bg-surface-container-low'}`}
              >
                <MaterialIcons name="shield" size={24} color={activeTab === 'privacy' ? '#82001b' : '#6B6560'} />
                <Text className={`font-label-lg text-label-lg ${activeTab === 'privacy' ? 'font-bold text-primary' : 'text-on-surface-variant'}`}>सहमति और गोपनीयता / Consent & Privacy</Text>
              </Pressable>
              
              <Pressable 
                onPress={() => setActiveTab('notifications')}
                className={`flex-row items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'notifications' ? 'bg-[#a61c2e]/10 border-l-4 border-primary' : 'hover:bg-surface-container-low'}`}
              >
                <MaterialIcons name="notifications" size={24} color={activeTab === 'notifications' ? '#82001b' : '#6B6560'} />
                <Text className={`font-label-lg text-label-lg ${activeTab === 'notifications' ? 'font-bold text-primary' : 'text-on-surface-variant'}`}>सूचनाएं / Notifications</Text>
              </Pressable>
              
            </View>
            <View className="px-4 py-2 mt-2">
              <Text className="font-label-sm text-label-sm text-text-warm-gray">Version 1.2.0</Text>
            </View>
          </View>

          {/* Right Content Panel */}
          {activeTab === 'language' && (
            <View className="flex-1 w-full bg-surface rounded-xl shadow-sm border border-surface-container-high overflow-hidden hover:border-primary/10 transition-colors">
              <View className="p-8 border-b border-surface-container-high bg-white">
                <Text className="font-headline-sm text-headline-sm text-on-surface mb-2">
                  भाषा चयन / Select Language
                </Text>
                <Text className="font-body-md text-body-md text-text-warm-gray">
                  Choose your preferred language for the interface and AI responses.
                </Text>
              </View>
              <View className="p-6 flex-col gap-4">
                {[
                  { code: 'hi', name: 'हिंदी (Hindi)', desc: 'हिंदी में जानकारी और सहायता प्राप्त करें' },
                  { code: 'en', name: 'English', desc: 'Get guidance and financial tools in English' },
                  { code: 'mr', name: 'मराठी (Marathi)', desc: 'मराठी मध्ये माहिती आणि मदत मिळवा' },
                ].map((item) => (
                  <Pressable
                    key={item.code}
                    onPress={() => handleLanguageChange(item.code as 'hi' | 'en' | 'mr')}
                    className={`p-4 rounded-xl border flex-row items-center justify-between transition-colors ${
                      language === item.code ? 'border-primary bg-primary/5' : 'border-outline-variant bg-surface hover:bg-surface-container-low'
                    }`}
                  >
                    <View>
                      <Text className="font-headline-sm text-base text-on-surface font-semibold">{item.name}</Text>
                      <Text className="font-body-md text-sm text-text-warm-gray mt-0.5">{item.desc}</Text>
                    </View>
                    {language === item.code && (
                      <MaterialIcons name="check-circle" size={24} color="#82001b" />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'privacy' && (
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
