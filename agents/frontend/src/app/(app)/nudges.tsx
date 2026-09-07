import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams } from 'expo-router';
import { getNudges } from '../../api/nudges';
import { AppLayout } from '../../components/shared/AppLayout';

export default function NudgesScreen() {
  const { empty } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [nudges, setNudges] = useState<any[]>([]);

  useEffect(() => {
    const fetchNudgesData = async () => {
      try {
        const data = await getNudges(empty === 'true');
        setNudges(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchNudgesData();
  }, [empty]);

  if (loading) {
    return (
      <AppLayout title="सूचनाएं / Nudges" hideHeader>
        <View className="flex-1 bg-background justify-center items-center">
          <ActivityIndicator size="large" color="#a61c2e" />
        </View>
      </AppLayout>
    );
  }

  const hasNudges = nudges && nudges.length > 0;

  return (
    <AppLayout title="सूचनाएं / Nudges" hideHeader>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 80, flexGrow: 1 }} showsVerticalScrollIndicator={false} className="bg-background">
        <View className="max-w-[700px] w-full mx-auto flex-col gap-6">
          
          {/* Header */}
          <View className="mb-4 hidden md:flex flex-row items-center justify-between border-b border-surface-variant pb-4">
            <Text className="font-headline-sm text-headline-sm text-on-background font-semibold">
              सूचनाएं / Nudges
            </Text>
          </View>
          
          {!hasNudges ? (
            /* Empty State */
            <View className="flex-1 justify-center items-center py-20 px-4 mt-10">
              <View className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mb-6">
                <MaterialIcons name="notifications-none" size={48} color="#a61c2e" />
              </View>
              <Text className="font-headline-md text-headline-md text-on-surface mb-2 text-center">
                आपके पास कोई नई सूचना नहीं है
              </Text>
              <Text className="font-body-lg text-body-lg text-text-warm-gray text-center">
                You have no new nudges right now.
              </Text>
            </View>
          ) : (
            /* Active Nudge Feed */
            <View className="flex-col gap-6">
              {nudges.map((nudge) => (
                <View 
                  key={nudge.id} 
                  className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container overflow-hidden group hover:border-primary/10 transition-colors duration-300 flex-col"
                >
                  <View className="p-6 pb-4">
                    
                    {/* Meta Row */}
                    <View className="flex-row justify-between items-start mb-4">
                      <View className="flex-row items-center gap-2">
                        {nudge.isHighPriority ? (
                          <>
                            <View className="w-2.5 h-2.5 rounded-full bg-[#E63946] shadow-sm" />
                            <View className="bg-error-container px-2 py-0.5 rounded">
                              <Text className="font-label-sm text-[12px] text-error font-medium">
                                {nudge.tagTitle}
                              </Text>
                            </View>
                          </>
                        ) : (
                          <>
                            <View className="w-2.5 h-2.5 rounded-full bg-surface-dim" />
                            <View className="bg-tertiary-fixed px-2 py-0.5 rounded">
                              <Text className="font-label-sm text-[12px] text-tertiary font-medium">
                                {nudge.tagTitle}
                              </Text>
                            </View>
                          </>
                        )}
                      </View>
                      <Text className="font-label-sm text-[12px] text-text-warm-gray">
                        {nudge.timeAgo}
                      </Text>
                    </View>

                    {/* Content */}
                    <Text className="font-headline-sm text-headline-sm text-on-background mb-2">
                      {nudge.headline}
                    </Text>
                    
                    <Text className="font-body-md text-body-md text-on-surface-variant mb-6 leading-relaxed">
                      {nudge.bodyHindi}{'\n'}
                      <Text className="text-text-warm-gray">
                        {nudge.bodyEnglish}
                      </Text>
                    </Text>

                    {/* Feedback Row */}
                    <View className="flex-row items-center justify-between border-t border-surface-container pt-4">
                      <View className="flex-row items-center gap-4">
                        <Pressable className="flex-row items-center gap-2 px-2 py-1 rounded active:bg-surface-container-low">
                          <MaterialIcons name="thumb-up" size={18} color="#594140" />
                          <Text className="font-label-sm text-[12px] text-on-surface-variant">
                            उपयोगी / Useful
                          </Text>
                        </Pressable>
                        <Pressable className="flex-row items-center gap-2 px-2 py-1 rounded active:bg-surface-container-low">
                          <MaterialIcons name="thumb-down" size={18} color="#594140" />
                          <Text className="font-label-sm text-[12px] text-on-surface-variant">
                            उपयोगी नहीं / Not useful
                          </Text>
                        </Pressable>
                      </View>
                      
                      <Pressable className="px-2 py-1 active:bg-error-container rounded">
                        <Text className="font-label-sm text-[12px] text-text-warm-gray hover:text-error underline">
                          यह नुकसानदायक था / This was harmful
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* Optional Outcome Follow-up Strip */}
                  {nudge.outcomeHindi && (
                    <View className="bg-[#e2f8eb] px-6 py-3 flex-row items-center gap-2 border-t border-[#71dc92]/30">
                      <MaterialIcons name="check-circle" size={18} color="#004923" />
                      <Text className="font-label-sm text-[12px] text-[#004923] font-medium leading-tight">
                        {nudge.outcomeHindi} / {nudge.outcomeEnglish}
                      </Text>
                    </View>
                  )}

                </View>
              ))}
            </View>
          )}

        </View>
      </ScrollView>
    </AppLayout>
  );
}
