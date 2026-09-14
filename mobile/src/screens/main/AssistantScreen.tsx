/**
 * AssistantScreen — AI Copilot Chat interface matching video reference.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { chatService, ChatMessage } from '../../services/chatService';

interface RichMessage {
  role: 'user' | 'assistant';
  text: string;
  hasInsight?: boolean;
  insightTitle?: string;
  insightBody?: string;
  confidence?: string;
  basisText?: string;
  disclaimer?: string;
}

const DEFAULT_MESSAGES: RichMessage[] = [
  {
    role: 'assistant',
    text: "आप PM-SYM के लिए योग्य हैं। आपका योगदान ₹55/महीना होगा। / You're eligible for PM-SYM. Your contribution would be ₹55/month.",
    hasInsight: true,
    insightTitle: "यहाँ एक बात ध्यान देने वाली है / Here's something to consider",
    insightBody: "आपकी कमाई पिछले 8 हफ़्तों में से 3 में स्थिर रही है। 4 और स्थिर हफ़्तों का इंतज़ार करने की सलाह है। / Your income has been stable in only 3 of the last 8 weeks. We recommend waiting 4 more stable weeks.",
    basisText: "पिछले 4 हफ्तों पर आधारित, 2 दिन पहले अपडेट हुआ / Based on last 4 weeks, updated 2 days ago",
    confidence: "85% confidence / 85% भरोसा",
    disclaimer: "यह जानकारी सामान्य मार्गदर्शन के लिए है। किसी भी योजना में दाखिला लेने से पहले आधिकारिक वेबसाइट पर जाँचें / This is general guidance — verify on the official website before enrolling.",
  },
];

const AssistantScreen: React.FC = () => {
  const [messages, setMessages] = useState<RichMessage[]>(DEFAULT_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: RichMessage = { role: 'user', text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history: ChatMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.text,
      }));
      const res = await chatService.sendMessage(userMsg.text, history);

      const r = res as any;
      const botMsg: RichMessage = {
        role: 'assistant',
        text: r.response || r.message || 'उत्तर प्राप्त हुआ।',
        hasInsight: Boolean(r.has_budget_implication || r.has_scheme_context || r.budget_note),
        insightTitle: "यहाँ एक बात ध्यान देने वाली है / Here's something to consider",
        insightBody: r.budget_note || "आपकी कमाई और बजट के अनुसार यह निर्णय सुरक्षित रहेगा।",
        confidence: "85% confidence / 85% भरोसा",
        disclaimer: "यह जानकारी सामान्य मार्गदर्शन के लिए है। किसी भी योजना में दाखिला लेने से पहले आधिकारिक वेबसाइट पर जाँचें / This is general guidance.",
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'माफ़ करें, मुझे कुछ तकनीकी समस्या हो रही है। कृपया पुनः प्रयास करें।',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages(DEFAULT_MESSAGES);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title="साथी / Assistant" />

      {/* Sub-header with New Chat button */}
      <View style={styles.subBar}>
        <View style={styles.liveIndicator}>
          <Text style={styles.liveDot}>●</Text>
          <Text style={styles.liveText}>
            बजट और योजनाएं देख रहे हैं... / Checking your budget and schemes...
          </Text>
        </View>
        <TouchableOpacity style={styles.newChatBtn} onPress={handleNewChat}>
          <Text style={styles.newChatText}>+ नई बातचीत / New chat</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.chatScroll}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <View key={idx} style={[styles.msgRow, isUser ? styles.msgRowRight : styles.msgRowLeft]}>
                {!isUser && (
                  <View style={styles.botAvatar}>
                    <Text style={styles.botAvatarText}>🏛️</Text>
                  </View>
                )}

                <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
                  {/* Primary Text */}
                  <Text style={[styles.primaryText, isUser ? styles.userText : styles.botText]}>
                    {msg.text}
                  </Text>

                  {/* Embedded Insight Box */}
                  {!isUser && msg.hasInsight && (
                    <View style={styles.insightBox}>
                      <Text style={styles.insightTitle}>{msg.insightTitle}</Text>
                      <Text style={styles.insightBody}>{msg.insightBody}</Text>
                    </View>
                  )}

                  {/* Basis / Confidence / Disclaimer */}
                  {!isUser && msg.basisText && (
                    <Text style={styles.basisText}>🕒 {msg.basisText}</Text>
                  )}

                  {!isUser && msg.confidence && (
                    <View style={styles.confidencePill}>
                      <Text style={styles.confidenceText}>✅ {msg.confidence}</Text>
                    </View>
                  )}

                  {!isUser && msg.disclaimer && (
                    <Text style={styles.disclaimerText}>{msg.disclaimer}</Text>
                  )}
                </View>
              </View>
            );
          })}

          {loading && (
            <View style={[styles.msgRow, styles.msgRowLeft]}>
              <View style={styles.botAvatar}>
                <Text style={styles.botAvatarText}>🏛️</Text>
              </View>
              <View style={[styles.bubble, styles.bubbleBot, { padding: 14 }]}>
                <ActivityIndicator size="small" color={Colors.primaryContainer} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.micBtn}>
              <Text style={styles.micIcon}>🎙️</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.textInput}
              value={input}
              onChangeText={setInput}
              placeholder="पूछें या टाइप करें... / Ask or type"
              placeholderTextColor={Colors.textWarmGray}
              onSubmitEditing={handleSend}
            />

            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
              <Text style={styles.sendIcon}>➤</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerDisclaimer}>
            साथी गलती कर सकता है। महत्वपूर्ण जानकारी की पुष्टि करें / Saathi can make mistakes. Verify important info.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.backgroundOffWhite },
  subBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: '#F7F3F1',
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant + '30',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  liveDot: { color: Colors.vividRed, fontSize: 10 },
  liveText: {
    fontSize: 11,
    color: Colors.textWarmGray,
    fontWeight: '500',
  },
  newChatBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  newChatText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryContainer,
  },
  chatScroll: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  msgRowLeft: { justifyContent: 'flex-start' },
  msgRowRight: { justifyContent: 'flex-end' },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FBECEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  botAvatarText: { fontSize: 14 },
  bubble: {
    maxWidth: '88%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  bubbleUser: {
    backgroundColor: Colors.primaryContainer,
    borderTopRightRadius: 2,
  },
  bubbleBot: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '30',
    borderTopLeftRadius: 2,
  },
  primaryText: {
    ...Typography.bodyMd,
    fontSize: 14,
    lineHeight: 20,
  },
  userText: { color: Colors.onPrimary, fontWeight: '500' },
  botText: { color: Colors.onSurface },

  // Insight Box
  insightBox: {
    backgroundColor: '#FAF7F7',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primaryContainer,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    gap: 4,
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  insightBody: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 17,
  },

  basisText: {
    fontSize: 11,
    color: Colors.textWarmGray,
  },
  confidencePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F8EE',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1B7A3D',
  },
  disclaimerText: {
    fontSize: 10,
    color: Colors.textWarmGray,
    lineHeight: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant + '20',
    paddingTop: 6,
  },

  // Input Box
  inputContainer: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant + '40',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    gap: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundOffWhite,
    borderRadius: 24,
    paddingHorizontal: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '40',
  },
  micBtn: {
    padding: 8,
  },
  micIcon: { fontSize: 18 },
  textInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: Spacing.xs,
    fontSize: 13,
    color: Colors.onSurface,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  sendIcon: {
    color: Colors.onPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  footerDisclaimer: {
    fontSize: 10,
    color: Colors.textWarmGray,
    textAlign: 'center',
  },
});

export default AssistantScreen;
