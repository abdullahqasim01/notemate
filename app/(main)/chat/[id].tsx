// Chat Screen: ChatGPT-style conversation interface with extracted notes
import { ChatBubble } from "@/src/components/ChatBubble";
import { GenerationSteps } from "@/src/components/GenerationSteps";
import { useBackgroundJob } from "@/src/context/BackgroundJobContext";
import { useChatContext } from "@/src/context/ChatContext";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import ReactNativeBlobUtil from "react-native-blob-util";
import Markdown from "react-native-markdown-display";
import {
  Button,
  Card,
  Modal,
  Portal,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const chatId = params.id as string;

  const {
    currentChat,
    messages: contextMessages,
    notes,
    loadChat,
    loadMessages,
    addMessage,
    clearChat,
    deleteChat,
    sending,
    loading,
  } = useChatContext();

  const { jobs, retryJob, cancelJob } = useBackgroundJob();

  const job = jobs[chatId];
  const isJobActive =
    job && job.status !== "completed" && job.status !== "done";
  const isFailed = job && (job.status === "failed" || job.status === "error");
  const isProcessing = isJobActive && !isFailed;

  const [inputText, setInputText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [sendError, setSendError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Auto-load notes when modal opens and notes aren't loaded yet
  useEffect(() => {
    if (isModalVisible && !notes && (currentChat?.status === "completed" || currentChat?.status === "done")) {
      loadChat(chatId);
    }
  }, [isModalVisible]);

  // Convert markdown to HTML for PDF generation
  const markdownToHtml = (markdown: string): string => {
    let html = markdown;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');

    // Unordered lists
    html = html.replace(/^\* (.+)$/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Line breaks
    html = html.replace(/\n/gim, '<br/>');

    return html;
  };

  const handleDownloadPdf = async () => {
    if (!notes || !notes.trim()) {
      Alert.alert("No Notes", "There are no notes to download.");
      return;
    }

    try {
      setDownloadingPdf(true);

      // Request storage permission for Android
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: "Storage Permission",
            message: "App needs access to save PDF to Downloads folder",
            buttonPositive: "OK",
          }
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            "Permission Denied",
            "Storage permission is required to save the PDF."
          );
          setDownloadingPdf(false);
          return;
        }
      }

      // Convert markdown to HTML
      const htmlContent = markdownToHtml(notes);

      // Create HTML document with styling
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                padding: 20px;
                line-height: 1.6;
                color: #333;
              }
              h1 {
                color: #2196F3;
                font-size: 24px;
                margin-top: 20px;
                margin-bottom: 10px;
              }
              h2 {
                color: #2196F3;
                font-size: 20px;
                margin-top: 16px;
                margin-bottom: 8px;
              }
              h3 {
                color: #2196F3;
                font-size: 18px;
                margin-top: 12px;
                margin-bottom: 6px;
              }
              ul {
                margin: 8px 0;
                padding-left: 20px;
              }
              li {
                margin: 4px 0;
              }
              a {
                color: #2196F3;
                text-decoration: none;
              }
              strong {
                font-weight: 600;
              }
            </style>
          </head>
          <body>
            <h1>Extracted Notes</h1>
            ${htmlContent}
          </body>
        </html>
      `;

      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html });

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
      const fileName = `notes_${timestamp}.pdf`;

      // Get Downloads directory path
      const downloadDir = ReactNativeBlobUtil.fs.dirs.DownloadDir;
      const destPath = `${downloadDir}/${fileName}`;

      // Copy the PDF to Downloads folder
      await ReactNativeBlobUtil.fs.cp(uri.replace("file://", ""), destPath);

      // Scan the file so it appears in Downloads immediately
      await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
        {
          name: fileName,
          parentFolder: "",
          mimeType: "application/pdf",
        },
        "Download",
        destPath
      );

      Alert.alert(
        "PDF Downloaded",
        `Your notes have been saved to Downloads folder as ${fileName}`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      Alert.alert("Error", "Failed to generate PDF. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  useEffect(() => {
    // Load chat data when screen mounts
    const loadData = async () => {
      try {
        setInitialLoading(true);
        // Clear previous state if context doesn't do it automatically (it does for messages now)
        await loadChat(chatId);
        await loadMessages(chatId);
      } catch (error) {
        console.error("Failed to load chat:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
  }, [chatId]);

  // Add "View Notes" to navigation header
  const navigation = useNavigation();

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        !initialLoading && currentChat && !isJobActive ? (
          <Button
            mode="contained"
            icon="file-document-outline"
            onPress={() => setIsModalVisible(true)}
            compact
            buttonColor={theme.colors.surfaceVariant}
            textColor={theme.colors.onSurfaceVariant}
            style={{
              marginRight: 8,
              height: 40,
              width: 110,
              justifyContent: "center",
            }}
            contentStyle={{
              height: 40,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
            labelStyle={{
              fontSize: 14,
              fontWeight: "600",
              marginVertical: 0,
              marginHorizontal: 8,
            }}
          >
            Notes
          </Button>
        ) : null,
    });
  }, [navigation, theme, initialLoading, currentChat, isJobActive]);

  useEffect(() => {
    if (job && (job.status === "completed" || job.status === "done")) {
      console.log("Job completed, reloading chat to fetch notes...");
      loadChat(chatId);
    }
  }, [job?.status, chatId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (contextMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [contextMessages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const text = inputText;
    setInputText("");
    setSendError(null);

    const result = await addMessage(chatId, text);

    if (result.error) {
      console.error("Failed to send message:', result.error");
      setSendError(result.error);
      // Restore the input text so user can retry
      setInputText(text);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["bottom"]}
    >
      {isFailed ? (
        <View style={styles.centerContainer}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
          <Text
            variant="headlineSmall"
            style={{ marginBottom: 8, color: theme.colors.error }}
          >
            Generation Failed
          </Text>
          <Text
            variant="bodyMedium"
            style={{ textAlign: "center", marginBottom: 8, opacity: 0.7 }}
          >
            {job.error || "Something went wrong while processing your video."}
          </Text>
          <Text
            variant="bodySmall"
            style={{
              textAlign: "center",
              marginBottom: 24,
              opacity: 0.5,
              paddingHorizontal: 32,
            }}
          >
            For privacy reasons, we do not store your files. Please delete this
            chat and start a new one to try again.
          </Text>
          <Button
            mode="outlined"
            textColor={theme.colors.error}
            style={{ borderColor: theme.colors.error }}
            onPress={async () => {
              try {
                await deleteChat(chatId);
                router.replace("/(main)/new-chat");
              } catch (error) {
                console.error("Failed to delete chat:", error);
              }
            }}
          >
            Delete Chat
          </Button>
        </View>
      ) : isProcessing ? (
        <View style={styles.centerContainer}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>✨</Text>
          <Text variant="headlineSmall" style={{ marginBottom: 24 }}>
            Generating Notes...
          </Text>
          <GenerationSteps status={job.status} progress={job.progress} />
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
          keyboardVerticalOffset={100}
        >
          {/* Messages List */}
          <FlatList
            ref={flatListRef}
            data={contextMessages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ChatBubble message={item} />}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text variant="bodyLarge" style={styles.emptyText}>
                  No messages yet. Start a conversation!
                </Text>
              </View>
            }
            ListFooterComponent={
              sending ? (
                <View style={styles.loadingMessage}>
                  <ActivityIndicator size="small" />
                  <Text variant="bodySmall" style={styles.loadingText}>
                    AI is thinking...
                  </Text>
                </View>
              ) : null
            }
          />

          {/* Input Area */}
          <View style={[styles.inputContainer]}>
            {sendError && (
              <Text
                variant="bodySmall"
                style={[styles.errorText, { color: theme.colors.error }]}
              >
                {sendError}
              </Text>
            )}

            <View style={styles.inputRow}>
              {/* Input Pill */}
              <TextInput
                mode="outlined"
                placeholder="Message"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={2000}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                  },
                ]}
                outlineStyle={{
                  borderRadius: 24,
                  borderWidth: 0,
                }}
                contentStyle={{
                  paddingTop: 8,
                  paddingBottom: 8,
                  paddingHorizontal: 12,
                  textAlignVertical: "center",
                }}
                activeOutlineColor="transparent"
                selectionColor={theme.colors.primary}
                onSubmitEditing={handleSend}
                error={!!sendError}
              />

              {/* Send Button */}
              <View
                style={[
                  styles.sendButton,
                  {
                    backgroundColor: inputText.trim()
                      ? theme.colors.primary
                      : theme.dark
                        ? "#333333"
                        : "#E0E0E0",
                  },
                ]}
              >
                <TextInput.Icon
                  icon="arrow-up"
                  onPress={handleSend}
                  disabled={!inputText.trim()}
                  color={
                    inputText.trim()
                      ? theme.colors.onPrimary
                      : theme.colors.onSurfaceVariant
                  }
                  size={22}
                  style={{
                    margin: 0,
                    padding: 0,
                    width: "100%",
                    height: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                    top: 0,
                  }}
                  forceTextInputFocus={false}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Notes Modal */}
      <Portal>
        <Modal
          visible={isModalVisible}
          onDismiss={() => setIsModalVisible(false)}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Card>
            <Card.Title title="Extracted Notes" />
            <Card.Content>
              {notes && notes.trim() ? (
                <ScrollView style={styles.notesList}>
                  <Markdown
                    style={{
                      body: { color: theme.colors.onSurface },
                      heading1: {
                        color: theme.colors.primary,
                        fontSize: 24,
                        fontWeight: "bold",
                        marginVertical: 8,
                      },
                      heading2: {
                        color: theme.colors.primary,
                        fontSize: 20,
                        fontWeight: "bold",
                        marginVertical: 6,
                      },
                      heading3: {
                        color: theme.colors.primary,
                        fontSize: 18,
                        fontWeight: "bold",
                        marginVertical: 4,
                      },
                      bullet_list: { marginVertical: 4 },
                      ordered_list: { marginVertical: 4 },
                      code_inline: {
                        backgroundColor: theme.colors.surfaceVariant,
                        padding: 2,
                        borderRadius: 4,
                      },
                      code_block: {
                        backgroundColor: theme.colors.surfaceVariant,
                        padding: 8,
                        borderRadius: 4,
                      },
                      link: { color: theme.colors.primary },
                      blockquote: {
                        backgroundColor: theme.colors.surfaceVariant,
                        borderLeftColor: theme.colors.primary,
                        borderLeftWidth: 4,
                        paddingLeft: 8,
                        marginVertical: 4,
                      },
                    }}
                  >
                    {notes}
                  </Markdown>
                </ScrollView>
              ) : currentChat?.status === "completed" ||
                currentChat?.status === "done" ? (
                <View style={styles.loadingCommon}>
                  <Button
                    mode="outlined"
                    onPress={() => loadChat(chatId)}
                    loading={loading}
                    icon="refresh"
                  >
                    Load Notes
                  </Button>
                </View>
              ) : (
                <View style={styles.loadingCommon}>
                  <Text variant="bodyMedium" style={{ marginBottom: 12 }}>
                    Notes will be available once processing is complete.
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={() => loadChat(chatId)}
                    loading={initialLoading}
                  >
                    Refresh Notes
                  </Button>
                </View>
              )}
            </Card.Content>
            <Card.Actions>
              <Button
                onPress={handleDownloadPdf}
                loading={downloadingPdf}
                disabled={!notes || !notes.trim() || downloadingPdf}
                icon="download"
              >
                Download PDF
              </Button>
              <Button onPress={() => setIsModalVisible(false)}>Close</Button>
            </Card.Actions>
          </Card>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  notesButtonContainer: {
    padding: 12,
    alignItems: "center",
  },
  messagesList: {
    paddingVertical: 8,
  },
  inputContainer: {
    padding: 16, // Increased padding
    backgroundColor: "transparent", // Make container transparent if necessary, or handled by parent view
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12, // Increased gap
  },
  input: {
    flex: 1,
    maxHeight: 180,
    fontSize: 16,
    lineHeight: 24,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  modalContainer: {
    margin: 20,
    maxHeight: "80%",
  },
  notesList: {
    maxHeight: 400,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.6,
  },
  errorText: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  loadingMessage: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 8,
  },
  loadingCommon: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    opacity: 0.6,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
});
