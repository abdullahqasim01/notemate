// useUploader: Presigned URL file uploads
import { api } from '@/src/lib/api';
import * as FileSystem from 'expo-file-system/legacy';
import { useState } from 'react';

export function useUploader() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (
    localUri: string,
    options: {
      type: 'transcription' | 'notes' | 'audio' | 'video';
      chatId?: string;
    }
  ): Promise<{ fileKey: string; publicUrl: string } | null> => {
    try {
      setUploading(true);
      setProgress(0);
      setError(null);

      // Get signed URL from backend
      const { uploadUrl, fileKey, publicUrl } = await api.getSignedUrl({
        type: options.type,
        chatId: options.chatId,
      });

      // Use uploadAsync to stream the file directly — avoids loading the entire file into memory
      console.log('Uploading to:', uploadUrl);
      const result = await FileSystem.uploadAsync(uploadUrl, localUri, {
        httpMethod: 'PUT',
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: {
          'Content-Type': 'audio/mp4',
        },
      });

      console.log('Upload response status:', result.status);

      if (result.status < 200 || result.status >= 300) {
        throw new Error(`Upload failed: ${result.status}`);
      }

      setProgress(100);
      return { fileKey, publicUrl };
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      console.error('Upload error:', err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadFile,
    uploading,
    progress,
    error,
  };
}
