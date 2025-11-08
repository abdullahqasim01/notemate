// TypeScript: Types for chat, messages, and user data

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Chat {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
  videoUri?: string;
  notes?: string;
}

export interface Note {
  id: string;
  chatId: string;
  content: string;
  extractedAt: Date;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  displayName?: string;
  photoURL?: string;
}
