// ChatContext: Global chat state management with auto-fetch
import { api } from '@/src/lib/api';
import { ApiError, Chat, Message } from '@/src/types/api';
import React, { createContext, useContext, useState } from 'react';

interface ChatContextType {
  currentChatId: string | null;
  currentChat: Chat | null;
  messages: Message[];
  notes: string | null;
  loading: boolean;
  sending: boolean;
  createChat: () => Promise<{ chatId: string | null; error: string | null }>;
  loadChat: (chatId: string) => Promise<void>;
  loadMessages: (chatId: string) => Promise<void>;
  addMessage: (chatId: string, content: string) => Promise<{ error: string | null }>;
  clearChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notes, setNotes] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const createChat = async () => {
    try {
      setLoading(true);
      const response = await api.createChat();
      setCurrentChatId(response.chatId);
      return { chatId: response.chatId, error: null };
    } catch (error: any) {
      const apiError = error as ApiError;
      return { chatId: null, error: apiError.message || 'Failed to create chat' };
    } finally {
      setLoading(false);
    }
  };

  const loadChat = async (chatId: string) => {
    try {
      setLoading(true);
      const chat = await api.getChat(chatId);
      setCurrentChatId(chatId);
      setCurrentChat(chat);

      // Clear notes first to avoid showing stale data
      setNotes(null);

      // Load notes using the download endpoint if chat is completed
      if (chat.status === 'completed' || chat.status === 'done') {
        try {
          const { downloadUrl } = await api.getNotesDownloadUrl(chatId);
          const response = await fetch(downloadUrl);
          if (response.ok) {
            const notesText = await response.text();
            if (notesText && notesText.trim()) {
              setNotes(notesText);
            }
          }
        } catch (error) {
          console.error('Failed to load notes:', error);
          // Keep notes as null if loading fails
        }
      }
    } catch (error: any) {
      console.error('Failed to load chat:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      setLoading(true);
      const msgs = await api.getMessages(chatId);
      setMessages(msgs);
    } catch (error: any) {
      console.error('Failed to load messages:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addMessage = async (chatId: string, content: string) => {
    try {
      // Validate input
      if (!content || !content.trim()) {
        return { error: 'Message cannot be empty' };
      }

      if (!chatId) {
        return { error: 'Chat ID is required' };
      }

      setSending(true);
      
      // Optimistically add user message
      const tempUserMessage: Message = {
        id: `temp-${Date.now()}`,
        role: 'user',
        text: content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMessage]);

      const response = await api.sendMessage(chatId, { text: content });
      
      // Replace temp message with real messages from server
      setMessages((prev) => {
        const withoutTemp = prev.filter(m => m.id !== tempUserMessage.id);
        return [...withoutTemp, response.userMessage, response.aiMessage];
      });
      
      return { error: null };
    } catch (error: any) {
      console.error('Send message error:', error);
      const apiError = error as ApiError;
      
      // Remove optimistic message on error
      setMessages((prev) => prev.filter(m => !m.id.startsWith('temp-')));
      
      // Provide specific error messages
      const errorMessage = apiError.statusCode === 401
        ? 'Authentication failed. Please log in again.'
        : apiError.statusCode === 404
        ? 'Chat not found. Please refresh and try again.'
        : apiError.statusCode === 0
        ? 'Network error. Please check your connection.'
        : apiError.message || 'Failed to send message. Please try again.';
      
      return { error: errorMessage };
    } finally {
      setSending(false);
    }
  };

  const clearChat = () => {
    setCurrentChatId(null);
    setCurrentChat(null);
    setMessages([]);
    setNotes(null);
  };

  return (
    <ChatContext.Provider
      value={{
        currentChatId,
        currentChat,
        messages,
        notes,
        loading,
        sending,
        createChat,
        loadChat,
        loadMessages,
        addMessage,
        clearChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
}
