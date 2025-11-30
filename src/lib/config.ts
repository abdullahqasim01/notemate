// API Configuration: Backend endpoints and settings
export const API_CONFIG = {
  // Update this to your NestJS backend URL
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  
  ENDPOINTS: {
    // Auth
    SIGNUP: '/auth/signup',
    LOGIN: '/auth/login',
    ME: '/auth/me',
    
    // Chat
    CHATS: '/chats',
    CHAT_HISTORY: '/chats/history',
    CHAT_BY_ID: (id: string) => `/chats/${id}`,
    PROCESS_AUDIO: (id: string) => `/chats/${id}/process-audio`,
    MESSAGES: (id: string) => `/chats/${id}/messages`,
    NOTES_DOWNLOAD: (id: string) => `/chats/${id}/notes/download`,
    
    // Audio
    TRANSCRIBE: '/audio/transcribe',
    
    // Upload
    SIGN_URL: '/uploads/sign-url',
  },
  
  TIMEOUT: 30000, // 30 seconds
};
