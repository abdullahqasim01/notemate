// Chat Screen: ChatGPT-style conversation interface with extracted notes
import { ChatBubble } from '@/src/components/ChatBubble';
import { useChatContext } from '@/src/context/ChatContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import {
  Button,
  Card,
  Modal,
  Portal,
  Text,
  TextInput,
  useTheme
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const chatId = params.id as string;
  
  const { currentChat, messages: contextMessages, notes, loadChat, loadMessages, addMessage, clearChat, sending } = useChatContext();
  
  const [inputText, setInputText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    // Load chat data when screen mounts
    const loadData = async () => {
      try {
        await loadChat(chatId);
        await loadMessages(chatId);
      } catch (error) {
        console.error('Failed to load chat:', error);
      } finally {
        setInitialLoading(false);
      }
    };
    
    loadData();
  }, [chatId]);

  useEffect(() => {
    // Check if chat is still processing and redirect to generating screen
    if (currentChat && currentChat.status && currentChat.status !== 'completed' && currentChat.status !== 'done') {
      const processingStatuses = ['processing', 'transcribing', 'generating_notes'];
      if (processingStatuses.includes(currentChat.status)) {
        console.log('Chat still processing, redirecting to generating screen');
        // Clear chat context before redirecting
        clearChat();
        router.replace({
          pathname: '/(main)/generating' as any,
          params: { chatId }
        });
      }
    }
  }, [currentChat]);

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
    setInputText('');
    setSendError(null);

    const result = await addMessage(chatId, text);
    
    if (result.error) {
      console.error('Failed to send message:', result.error);
      setSendError(result.error);
      // Restore the input text so user can retry
      setInputText(text);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={100}
      >
        {/* View Notes Button */}
        <View style={styles.notesButtonContainer}>
          <Button
            mode="outlined"
            icon="file-document"
            onPress={() => setIsModalVisible(true)}
            compact
          >
            View Notes
          </Button>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={contextMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatBubble message={item} />}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
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
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
          {sendError && (
            <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
              {sendError}
            </Text>
          )}
          <TextInput
            mode="outlined"
            placeholder="Ask me anything about the video..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            style={styles.input}
            onSubmitEditing={handleSend}
            error={!!sendError}
            right={
              <TextInput.Icon
                icon="send"
                onPress={handleSend}
                disabled={!inputText.trim()}
                color={inputText.trim() ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
            }
          />
        </View>
      </KeyboardAvoidingView>

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
                      heading1: { color: theme.colors.primary, fontSize: 24, fontWeight: 'bold', marginVertical: 8 },
                      heading2: { color: theme.colors.primary, fontSize: 20, fontWeight: 'bold', marginVertical: 6 },
                      heading3: { color: theme.colors.primary, fontSize: 18, fontWeight: 'bold', marginVertical: 4 },
                      bullet_list: { marginVertical: 4 },
                      ordered_list: { marginVertical: 4 },
                      code_inline: { backgroundColor: theme.colors.surfaceVariant, padding: 2, borderRadius: 4 },
                      code_block: { backgroundColor: theme.colors.surfaceVariant, padding: 8, borderRadius: 4 },
                      link: { color: theme.colors.primary },
                      blockquote: { 
                        backgroundColor: theme.colors.surfaceVariant, 
                        borderLeftColor: theme.colors.primary, 
                        borderLeftWidth: 4,
                        paddingLeft: 8,
                        marginVertical: 4
                      },
                    }}
                  >
                    {notes}
                  </Markdown>
                </ScrollView>
              ) : currentChat?.status === 'completed' || currentChat?.status === 'done' ? (
                <Text variant="bodyMedium">Notes are being processed. Please try again in a moment.</Text>
              ) : (
                <Text variant="bodyMedium">Notes will be available once processing is complete.</Text>
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
    alignItems: 'center',
  },
  messagesList: {
    paddingVertical: 8,
  },
  inputContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  input: {
    maxHeight: 100,
  },
  modalContainer: {
    margin: 20,
    maxHeight: '80%',
  },
  notesList: {
    maxHeight: 400,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
  },
  errorText: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  loadingMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  loadingText: {
    opacity: 0.6,
  },
});
