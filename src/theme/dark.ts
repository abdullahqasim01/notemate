// Dark theme configuration - ChatGPT-like styling
import { MD3DarkTheme as DefaultTheme } from 'react-native-paper';

export const darkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#ECECF1',           // Light gray for primary actions
    background: '#0D0D0D',         // Almost black background (ChatGPT dark)
    surface: '#1E1E1F',           // Dark gray surface
    accent: '#8E8EA0',            // Muted gray accent
    text: '#ECECF1',              // Light gray text
    onSurface: '#ECECF1',         // Light text on surfaces
    onBackground: '#ECECF1',      // Light text on background
    surfaceVariant: '#2F2F2F',    // Darker gray for message bubbles
    onSurfaceVariant: '#ECECF1',  // Light text on variants
    outline: '#40414F',           // Medium gray borders
    error: '#EF4146',             // Red for errors
    secondaryContainer: '#2F2F2F', // Dark gray containers
    onPrimary: '#0D0D0D',         // Dark text on primary
    elevation: {
      level0: 'transparent',
      level1: '#1A1A1B',
      level2: '#202124',
      level3: '#292A2D',
      level4: '#2F3136',
      level5: '#36373C',
    },
  },
};

export type AppTheme = typeof darkTheme;
