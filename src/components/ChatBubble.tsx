// Component: Chat bubble for displaying messages in ChatGPT-like style
import { Message } from '@/src/types/api';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Card, Text, useTheme } from 'react-native-paper';

interface ChatBubbleProps {
  message: Message;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const theme = useTheme();
  const isUser = message.role === 'user';

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      <Card
        style={[
          styles.bubble,
          {
            backgroundColor: isUser
              ? theme.colors.primary
              : theme.colors.surfaceVariant,
          },
        ]}
      >
        <Card.Content>
          {isUser ? (
            <Text
              variant="bodyMedium"
              style={{
                color: '#000000',
              }}
            >
              {message.text}
            </Text>
          ) : (
            <Markdown
              style={{
                body: { color: '#FFFFFF' },
                heading1: { color: '#FFFFFF' },
                heading2: { color: '#FFFFFF' },
                heading3: { color: '#FFFFFF' },
                heading4: { color: '#FFFFFF' },
                heading5: { color: '#FFFFFF' },
                heading6: { color: '#FFFFFF' },
                code_inline: {
                  backgroundColor: theme.colors.surface,
                  color: '#FFFFFF',
                },
                fence: {
                  backgroundColor: theme.colors.surface,
                  color: '#FFFFFF',
                },
                link: { color: theme.colors.primary },
              }}
            >
              {message.text}
            </Markdown>
          )}
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 12,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
  },
});
