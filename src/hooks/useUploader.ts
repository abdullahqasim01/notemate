// useUploader: Presigned URL file uploads
import { api } from '@/src/lib/api';
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

      // Read file as blob
      const response = await fetch(localUri);
      const blob = await response.blob();

      // Upload directly to storage using presigned URL
      console.log('Uploading to:', uploadUrl);
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': blob.type,
        },
      });

      console.log('Upload response:', uploadResponse);

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
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
