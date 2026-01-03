// Component: Animated progress bar for note generation
import React from "react";
import { StyleSheet, View } from "react-native";
import { ProgressBar as PaperProgressBar, Text } from "react-native-paper";

interface ProgressBarProps {
  progress: number; // 0 to 1
  label?: string;
  color?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  color,
}) => {
  return (
    <View style={styles.container}>
      {label && (
        <Text variant="bodyMedium" style={styles.label}>
          {label}
        </Text>
      )}
      <PaperProgressBar
        progress={progress}
        color={color}
        style={styles.progressBar}
      />
      <Text variant="bodySmall" style={styles.percentage}>
        {Math.round(progress * 100)}%
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 20,
  },
  label: {
    marginBottom: 8,
    textAlign: "center",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  percentage: {
    marginTop: 8,
    textAlign: "center",
  },
});
