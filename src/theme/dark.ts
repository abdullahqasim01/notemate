// Dark theme configuration - ChatGPT-like styling
import { MD3DarkTheme as DefaultTheme } from "react-native-paper";

export const darkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#FAFAFA", // Off-white for primary actions
    background: "#18181B", // Zinc-900 (Rich Dark Grey) instead of Pitch Black
    surface: "#27272A", // Zinc-800 for headers/drawers
    surfaceDisabled: "#3F3F46",
    accent: "#A1A1AA", // Zinc-400
    text: "#F4F4F5", // Zinc-100
    onSurface: "#F4F4F5",
    onBackground: "#F4F4F5",
    surfaceVariant: "#27272A", // Zinc-800 for bubbles
    onSurfaceVariant: "#E4E4E7",
    outline: "#3F3F46", // Zinc-700
    error: "#EF4444",
    secondaryContainer: "#3F3F46",
    onPrimary: "#18181B",
    elevation: {
      level0: "transparent",
      level1: "#27272A",
      level2: "#3F3F46",
      level3: "#52525B",
      level4: "#71717A",
      level5: "#A1A1AA",
    },
  },
};

export type AppTheme = typeof darkTheme;
