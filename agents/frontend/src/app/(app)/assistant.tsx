import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Platform, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { getChatHistory, getSuggestedQuestions } from '../../api/chat';
import { TradeoffCard } from '../../components/shared/TradeoffCard';
import { AppLayout } from '../../components/shared/AppLayout';

export default function AssistantScreen() {
  const [loading, setLoading] = useState(true);
  const [chatData, setChatData] = useState<any>(null);
  const [inputValue, setInputValue] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [chatResult, questionsResult] = await Promise.all([
          getChatHistory(),
          getSuggestedQuestions(),
        ]);
        setChatData(chatResult);
        setSuggestedQuestions(questionsResult as any[]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <AppLayout title="साथी / Assistant" hideHeader>
        <View className="flex-1 bg-surface-container-lowest justify-center items-center">
          <ActivityIndicator size="large" color="#a61c2e" />
        </View>
      </AppLayout>
    );
  }

  const hasMessages = chatData && chatData.messages && chatData.messages.length > 0;

  return (
    <AppLayout title="साथी / Assistant" hideHeader>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-1 items-center px-4 md:px-0">
          
          <View className="w-full max-w-[700px] flex-1 relative">
            
            {/* Header Area */}
            {hasMessages ? (
              <View className="py-4 shrink-0 border-b border-surface-container-high w-full flex-row justify-between items-center z-10 bg-surface-bright px-4 mt-2">
                <Text className="font-headline-md text-headline-md text-on-background">
                  साथी / Assistant
                </Text>
                <Pressable className="flex-row items-center gap-2">
                  <MaterialIcons name="add-circle" size={16} color="#82001b" />
                  <Text className="text-primary font-label-lg text-label-lg">नई बातचीत / New chat</Text>
                </Pressable>
              </View>
            ) : (
              <View className="py-8 shrink-0 border-b border-surface-variant/50 w-full mb-8 px-4">
                <Text className="font-headline-lg text-headline-lg text-on-surface">
                  साथी से पूछें / Ask nitisaathi
                </Text>
                <Text className="font-body-md text-body-md text-text-warm-gray mt-2">
                  Your 24/7 Financial Guardian Assistant
                </Text>
              </View>
            )}

            {/* Scrollable Area */}
            <ScrollView 
              className="flex-1"
              contentContainerStyle={{ alignItems: 'center', paddingBottom: 160, paddingTop: hasMessages ? 24 : 0 }}
              showsVerticalScrollIndicator={false}
            >
              
              {!hasMessages ? (
                <>
                  {/* Empty State Illustration & Heading */}
                  <View className="items-center mb-12 w-full">
                    <View className="w-24 h-24 bg-primary-fixed rounded-full flex items-center justify-center mb-6 shadow-sm">
                      <MaterialIcons name="forum" size={48} color="#82001b" />
                    </View>
                    <Text className="font-headline-md text-headline-md text-on-surface mb-2 text-center">
                      आप क्या जानना चाहते हैं?
                    </Text>
                    <Text className="font-body-lg text-body-lg text-text-warm-gray text-center">
                      What would you like to know?
                    </Text>
                  </View>

                  {/* Suggested Questions Grid */}
                  <View className="w-full max-w-[600px] flex-row flex-wrap justify-between px-4 md:px-0">
                    {suggestedQuestions.map((q, idx) => (
                      <Pressable 
                        key={idx}
                        className="bg-surface rounded-xl p-6 border border-surface-variant w-[100%] md:w-[48%] mb-4 shadow-sm active:bg-surface-container-low transition-all"
                      >
                        <MaterialIcons name={q.icon as any} size={24} color="#a61c2e" style={{ marginBottom: 12 }} />
                        <Text className="font-body-md text-body-md text-on-surface font-medium leading-relaxed">
                          {q.hindi}
                        </Text>
                        <Text className="text-text-warm-gray text-sm font-normal mt-1">
                          {q.english}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : (
                /* Active Conversation State */
                <View className="w-full px-4 md:px-0 flex-col gap-6">
                  
                  {/* Date Divider */}
                  <View className="items-center w-full mb-2">
                    <View className="bg-surface-container-low px-3 py-1 rounded-full">
                      <Text className="font-label-sm text-label-sm text-on-surface-variant">Today</Text>
                    </View>
                  </View>

                  {chatData.messages.map((msg: any) => {
                    if (msg.role === 'user') {
                      return (
                        <View key={msg.id} className="flex-row justify-end w-full">
                          <View className="bg-primary-container p-4 rounded-2xl rounded-tr-sm max-w-[85%] shadow-sm border border-primary/10">
                            <Text className="font-body-md text-body-md text-[#ffb9b8]">{msg.text}</Text>
                          </View>
                        </View>
                      );
                    } else {
                      return (
                        <View key={msg.id} className="flex-row justify-start w-full gap-3">
                          <View className="flex-shrink-0 mt-1">
                            <View className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center">
                              <MaterialIcons name="smart-toy" size={18} color="#a61c2e" />
                            </View>
                          </View>
                          <View className="flex-col gap-3 max-w-[85%]">
                            <View className="bg-background-off-white p-4 rounded-2xl rounded-tl-sm shadow-sm border border-outline-variant/30">
                              <Text className="font-body-md text-body-md mb-4 text-on-background">
                                {msg.text}
                              </Text>

                              {msg.tradeoff && (
                                <TradeoffCard 
                                  headerText={msg.tradeoff.headerText}
                                  reasoningBody={msg.tradeoff.reasoningBody}
                                  icon={msg.tradeoff.icon}
                                />
                              )}

                              {msg.trustMetadata && (
                                <View className="flex-row flex-wrap items-center gap-3 mb-2">
                                  <View className="flex-row items-center gap-1 bg-surface-container-low px-2 py-1 rounded">
                                    <MaterialIcons name="schedule" size={14} color="#594140" />
                                    <Text className="font-label-sm text-label-sm text-on-surface-variant">
                                      {msg.trustMetadata.basis}
                                    </Text>
                                  </View>
                                  <View className="flex-row items-center gap-1 bg-[#8df9ac]/30 px-2 py-1 rounded">
                                    <MaterialIcons name="verified" size={14} color="#004923" />
                                    <Text className="font-label-sm text-label-sm text-[#004923]">
                                      {msg.trustMetadata.confidence}
                                    </Text>
                                  </View>
                                </View>
                              )}

                              {msg.disclaimer && (
                                <View className="border-t border-surface-container-high pt-2 mt-2">
                                  <Text className="font-label-sm text-[12px] italic text-text-warm-gray">
                                    {msg.disclaimer}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>
                      );
                    }
                  })}

                  {/* Thinking State */}
                  {chatData.isThinking && (
                    <View className="flex-row justify-start w-full gap-3 mt-2">
                      <View className="flex-shrink-0 w-8" />
                      <View className="flex-row items-center gap-3 bg-transparent px-2 py-1">
                        <View className="flex-row gap-1 items-center">
                          <View className="w-2 h-2 rounded-full bg-primary/40" />
                          <View className="w-2 h-2 rounded-full bg-primary/60" />
                          <View className="w-2 h-2 rounded-full bg-primary/80" />
                        </View>
                        <Text className="font-label-sm text-[12px] italic text-on-surface-variant">
                          {chatData.thinkingText}
                        </Text>
                      </View>
                    </View>
                  )}

                </View>
              )}

            </ScrollView>

            {/* Chat Input (Pinned Bottom) */}
            <View className="absolute bottom-0 left-0 w-full pb-8 pt-4 px-4 md:px-0">
              {!hasMessages && (
                <LinearGradient
                  colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)', 'rgba(255,255,255,1)']}
                  style={{ position: 'absolute', top: -20, left: 0, right: 0, bottom: 0, zIndex: -1 }}
                />
              )}
              
              <View className="flex-row items-center bg-background-off-white rounded-lg h-14 px-2 shadow-sm border border-outline-variant w-full">
                
                {/* Mic Icon */}
                <Pressable className="p-2 rounded-full active:bg-surface-variant">
                  <MaterialIcons name="mic" size={24} color="#594140" />
                </Pressable>
                
                {/* Input */}
                <TextInput 
                  className="flex-1 bg-transparent border-none font-body-md text-body-md text-on-background px-2 h-full"
                  placeholder="पूछें या टाइप करें... / Ask or type here..."
                  placeholderTextColor="#6B6560"
                  value={inputValue}
                  onChangeText={setInputValue}
                />
                
                {/* Send Button */}
                <Pressable className="w-10 h-10 bg-primary active:bg-secondary rounded flex items-center justify-center shadow-sm ml-2">
                  <MaterialIcons name="send" size={20} color="white" />
                </Pressable>
              </View>
              
              <View className="items-center mt-2">
                <Text className="font-label-sm text-[12px] text-text-warm-gray text-center">
                  साथी गलती कर सकता है। महत्वपूर्ण जानकारी की पुष्टि करें। / Saathi can make mistakes. Verify important info.
                </Text>
              </View>
            </View>

          </View>
        </View>
      </KeyboardAvoidingView>
    </AppLayout>
  );
}
