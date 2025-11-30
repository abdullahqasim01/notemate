// Root Layout: Configure PaperProvider with theme switching
import { AuthProvider } from '@/src/context/AuthContext';
import { ChatProvider } from '@/src/context/ChatContext';
import { ThemeProvider, useThemeContext } from '@/src/context/ThemeContext';
import { darkTheme, lightTheme } from '@/src/theme';
import { Stack } from 'expo-router';
import React from 'react';
import 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function RootNavigator() {
  const { isDarkMode } = useThemeContext();
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={theme}>
      <Stack 
        key={isDarkMode ? 'dark' : 'light'}
        screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background }
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(main)" />
      </Stack>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ChatProvider>
          <ThemeProvider>
            <RootNavigator />
          </ThemeProvider>
        </ChatProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
