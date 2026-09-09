import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable, Platform } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams } from 'expo-router';
import { getReports, downloadWeeklyReport, downloadMonthlyReport, downloadQuarterlyReport, downloadYearlyReport, emailWeeklyReport } from '../../api/reports';
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
        const data = await getReports();
        setReports(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchReportsData();
  }, [empty]);

  const triggerDownload = async (response: Response, filename: string) => {
    if (Platform.OS === 'web') {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } else {
      // In a real app we would use expo-file-system or similar
      console.log('Download not supported on native yet, needs expo-file-system');
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const now = new Date();
      let res;
      let filename = 'report.pdf';
      if (selectedPeriod === 'weekly') {
        res = await downloadWeeklyReport();
        filename = 'weekly_report.pdf';
      } else if (selectedPeriod === 'monthly') {
        res = await downloadMonthlyReport(now.getFullYear(), now.getMonth() + 1);
        filename = 'monthly_report.pdf';
      } else if (selectedPeriod === 'quarterly') {
        res = await downloadQuarterlyReport(now.getFullYear(), Math.floor(now.getMonth() / 3) + 1);
        filename = 'quarterly_report.pdf';
      } else if (selectedPeriod === 'yearly') {
        res = await downloadYearlyReport(now.getFullYear());
        filename = 'yearly_report.pdf';
      }
      if (res && res.ok) {
        await triggerDownload(res, filename);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    // Just trigger generate for now with the selected id
    const oldPeriod = selectedPeriod;
    setSelectedPeriod(reportId);
    await handleGenerate();
    setSelectedPeriod(oldPeriod);
  };

  const handleEmailReport = async () => {
    try {
      await emailWeeklyReport();
      alert('Report emailed successfully!');
    } catch (e) {
      console.error(e);
    }
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
    <AppLayout title="रिपोर्ट / Reports">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 80, flexGrow: 1 }} showsVerticalScrollIndicator={false} className="bg-surface">
        <View className="max-w-[1200px] w-full mx-auto flex-col">

          <View className="mb-8 hidden md:flex">
            <Text className="font-display-lg text-[48px] font-semibold tracking-tight text-on-surface">
              रिपोर्ट / Reports
            </Text>
            <Text className="font-body-lg text-body-lg text-on-surface-variant mt-2">
              Manage and generate your financial statements.
            </Text>
          </View>

          <View className="flex-col lg:flex-row gap-6 w-full">

            <View className="lg:w-1/3">
              <View className="bg-surface-container-lowest rounded-xl shadow-sm border border-transparent hover:border-primary/10 transition-colors duration-300 p-8 sticky top-24">

                <View className="flex-row items-center gap-2 mb-6">
                  <MaterialIcons name="add-circle" size={24} color="#82001b" />
                  <Text className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    नई रिपोर्ट बनाएं / Generate a new report
                  </Text>
                </View>

                <View className="mb-8">
                  <Text className="font-label-lg text-label-lg text-on-surface-variant mb-3">
                    Select Period
                  </Text>
                  <View className="flex-row bg-surface-container-low rounded-lg p-1 border border-outline-variant/30 flex-wrap">
                    <Pressable
                      onPress={() => setSelectedPeriod('weekly')}
                      className={`w-1/2 py-2 px-1 rounded-md border ${selectedPeriod === 'weekly' ? 'bg-surface-container-lowest shadow-sm border-outline-variant/50' : 'border-transparent active:bg-surface-variant/30'}`}
                    >
                      <Text className={`font-label-sm text-[12px] text-center ${selectedPeriod === 'weekly' ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}>
                        साप्ताहिक{'\n'}Weekly
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setSelectedPeriod('monthly')}
                      className={`w-1/2 py-2 px-1 rounded-md border ${selectedPeriod === 'monthly' ? 'bg-surface-container-lowest shadow-sm border-outline-variant/50' : 'border-transparent active:bg-surface-variant/30'}`}
                    >
                      <Text className={`font-label-sm text-[12px] text-center ${selectedPeriod === 'monthly' ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}>
                        मासिक{'\n'}Monthly
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setSelectedPeriod('quarterly')}
                      className={`w-1/2 py-2 px-1 rounded-md border ${selectedPeriod === 'quarterly' ? 'bg-surface-container-lowest shadow-sm border-outline-variant/50' : 'border-transparent active:bg-surface-variant/30'}`}
                    >
                      <Text className={`font-label-sm text-[12px] text-center ${selectedPeriod === 'quarterly' ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}>
                        तिमाही{'\n'}Quarterly
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setSelectedPeriod('yearly')}
                      className={`w-1/2 py-2 px-1 rounded-md border ${selectedPeriod === 'yearly' ? 'bg-surface-container-lowest shadow-sm border-outline-variant/50' : 'border-transparent active:bg-surface-variant/30'}`}
                    >
                      <Text className={`font-label-sm text-[12px] text-center ${selectedPeriod === 'yearly' ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}>
                        वार्षिक{'\n'}Yearly
                      </Text>
                    </Pressable>
                  </View>
                </View>

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

            <View className="lg:w-2/3">
              <View className="bg-surface-container-lowest rounded-xl shadow-sm border border-transparent hover:border-primary/10 transition-colors duration-300 p-8 h-full">

                <Text className="font-headline-sm text-headline-sm text-on-surface mb-6 pb-4 border-b border-background-off-white font-semibold">
                  आपकी रिपोर्ट / Your reports
                </Text>

                <View className="flex-col gap-4">
                  {!hasReports ? (
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
                          <View className={`px-3 py-1 rounded-full border flex-row items-center gap-1 ${report.status === 'ready' ? 'bg-primary/5 border-primary' : 'bg-surface border-outline-variant'}`}>
                            <MaterialIcons name={report.icon as any} size={14} color={report.status === 'ready' ? '#82001b' : '#594140'} />
                            <Text className={`font-label-sm text-[12px] font-medium ${report.status === 'ready' ? 'text-primary' : 'text-on-surface-variant'}`}>
                              {report.status === 'ready' ? 'तैयार / Ready' : 'तैयार नहीं / Not Ready'}
                            </Text>
                          </View>

                          <View className="flex-row items-center gap-2">
                            <Pressable onPress={() => handleDownloadReport(report.id)} className="p-2 rounded-full active:bg-primary/10">
                              <MaterialIcons name="download" size={20} color="#594140" />
                            </Pressable>
                            <Pressable onPress={handleEmailReport} className="p-2 rounded-full active:bg-primary/10">
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
