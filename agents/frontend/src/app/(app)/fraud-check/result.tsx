import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getFraudCheckResult } from '../../../api/fraud';
import { AppLayout } from '../../../components/shared/AppLayout';

export default function FraudCheckResultScreen() {
  const router = useRouter();
  const { risk = 'high' } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const data = await getFraudCheckResult(risk as string);
        setResult(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [risk]);

  if (loading || !result) {
    return (
      <AppLayout title="जांच परिणाम / Check Result" hideHeader>
        <View className="flex-1 bg-background justify-center items-center">
          <ActivityIndicator size="large" color="#a61c2e" />
        </View>
      </AppLayout>
    );
  }

  const isHighRisk = result.riskLevel === 'high';

  return (
    <AppLayout title="जांच परिणाम / Check Result" hideHeader>
      <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false} className="bg-background">
        <View className="max-w-[700px] w-full mx-auto flex-col gap-8 pb-10">
          
          {/* Header Area (with back button) */}
          <View className="flex-row items-center gap-4 mb-4">
            <Pressable 
              onPress={() => router.back()} 
              className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high transition-colors"
            >
              <MaterialIcons name="arrow-back" size={24} color="#1c1b1b" />
            </Pressable>
            <Text className="font-headline-sm text-headline-sm text-[#1A1A1A] font-semibold">
              जांच परिणाम / Check Result
            </Text>
          </View>

          {/* Result Card */}
          <View className="rounded-xl overflow-hidden shadow-lg transform transition-transform hover:scale-[1.01] hover:shadow-xl duration-300">
            
            {/* Top Border/Header Strip */}
            {isHighRisk ? (
              <View className="bg-[#1A1A1A] h-3 w-full" />
            ) : (
              <View className="bg-[#137333] h-3 w-full" />
            )}
            
            {/* Main Body */}
            <View className={`${isHighRisk ? 'bg-[#E63946]' : 'bg-[#E6F4EA]'} p-8 relative overflow-hidden flex-col items-center text-center`}>
              
              {/* Icon */}
              <View className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-sm border-4 ${isHighRisk ? 'bg-[#1A1A1A] border-[#1A1A1A]' : 'bg-[#137333] border-[#137333]'}`}>
                <MaterialIcons 
                  name={isHighRisk ? 'warning' : 'check'} 
                  size={48} 
                  color={isHighRisk ? '#E63946' : 'white'} 
                />
              </View>
              
              {/* Headline */}
              <Text className={`font-headline-lg text-[32px] font-bold text-center mb-4 tracking-tight ${isHighRisk ? 'text-white' : 'text-[#137333]'}`}>
                {result.headlineHindi}{'\n'}
                <Text className={`font-medium text-[28px] ${isHighRisk ? 'text-white/90' : 'text-[#137333]/90'}`}>
                  {result.headlineEnglish}
                </Text>
              </Text>
              
              {/* Supporting Line */}
              <View className={`p-4 rounded-lg border max-w-[500px] w-full ${isHighRisk ? 'bg-black/10 border-white/10' : 'bg-[#137333]/10 border-[#137333]/20'}`}>
                <Text className={`font-body-lg text-body-lg text-center ${isHighRisk ? 'text-white/90' : 'text-[#137333]'}`}>
                  {result.reasonHindi}
                </Text>
                <Text className={`text-sm text-center mt-1 block ${isHighRisk ? 'text-white/80' : 'text-[#137333]/80'}`}>
                  {result.reasonEnglish}
                </Text>
              </View>

            </View>
          </View>

          {/* Action Steps Section */}
          <View className="flex-col gap-4">
            <View className="flex-row items-center gap-2 mb-2">
              <MaterialIcons name="policy" size={24} color="#a61c2e" />
              <Text className="font-headline-sm text-headline-sm text-on-surface">
                सुरक्षा कदम / Action Steps
              </Text>
            </View>
            
            {/* Horizontal Row of 3 Compact Cards */}
            <View className="flex-col sm:flex-row gap-4">
              
              <View className="bg-surface rounded-xl p-4 shadow-sm border border-surface-variant flex-1 flex-col items-center text-center">
                <View className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-3">
                  <MaterialIcons name="link-off" size={24} color="#594140" />
                </View>
                <Text className="font-label-lg text-label-lg text-on-surface mb-1 text-center">लिंक पर क्लिक न करें</Text>
                <Text className="font-label-sm text-[12px] text-on-surface-variant text-center">Do not click links</Text>
              </View>

              <View className="bg-surface rounded-xl p-4 shadow-sm border border-surface-variant flex-1 flex-col items-center text-center">
                <View className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-3">
                  <MaterialIcons name="visibility-off" size={24} color="#594140" />
                </View>
                <Text className="font-label-lg text-label-lg text-on-surface mb-1 text-center">जानकारी साझा न करें</Text>
                <Text className="font-label-sm text-[12px] text-on-surface-variant text-center">Do not share info</Text>
              </View>

              <View className="bg-surface rounded-xl p-4 shadow-sm border border-surface-variant flex-1 flex-col items-center text-center">
                <View className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-3">
                  <MaterialIcons name="block" size={24} color="#594140" />
                </View>
                <Text className="font-label-lg text-label-lg text-on-surface mb-1 text-center">मैसेज को ब्लॉक करें</Text>
                <Text className="font-label-sm text-[12px] text-on-surface-variant text-center">Block the message</Text>
              </View>

            </View>
          </View>

          {/* Permanent PIN/OTP Notice */}
          <View className="bg-[#1A1A1A] rounded-xl overflow-hidden relative shadow-lg flex-row items-center p-6 border border-gray-800">
            <View className="absolute left-0 top-0 bottom-0 w-2 bg-[#E63946]" />
            <View className="ml-2 mr-4 bg-[#E63946]/20 p-3 rounded-full">
              <MaterialIcons name="admin-panel-settings" size={24} color="#E63946" />
            </View>
            <View className="flex-col flex-1">
              <Text className="text-white font-body-md text-body-md font-medium leading-tight">
                nitisaathi कभी भी आपका UPI PIN या OTP नहीं मांगेगा
              </Text>
              <Text className="text-white/70 font-label-sm text-[12px] mt-1">
                nitisaathi will never ask for your UPI PIN or OTP
              </Text>
            </View>
          </View>

          {/* Footer Actions */}
          <View className="flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-surface-variant">
            <Pressable 
              onPress={() => router.back()}
              className="w-full sm:w-auto bg-[#E63946] active:bg-[#b32736] px-8 py-4 rounded-lg flex-row items-center justify-center gap-2 shadow-sm"
            >
              <MaterialIcons name="check-circle" size={20} color="white" />
              <Text className="text-white font-label-lg text-label-lg">
                ठीक है, समझ गया / Got it, understood
              </Text>
            </Pressable>
            
            <Pressable className="flex-row items-center gap-2 active:opacity-70">
              <MaterialIcons name="flag" size={16} color="#594140" />
              <Text className="text-on-surface-variant font-label-lg text-label-lg underline">
                इसे रिपोर्ट करें / Report this
              </Text>
            </Pressable>
          </View>

        </View>
      </ScrollView>
    </AppLayout>
  );
}
