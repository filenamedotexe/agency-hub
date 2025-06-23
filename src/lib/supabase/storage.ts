import type { Database } from "@/types/database";

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  VIDEO: 50 * 1024 * 1024, // 50MB
  DEFAULT: 10 * 1024 * 1024, // 10MB
};

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  IMAGE: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ],
  DOCUMENT: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
  ],
  VIDEO: ["video/mp4", "video/mpeg", "video/quicktime", "video/webm"],
};

export const ALL_ALLOWED_TYPES = [
  ...ALLOWED_FILE_TYPES.IMAGE,
  ...ALLOWED_FILE_TYPES.DOCUMENT,
  ...ALLOWED_FILE_TYPES.VIDEO,
];

// Get file size limit based on mime type
export function getFileSizeLimit(mimeType: string): number {
  if (ALLOWED_FILE_TYPES.IMAGE.includes(mimeType)) {
    return FILE_SIZE_LIMITS.IMAGE;
  }
  if (ALLOWED_FILE_TYPES.DOCUMENT.includes(mimeType)) {
    return FILE_SIZE_LIMITS.DOCUMENT;
  }
  if (ALLOWED_FILE_TYPES.VIDEO.includes(mimeType)) {
    return FILE_SIZE_LIMITS.VIDEO;
  }
  return FILE_SIZE_LIMITS.DEFAULT;
}

// Storage bucket names
export const STORAGE_BUCKETS = {
  ATTACHMENTS: "attachments",
};

// Generate unique file path
export function generateFilePath(
  entityType: string,
  entityId: string,
  fileName: string
): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${entityType}/${entityId}/${timestamp}-${sanitizedFileName}`;
}

// Get public URL for a file
export function getPublicUrl(filePath: string, bucketUrl?: string): string {
  // In production, this would use the Supabase client
  // For now, return a placeholder URL
  const baseUrl = bucketUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${baseUrl}/storage/v1/object/public/${STORAGE_BUCKETS.ATTACHMENTS}/${filePath}`;
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Validate file type
export function isValidFileType(mimeType: string): boolean {
  return ALL_ALLOWED_TYPES.includes(mimeType);
}

// Validate file size
export function isValidFileSize(size: number, mimeType: string): boolean {
  const limit = getFileSizeLimit(mimeType);
  return size <= limit;
}
