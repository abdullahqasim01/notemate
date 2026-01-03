import { useBackgroundJob } from "@/src/context/BackgroundJobContext";
import { useChatContext } from "@/src/context/ChatContext";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NewChatScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { clearChat } = useChatContext();
  const { startJob, activeJobs, jobs } = useBackgroundJob();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const processingJobId = Object.keys(jobs).find(
    (key) =>
      jobs[key].status !== "completed" &&
      jobs[key].status !== "failed" &&
      jobs[key].status !== "done",
  );
  const isProcessing = !!processingJobId;

  // Handle video upload
  const handleUpload = async () => {
    if (isProcessing) return;
    try {
      setError("");

      const result = await DocumentPicker.getDocumentAsync({
        type: "video/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLoading(true);
        const videoUri = result.assets[0].uri;

        // Clear any existing chat data
        clearChat();

        // Start job and get ID
        try {
          const chatId = await startJob(videoUri);
          setLoading(false);
          // Navigate immediately to chat screen
          router.replace(`/(main)/chat/${chatId}` as any);
        } catch (err: any) {
          setError(err.message || "Failed to start processing");
          setLoading(false);
        }
      }
    } catch (error: any) {
      console.error("Error picking video:", error);
      setError("Failed to pick video");
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
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
            style={[
              styles.emptySubtitle,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Upload a video to extract notes and start a new conversation
          </Text>

          {/* Upload Button */}
          <Button
            mode="contained"
            icon="video-plus"
            onPress={handleUpload}
            loading={loading || !!(isProcessing && processingJobId)}
            disabled={loading || !!(isProcessing && processingJobId)}
            contentStyle={styles.uploadButton}
          >
            {isProcessing && processingJobId ? "Processing..." : "Upload Video"}
          </Button>

          {isProcessing && processingJobId && (
            <View style={styles.processingContainer}>
              <Text
                variant="bodyMedium"
                style={[styles.warningText, { color: theme.colors.primary }]}
              >
                Only one notes generation is allowed at a time. Please wait for
                the current job to complete.
              </Text>
              <Button
                mode="outlined"
                onPress={() =>
                  router.push(`/(main)/chat/${processingJobId}` as any)
                }
                style={styles.goToChatButton}
              >
                Go to Processing Chat
              </Button>
            </View>
          )}

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
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyState: {
    alignItems: "center",
    maxWidth: 400,
  },
  emptyIcon: {
    fontSize: 72,
    marginBottom: 16,
  },
  emptyTitle: {
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "bold",
  },
  emptySubtitle: {
    textAlign: "center",
    marginBottom: 32,
  },
  uploadButton: {
    paddingHorizontal: 24,
  },
  errorText: {
    marginTop: 16,
    textAlign: "center",
  },
  processingContainer: {
    marginTop: 24,
    alignItems: "center",
    width: "100%",
  },
  warningText: {
    textAlign: "center",
    marginBottom: 12,
    opacity: 0.8,
  },
  goToChatButton: {
    marginTop: 8,
  },
});
