/**
 * AssistantScreen — Main Chat Interface
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
import { chatService, ChatMessage } from '../../services/chatService';

const AssistantScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Send chat history + new message to LangGraph
      const res = await chatService.sendMessage(userMsg.content, messages);
      const botMsg: ChatMessage = { role: 'assistant', content: res.response };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      console.log('Chat error', e);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'माफ़ करें, मुझे कुछ तकनीकी समस्या हो रही है। / Sorry, I am having technical issues.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.appBar}>
          <Text style={styles.appBarTitle}>साथी / Assistant</Text>
          <TouchableOpacity onPress={() => setMessages([])}>
            <Text style={styles.newChatText}>नई बातचीत / New chat</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.chatContainer}>
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBg}>
                <Text style={styles.emptyIcon}>🤖</Text>
              </View>
              <Text style={styles.emptyTitle}>मैं साथी हूँ / I am Saathi</Text>
              <Text style={styles.emptySubtitle}>आप मुझसे कुछ भी पूछ सकते हैं। / Ask me anything.</Text>
            </View>
          ) : (
            messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <View key={idx} style={[styles.msgRow, isUser ? styles.msgRowRight : styles.msgRowLeft]}>
                  {!isUser && (
                    <View style={styles.avatar}>
                      <Text style={{ fontSize: 16 }}>🤖</Text>
                    </View>
                  )}
                  <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
                    <Text style={[styles.msgText, isUser ? styles.msgTextUser : styles.msgTextBot]}>
                      {msg.content}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
          {loading && (
            <View style={[styles.msgRow, styles.msgRowLeft]}>
              <View style={styles.avatar}><Text style={{ fontSize: 16 }}>🤖</Text></View>
              <View style={[styles.bubble, styles.bubbleBot]}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="पूछें या टाइप करें... / Ask here..."
              placeholderTextColor={Colors.textWarmGray}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
              <Text style={styles.sendIcon}>⬆</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.disclaimer}>साथी गलती कर सकता है। / Saathi can make mistakes.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  appBar: {
    height: 64,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceBright,
  },
  appBarTitle: { ...Typography.headlineSm, color: Colors.onSurface },
  newChatText: { ...Typography.labelLg, color: Colors.primary },
  chatContainer: { flexGrow: 1, padding: Spacing.lg, paddingBottom: Spacing.xxl },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primaryFixed, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { ...Typography.headlineMd, color: Colors.onSurface, marginBottom: Spacing.xs },
  emptySubtitle: { ...Typography.bodyMd, color: Colors.textWarmGray },
  msgRow: { flexDirection: 'row', marginBottom: Spacing.md, alignItems: 'flex-end' },
  msgRowRight: { justifyContent: 'flex-end' },
  msgRowLeft: { justifyContent: 'flex-start', gap: Spacing.sm },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primaryFixed, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  bubble: { maxWidth: '80%', padding: Spacing.md, borderRadius: BorderRadius.lg },
  bubbleUser: { backgroundColor: Colors.primaryContainer, borderBottomRightRadius: 4 },
  bubbleBot: { backgroundColor: Colors.surfaceContainerLowest, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.outlineVariant },
  msgText: { ...Typography.bodyMd },
  msgTextUser: { color: Colors.onPrimary },
  msgTextBot: { color: Colors.onSurface },
  inputBar: { padding: Spacing.md, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.surfaceContainerHigh },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.backgroundOffWhite, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.outlineVariant, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  input: { flex: 1, paddingVertical: 10, paddingHorizontal: Spacing.sm, ...Typography.bodyMd, color: Colors.onSurface },
  sendBtn: { backgroundColor: Colors.primary, padding: 8, borderRadius: BorderRadius.sm, justifyContent: 'center', alignItems: 'center' },
  sendIcon: { color: Colors.onPrimary, fontWeight: 'bold' },
  disclaimer: { ...Typography.labelSm, color: Colors.textWarmGray, textAlign: 'center', marginTop: Spacing.sm },
});

export default AssistantScreen;
