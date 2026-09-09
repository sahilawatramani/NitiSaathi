import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { getSchemes } from '../../../api/schemes';
import { AppLayout } from '../../../components/shared/AppLayout';

export default function SchemesListScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [consentDenied, setConsentDenied] = useState(false);

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const data = await getSchemes();
        setSchemes(data);
      } catch (e: any) {
        if (e?.message === 'CONSENT_REQUIRED') {
          setConsentDenied(true);
        } else {
          console.error(e);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSchemes();
  }, []);

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'eligible':
        return 'bg-[#E6F4EA]';
      case 'needs_info':
        return 'border border-outline-variant bg-transparent';
      case 'not_eligible':
        return 'bg-surface-container-high';
      default:
        return 'bg-surface-container-high';
    }
  };

  const getStatusTextStyles = (status: string) => {
    switch (status) {
      case 'eligible':
        return 'text-[#137333]';
      case 'needs_info':
        return 'text-on-surface-variant';
      case 'not_eligible':
        return 'text-on-surface-variant';
      default:
        return 'text-on-surface-variant';
    }
  };

  if (loading) {
    return (
      <AppLayout title="योजनाएं / Schemes">
        <View className="flex-1 bg-background justify-center items-center">
          <ActivityIndicator size="large" color="#a61c2e" />
        </View>
      </AppLayout>
    );
  }

  if (consentDenied) {
    return (
      <AppLayout title="योजनाएं / Schemes">
        <View className="flex-1 bg-background justify-center items-center p-8">
          <MaterialIcons name="lock" size={48} color="#a61c2e" style={{ marginBottom: 16 }} />
          <Text className="font-headline-sm text-headline-sm text-on-surface text-center mb-2">
            सहमति आवश्यक है / Consent Required
          </Text>
          <Text className="font-body-md text-body-md text-on-surface-variant text-center">
            योजना पात्रता जांच के लिए Settings → Privacy में सहमति दें।{'\n'}
            Enable scheme eligibility consent in Settings → Privacy.
          </Text>
          <Pressable
            onPress={() => router.push('/settings')}
            className="mt-6 bg-primary px-6 py-3 rounded-full"
          >
            <Text className="text-white font-label-lg text-label-lg">Settings खोलें / Open Settings</Text>
          </Pressable>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="योजनाएं / Schemes">
      <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false} className="bg-background">
        
        <View className="max-w-[1200px] w-full mx-auto">
          {/* Page Header */}
          <View className="mb-8">
            <Text className="font-display-lg text-[48px] font-semibold tracking-tight text-on-background">
              योजनाएं / Schemes
            </Text>
            <Text className="font-body-lg text-body-lg text-on-surface-variant mt-2">
              आपकी जानकारी के आधार पर / Based on your details
            </Text>
          </View>

          {/* Three Column Grid */}
          <View className="flex-row flex-wrap justify-between gap-y-6">
            {schemes.map((scheme, idx) => (
              <Pressable
                key={scheme.id}
                onPress={() => router.push(`/schemes/${scheme.id}`)}
                className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-transparent w-[100%] md:w-[48%] lg:w-[31%] flex-col relative overflow-hidden group hover:border-primary-container/10 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                {/* Conditional Banner */}
                {scheme.hasBudgetGuidance && (
                  <View className="absolute top-0 left-0 right-0 bg-[#F8D7DC] py-1 px-4 border-b border-outline-variant/30 flex-row items-center justify-center gap-2">
                    <MaterialIcons name="lightbulb" size={14} color="#93000a" />
                    <Text className="text-[#93000a] font-label-sm text-[12px] font-medium text-center">
                      बजट सलाह उपलब्ध है / Budget guidance available
                    </Text>
                  </View>
                )}

                <View className={`flex-row justify-between items-start mb-4 ${scheme.hasBudgetGuidance ? 'mt-6' : ''}`}>
                  <Text className="font-headline-md text-headline-md text-on-background group-hover:text-primary transition-colors">
                    {scheme.name}
                  </Text>
                  
                  <View className={`px-2.5 py-1 rounded-full flex-row items-center gap-1 ${getStatusStyles(scheme.status)}`}>
                    <Text className={`font-label-sm text-[12px] font-medium ${getStatusTextStyles(scheme.status)}`}>
                      {scheme.statusLabelHindi} / {scheme.statusLabelEnglish}
                    </Text>
                  </View>
                </View>

                <Text className="font-body-md text-body-md text-on-surface-variant flex-grow mb-6">
                  {scheme.description}
                </Text>

                <View className="mt-auto border-t border-surface-container pt-4 flex-row items-center gap-2">
                  <MaterialIcons name="verified-user" size={16} color="#594140" />
                  <Text className="text-on-surface-variant font-label-sm text-[12px]">
                    अंतिम सत्यापित: {scheme.lastVerified}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

      </ScrollView>
    </AppLayout>
  );
}
