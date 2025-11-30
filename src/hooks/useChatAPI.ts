// useChatAPI: Centralized chat operations wrapper
import { api } from '@/src/lib/api';
import { Chat, Message } from '@/src/types/api';
import { useState } from 'react';

export function useChatAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createChat = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.createChat();
      return { chatId: response.chatId, error: null };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create chat';
      setError(errorMsg);
      return { chatId: null, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const getChat = async (chatId: string): Promise<Chat | null> => {
    try {
      setLoading(true);
      setError(null);
      return await api.getChat(chatId);
    } catch (err: any) {
      setError(err.message || 'Failed to get chat');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getMessages = async (chatId: string): Promise<Message[]> => {
    try {
      setLoading(true);
      setError(null);
      return await api.getMessages(chatId);
    } catch (err: any) {
      setError(err.message || 'Failed to get messages');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (chatId: string, text: string) => {
    try {
      setError(null);
      const response = await api.sendMessage(chatId, { content: text });
      return { 
        userMessage: response.userMessage, 
        aiMessage: response.aiMessage, 
        error: null 
      };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to send message';
      setError(errorMsg);
      return { userMessage: null, aiMessage: null, error: errorMsg };
    }
  };

  const getNotes = async (chatId: string): Promise<string | null> => {
    try {
      setError(null);
      const chat = await api.getChat(chatId);
      
      if (chat.notesUrl) {
        const response = await fetch(chat.notesUrl);
        return await response.text();
      }
      
      return null;
    } catch (err: any) {
      setError(err.message || 'Failed to get notes');
      return null;
    }
  };

  return {
    createChat,
    getChat,
    getMessages,
    sendMessage,
    getNotes,
    loading,
    error,
  };
}
