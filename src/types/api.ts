// API Types: Backend response and request types
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface Chat {
  id: string;
  userId: string;
  title?: string;
  videoUrl?: string;
  transcriptionUrl?: string;
  notesUrl?: string;
  status?: 'processing' | 'transcribing' | 'generating_notes' | 'completed' | 'done' | 'failed' | 'error';
  createdAt: string;
  updatedAt: string;
}

export interface ChatHistoryItem {
  id: string;
  title: string;
}

export interface Message {
  id: string;
  chatId?: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string | { _seconds: number; _nanoseconds: number };
}

export interface CreateChatResponse {
  chatId: string;
}

export interface ProcessAudioRequest {
  fileKey: string;
}

export interface ProcessAudioResponse {
  success: boolean;
  message?: string;
}

export interface SendMessageRequest {
  text: string;
}

export interface SendMessageResponse {
  userMessage: Message;
  aiMessage: Message;
}

export interface TranscriptionRequest {
  audioUrl: string;
}

export interface TranscriptionResponse {
  text: string;
  confidence: number;
}

export interface SignedUrlRequest {
  type: 'transcription' | 'notes' | 'audio' | 'video';
  chatId?: string;
}

export interface SignedUrlResponse {
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
