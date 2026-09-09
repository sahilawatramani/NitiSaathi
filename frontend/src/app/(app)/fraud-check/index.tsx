import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getFlaggedTransactions, getFraudCheckResult } from '../../../api/fraud';
import { AppLayout } from '../../../components/shared/AppLayout';

export default function FraudCheckScreen() {
  const [loading, setLoading] = useState(true);
  const [flaggedTxns, setFlaggedTxns] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [consentDenied, setConsentDenied] = useState(false);

  useEffect(() => {
    const fetchTxns = async () => {
      try {
        const data = await getFlaggedTransactions();
        setFlaggedTxns(data);
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
    fetchTxns();
  }, []);

  const handleCheck = async () => {
    if (!messageText.trim()) return;
    setChecking(true);
    setCheckResult(null);
    try {
      const result = await getFraudCheckResult(messageText.trim());
      setCheckResult(result);
    } catch (e: any) {
      if (e?.message === 'CONSENT_REQUIRED') {
        setCheckResult({
          riskLevel: 'low',
          headlineHindi: 'सहमति आवश्यक है',
          headlineEnglish: 'Consent Required',
          reasonHindi: 'धोखाधड़ी जांच के लिए Settings → Privacy में सहमति दें।',
          reasonEnglish: 'Enable fraud detection consent in Settings → Privacy.',
        });
      } else {
        console.error(e);
      }
      console.error(e);
    } finally {
      setChecking(false);
    }
  };;

  if (loading) {
    return (
      <AppLayout title="धोखाधड़ी जांच / Fraud Check">
        <View className="flex-1 bg-background justify-center items-center">
          <ActivityIndicator size="large" color="#a61c2e" />
        </View>
      </AppLayout>
    );
  }

  if (consentDenied) {
    return (
      <AppLayout title="धोखाधड़ी जांच / Fraud Check">
        <View className="flex-1 bg-background justify-center items-center p-8">
          <MaterialIcons name="lock" size={48} color="#a61c2e" style={{ marginBottom: 16 }} />
          <Text className="font-headline-sm text-headline-sm text-on-surface text-center mb-2">
            सहमति आवश्यक है / Consent Required
          </Text>
          <Text className="font-body-md text-body-md text-on-surface-variant text-center">
            धोखाधड़ी सुरक्षा के लिए Settings → Privacy में सहमति दें।{'\n'}
            Enable fraud detection consent in Settings → Privacy.
          </Text>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="धोखाधड़ी जांच / Fraud Check">
      <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false} className="bg-background">
        <View className="max-w-[1200px] w-full mx-auto flex-col gap-8">
          
          {/* Page Header & Critical Notice */}
          <View className="flex-col gap-4 w-full">
            <Text className="font-display-lg text-[48px] font-semibold tracking-tight text-on-surface">
              धोखाधड़ी जांच / Fraud Check
            </Text>
            
            {/* Fixed Notice (Solid Black Background) */}
            <View className="w-full bg-[#1A1A1A] flex-row items-center gap-4 p-4 rounded-r-lg border-l-4 border-[#E63946] shadow-sm">
              <MaterialIcons name="security" size={24} color="#E63946" />
              <Text className="font-body-lg text-body-lg font-bold tracking-wide text-[#ffffff] flex-1">
                nitisaathi कभी भी आपका UPI PIN या OTP नहीं मांगेगा / nitisaathi will never ask for your UPI PIN or OTP
              </Text>
            </View>
          </View>

          {/* Two Column Layout Grid (Stack on mobile) */}
          <View className="flex-col lg:flex-row gap-6 w-full pb-8">
            
            {/* Left Column: Input */}
            <View className="flex-col gap-4 bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-surface-container flex-[4]">
              <View className="flex-row items-center gap-3 border-b border-surface-container pb-4">
                <MaterialIcons name="plagiarism" size={28} color="#a61c2e" />
                <Text className="font-headline-md text-headline-md text-on-surface flex-1">
                  एक संदिग्ध मैसेज चेक करें / Check a suspicious message
                </Text>
              </View>
              
              <View className="flex-col gap-4 mt-2">
                <TextInput
                  className="w-full bg-background-off-white border border-transparent rounded-lg p-4 font-body-md text-body-md text-on-surface text-left align-top"
                  placeholder="यहां मैसेज पेस्ट करें... / Paste the message here..."
                  placeholderTextColor="#6B6560"
                  multiline
                  numberOfLines={6}
                  style={{ minHeight: 150 }}
                  value={messageText}
                  onChangeText={setMessageText}
                />
                
                <View className="flex-row flex-wrap justify-between items-center mt-2 gap-4">
                  <Pressable onPress={() => { setMessageText(''); setCheckResult(null); }}>
                    <Text className="font-label-lg text-label-lg text-text-warm-gray underline">
                      साफ़ करें / Clear
                    </Text>
                  </Pressable>
                  
                  <Pressable
                    onPress={handleCheck}
                    disabled={checking || !messageText.trim()}
                    className="bg-[#E63946] active:bg-[#b7102a] flex-row items-center gap-2 px-8 py-3 rounded-full shadow-sm disabled:opacity-50"
                  >
                    {checking ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <MaterialIcons name="fact-check" size={20} color="white" />
                    )}
                    <Text className="text-white font-label-lg text-label-lg">
                      {checking ? 'जांच रहे हैं...' : 'जांचें / Check'}
                    </Text>
                  </Pressable>
                </View>

                {/* Inline result card */}
                {checkResult && (
                  <View
                    className={`mt-2 p-4 rounded-xl border-l-4 ${
                      checkResult.riskLevel === 'high'
                        ? 'bg-error-container border-error'
                        : checkResult.riskLevel === 'medium'
                        ? 'bg-caution-tint border-[#F4A621]'
                        : 'bg-[#E6F4EA] border-[#137333]'
                    }`}
                  >
                    <View className="flex-row items-center gap-2 mb-2">
                      <MaterialIcons
                        name={
                          checkResult.riskLevel === 'high'
                            ? 'gpp-bad'
                            : checkResult.riskLevel === 'medium'
                            ? 'gpp-maybe'
                            : 'verified-user'
                        }
                        size={22}
                        color={
                          checkResult.riskLevel === 'high'
                            ? '#ba1a1a'
                            : checkResult.riskLevel === 'medium'
                            ? '#8B5E00'
                            : '#137333'
                        }
                      />
                      <Text
                        className={`font-headline-sm text-headline-sm font-bold flex-1 ${
                          checkResult.riskLevel === 'high'
                            ? 'text-on-error-container'
                            : checkResult.riskLevel === 'medium'
                            ? 'text-[#8B5E00]'
                            : 'text-[#137333]'
                        }`}
                      >
                        {checkResult.headlineEnglish}
                      </Text>
                    </View>
                    <Text className="font-body-md text-body-md text-on-surface">
                      {checkResult.headlineHindi}
                    </Text>
                    <Text className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                      {checkResult.reasonEnglish}
                    </Text>
                    {checkResult.actionRequired && (
                      <Text className="font-label-md font-bold text-error mt-2">
                        {checkResult.actionRequired}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>

            {/* Right Column: Automatically Flagged */}
            <View className="flex-col gap-4 flex-[3]">
              <View className="flex-row items-center justify-between px-2">
                <View className="flex-row items-center gap-2 flex-1">
                  <MaterialIcons name="flag" size={24} color="#a61c2e" />
                  <View className="flex-col">
                    <Text className="font-headline-sm text-headline-sm text-on-surface">
                      स्वतः पहचाने गए लेनदेन
                    </Text>
                    <Text className="text-sm font-normal text-text-warm-gray mt-1">
                      Automatically flagged
                    </Text>
                  </View>
                </View>
                <View className="bg-error-container px-2.5 py-1 rounded-full">
                  <Text className="text-on-error-container font-label-sm text-[12px] font-bold">
                    {flaggedTxns.length} Flagged
                  </Text>
                </View>
              </View>
              
              <View className="flex-col gap-4">
                {flaggedTxns.map((txn) => (
                  <View key={txn.id} className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-surface-container border-l-4 border-l-primary flex-col gap-4">
                    <View className="flex-row justify-between items-start gap-2">
                      <View className="flex-col flex-1">
                        <Text className="font-headline-sm text-headline-sm text-on-surface">
                          {txn.amount}
                        </Text>
                        <Text className="font-body-md text-body-md text-on-surface-variant">
                          {txn.merchant}
                        </Text>
                        <Text className="font-label-sm text-[12px] text-text-warm-gray mt-1">
                          {txn.date}
                        </Text>
                      </View>
                      <View className="bg-caution-tint px-3 py-1 rounded-md flex-row items-center gap-1 shrink-0">
                        <MaterialIcons name={txn.icon as any} size={16} color="#93000a" />
                        <Text className="font-label-sm text-[12px] font-bold text-[#93000a]">
                          {txn.flagTypeHindi} / {txn.flagTypeEnglish}
                        </Text>
                      </View>
                    </View>
                    
                    <View className="flex-row gap-3 mt-2 border-t border-surface-container pt-4">
                      <Pressable className="flex-1 border border-outline py-2 rounded-full flex-row justify-center items-center gap-1 active:bg-surface-container-highest">
                        <MaterialIcons name="check-circle" size={18} color="#594140" />
                        <Text className="text-on-surface-variant font-label-lg text-label-lg">
                          सही है
                        </Text>
                      </Pressable>
                      <Pressable className="flex-1 border-2 border-error py-2 rounded-full flex-row justify-center items-center gap-1 active:bg-error-container">
                        <MaterialIcons name="gavel" size={18} color="#ba1a1a" />
                        <Text className="text-error font-label-lg text-label-lg font-bold">
                          धोखाधड़ी है
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </View>

          </View>
        </View>
      </ScrollView>
    </AppLayout>
  );
}
