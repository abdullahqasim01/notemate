// Navigation: Redirect to login or main app based on authentication state
import { useAuthContext } from '@/src/context/AuthContext';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';

export default function Index() {
  const router = useRouter();
  const { user, loading } = useAuthContext();
  const theme = useTheme();

  useEffect(() => {
    if (!loading) {
      // Firebase: Check authentication state and redirect accordingly
      if (user) {
        // User is logged in, navigate to main app
        router.replace('/new-chat' as any);
      } else {
        // User is not logged in, navigate to login
        router.replace('/login' as any);
      }
    }
  }, [user, loading]);

  // Show loading indicator while checking auth state
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
