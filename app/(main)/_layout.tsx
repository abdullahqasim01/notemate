// Main Layout: Drawer navigation with sidebar for chat history
import { useAuthContext } from "@/src/context/AuthContext";
import { useChatContext } from "@/src/context/ChatContext";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { useFocusEffect, useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import {
  Button,
  Divider,
  IconButton,
  Menu,
  Drawer as PaperDrawer,
  Text,
  useTheme,
} from "react-native-paper";

// Custom drawer content component
function CustomDrawerContent(props: any) {
  const theme = useTheme();
  const router = useRouter();
  const { logout } = useAuthContext();
  const { chats, refreshChats, deleteChat, loading } = useChatContext(); // Use global chat context
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Focus effect to ensure freshness (optional since context should handle it, but good for safety)
  useFocusEffect(
    useCallback(() => {
      refreshChats();
    }, []),
  );

  const handleDeleteChat = async (chatId: string) => {
    try {
      setDeleting(chatId);
      setMenuVisible(null);
      await deleteChat(chatId);
    } catch (error) {
      console.error("Failed to delete chat:", error);
    } finally {
      setDeleting(null);
    }
  };

  // Firebase: Handle user logout
  const handleLogout = async () => {
    await logout();
    router.replace("/" as any);
  };

  return (
    <DrawerContentScrollView
      {...props}
      style={{ backgroundColor: theme.colors.background }}
    >
      <View style={styles.drawerContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            NoteMate
          </Text>
        </View>

        {/* New Chat Button */}
        <Button
          mode="contained"
          icon="plus"
          onPress={() => router.push("/new-chat" as any)}
          style={styles.newChatButton}
        >
          New Chat
        </Button>

        <Divider style={styles.divider} />

        {/* Chat History */}
        <View style={styles.chatHistoryHeader}>
          <Text variant="labelLarge" style={styles.sectionTitle}>
            Recent Chats
          </Text>
          <IconButton
            icon="refresh"
            size={20}
            onPress={refreshChats}
            disabled={loading}
          />
        </View>

        {loading && chats.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" />
          </View>
        ) : chats.length > 0 ? (
          chats.map((chat) => (
            <Pressable
              key={chat.id}
              onPress={() => router.push(`/chat/${chat.id}` as any)}
              style={({ pressed }: { pressed: boolean }) => [
                styles.drawerItem,
                {
                  backgroundColor: pressed
                    ? theme.colors.surfaceVariant
                    : "transparent",
                },
              ]}
              android_ripple={{
                color: theme.colors.onSurfaceVariant,
                borderless: false,
              }}
            >
              <View style={styles.drawerItemContent}>
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.drawerItemText,
                    { color: theme.colors.onSurface },
                  ]}
                  numberOfLines={1}
                >
                  {chat.title || "Untitled Chat"}
                </Text>
                {deleting === chat.id ? (
                  <ActivityIndicator
                    size="small"
                    style={styles.chatMenuButton}
                  />
                ) : (
                  <Menu
                    visible={menuVisible === chat.id}
                    onDismiss={() => setMenuVisible(null)}
                    anchor={
                      <IconButton
                        icon="dots-vertical"
                        size={20}
                        onPress={() => setMenuVisible(chat.id)}
                        style={styles.chatMenuButton}
                      />
                    }
                  >
                    <Menu.Item
                      leadingIcon="delete"
                      onPress={() => handleDeleteChat(chat.id)}
                      title="Delete"
                    />
                  </Menu>
                )}
              </View>
            </Pressable>
          ))
        ) : (
          <Text variant="bodyMedium" style={styles.emptyText}>
            Your chat history will appear here
          </Text>
        )}

        <Divider style={styles.divider} />

        {/* Navigation Items */}
        <PaperDrawer.Item
          label="Settings"
          icon="cog"
          onPress={() => router.push("/settings" as any)}
        />

        <Divider style={styles.divider} />

        {/* Logout */}
        <PaperDrawer.Item label="Logout" icon="logout" onPress={handleLogout} />
      </View>
    </DrawerContentScrollView>
  );
}

export default function MainLayout() {
  const theme = useTheme();

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        drawerStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Drawer.Screen
        name="new-chat"
        options={{
          title: "New Chat",
          headerShown: true,
        }}
      />

      <Drawer.Screen
        name="chat/[id]"
        options={{
          title: "Chat",
          headerShown: true,
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: "Settings",
          headerShown: true,
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
    padding: 12, // Reduced from 16
    paddingHorizontal: 2, // Explicitly reduce horizontal padding
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontWeight: "bold",
  },
  newChatButton: {
    marginVertical: 8,
  },
  divider: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 18,
    paddingHorizontal: 8,
    paddingVertical: 8,
    opacity: 0.6,
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.6,
    paddingVertical: 16,
  },
  loadingContainer: {
    paddingVertical: 16,
    alignItems: "center",
  },
  chatHistoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  drawerItem: {
    marginHorizontal: 0,
    paddingHorizontal: 8, // Add small padding for touch target but keeping it tight
    paddingVertical: 8,
    borderRadius: 8,
  },
  drawerItemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  drawerItemText: {
    flex: 1,
    marginRight: 8,
  },
  chatMenuButton: {
    margin: 0,
  },
});
