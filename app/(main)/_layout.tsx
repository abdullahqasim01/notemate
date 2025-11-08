// Main Layout: Drawer navigation with sidebar for chat history
import { useAuth } from '@/src/hooks/useAuth';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Divider, Drawer as PaperDrawer, Text, useTheme } from 'react-native-paper';

// Custom drawer content component
function CustomDrawerContent(props: any) {
  const theme = useTheme();
  const router = useRouter();
  const { logout } = useAuth();

  // TODO: Replace mock chat list with Firestore integration
  const mockChats = [
    { id: '1', title: 'Video Analysis 1', date: '2025-11-07' },
    { id: '2', title: 'Lecture Notes', date: '2025-11-06' },
    { id: '3', title: 'Meeting Summary', date: '2025-11-05' },
  ];

  // Firebase: Handle user logout
  const handleLogout = async () => {
    const result = await logout();
    if (!result.error) {
      router.replace('/' as any);
    }
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
        <Text variant="labelLarge" style={styles.sectionTitle}>
          Recent Chats
        </Text>
        
        {mockChats.map((chat) => (
          <PaperDrawer.Item
            key={chat.id}
            label={chat.title}
            icon="message-text"
            onPress={() => router.push(`/chat/${chat.id}` as any)}
          />
        ))}

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
});
