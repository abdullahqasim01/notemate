import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Text, useTheme } from "react-native-paper";

interface GenerationStepsProps {
    status: string;
    progress: number;
}

export const GenerationSteps: React.FC<GenerationStepsProps> = ({
    status,
    progress,
}) => {
    const theme = useTheme();

    // Define steps
    const steps = [
        { title: "Converting to audio", id: 1 },
        { title: "Uploading Audio", id: 2 },
        { title: "Transcribing", id: 3 },
        { title: "Generating Notes", id: 4 },
        { title: "Done", id: 5 },
    ];

    // Determine current active step index (0-based)
    // 1. Converting: status='uploading' & progress <= 0.1
    // 2. Uploading: status='uploading' & progress > 0.1
    // 3. Transcribing: status='processing'/'transcribing'
    // 4. Generating: status='generating_notes'
    // 5. Done: status='completed'/'done'

    let currentStepIndex = 0;
    const s = status.toLowerCase();

    if (s === "completed" || s === "done") {
        currentStepIndex = 5; // All done
    } else if (s === "generating_notes") {
        currentStepIndex = 3;
    } else if (s === "processing" || s === "transcribing") {
        currentStepIndex = 2;
    } else if (s === "uploading") {
        currentStepIndex = 1;
    } else if (s === "converting") {
        currentStepIndex = 0;
    }

    return (
        <View style={styles.container}>
            {steps.map((step, index) => {
                const isCompleted = index < currentStepIndex;
                const isActive = index === currentStepIndex;
                const isPending = index > currentStepIndex;

                return (
                    <View key={step.id} style={styles.stepRow}>
                        {/* Icon Column */}
                        <View style={styles.iconContainer}>
                            {isCompleted ? (
                                <MaterialCommunityIcons
                                    name="check-circle"
                                    size={24}
                                    color={theme.colors.primary}
                                />
                            ) : isActive ? (
                                <ActivityIndicator
                                    size={18}
                                    color={theme.colors.primary}
                                    style={{ margin: 3 }}
                                />
                            ) : (
                                <MaterialCommunityIcons
                                    name="checkbox-blank-circle-outline"
                                    size={24}
                                    color={theme.colors.surfaceVariant}
                                />
                            )}
                        </View>

                        {/* Text Column */}
                        <View style={styles.textContainer}>
                            <Text
                                variant="bodyLarge"
                                style={{
                                    color: isPending
                                        ? theme.colors.surfaceVariant
                                        : theme.colors.onSurface,
                                    fontWeight: isActive ? "bold" : "normal",
                                    opacity: isPending ? 0.6 : 1,
                                }}
                            >
                                {step.title}
                            </Text>
                        </View>
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: "100%",
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    stepRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    iconContainer: {
        width: 32,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
});
