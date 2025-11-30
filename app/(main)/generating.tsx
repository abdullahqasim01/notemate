// Generating Notes Screen: Progress UI for video processing and note extraction
import { ProgressBar } from '@/src/components/ProgressBar';
import { useChatContext } from '@/src/context/ChatContext';
import { useFileUpload } from '@/src/hooks/useFileUpload';
import { api } from '@/src/lib/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GeneratingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { createChat } = useChatContext();
  const { uploadVideoForChat, uploading } = useFileUpload();
  
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Converting video to audio...');
  const [error, setError] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pollTimeout, setPollTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const processVideo = async () => {
      // Check if chatId is provided (redirected from chat screen)
      if (params.chatId && typeof params.chatId === 'string') {
        console.log('Resuming processing for existing chat:', params.chatId);
        setChatId(params.chatId);
        setStatus('Checking processing status...');
        setProgress(0.4);
        await pollChatStatus(params.chatId);
        return;
      }

      if (!params.videoUri || isProcessing) {
        if (!params.videoUri) {
          setError('No video selected');
        }
        return;
      }

      setIsProcessing(true);

      try {
        // Step 1: Create chat
        setStatus('Creating chat...');
        setError(null)
        setProgress(0.1);
        
        let newChatId: string;
        try {
          const { chatId: id, error: createError } = await createChat();
          if (createError || !id) {
            throw new Error(createError || 'Failed to create chat');
          }
          newChatId = id;
          setChatId(newChatId);
        } catch (err: any) {
          throw new Error(`Unable to create chat: ${err.message || 'Server error'}`);
        }

        // Step 2: Convert video to audio and upload
        setStatus('Converting video to audio...');
        setProgress(0.2);
        
        let fileKey: string;
        try {
          const { fileKey: key, error: uploadError } = await uploadVideoForChat(
            newChatId,
            params.videoUri as string
          );
          
          if (uploadError || !key) {
            throw new Error(uploadError || 'Upload failed');
          }
          fileKey = key;
        } catch (err: any) {
          throw new Error(`Video conversion failed: ${err.message || 'Conversion error'}`);
        }

        // Step 3: Notify backend that audio is uploaded and ready for processing
        setStatus('Starting processing...');
        setProgress(0.3);
        
        try {
          await api.processAudio(newChatId, fileKey);
        } catch (err: any) {
          const errorMsg = err.statusCode === 401
            ? 'Authentication failed. Please log in again.'
            : err.statusCode === 404
            ? 'Chat not found. Please try creating a new chat.'
            : err.statusCode === 408 || err.message?.includes('timeout')
            ? 'Server took too long to respond. Please try again.'
            : err.statusCode === 0 || err.message?.includes('Network')
            ? 'Network error. Please check your connection.'
            : `Failed to start processing: ${err.message || 'Server error'}`;
          throw new Error(errorMsg);
        }

        // Step 4: Poll backend for processing statusb
        setStatus('Processing audio...');
        setProgress(0.4);
        await pollChatStatus(newChatId);

      } catch (err: any) {
        console.error('Video processing error:', err);
        setError(err.message || 'Failed to process video. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    };

    processVideo();
    
    // Cleanup function
    return () => {
      setIsProcessing(false);
      if (pollTimeout) {
        clearTimeout(pollTimeout);
        setPollTimeout(null);
      }
    };
  }, []);

  const pollChatStatus = async (chatId: string) => {
    const maxAttempts = 60; // 60 attempts = 5 minutes max
    let attempts = 0;
    let isCancelled = false;

    const poll = async () => {
      if (isCancelled) return;

      try {
        const chat = await api.getChat(chatId);
        
        // Check for error status from backend
        if (chat.status === 'failed' || chat.status === 'error') {
          throw new Error('Processing failed on the server. Please try again.');
        }
        
        // Check if processing is complete
        if (chat.status === 'completed' || chat.status === 'done') {
          setProgress(1);
          setStatus('Complete!');
          setTimeout(() => {
            if (!isCancelled) {
              router.replace(`/(main)/chat/${chatId}` as any);
            }
          }, 500);
          return;
        }

        // Update progress based on status
        if (chat.status === 'transcribing') {
          setStatus('Transcribing audio...');
          setProgress(0.6);
        } else if (chat.status === 'generating_notes') {
          setStatus('Generating notes...');
          setProgress(0.8);
        } else if (chat.status === 'processing') {
          setStatus('Processing audio...');
          setProgress(0.5);
        }

        // Continue polling
        attempts++;
        if (attempts < maxAttempts) {
          const timeout = setTimeout(poll, 5000); // Poll every 5 seconds
          setPollTimeout(timeout);
        } else {
          throw new Error('Processing is taking longer than expected. Please check back later.');
        }
      } catch (err: any) {
        console.error('Polling error:', err);
        if (!isCancelled) {
          const errorMsg = err.statusCode === 0 || err.message?.includes('Network')
            ? 'Network error while checking status. Please check your connection.'
            : err.statusCode === 408 || err.message?.includes('timeout')
            ? 'Server not responding. Please try again.'
            : err.message || 'Failed to check processing status';
          setError(errorMsg);
        }
      }
    };

    // Start polling
    poll();

    // Return cleanup function
    return () => {
      isCancelled = true;
    };
  };

  const handleCancel = () => {
    router.back();
  };

  const handleRetry = () => {
    // Reset all states
    setError(null);
    setProgress(0);
    setStatus('Converting video to audio...');
    setChatId(null);
    
    // Navigate back to new-chat to start fresh
    router.replace('/(main)/new-chat');
  };

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.content}>
          <Text variant="displaySmall" style={styles.errorIcon}>
            ⚠️
          </Text>
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.error }]}>
            Processing Failed
          </Text>
          <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            {error}
          </Text>
          <View style={styles.errorButtons}>
            <Button mode="contained" onPress={handleRetry} style={styles.retryButton}>
              Try Again
            </Button>
            <Button mode="outlined" onPress={() => router.back()} style={styles.cancelButton}>
              Cancel
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Generating Notes
          </Text>
          <Text
            variant="bodyLarge"
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Please wait while we process your video
          </Text>
        </View>

        {/* Animation Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>⚡</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} label={status} />
        </View>

        {/* Video Info */}
        {params.videoUri && (
          <Text
            variant="bodySmall"
            style={[styles.videoInfo, { color: theme.colors.onSurfaceVariant }]}
          >
            Video: {params.videoUri.toString().split('/').pop()}
          </Text>
        )}

        {/* Cancel Button */}
        <Button
          mode="outlined"
          onPress={handleCancel}
          style={styles.cancelButton}
          disabled={progress >= 1}
        >
          Cancel
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
  iconContainer: {
    marginVertical: 32,
  },
  icon: {
    fontSize: 80,
  },
  progressContainer: {
    width: '100%',
    marginVertical: 32,
  },
  videoInfo: {
    marginTop: 16,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 32,
    minWidth: 120,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorButtons: {
    marginTop: 32,
    gap: 12,
    width: '100%',
    maxWidth: 300,
  },
  retryButton: {
    minWidth: 120,
  },
});
