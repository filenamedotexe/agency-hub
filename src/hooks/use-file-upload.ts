import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import {
  STORAGE_BUCKETS,
  generateFilePath,
  isValidFileType,
  isValidFileSize,
} from "@/lib/supabase/storage";
import { FILE_ERROR_MESSAGES } from "@/lib/validations/file";
import type { Database } from "@/types/database";

interface UploadProgress {
  progress: number;
  fileName: string;
}

interface UseFileUploadOptions {
  entityType: "service" | "task" | "client" | "form";
  entityId: string;
  onSuccess?: (attachment: any) => void;
  onError?: (error: Error) => void;
}

export function useFileUpload({
  entityType,
  entityId,
  onSuccess,
  onError,
}: UseFileUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );
  const router = useRouter();
  const supabase = createClient();

  const uploadFile = useCallback(
    async (file: File) => {
      try {
        setIsUploading(true);
        setUploadProgress({ progress: 0, fileName: file.name });

        // Validate file type
        if (!isValidFileType(file.type)) {
          throw new Error(FILE_ERROR_MESSAGES.INVALID_TYPE);
        }

        // Validate file size
        if (!isValidFileSize(file.size, file.type)) {
          throw new Error(FILE_ERROR_MESSAGES.SIZE_EXCEEDED);
        }

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("User not authenticated");
        }

        // Generate file path
        const filePath = generateFilePath(entityType, entityId, file.name);

        // Upload file to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKETS.ATTACHMENTS)
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        // Create attachment record in database
        const attachmentData = {
          entity_type: entityType,
          entity_id: entityId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user.id,
          metadata: {},
        };

        const { data: attachment, error: dbError } = await supabase
          .from("attachments")
          .insert(attachmentData)
          .select()
          .single();

        if (dbError) {
          // If database insert fails, delete the uploaded file
          await supabase.storage
            .from(STORAGE_BUCKETS.ATTACHMENTS)
            .remove([filePath]);
          throw dbError;
        }

        // Success
        toast({
          title: "File uploaded",
          description: `${file.name} has been uploaded successfully.`,
        });

        onSuccess?.(attachment);
        router.refresh();

        return attachment;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : FILE_ERROR_MESSAGES.UPLOAD_FAILED;
        toast({
          title: "Upload failed",
          description: message,
          variant: "destructive",
        });
        onError?.(error instanceof Error ? error : new Error(message));
        throw error;
      } finally {
        setIsUploading(false);
        setUploadProgress(null);
      }
    },
    [entityType, entityId, supabase, router, onSuccess, onError]
  );

  const uploadMultipleFiles = useCallback(
    async (files: File[]) => {
      const results = [];
      const errors = [];

      for (const file of files) {
        try {
          const attachment = await uploadFile(file);
          results.push(attachment);
        } catch (error) {
          errors.push({ file, error });
        }
      }

      return { results, errors };
    },
    [uploadFile]
  );

  return {
    uploadFile,
    uploadMultipleFiles,
    isUploading,
    uploadProgress,
  };
}
