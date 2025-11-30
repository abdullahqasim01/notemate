// New Chat Screen: Starting point for uploading videos and creating new conversations
import { useChatContext } from '@/src/context/ChatContext';
import { useFileUpload } from '@/src/hooks/useFileUpload';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewChatScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { createChat, clearChat } = useChatContext();
  const { uploadVideoForChat, uploading } = useFileUpload();
  const [error, setError] = useState('');

  // Handle video upload
  const handleUpload = async () => {
    try {
      setError('');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const videoUri = result.assets[0].uri;
        
        // Clear any existing chat data
        clearChat();
        
        // Navigate to generating screen with videoUri
        router.push({
          pathname: '/(main)/generating' as any,
          params: { 
            videoUri 
          },
        });
      }
    } catch (error: any) {
      console.error('Error picking video:', error);
      setError('Failed to pick video');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Empty state */}
        <View style={styles.emptyState}>
          <Text variant="displaySmall" style={styles.emptyIcon}>
            📹
          </Text>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            Upload a video to start
          </Text>
          <Text
            variant="bodyLarge"
            style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Upload a video to extract notes and start a new conversation
          </Text>
          
          {/* Upload Button */}
          <Button
            mode="contained"
            icon="video-plus"
            onPress={handleUpload}
            loading={uploading}
            disabled={uploading}
            style={styles.uploadButton}
          >
            Upload Video
          </Button>
          
          {error ? (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
          ) : null}
        </View>
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
  emptyState: {
    alignItems: 'center',
    maxWidth: 400,
  },
  emptyIcon: {
    fontSize: 72,
    marginBottom: 16,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: 32,
  },
  uploadButton: {
    paddingHorizontal: 24,
  },
  errorText: {
    marginTop: 16,
    textAlign: 'center',
  },
});
