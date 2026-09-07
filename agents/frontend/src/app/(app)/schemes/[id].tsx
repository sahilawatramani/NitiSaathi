import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, ActivityIndicator, Pressable, Linking } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getSchemeDetail } from '../../../api/schemes';
import { TradeoffCard } from '../../../components/shared/TradeoffCard';
import { AppLayout } from '../../../components/shared/AppLayout';

export default function SchemeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [scheme, setScheme] = useState<any>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await getSchemeDetail(id);
        setScheme(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchDetail();
    }
  }, [id]);

  if (loading || !scheme) {
    return (
      <AppLayout title="Scheme Detail" hideHeader>
        <View className="flex-1 bg-background justify-center items-center">
          <ActivityIndicator size="large" color="#a61c2e" />
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={scheme.name} hideHeader>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} className="bg-background">
        <View className="max-w-[900px] w-full mx-auto px-6 py-8 flex-1 flex-col gap-8">
          
          {/* Header Section */}
          <View className="flex-col gap-4 border-b border-surface-variant pb-4">
            <Pressable 
              onPress={() => router.back()} 
              className="flex-row items-center gap-2 w-auto self-start"
            >
              <MaterialIcons name="arrow-back" size={16} color="#82001b" />
              <Text className="text-primary font-label-lg text-label-lg">Schemes</Text>
            </Pressable>
            
            <View className="flex-row flex-wrap items-center justify-between gap-4">
              <View className="flex-row items-center gap-4">
                <Text className="font-headline-lg text-headline-lg text-on-background m-0">
                  {scheme.name}
                </Text>
                <View className="px-3 py-1 bg-tertiary-container rounded-full">
                  <Text className="text-on-tertiary-container font-label-sm text-label-sm uppercase tracking-wider">
                    {scheme.statusLabelEnglish}
                  </Text>
                </View>
              </View>
              
              <View className="flex-row items-center gap-2 bg-surface-container-low px-4 py-2 rounded-lg border border-surface-variant">
                <MaterialIcons name="security" size={20} color="#004923" />
                <Text className="font-body-md text-[14px] text-text-warm-gray">
                  अंतिम सत्यापित: {scheme.lastVerified.split(' / ')[0]}
                </Text>
              </View>
            </View>
          </View>

          {/* Main Content Area: Two Columns (Mobile flows sequentially) */}
          <View className="flex-col md:flex-row gap-6">
            
            {/* Left Column */}
            <View className="flex-col gap-8 md:flex-[7]">
              
              {/* What it is */}
              <View className="flex-col gap-2">
                <Text className="font-headline-sm text-headline-sm text-on-background">
                  यह क्या है / What it is
                </Text>
                <Text className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  {scheme.description}
                </Text>
              </View>
              
              {/* Benefits & Contribution Grid */}
              <View className="flex-col sm:flex-row gap-4">
                
                {/* Benefits Card */}
                <View className="bg-surface-container-lowest border border-surface-variant rounded-xl p-6 shadow-sm flex-1">
                  <View className="flex-row items-center gap-2 mb-4">
                    <MaterialIcons name="card-giftcard" size={20} color="#004923" />
                    <Text className="font-label-lg text-label-lg uppercase tracking-wider text-[#004923]">
                      फायदे / Benefits
                    </Text>
                  </View>
                  <Text className="font-headline-md text-headline-md text-on-background mb-1">
                    {scheme.benefits.amount}
                  </Text>
                  <Text className="font-body-md text-body-md text-on-surface-variant">
                    {scheme.benefits.subtext}
                  </Text>
                </View>

                {/* Contribution Card */}
                <View className="bg-surface-container-lowest border border-surface-variant rounded-xl p-6 shadow-sm flex-1">
                  <View className="flex-row items-center gap-2 mb-4">
                    <MaterialIcons name="account-balance-wallet" size={20} color="#82001b" />
                    <Text className="font-label-lg text-label-lg uppercase tracking-wider text-primary">
                      योगदान / Contribution
                    </Text>
                  </View>
                  <Text className="font-headline-md text-headline-md text-on-background mb-1">
                    {scheme.contribution.amount}
                  </Text>
                  <Text className="font-body-md text-body-md text-on-surface-variant">
                    {scheme.contribution.subtext}
                  </Text>
                </View>

              </View>
            </View>

            {/* Right Column */}
            <View className="flex-col gap-8 md:flex-[5]">
              
              {/* Joint Reasoning Card (reusing TradeoffCard) */}
              {scheme.budgetGuidance && (
                <TradeoffCard 
                  headerText={scheme.budgetGuidance.headerText}
                  reasoningBody={scheme.budgetGuidance.reasoningBody}
                  icon={scheme.budgetGuidance.icon}
                />
              )}

              {/* How to enroll */}
              <View className="bg-surface-container-lowest border border-surface-variant rounded-xl p-6 shadow-sm flex-col gap-4">
                <View className="flex-row items-center gap-2">
                  <MaterialIcons name="how-to-reg" size={24} color="#82001b" />
                  <Text className="font-headline-sm text-headline-sm text-on-background">
                    कैसे शामिल हों / How to enroll
                  </Text>
                </View>
                
                <View className="bg-surface-container border border-surface-variant rounded-lg p-4 mb-2">
                  <Text className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    <Text className="font-bold text-on-background">nitisaathi सीधे दाखिला नहीं करता / </Text> 
                    nitisaathi does not enroll you directly. You must visit the official government portal to complete registration.
                  </Text>
                </View>
                
                <Pressable 
                  onPress={() => Linking.openURL(scheme.portalUrl)}
                  className="flex-row items-center justify-center gap-2 bg-primary active:bg-secondary py-3 px-6 rounded-lg transition-colors"
                >
                  <Text className="text-white font-label-lg text-label-lg">
                    पोर्टल पर जाएं / Go to portal
                  </Text>
                  <MaterialIcons name="open-in-new" size={18} color="white" />
                </Pressable>
              </View>
              
            </View>
          </View>
          
          <View className="flex-1" />
          
          {/* Footer Disclaimer */}
          <View className="w-full border-t border-surface-variant py-8 mt-auto">
            <Text className="font-body-md text-body-md text-text-warm-gray italic text-center">
              यह जानकारी सामान्य मार्गदर्शन के लिए है। आधिकारिक विवरण के लिए सरकारी पोर्टल देखें। / This is general guidance — check the official government portal for official details.
            </Text>
          </View>

        </View>
      </ScrollView>
    </AppLayout>
  );
}
