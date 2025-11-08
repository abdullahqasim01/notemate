// Chat Screen: ChatGPT-style conversation interface with extracted notes
import { ChatBubble } from '@/src/components/ChatBubble';
import { Message } from '@/src/types/chat';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    View,
} from 'react-native';
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
  const flatListRef = useRef<FlatList>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `I've extracted the key points from your video. Here's a summary:\n\n• Introduction to React Native development\n• Setting up Expo environment\n• Building your first component\n• Understanding state management\n\nFeel free to ask me anything about the video!`,
      timestamp: new Date(),
    },
  ]);
  
  const [inputText, setInputText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Mock notes content
  // TODO: Connect 'View Notes' modal to actual extraction output
  const mockNotes = `# Video Notes - Chat ${params.id}

## Introduction
- Overview of React Native and Expo
- Benefits of cross-platform development

## Setup Process
1. Install Node.js and npm
2. Install Expo CLI globally
3. Create a new Expo project
4. Start the development server

## Core Concepts
- Components and props
- State and lifecycle
- Styling with StyleSheet
- Navigation patterns

## Best Practices
- Use TypeScript for type safety
- Follow React Native conventions
- Optimize performance
- Test on multiple devices

## Conclusion
- React Native provides excellent developer experience
- Expo simplifies the development workflow
- Great for building production apps`;

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // TODO: Integrate backend chat API
  const handleSend = () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I understand your question about "${inputText}". Based on the video content, I can help you with that. This is a placeholder response that will be replaced with actual AI-generated content.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

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
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatBubble message={item} />}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Input Area */}
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
          <TextInput
            mode="outlined"
            placeholder="Ask me anything about the video..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            style={styles.input}
            onSubmitEditing={handleSend}
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
              <FlatList
                data={mockNotes.split('\n')}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <Text variant="bodyMedium" style={styles.noteText}>
                    {item}
                  </Text>
                )}
                style={styles.notesList}
              />
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
  noteText: {
    marginVertical: 2,
  },
});
