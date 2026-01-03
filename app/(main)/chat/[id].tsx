// Chat Screen: ChatGPT-style conversation interface with extracted notes
import { ChatBubble } from "@/src/components/ChatBubble";
import { ProgressBar } from "@/src/components/ProgressBar";
import { useBackgroundJob } from "@/src/context/BackgroundJobContext";
import { useChatContext } from "@/src/context/ChatContext";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
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
          <Text variant="headlineSmall" style={{ marginBottom: 8 }}>
            Generating Notes...
          </Text>
          <Text
            variant="bodyMedium"
            style={{
              textAlign: "center",
              marginBottom: 32,
              opacity: 0.7,
              paddingHorizontal: 32,
            }}
          >
            Please wait while we transcribe and analyze your video.
          </Text>
          <View style={{ width: "80%" }}>
            <ProgressBar
              progress={job.progress}
              color={theme.colors.primary}
              label={
                job.status === "uploading"
                  ? "Uploading Video..."
                  : job.status === "processing"
                    ? "Processing..."
                    : job.status === "transcribing"
                      ? "Transcribing Audio..."
                      : job.status === "generating_notes"
                        ? "Generating Notes..."
                        : "Loading..."
              }
            />
          </View>
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
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primary}
                  />
                  <Text variant="bodyMedium" style={{ marginTop: 8 }}>
                    Loading notes...
                  </Text>
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
