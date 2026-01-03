// Light theme configuration - ChatGPT-like styling
import { MD3LightTheme as DefaultTheme } from "react-native-paper";

export const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#1A1A1A", // Soft black for primary actions
    background: "#FFFFFF", // Pure white background
    surface: "#F4F4F5", // Light grey surface (Zinc-100) for distinct areas like headers/drawers
    surfaceDisabled: "#E4E4E5",
    accent: "#71717A", // Zinc-500
    text: "#18181B", // Zinc-900
    onSurface: "#18181B",
    onBackground: "#18181B",
    surfaceVariant: "#F4F4F5", // Light grey for incoming bubbles
    onSurfaceVariant: "#3F3F46", // Dark grey text on bubbles
    outline: "#E4E4E7", // Zinc-200
    error: "#EF4444",
    secondaryContainer: "#E4E4E7",
    onPrimary: "#FFFFFF",
    elevation: {
      level0: "transparent",
      level1: "#F4F4F5",
      level2: "#E4E4E7",
      level3: "#D4D4D8",
      level4: "#A1A1AA",
      level5: "#71717A",
    },  
  },
};

export type AppTheme = typeof lightTheme;
