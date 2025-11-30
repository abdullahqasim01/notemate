// Main Layout: Drawer navigation with sidebar for chat history
import { useAuthContext } from '@/src/context/AuthContext';
import { api } from '@/src/lib/api';
import { ChatHistoryItem } from '@/src/types/api';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useFocusEffect, useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button, Divider, IconButton, Menu, Drawer as PaperDrawer, Text, useTheme } from 'react-native-paper';

// Custom drawer content component
function CustomDrawerContent(props: any) {
  const theme = useTheme();
  const router = useRouter();
  const { logout, firebaseUser } = useAuthContext();
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch chat history when drawer opens
  const fetchChatHistory = async () => {
    if (!firebaseUser) return;
    
    try {
      setLoading(true);
      const token = await firebaseUser.getIdToken();
      const history = await api.getChatHistory(token);
      setChatHistory(history);
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatHistory();
  }, [firebaseUser]);

  // Also refresh when the screen comes into focus (e.g., after completing generating)
  useFocusEffect(
    useCallback(() => {
      fetchChatHistory();
    }, [firebaseUser])
  );

  const handleDeleteChat = async (chatId: string) => {
    try {
      setDeleting(chatId);
      setMenuVisible(null);
      await api.deleteChat(chatId);
      // Refresh chat history after deletion
      await fetchChatHistory();
    } catch (error) {
      console.error('Failed to delete chat:', error);
    } finally {
      setDeleting(null);
    }
  };

  // Firebase: Handle user logout
  const handleLogout = async () => {
    await logout();
    router.replace('/' as any);
  };

  return (
    <DrawerContentScrollView {...props} style={{ backgroundColor: theme.colors.background }}>
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
          onPress={() => router.push('/new-chat' as any)}
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
            onPress={fetchChatHistory}
            disabled={loading}
          />
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" />
          </View>
        ) : chatHistory.length > 0 ? (
          chatHistory.map((chat) => (
            <View key={chat.id} style={styles.chatItem}>
              <PaperDrawer.Item
                label={chat.title || 'Untitled Chat'}
                icon="message-text"
                onPress={() => router.push(`/chat/${chat.id}` as any)}
                style={styles.drawerItem}
              />
              {deleting === chat.id ? (
                <ActivityIndicator size="small" style={styles.chatMenuButton} />
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
          onPress={() => router.push('/settings' as any)}
        />

        <Divider style={styles.divider} />

        {/* Logout */}
        <PaperDrawer.Item
          label="Logout"
          icon="logout"
          onPress={handleLogout}
        />
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
          title: 'New Chat',
          headerShown: true,
        }}
      />
      <Drawer.Screen
        name="generating"
        options={{
          title: 'Generating Notes',
          headerShown: true,
        }}
      />
      <Drawer.Screen
        name="chat/[id]"
        options={{
          title: 'Chat',
          headerShown: true,
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: true,
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
    padding: 16,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  newChatButton: {
    marginVertical: 8,
  },
  divider: {
    marginVertical: 12,
  },
  sectionTitle: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    opacity: 0.6,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
    paddingVertical: 16,
  },
  loadingContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  chatHistoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawerItem: {
    flex: 1,
  },
  chatMenuButton: {
    margin: 0,
  },
});
