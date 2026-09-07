import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams } from 'expo-router';
import { getReports } from '../../api/reports';
import { AppLayout } from '../../components/shared/AppLayout';

export default function ReportsScreen() {
  const { empty } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        const data = await getReports(empty === 'true');
        setReports(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchReportsData();
  }, [empty]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      // Mock generation completion
    }, 2000);
  };

  if (loading) {
    return (
      <AppLayout title="रिपोर्ट / Reports" hideHeader>
        <View className="flex-1 bg-surface justify-center items-center">
          <ActivityIndicator size="large" color="#a61c2e" />
        </View>
      </AppLayout>
    );
  }

  const hasReports = reports && reports.length > 0;

  return (
    <AppLayout title="रिपोर्ट / Reports" hideHeader>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 80, flexGrow: 1 }} showsVerticalScrollIndicator={false} className="bg-surface">
        <View className="max-w-[1200px] w-full mx-auto flex-col">

          {/* Page Title */}
          <View className="mb-8 hidden md:flex">
            <Text className="font-display-lg text-[48px] font-semibold tracking-tight text-on-surface">
              रिपोर्ट / Reports
            </Text>
            <Text className="font-body-lg text-body-lg text-on-surface-variant mt-2">
              Manage and generate your financial statements.
            </Text>
          </View>

          {/* Two Column Layout (Stacked on mobile) */}
          <View className="flex-col lg:flex-row gap-6 w-full">

            {/* Left Column: Generate Report */}
            <View className="lg:w-1/3">
              <View className="bg-surface-container-lowest rounded-xl shadow-sm border border-transparent hover:border-primary/10 transition-colors duration-300 p-8 sticky top-24">

                <View className="flex-row items-center gap-2 mb-6">
                  <MaterialIcons name="add-circle" size={24} color="#82001b" />
                  <Text className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    नई रिपोर्ट बनाएं / Generate a new report
                  </Text>
                </View>

                {/* Segmented Toggle */}
                <View className="mb-8">
                  <Text className="font-label-lg text-label-lg text-on-surface-variant mb-3">
                    Select Period
                  </Text>
                  <View className="flex-row bg-surface-container-low rounded-lg p-1 border border-outline-variant/30">
                    <Pressable
                      onPress={() => setSelectedPeriod('monthly')}
                      className={`flex-1 py-2 px-1 rounded-md border ${selectedPeriod === 'monthly' ? 'bg-surface-container-lowest shadow-sm border-outline-variant/50' : 'border-transparent active:bg-surface-variant/30'}`}
                    >
                      <Text className={`font-label-sm text-[12px] text-center ${selectedPeriod === 'monthly' ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}>
                        मासिक{'\n'}Monthly
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setSelectedPeriod('quarterly')}
                      className={`flex-1 py-2 px-1 rounded-md border ${selectedPeriod === 'quarterly' ? 'bg-surface-container-lowest shadow-sm border-outline-variant/50' : 'border-transparent active:bg-surface-variant/30'}`}
                    >
                      <Text className={`font-label-sm text-[12px] text-center ${selectedPeriod === 'quarterly' ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}>
                        तिमाही{'\n'}Quarterly
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setSelectedPeriod('yearly')}
                      className={`flex-1 py-2 px-1 rounded-md border ${selectedPeriod === 'yearly' ? 'bg-surface-container-lowest shadow-sm border-outline-variant/50' : 'border-transparent active:bg-surface-variant/30'}`}
                    >
                      <Text className={`font-label-sm text-[12px] text-center ${selectedPeriod === 'yearly' ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}>
                        वार्षिक{'\n'}Yearly
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Action Button */}
                <Pressable
                  onPress={handleGenerate}
                  disabled={isGenerating}
                  className={`w-full ${isGenerating ? 'bg-[#b32736]' : 'bg-[#E63946] active:bg-primary-container'} py-4 rounded-lg flex-row items-center justify-center gap-2 shadow-sm`}
                >
                  {isGenerating ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <MaterialIcons name="description" size={20} color="white" />
                  )}
                  <Text className="text-white font-label-lg text-label-lg font-medium">
                    {isGenerating ? 'Generating...' : 'रिपोर्ट बनाएं / Generate Report'}
                  </Text>
                </Pressable>

              </View>
            </View>

            {/* Right Column: Report List */}
            <View className="lg:w-2/3">
              <View className="bg-surface-container-lowest rounded-xl shadow-sm border border-transparent hover:border-primary/10 transition-colors duration-300 p-8 h-full">

                <Text className="font-headline-sm text-headline-sm text-on-surface mb-6 pb-4 border-b border-background-off-white font-semibold">
                  आपकी रिपोर्ट / Your reports
                </Text>

                {/* List Container */}
                <View className="flex-col gap-4">
                  {!hasReports ? (
                    /* Empty State */
                    <View className="flex-col items-center justify-center py-16 text-center">
                      <MaterialIcons name="inventory-2" size={60} color="#a61c2e" style={{ opacity: 0.5, marginBottom: 16 }} />
                      <Text className="font-headline-sm text-headline-sm text-on-surface-variant mb-2 font-semibold">
                        अभी तक कोई रिपोर्ट नहीं / No reports yet
                      </Text>
                      <Text className="font-body-md text-body-md text-on-surface-variant opacity-70 max-w-xs text-center leading-relaxed">
                        Use the panel on the left to generate your first financial report.
                      </Text>
                    </View>
                  ) : (
                    /* Report Cards */
                    reports.map((report) => (
                      <View
                        key={report.id}
                        className="flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border border-outline-variant/50 hover:bg-surface-container-low transition-colors duration-200 gap-4"
                      >

                        <View className="flex-row items-center gap-4">
                          <View className={`w-12 h-12 rounded-full flex items-center justify-center ${report.status === 'ready' ? 'bg-primary/10' : 'bg-surface-variant'}`}>
                            <MaterialIcons name="insert-drive-file" size={24} color={report.status === 'ready' ? '#82001b' : '#594140'} />
                          </View>
                          <View className="flex-col">
                            <Text className="font-headline-sm text-[16px] font-semibold text-on-surface">
                              {report.title}
                            </Text>
                            <Text className="font-label-sm text-[12px] text-on-surface-variant mt-1">
                              Generated: {report.generatedDate}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row items-center justify-between sm:justify-end w-full sm:w-auto gap-4 sm:gap-6 mt-2 sm:mt-0">
                          {/* Status Pill */}
                          <View className={`px-3 py-1 rounded-full border flex-row items-center gap-1 ${report.status === 'ready' ? 'bg-primary/5 border-primary' : 'bg-surface border-outline-variant'}`}>
                            <MaterialIcons name={report.icon as any} size={14} color={report.status === 'ready' ? '#82001b' : '#594140'} />
                            <Text className={`font-label-sm text-[12px] font-medium ${report.status === 'ready' ? 'text-primary' : 'text-on-surface-variant'}`}>
                              {report.statusHindi} / {report.statusEnglish}
                            </Text>
                          </View>

                          {/* Actions */}
                          <View className="flex-row items-center gap-2">
                            <Pressable className="p-2 rounded-full active:bg-primary/10">
                              <MaterialIcons name="download" size={20} color="#594140" />
                            </Pressable>
                            <Pressable className="p-2 rounded-full active:bg-primary/10">
                              <MaterialIcons name="send" size={20} color="#594140" />
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    ))
                  )}
                </View>

              </View>
            </View>

          </View>
        </View>
      </ScrollView>
    </AppLayout>
  );
}
