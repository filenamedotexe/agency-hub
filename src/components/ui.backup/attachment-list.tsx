"use client";

import { useState } from "react";
import {
  Download,
  Trash2,
  Eye,
  File,
  Image,
  FileText,
  Video,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import {
  STORAGE_BUCKETS,
  formatFileSize,
  getPublicUrl,
} from "@/lib/supabase/storage";
import type { Database } from "@/types/database";

interface Attachment {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  createdAt: string;
}

interface AttachmentListProps {
  attachments: Attachment[];
  canDelete?: boolean;
  onDelete?: (attachmentId: string) => void;
  className?: string;
}

export function AttachmentList({
  attachments,
  canDelete = false,
  onDelete,
  className,
}: AttachmentListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const supabase = createClient();

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return Image;
    if (mimeType.startsWith("video/")) return Video;
    if (mimeType.includes("pdf") || mimeType.includes("document"))
      return FileText;
    return File;
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      setDownloadingId(attachment.id);

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.ATTACHMENTS)
        .download(attachment.filePath);

      if (error) throw error;

      // Create blob URL and trigger download
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: `Downloading ${attachment.fileName}`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (attachment: Attachment) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKETS.ATTACHMENTS)
        .remove([attachment.filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("attachments")
        .delete()
        .eq("id", attachment.id);

      if (dbError) throw dbError;

      toast({
        title: "File deleted",
        description: `${attachment.fileName} has been deleted.`,
      });

      onDelete?.(attachment.id);
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handlePreview = (attachment: Attachment) => {
    if (attachment.mimeType.startsWith("image/")) {
      const url = getPublicUrl(attachment.filePath);
      window.open(url, "_blank");
    } else {
      handleDownload(attachment);
    }
  };

  if (attachments.length === 0) {
    return (
      <div className={className}>
        <p className="text-center text-sm text-gray-500">No attachments</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-2">
        {attachments.map((attachment) => {
          const FileIcon = getFileIcon(attachment.mimeType);
          const isDeleting = deletingId === attachment.id;
          const isDownloading = downloadingId === attachment.id;

          return (
            <div
              key={attachment.id}
              className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-3 hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <FileIcon className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">{attachment.fileName}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(attachment.fileSize)} •{" "}
                    {formatDistanceToNow(new Date(attachment.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePreview(attachment)}
                  disabled={isDownloading}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(attachment)}
                  disabled={isDownloading}
                  className="h-8 w-8 p-0"
                >
                  <Download className="h-4 w-4" />
                </Button>
                {canDelete && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingId(attachment.id)}
                      disabled={isDeleting}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog
                      open={isDeleting}
                      onOpenChange={(open) => !open && setDeletingId(null)}
                    >
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete attachment?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete &quot;
                            {attachment.fileName}&quot;. This action cannot be
                            undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(attachment)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
