"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { FileUpload } from "@/components/ui/file-upload";
import { AttachmentList } from "@/components/ui/attachment-list";
import { useFileUpload } from "@/hooks/use-file-upload";
import { Skeleton } from "@/components/ui/skeleton";
import type { Database } from "@/types/database";

interface AttachmentManagerProps {
  entityType: "service" | "task" | "client" | "form";
  entityId: string;
  canDelete?: boolean;
  canUpload?: boolean;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
}

export function AttachmentManager({
  entityType,
  entityId,
  canDelete = true,
  canUpload = true,
  accept,
  multiple = true,
  maxFiles = 10,
}: AttachmentManagerProps) {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const { uploadFile, uploadMultipleFiles, isUploading, uploadProgress } =
    useFileUpload({
      entityType,
      entityId,
      onSuccess: (newAttachment) => {
        setAttachments((prev) => [...prev, newAttachment]);
      },
    });

  // Fetch existing attachments
  useEffect(() => {
    async function fetchAttachments() {
      try {
        const { data, error } = await supabase
          .from("attachments")
          .select("*")
          .eq("entity_type", entityType)
          .eq("entity_id", entityId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setAttachments(data || []);
      } catch (error) {
        console.error("Failed to fetch attachments:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAttachments();
  }, [entityType, entityId, supabase]);

  const handleFilesSelected = async (files: File[]) => {
    if (multiple) {
      await uploadMultipleFiles(files);
    } else {
      await uploadFile(files[0]);
    }
  };

  const handleDelete = (attachmentId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {canUpload && (
        <FileUpload
          accept={accept}
          multiple={multiple}
          maxFiles={maxFiles}
          disabled={isUploading}
          onFilesSelected={handleFilesSelected}
          uploadProgress={uploadProgress}
        />
      )}

      <AttachmentList
        attachments={attachments}
        canDelete={canDelete}
        onDelete={handleDelete}
      />
    </div>
  );
}
