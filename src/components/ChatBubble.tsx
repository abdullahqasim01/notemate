// Component: Chat bubble for displaying messages in ChatGPT-like style
import { Message } from "@/src/types/api";
import React from "react";
import { StyleSheet, View } from "react-native";
import Markdown from "react-native-markdown-display";
import { Avatar, Card, Text, useTheme } from "react-native-paper";

interface ChatBubbleProps {
  message: Message;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const theme = useTheme();
  const isUser = message.role === "user";

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      {!isUser && (
        <Avatar.Icon
          size={32}
          icon="robot"
          style={[styles.avatar, { backgroundColor: theme.colors.secondary }]}
          color={theme.colors.onSecondary}
        />
      )}

      <Card
        style={[
          styles.bubble,
          {
            backgroundColor: isUser
              ? theme.dark
                ? "#3F3F46" // Zinc 700 (Slightly lighter than Zinc 800 assistant)
                : "#E4E4E7" // Zinc 200 (Slightly darker than Zinc 100 assistant)
              : theme.colors.surfaceVariant, // Assistant uses Zinc 800 (dark) / Zinc 100 (light)
          },
        ]}
      >
      <Card.Content style={styles.bubbleContent}>
        {isUser ? (
          <Text
            variant="bodyMedium"
            style={{
              color: theme.colors.onSurface, // Standard text color instead of onPrimary
            }}
          >
            {message.text}
          </Text>
        ) : (
          <Markdown
            style={{
              body: { color: theme.colors.onSurfaceVariant },
              heading1: { color: theme.colors.onSurfaceVariant },
              heading2: { color: theme.colors.onSurfaceVariant },
              heading3: { color: theme.colors.onSurfaceVariant },
              heading4: { color: theme.colors.onSurfaceVariant },
              heading5: { color: theme.colors.onSurfaceVariant },
              heading6: { color: theme.colors.onSurfaceVariant },
              code_inline: {
                backgroundColor: theme.colors.surface,
                color: theme.colors.onSurface,
              },
              fence: {
                backgroundColor: theme.colors.surface,
                color: theme.colors.onSurface,
              },
              link: { color: theme.colors.primary },
            }}
          >
            {message.text}
          </Markdown>
        )}
      </Card.Content>
    </Card>

      {
    isUser && (
      <Avatar.Icon
        size={32}
        icon="account"
        style={[styles.avatar, { backgroundColor: theme.colors.tertiary }]}
        color={theme.colors.onTertiary}
      />
    )
  }
    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  userContainer: {
    justifyContent: "flex-end",
  },
  assistantContainer: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 20,
    marginHorizontal: 8,
  },
  bubbleContent: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  avatar: {
    marginTop: 0,
  },
});
