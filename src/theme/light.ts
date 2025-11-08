// Light theme configuration - ChatGPT-like styling
import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2D2D2D',           // Dark gray for primary actions
    background: '#FFFFFF',         // Pure white background
    surface: '#FFFFFF',            // White surface
    accent: '#8E8EA0',            // Muted gray accent
    text: '#0D0D0D',              // Almost black text
    onSurface: '#0D0D0D',         // Dark text on surfaces
    onBackground: '#0D0D0D',      // Dark text on background
    surfaceVariant: '#F7F7F8',    // Light gray for message bubbles
    onSurfaceVariant: '#40414F',  // Gray text on variants
    outline: '#ECECF1',           // Very light gray borders
    error: '#EF4146',             // Red for errors
    secondaryContainer: '#F7F7F8', // Light gray containers
    onPrimary: '#FFFFFF',         // White text on primary
    elevation: {
      level0: 'transparent',
      level1: '#FAFAFA',
      level2: '#F5F5F5',
      level3: '#F0F0F0',
      level4: '#ECECEC',
      level5: '#E8E8E8',
    },
  },
};

export type AppTheme = typeof lightTheme;
