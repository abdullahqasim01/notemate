// Generating Notes Screen: Progress UI for video processing and note extraction
import { ProgressBar } from '@/src/components/ProgressBar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GeneratingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Processing video...');

  useEffect(() => {
    // TODO: Replace fake timeout with backend API for video → text extraction
    // Simulate progress animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 1) {
          clearInterval(interval);
          return 1;
        }
        
        const newProgress = prev + 0.02;
        
        // Update status based on progress
        if (newProgress < 0.3) {
          setStatus('Analyzing video...');
        } else if (newProgress < 0.6) {
          setStatus('Extracting audio...');
        } else if (newProgress < 0.9) {
          setStatus('Generating notes...');
        } else {
          setStatus('Finalizing...');
        }
        
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Navigate to chat when complete
    if (progress >= 1) {
        // Generate a unique chat ID using timestamp + random string
        const chatId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        router.replace(`/(main)/chat/${chatId}` as any);
    }
  }, [progress]);

  const handleCancel = () => {
    router.back();
  };

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
});
