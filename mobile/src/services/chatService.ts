/**
 * Chat Service — send a message to the LangGraph orchestrator.
 */
import api from './api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  response: string;
  intent: string | null;
  active_agents: string[];
  confidence: number | null;
  trust_metadata: Record<string, unknown>;
  nudge_queue: Record<string, unknown>[];
}

export const chatService = {
  sendMessage: async (
    message: string,
    chatHistory: ChatMessage[],
    options?: { sessionId?: string; language?: string }
  ): Promise<ChatResponse> => {
    const res = await api.post<ChatResponse>('/chat/', {
      message,
      chat_history: chatHistory,
      session_id: options?.sessionId,
      language_pref: options?.language,
    });
    return res.data;
  },
};
