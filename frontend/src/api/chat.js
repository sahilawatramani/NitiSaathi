import { apiFetch } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'nitisaathi_chat_session_id';

export const getOrCreateSessionId = async () => {
  let id = await AsyncStorage.getItem(SESSION_KEY);
  if (!id) { 
    id = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`; 
    await AsyncStorage.setItem(SESSION_KEY, id); 
  }
  return id;
};

export const sendChatMessage = async (message, chatHistory = [], sessionId = null) => {
  const session_id = sessionId || await getOrCreateSessionId();
  const response = await apiFetch('/api/chat/', {
    method: 'POST',
    body: JSON.stringify({ message, session_id, chat_history: chatHistory })
  });
  return response;
};

export const getSuggestedQuestions = async () => [
  { icon: 'savings', hindi: 'इस हफ्ते कितना बचा सकता हूं?', english: 'How much can I save this week?' },
  { icon: 'verified', hindi: 'क्या मैं PM-SYM के लिए योग्य हूं?', english: 'Am I eligible for PM-SYM?' },
  { icon: 'security', hindi: 'यह मैसेज सुरक्षित है या नहीं?', english: 'Is this message safe?' },
  { icon: 'real-estate-agent', hindi: 'मेरा किराया इस महीने कैसे मैनेज करूं?', english: 'How do I manage rent this month?' }
];

export const getChatHistory = async () => ({ messages: [], isThinking: false });
