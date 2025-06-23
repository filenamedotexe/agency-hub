"use client";

import { useCallback, useState } from "react";
import { Upload, X, File, Image, FileText, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/supabase/storage";
import { validateFiles } from "@/lib/validations/file";

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  disabled?: boolean;
  onFilesSelected: (files: File[]) => void;
  uploadProgress?: { progress: number; fileName: string } | null;
  className?: string;
}

export function FileUpload({
  accept,
  multiple = false,
  maxFiles = 10,
  disabled = false,
  onFilesSelected,
  uploadProgress,
  className,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    },
    [disabled, handleFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const files = Array.from(e.target.files || []);
      handleFiles(files);
    },
    [disabled, handleFiles]
  );

  const handleFiles = useCallback(
    (files: File[]) => {
      setErrors([]);

      // Limit number of files
      if (files.length > maxFiles) {
        setErrors([`Maximum ${maxFiles} files allowed`]);
        return;
      }

      // Validate files
      const { valid, errors: validationErrors } = validateFiles(files);

      if (validationErrors.length > 0) {
        setErrors(validationErrors.map((e) => `${e.file.name}: ${e.error}`));
        return;
      }

      setSelectedFiles(valid);
      onFilesSelected(valid);
    },
    [maxFiles, onFilesSelected]
  );

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      setSelectedFiles(newFiles);
      onFilesSelected(newFiles);
    },
    [selectedFiles, onFilesSelected]
  );

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return Image;
    if (mimeType.startsWith("video/")) return Video;
    if (mimeType.includes("pdf") || mimeType.includes("document"))
      return FileText;
    return File;
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed border-gray-200 p-6 transition-colors",
          dragActive && "border-primary bg-primary/5",
          disabled && "cursor-not-allowed opacity-50",
          !disabled && "hover:border-gray-300"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleFileInput}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        />

        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <Upload className="h-8 w-8 text-gray-400" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700">
              Drop files here or click to upload
            </p>
            <p className="text-xs text-gray-500">
              {multiple ? `Up to ${maxFiles} files` : "Single file only"}
            </p>
          </div>
        </div>
      </div>

      {/* Upload progress */}
      {uploadProgress && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{uploadProgress.fileName}</span>
            <span className="text-gray-500">{uploadProgress.progress}%</span>
          </div>
          <Progress value={uploadProgress.progress} className="h-2" />
        </div>
      )}

      {/* Selected files */}
      {selectedFiles.length > 0 && !uploadProgress && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">Selected files:</p>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => {
              const FileIcon = getFileIcon(file.type);
              return (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-2"
                >
                  <div className="flex items-center space-x-2">
                    <FileIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mt-4 space-y-1">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-500">
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
