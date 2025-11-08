// Settings Screen: User profile and app preferences
import { useThemeContext } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/hooks/useAuth';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Avatar,
  Button,
  Divider,
  List,
  SegmentedButtons,
  Snackbar,
  Switch,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, logout, updateUserProfile, changePassword } = useAuth();
  const { themeMode, setThemeMode, isDarkMode } = useThemeContext();
  
  // State management
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Notification preferences
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Firebase: Update user profile
  const handleUpdateProfile = async () => {
    if (!user) return;

    setLoading(true);
    setError('');
    setSuccess('');

    const result = await updateUserProfile(displayName, photoURL);
    
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess('Profile updated successfully!');
    }
    
    setLoading(false);
  };

  const handleChangePassword = async () => {
    if (!user) return;

    if (!newPassword || !confirmPassword) {
      setError('Please enter both password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const result = await changePassword(newPassword);
    
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess('Password changed successfully!');
      setNewPassword('');
      setConfirmPassword('');
    }
    
    setLoading(false);
  };

  // TODO: Integrate expo-image-picker for profile picture
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoURL(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setError('Failed to pick image');
    }
  };

  const handleLogout = async () => {
    const result = await logout();
    
    if (result.error) {
      setError('Failed to logout');
    } else {
      router.replace('/' as any);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Profile Section */}
          <View style={styles.section}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Profile
            </Text>

            {/* Avatar */}
            <View style={styles.avatarContainer}>
              {photoURL ? (
                <Avatar.Image size={100} source={{ uri: photoURL }} />
              ) : (
                <Avatar.Text size={100} label={displayName?.[0]?.toUpperCase() || 'U'} />
              )}
              <Button mode="text" onPress={handlePickImage} style={styles.changePhotoButton}>
                Change Photo
              </Button>
            </View>

            {/* Name Input */}
            <TextInput
              mode="outlined"
              label="Display Name"
              value={displayName}
              onChangeText={setDisplayName}
              style={styles.input}
              disabled={loading}
            />

            {/* Email (read-only) */}
            <TextInput
              mode="outlined"
              label="Email"
              value={user?.email || ''}
              editable={false}
              style={styles.input}
            />

            <Button
              mode="contained"
              onPress={handleUpdateProfile}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Update Profile
            </Button>
          </View>

          <Divider style={styles.divider} />

          {/* Password Section */}
          <View style={styles.section}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Change Password
            </Text>

            <TextInput
              mode="outlined"
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
              style={styles.input}
              disabled={loading}
            />

            <TextInput
              mode="outlined"
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              style={styles.input}
              disabled={loading}
            />

            <Button
              mode="contained"
              onPress={handleChangePassword}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Change Password
            </Button>
          </View>

          <Divider style={styles.divider} />

          {/* Preferences Section */}
          <View style={styles.section}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Preferences
            </Text>

            {/* Theme Mode Selector */}
            <Text variant="labelLarge" style={styles.preferenceLabel}>
              Theme
            </Text>
            <SegmentedButtons
              value={themeMode}
              onValueChange={(value) => setThemeMode(value as any)}
              buttons={[
                { value: 'light', label: 'Light', icon: 'white-balance-sunny' },
                { value: 'dark', label: 'Dark', icon: 'moon-waning-crescent' },
                { value: 'system', label: 'System', icon: 'cellphone' },
              ]}
              style={styles.segmentedButtons}
            />

            <Divider style={styles.preferenceDivider} />

            <List.Item
              title="Notifications"
              description="Enable push notifications"
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                />
              )}
            />
          </View>

          <Divider style={styles.divider} />

          {/* Logout Section */}
          <View style={styles.section}>
            <Button
              mode="outlined"
              onPress={handleLogout}
              icon="logout"
              textColor={theme.colors.error}
              style={styles.logoutButton}
            >
              Logout
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* Error Snackbar */}
      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={3000}
        action={{
          label: 'Dismiss',
          onPress: () => setError(''),
        }}
      >
        {error}
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        visible={!!success}
        onDismiss={() => setSuccess('')}
        duration={3000}
        style={{ backgroundColor: theme.colors.primary }}
      >
        {success}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  changePhotoButton: {
    marginTop: 8,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 24,
  },
  preferenceLabel: {
    marginTop: 8,
    marginBottom: 12,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  preferenceDivider: {
    marginVertical: 16,
  },
  logoutButton: {
    marginTop: 8,
  },
});
