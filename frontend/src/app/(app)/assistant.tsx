import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Platform, KeyboardAvoidingView, ActivityIndicator, Keyboard } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { sendChatMessage, getSuggestedQuestions } from '../../api/chat';
import { TradeoffCard } from '../../components/shared/TradeoffCard';
import { AppLayout } from '../../components/shared/AppLayout';
import { TrustBadge } from '../../components/shared/TrustBadge';
import { VoiceButton } from '../../components/shared/VoiceButton';

const ASSISTANT_HEADER_HEIGHT = 64;
const INPUT_LINE_HEIGHT = 24;
const INPUT_VERTICAL_PADDING = 16;
const INPUT_MIN_HEIGHT = INPUT_LINE_HEIGHT + INPUT_VERTICAL_PADDING;
const INPUT_MAX_HEIGHT = INPUT_LINE_HEIGHT * 5 + INPUT_VERTICAL_PADDING;

export default function AssistantScreen() {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [inputHeight, setInputHeight] = useState(INPUT_MIN_HEIGHT);
  const [suggestedQuestions, setSuggestedQuestions] = useState<any[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [nudgeQueue, setNudgeQueue] = useState<any[]>([]);

  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToBottom = useCallback((animated = true) => {
    scrollViewRef.current?.scrollToEnd({ animated });
  }, []);

  const handleContentSizeChange = useCallback((e: any) => {
    const newHeight = e.nativeEvent.contentSize.height;
    setInputHeight(Math.max(INPUT_MIN_HEIGHT, Math.min(newHeight, INPUT_MAX_HEIGHT)));
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      scrollToBottom(true);
    });
    return () => showSub.remove();
  }, [scrollToBottom]);

  useEffect(() => {
    if (messages.length) {
      const t = setTimeout(() => scrollToBottom(true), 80);
      return () => clearTimeout(t);
    }
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const questionsResult = await getSuggestedQuestions();
        setSuggestedQuestions(questionsResult as any[]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSend = async () => {
    if (!inputValue.trim() || isThinking) return;
    const text = inputValue.trim();
    setInputValue('');
    setInputHeight(INPUT_MIN_HEIGHT);
    const userMsg = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.text }));
      const response = await sendChatMessage(text, history);
      if (response.nudge_queue && response.nudge_queue.length > 0) {
        setNudgeQueue(prev => [...prev, ...response.nudge_queue]);
      }
      const aiMsg = { 
        id: (Date.now()+1).toString(), 
        role: 'assistant', 
        text: response.response,
        trustMetadata: response.trust_metadata
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'assistant', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsThinking(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="साथी / Assistant" hideHeader>
        <View className="flex-1 bg-surface-container-lowest justify-center items-center">
          <ActivityIndicator size="large" color="#a61c2e" />
        </View>
      </AppLayout>
    );
  }

  const hasMessages = messages.length > 0;

  return (
    <AppLayout title="साथी / Assistant" hideHeader>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={ASSISTANT_HEADER_HEIGHT}
      >
        <View style={{ flex: 1, alignItems: 'center' }} className="px-4 md:px-0">
          <View className="w-full max-w-[700px] flex-1 flex-col">
            
            {nudgeQueue.length > 0 && (
              <View className="w-full bg-vivid-red/10 p-4 border-b border-vivid-red/20 flex-row justify-between items-center">
                <Text className="text-vivid-red font-body-md flex-1">{nudgeQueue[0].message || 'New notification'}</Text>
                <Pressable onPress={() => setNudgeQueue(prev => prev.slice(1))}>
                  <MaterialIcons name="close" size={20} color="#a61c2e" />
                </Pressable>
              </View>
            )}

            {hasMessages ? (
              <View className="h-16 shrink-0 border-b border-surface-container-high w-full flex-row justify-between items-center z-10 bg-surface-bright px-4">
                <Text className="font-headline-md text-headline-md text-on-background">
                  साथी / Assistant
                </Text>
                <Pressable className="flex-row items-center gap-2" onPress={() => setMessages([])}>
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

            <ScrollView
              ref={scrollViewRef}
              style={{ flex: 1 }}
              contentContainerStyle={{
                alignItems: 'center',
                paddingBottom: 24,
                paddingTop: hasMessages ? 24 : 0,
              }}
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
            >
              
              {!hasMessages ? (
                <>
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

                  <View className="w-full max-w-[600px] flex-row flex-wrap justify-between px-4 md:px-0">
                    {suggestedQuestions.map((q, idx) => (
                      <Pressable 
                        key={idx}
                        onPress={() => { setInputValue(q.hindi); }}
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
                <View className="w-full px-4 md:px-0 flex-col gap-6">
                  
                  <View className="items-center w-full mb-2">
                    <View className="bg-surface-container-low px-3 py-1 rounded-full">
                      <Text className="font-label-sm text-label-sm text-on-surface-variant">Today</Text>
                    </View>
                  </View>

                  {messages.map((msg: any) => {
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
                              <View className="flex-row items-start justify-between mb-2">
                                <Text className="font-body-md text-body-md text-on-background flex-1">
                                  {msg.text}
                                </Text>
                                <VoiceButton text={msg.text} />
                              </View>

                              {msg.tradeoff && (
                                <TradeoffCard 
                                  headerText={msg.tradeoff.headerText}
                                  reasoningBody={msg.tradeoff.reasoningBody}
                                  icon={msg.tradeoff.icon}
                                />
                              )}

                              {msg.trustMetadata && (
                                <TrustBadge 
                                  confidenceLabel={msg.trustMetadata.confidence_label || 'Moderate'}
                                  dataFreshness={msg.trustMetadata.data_freshness || 'Recent'}
                                  confidenceScore={msg.trustMetadata.confidence_score || 0.7}
                                />
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

                  {isThinking && (
                    <View className="flex-row justify-start w-full gap-3 mt-2">
                      <View className="flex-shrink-0 w-8" />
                      <View className="flex-row items-center gap-3 bg-transparent px-2 py-1">
                        <ActivityIndicator size="small" color="#a61c2e" />
                        <Text className="font-label-sm text-[12px] italic text-on-surface-variant">
                          Thinking...
                        </Text>
                      </View>
                    </View>
                  )}

                </View>
              )}

            </ScrollView>

            <View className="w-full shrink-0 pt-3 pb-6 px-4 md:px-0">
              {!hasMessages && (
                <LinearGradient
                  colors={['rgba(252,249,248,0)', 'rgba(252,249,248,1)']}
                  style={{ position: 'absolute', top: -32, left: 0, right: 0, height: 40, zIndex: -1 }}
                />
              )}

              <View
                className="flex-row items-end bg-background-off-white rounded-lg px-2 shadow-sm border border-outline-variant w-full"
                style={{ minHeight: INPUT_MIN_HEIGHT + INPUT_VERTICAL_PADDING }}
              >
                <Pressable className="p-2 rounded-full active:bg-surface-variant mb-1">
                  <MaterialIcons name="mic" size={24} color="#594140" />
                </Pressable>

                <TextInput
                  className="flex-1 bg-transparent border-none font-body-md text-body-md text-on-background px-2"
                  style={{
                    height: inputHeight,
                    maxHeight: INPUT_MAX_HEIGHT,
                    lineHeight: INPUT_LINE_HEIGHT,
                    fontSize: 16,
                    paddingTop: 8,
                    paddingBottom: 8,
                    textAlignVertical: 'top',
                  }}
                  placeholder="पूछें या टाइप करें... / Ask or type here..."
                  placeholderTextColor="#6B6560"
                  value={inputValue}
                  onChangeText={setInputValue}
                  multiline
                  scrollEnabled={inputHeight >= INPUT_MAX_HEIGHT}
                  onContentSizeChange={handleContentSizeChange}
                  onSubmitEditing={handleSend}
                />

                <Pressable onPress={handleSend} className="w-10 h-10 bg-primary active:bg-secondary rounded flex items-center justify-center shadow-sm ml-2 mb-1">
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
