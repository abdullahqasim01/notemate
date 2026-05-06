import { useFileUpload } from "@/src/hooks/useFileUpload";
import { api } from "@/src/lib/api";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useChatContext } from "./ChatContext";

export interface JobStatus {
    chatId: string;
    status: string; // "queued", "uploading", "processing", "completed", "failed"
    progress: number;
    error?: string | null;
    videoUri?: string;
}

interface BackgroundJobContextType {
    jobs: Record<string, JobStatus>;
    activeJobs: number;
    startJob: (videoUri: string) => Promise<string>; // Returns chatId
    retryJob: (chatId: string) => Promise<void>;
    cancelJob: (chatId: string) => void;
    cleanupJob: (chatId: string) => void;
}

const BackgroundJobContext = createContext<
    BackgroundJobContextType | undefined
>(undefined);

export function BackgroundJobProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { createChat, refreshChats } = useChatContext();
    const { convertVideoToAudio, uploadAudioForChat } = useFileUpload();
    const [jobs, setJobs] = useState<Record<string, JobStatus>>({});

    // Use ref for poll intervals so stopPolling always has the current map (avoids stale closure)
    const pollIntervalsRef = React.useRef<Record<string, ReturnType<typeof setInterval>>>({});

    const activeJobs = Object.values(jobs).filter(
        (j) =>
            j.status !== "completed" && j.status !== "failed" && j.status !== "done",
    ).length;

    const updateJob = (chatId: string, updates: Partial<JobStatus>) => {
        setJobs((prev) => ({
            ...prev,
            [chatId]: { ...prev[chatId], ...updates },
        }));
    };

    const cleanupJob = (chatId: string) => {
        stopPolling(chatId);
        setJobs((prev) => {
            const next = { ...prev };
            delete next[chatId];
            return next;
        });
    };

    const stopPolling = (chatId: string) => {
        const interval = pollIntervalsRef.current[chatId];
        if (interval) {
            clearInterval(interval);
            delete pollIntervalsRef.current[chatId];
        }
    };

    const startJob = async (videoUri: string): Promise<string> => {
        // 1. Create chat to get ID
        let chatId: string;
        try {
            const { chatId: id, error } = await createChat();
            if (error || !id) throw new Error(error || "Failed to create chat");
            chatId = id;
        } catch (err: any) {
            throw new Error(`Could not create chat: ${err.message}`);
        }

        // Initialize job status
        setJobs((prev) => ({
            ...prev,
            [chatId]: {
                chatId,
                status: "converting", // Start with converting
                progress: 0.1,
                videoUri,
                error: null,
            },
        }));

        // Start async process (fire and forget from caller's perspective)
        processJob(chatId, videoUri);

        return chatId;
    };

    const retryJob = async (chatId: string) => {
        const job = jobs[chatId];
        if (!job) return;

        // Reset status
        updateJob(chatId, { status: "queued", error: null, progress: 0 });

        if (job.videoUri) {
            processJob(chatId, job.videoUri);
        } else {
            pollChatStatus(chatId);
        }
    };

    const cancelJob = (chatId: string) => {
        stopPolling(chatId);
        cleanupJob(chatId);
    };

    const processJob = async (chatId: string, videoUri: string) => {
        try {
            // Step 1: Converting
            updateJob(chatId, { status: "converting", progress: 0.1 });

            let audioUri: string | null = null;
            try {
                audioUri = await convertVideoToAudio(videoUri);
                if (!audioUri) throw new Error("Conversion returned no audio URI");
            } catch (convErr: any) {
                throw new Error(`Conversion failed: ${convErr.message}`);
            }

            // Step 2: Uploading
            updateJob(chatId, { status: "uploading", progress: 0.2 });

            let fileKey: string;
            try {
                const { fileKey: key, error: uploadError } = await uploadAudioForChat(
                    chatId,
                    audioUri,
                );
                if (uploadError || !key)
                    throw new Error(uploadError || "Upload failed");
                fileKey = key;
            } catch (err: any) {
                throw new Error(`Audio upload failed: ${err.message}`);
            }

            updateJob(chatId, { status: "processing", progress: 0.3 });

            try {
                await api.processAudio(chatId, fileKey);
            } catch (err: any) {
                const errorMsg =
                    err.statusCode === 401
                        ? "Authentication failed."
                        : err.statusCode === 404
                            ? "Chat not found."
                            : err.statusCode === 408 || err.message?.includes("timeout")
                                ? "Server timeout."
                                : err.statusCode === 0 || err.message?.includes("Network")
                                    ? "Network error."
                                    : `Processing start failed: ${err.message}`;
                throw new Error(errorMsg);
            }

            updateJob(chatId, { status: "processing", progress: 0.4 });
            pollChatStatus(chatId);
        } catch (error: any) {
            console.error("Job failed:", error);
            updateJob(chatId, {
                status: "failed",
                error: error.message || "Unknown error occurred",
            });
        }
    };

    const pollChatStatus = async (chatId: string) => {
        // Avoid double polling
        if (pollIntervalsRef.current[chatId]) return;

        let attempts = 0;
        const maxAttempts = 1080; // 90 mins (5s interval)

        const interval = setInterval(async () => {
            try {
                const chat = await api.getChat(chatId);
                const status = chat.status ? chat.status.toLowerCase() : "processing";

                if (status === "failed" || status === "error") {
                    updateJob(chatId, {
                        status: "failed",
                        error: "Processing failed on server.",
                    });
                    stopPolling(chatId);
                    return;
                }

                if (status === "completed" || status === "done") {
                    updateJob(chatId, { status: "completed", progress: 1.0 });
                    await refreshChats();
                    stopPolling(chatId);
                    return;
                }

                // Progress updates
                let newStatus = "processing";
                let newProgress = 0.5;

                if (status === "transcribing") {
                    newStatus = "processing";
                    newProgress = 0.6;
                } else if (status === "generating_notes") {
                    newStatus = "processing";
                    newProgress = 0.8;
                }

                updateJob(chatId, { status: newStatus, progress: newProgress });

                attempts++;
                if (attempts >= maxAttempts) {
                    updateJob(chatId, {
                        status: "failed",
                        error: "Timeout waiting for server.",
                    });
                    stopPolling(chatId);
                }
            } catch (err: any) {
                const statusCode = err?.statusCode ?? err?.status;
                // 404 means the chat was deleted or never existed — stop polling immediately
                if (statusCode === 404) {
                    console.log(`Polling stopped: chat ${chatId} not found`);
                    stopPolling(chatId);
                    return;
                }
                // Other errors are transient (network blip) — keep polling
                console.log("Polling transient error:", err);
            }
        }, 5000);

        pollIntervalsRef.current[chatId] = interval;
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            Object.values(pollIntervalsRef.current).forEach(clearInterval);
        };
    }, []);

    return (
        <BackgroundJobContext.Provider
            value={{
                jobs,
                activeJobs,
                startJob,
                retryJob,
                cancelJob,
                cleanupJob,
            }}
        >
            {children}
        </BackgroundJobContext.Provider>
    );
}

export function useBackgroundJob() {
    const context = useContext(BackgroundJobContext);
    if (!context) {
        throw new Error(
            "useBackgroundJob must be used within BackgroundJobProvider",
        );
    }
    return context;
}
