import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { getCausalRiskChain } from '../../../api/budget';
import { AppLayout } from '../../../components/shared/AppLayout';

export default function RiskDetailScreen() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRiskData = async () => {
      try {
        const result = await getCausalRiskChain();
        setData(result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchRiskData();
  }, []);

  if (loading) {
    return (
      <AppLayout title="आगे क्या हो सकता है / What could happen" hideHeader>
        <View className="flex-1 bg-background justify-center items-center">
          <ActivityIndicator size="large" color="#a61c2e" />
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="आगे क्या हो सकता है / What could happen" hideHeader>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }} className="bg-background">
        
        {/* Top: Back link and Title */}
        <View className="mb-4">
          <Pressable 
            onPress={() => router.back()} 
            className="flex-row items-center gap-2 mb-4 active:opacity-60"
          >
            <MaterialIcons name="arrow-back" size={16} color="#594140" />
            <Text className="font-label-lg text-label-lg text-on-surface-variant hover:text-primary">
              Budget
            </Text>
          </Pressable>
          <Text className="font-headline-lg text-headline-lg text-on-background">
            आगे क्या हो सकता है / What could happen
          </Text>
        </View>
        
        {/* Trigger Summary Card */}
        <View className="bg-[#F8D7DC] border border-primary-container rounded-lg p-4 flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 shadow-sm">
          <View className="flex-row items-start gap-4">
            <View className="p-2 bg-white/50 rounded-full shrink-0 mt-1 sm:mt-0">
              <MaterialIcons name="warning" size={24} color="#a61c2e" />
            </View>
            <View className="flex-shrink">
              <Text className="font-headline-sm text-headline-sm text-primary-container mb-1">
                {data.trigger.titleHindi}
              </Text>
              <Text className="font-body-md text-body-md text-primary-container/80">
                {data.trigger.titleEnglish}
              </Text>
            </View>
          </View>
          
          <View className="shrink-0 flex-row items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-primary-container/30 self-start sm:self-auto">
            <MaterialIcons name="schedule" size={16} color="#a61c2e" />
            <Text className="font-label-sm text-label-sm text-primary-container font-semibold">
              {data.trigger.dueInHindi} / {data.trigger.dueInEnglish}
            </Text>
          </View>
        </View>
        
        {/* Two-Column Layout */}
        <View className="flex-col lg:flex-row gap-6">
          
          {/* Left Column (Causal Chain) */}
          <View className="bg-surface-container-lowest rounded-xl border border-surface-container-highest p-4 shadow-sm flex-col lg:flex-[2]">
            <Text className="font-headline-sm text-headline-sm text-on-surface mb-4 border-b border-surface-container-high pb-2">
              Causal Chain
            </Text>
            
            <View className="flex-1 flex-col justify-center">
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ alignItems: 'center', gap: 16, paddingVertical: 16, paddingBottom: 16 }}
              >
                {data.steps.map((step: any, index: number) => (
                  <View key={step.stepNum} className="flex-row items-center">
                    <View className="w-56 bg-surface-bright border-l-4 border-l-[#F59E0B] border-y border-r border-surface-container-high rounded-r-lg p-4 relative group hover:border-[#F59E0B]/30 hover:shadow-md transition-all">
                      <View className="w-8 h-8 rounded-full bg-[#FEF3C7] flex items-center justify-center mb-3">
                        <Text className="text-[#D97706] font-bold font-label-sm">{step.stepNum}</Text>
                      </View>
                      <Text className="font-label-lg text-label-lg text-on-background mb-1">
                        {step.titleHindi}
                      </Text>
                      <Text className="font-body-sm text-[12px] text-text-warm-gray">
                        {step.titleEnglish}
                      </Text>
                    </View>
                    
                    {/* Arrow to next */}
                    {index < data.steps.length - 1 && (
                      <MaterialIcons name="arrow-right-alt" size={32} color="#e5e2e1" style={{ marginLeft: 8 }} />
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
          
          {/* Right Column (Recommended Options) */}
          <View className="flex-col gap-4 lg:flex-[1]">
            <Text className="font-headline-sm text-headline-sm text-on-surface">
              सुझाए गए विकल्प / Recommended options
            </Text>
            
            {data.recommendations.map((rec: any) => {
              if (rec.isTopChoice) {
                return (
                  <Pressable key={rec.id} className="bg-surface-container-lowest border-2 border-primary-container rounded-xl p-4 shadow-md relative overflow-hidden active:bg-surface-bright transition-colors">
                    <View className="absolute top-0 right-0 w-16 h-16 bg-primary-container/10 rounded-bl-full -z-0" />
                    
                    <View className="flex-row items-start gap-4 relative z-10">
                      <View className="p-2 bg-primary-container rounded-full shrink-0">
                        <MaterialIcons name={rec.icon.replace('-', '_') as any} size={20} color="white" />
                      </View>
                      
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">
                            Top Choice
                          </Text>
                        </View>
                        <Text className="font-headline-sm text-headline-sm text-on-background mb-1">
                          {rec.titleHindi}
                        </Text>
                        <Text className="font-body-md text-body-md text-text-warm-gray mb-4">
                          {rec.titleEnglish}
                        </Text>
                        
                        <View className="bg-primary hover:bg-secondary rounded py-2 px-4 flex-row items-center justify-center gap-2 self-start">
                          <Text className="text-white font-label-lg text-label-lg">Explore Option</Text>
                          <MaterialIcons name="arrow-forward" size={18} color="white" />
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              }
              
              return (
                <Pressable key={rec.id} className="bg-surface-container-lowest border border-surface-container-highest rounded-xl p-4 shadow-sm active:shadow-md hover:border-primary-container/30 transition-all flex-row items-center gap-4">
                  <View className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0">
                    <MaterialIcons name={rec.icon.replace('-', '_') as any} size={20} color="#6B6560" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-label-lg text-label-lg text-on-background">
                      {rec.titleHindi}
                    </Text>
                    <Text className="font-body-sm text-[12px] text-text-warm-gray">
                      {rec.titleEnglish}
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color="#e5e2e1" />
                </Pressable>
              );
            })}
            
          </View>
        </View>
        
      </ScrollView>
    </AppLayout>
  );
}
