// useFileUpload: Video to audio conversion and upload for chat
import {
  FFmpegKit,
  ReturnCode,
} from "@palashakhenia/ffmpeg-kit-react-native-sf";
import { File, Paths } from "expo-file-system";
import { useState } from "react";
import { useUploader } from "./useUploader";

export function useFileUpload() {
  const { uploadFile, uploading, progress } = useUploader();
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);

  const convertVideoToAudio = async (
    videoUri: string,
  ): Promise<string | null> => {
    try {
      setConverting(true);

      console.log("Starting video to audio conversion...");
      console.log("Input video URI:", videoUri);

      // Create output path for audio file in cache directory
      const timestamp = Date.now();
      const audioFile = new File(Paths.cache, `audio_${timestamp}.m4a`);
      const outputPath = audioFile.uri;

      console.log("Output audio path:", outputPath);

      // Normalize file paths - remove file:// scheme if present
      const inputPath = videoUri.replace("file://", "");
      const normalizedOutputPath = outputPath.replace("file://", "");

      // Try fast remux first (no re-encode) — works when audio is already AAC
      const copyCommand = `-i "${inputPath}" -vn -acodec copy -y "${normalizedOutputPath}"`;
      console.log("FFmpeg copy command:", copyCommand);

      const copySession = await FFmpegKit.execute(copyCommand);
      const copyReturnCode = await copySession.getReturnCode();

      if (!ReturnCode.isSuccess(copyReturnCode)) {
        // Fast path failed — fall back to AAC re-encode
        console.log("FFmpeg copy failed, falling back to AAC re-encode");
        const encodeCommand = `-i "${inputPath}" -vn -acodec aac -b:a 128k -y "${normalizedOutputPath}"`;
        console.log("FFmpeg encode command:", encodeCommand);

        const encodeSession = await FFmpegKit.execute(encodeCommand);
        const encodeReturnCode = await encodeSession.getReturnCode();
        const output = await encodeSession.getOutput();
        const failStackTrace = await encodeSession.getFailStackTrace();

        console.log("FFmpeg encode return code:", encodeReturnCode);

        if (!ReturnCode.isSuccess(encodeReturnCode)) {
          console.error("FFmpeg re-encode failed:", output);
          if (failStackTrace) console.error("FFmpeg stack trace:", failStackTrace);
          throw new Error(
            `FFmpeg failed: ${output?.substring(0, 200) || "Unknown error"}`,
          );
        }
      } else {
        console.log("FFmpeg copy succeeded (fast path)");
      }

      // Verify the audio file exists
      const audioFileExists = await audioFile.exists;
      console.log("Audio file exists:", audioFileExists);

      if (!audioFileExists) {
        throw new Error("Audio file was not created after conversion");
      }

      console.log("Video converted to audio successfully:", outputPath);
      return outputPath;
    } catch (err: any) {
      console.error("Video to audio conversion error:", err);
      const errorMsg = err.message || "Failed to convert video to audio";
      setError(errorMsg);
      throw err; // Re-throw to propagate to caller
    } finally {
      setConverting(false);
    }
  };

  const uploadAudioForChat = async (chatId: string, audioUri: string) => {
    try {
      setError(null);

      // Step 2: Upload audio file to backend
      console.log("Uploading audio file...", audioUri);
      const uploadResult = await uploadFile(audioUri, {
        type: "audio",
        chatId,
      });

      if (!uploadResult) {
        throw new Error("Failed to upload audio");
      }

      const { fileKey, publicUrl } = uploadResult;

      // Step 3: Clean up temporary audio file
      try {
        const audioFile = new File(audioUri);
        await audioFile.delete();
      } catch (cleanupErr) {
        console.warn("Failed to clean up temporary audio file:", cleanupErr);
      }

      console.log("Audio uploaded successfully:", publicUrl);
      return { fileKey, publicUrl, error: null };
    } catch (err: any) {
      const errorMsg = err.message || "Failed to process audio upload";
      setError(errorMsg);
      return { fileKey: null, publicUrl: null, error: errorMsg };
    }
  };

  return {
    convertVideoToAudio,
    uploadAudioForChat,
    uploading: uploading || converting,
    progress,
    error,
  };
}
