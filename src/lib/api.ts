// API Wrapper: Centralized HTTP client with auth and error handling
import { auth } from '@/src/lib/firebase';
import {
    ApiError,
    AuthResponse,
    Chat,
    ChatHistoryItem,
    CreateChatResponse,
    LoginRequest,
    Message,
    ProcessAudioResponse,
    SendMessageRequest,
    SendMessageResponse,
    SignedUrlRequest,
    SignedUrlResponse,
    SignupRequest,
    TranscriptionRequest,
    TranscriptionResponse,
    User
} from '@/src/types/api';
import axios, { AxiosError, AxiosInstance } from 'axios';
import { API_CONFIG } from './config';

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('API Client initialized with Base URL:', API_CONFIG.BASE_URL);

    // Request interceptor to add Firebase token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        try {
          const currentUser = auth.currentUser;
          if (currentUser) {
            const token = await currentUser.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Failed to get Firebase token:', error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log('API Response:', response);
        return response;
      },
      (error: AxiosError) => {
        if (error.code === 'ECONNABORTED') {
          throw {
            message: 'Request timeout',
            statusCode: 408,
          } as ApiError;
        }
        
        if (error.response) {
          const apiError: ApiError = {
            message: (error.response.data as any)?.message || 'An error occurred',
            statusCode: error.response.status,
            error: (error.response.data as any)?.error,
          };
          throw apiError;
        }
        
        throw {
          message: error.message || 'Network error',
          statusCode: 0,
        } as ApiError;
      }
    );
  }

  // Auth APIs
  async signup(data: SignupRequest): Promise<AuthResponse> {
    const response = await this.axiosInstance.post<AuthResponse>(
      API_CONFIG.ENDPOINTS.SIGNUP,
      data
    );
    return response.data;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.axiosInstance.post<AuthResponse>(
      API_CONFIG.ENDPOINTS.LOGIN,
      data
    );
    return response.data;
  }

  async getMe(): Promise<User> {
    const response = await this.axiosInstance.get<User>(API_CONFIG.ENDPOINTS.ME);
    return response.data;
  }

  async resetPassword(email: string): Promise<{ message: string }> {
    const response = await this.axiosInstance.post<{ message: string }>(
      '/auth/reset-password',
      { email }
    );
    return response.data;
  }

  // Chat APIs
  async createChat(): Promise<CreateChatResponse> {
    const response = await this.axiosInstance.post<CreateChatResponse>(
      API_CONFIG.ENDPOINTS.CHATS
    );
    return response.data;
  }

  async getChatHistory(token?: string): Promise<ChatHistoryItem[]> {
    const url = token 
      ? `${API_CONFIG.ENDPOINTS.CHAT_HISTORY}?token=${encodeURIComponent(token)}`
      : API_CONFIG.ENDPOINTS.CHAT_HISTORY;
    const response = await this.axiosInstance.get<ChatHistoryItem[]>(url);
    return response.data;
  }

  async getChat(chatId: string): Promise<Chat> {
    const response = await this.axiosInstance.get<Chat>(
      API_CONFIG.ENDPOINTS.CHAT_BY_ID(chatId)
    );
    return response.data;
  }

  async processAudio(chatId: string, fileKey: string): Promise<ProcessAudioResponse> {
    const response = await this.axiosInstance.post<ProcessAudioResponse>(
      API_CONFIG.ENDPOINTS.PROCESS_AUDIO(chatId),
      { fileKey }
    );
    return response.data;
  }

  async getMessages(chatId: string): Promise<Message[]> {
    const response = await this.axiosInstance.get<Message[]>(
      API_CONFIG.ENDPOINTS.MESSAGES(chatId)
    );
    return response.data;
  }

  async sendMessage(
    chatId: string,
    data: SendMessageRequest
  ): Promise<SendMessageResponse> {
    const response = await this.axiosInstance.post<SendMessageResponse>(
      API_CONFIG.ENDPOINTS.MESSAGES(chatId),
      data
    );
    return response.data;
  }

  async getNotesDownloadUrl(chatId: string): Promise<{ downloadUrl: string }> {
    const response = await this.axiosInstance.get<{ downloadUrl: string }>(
      API_CONFIG.ENDPOINTS.NOTES_DOWNLOAD(chatId)
    );
    return response.data;
  }

  async deleteChat(chatId: string): Promise<{ message: string }> {
    const response = await this.axiosInstance.delete<{ message: string }>(
      API_CONFIG.ENDPOINTS.CHAT_BY_ID(chatId)
    );
    return response.data;
  }
  

  // Audio APIs
  async transcribeAudio(data: TranscriptionRequest): Promise<TranscriptionResponse> {
    const response = await this.axiosInstance.post<TranscriptionResponse>(
      API_CONFIG.ENDPOINTS.TRANSCRIBE,
      data
    );
    return response.data;
  }

  // Upload APIs
  async getSignedUrl(data: SignedUrlRequest): Promise<SignedUrlResponse> {
    const params = new URLSearchParams();
    params.append('type', data.type);
    if (data.chatId) {
      params.append('chatId', data.chatId);
    }

    const response = await this.axiosInstance.post<SignedUrlResponse>(
      `${API_CONFIG.ENDPOINTS.SIGN_URL}?${params.toString()}`
    );
    return response.data;
  }
}

export const api = new ApiClient();
