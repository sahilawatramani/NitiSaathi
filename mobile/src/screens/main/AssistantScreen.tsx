/**
 * AssistantScreen — AI Copilot Chat interface matching reference design.
 * Pure single-language strings dynamically loaded via useTranslation().
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
import { useTranslation } from '../../i18n';
import { chatService, ChatMessage } from '../../services/chatService';

interface RichMessage {
  role: 'user' | 'assistant';
  text: string;
  hasInsight?: boolean;
  insightTitle?: string;
  insightBody?: string;
  confidence?: string;
  disclaimer?: string;
}

const AssistantScreen: React.FC = () => {
  const { t, language } = useTranslation();

  const initialMessage: RichMessage = {
    role: 'assistant',
    text: t.assistant.initialMsg,
    hasInsight: true,
    insightTitle: t.assistant.insightHeading,
    insightBody: t.budget.steadyIncomeCallout,
    confidence: t.assistant.confidenceBadge,
    disclaimer: t.assistant.disclaimerText,
  };

  const [messages, setMessages] = useState<RichMessage[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim()) return;

    const userMsg: RichMessage = { role: 'user', text: textToSend.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history: ChatMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.text,
      }));
      const res = await chatService.sendMessage(userMsg.text, history, { language });

      const r = res as any;
      const botMsg: RichMessage = {
        role: 'assistant',
        text: r.response || r.message || t.assistant.initialMsg,
        hasInsight: Boolean(r.has_budget_implication || r.has_scheme_context || r.budget_note),
        insightTitle: t.assistant.insightHeading,
        insightBody: r.budget_note || t.budget.causal1,
        confidence: t.assistant.confidenceBadge,
        disclaimer: t.assistant.disclaimerText,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: t.assistant.initialMsg,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([initialMessage]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title={t.nav.assistant} />

      {/* Sub-header with New Chat button */}
      <View style={styles.subBar}>
        <View style={styles.liveIndicator}>
          <Text style={styles.liveDot}>●</Text>
          <Text style={styles.liveText}>{t.assistant.liveStatus}</Text>
        </View>
        <TouchableOpacity style={styles.newChatBtn} onPress={handleNewChat}>
          <Text style={styles.newChatText}>{t.assistant.newChat}</Text>
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

          {/* Quick Prompts */}
          <View style={styles.quickPrompts}>
            {[t.assistant.quickQ1, t.assistant.quickQ2, t.assistant.quickQ3].map((q, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.quickPromptBtn}
                onPress={() => handleSend(q)}
                activeOpacity={0.8}
              >
                <Text style={styles.quickPromptText}>💬 {q}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
              placeholder={t.assistant.inputPlaceholder}
              placeholderTextColor={Colors.textWarmGray}
              onSubmitEditing={() => handleSend()}
            />

            <TouchableOpacity style={styles.sendBtn} onPress={() => handleSend()}>
              <Text style={styles.sendIcon}>➤</Text>
            </TouchableOpacity>
          </View>
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
  quickPrompts: {
    gap: 8,
    marginTop: Spacing.sm,
  },
  quickPromptBtn: {
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '30',
  },
  quickPromptText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
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
});

export default AssistantScreen;
