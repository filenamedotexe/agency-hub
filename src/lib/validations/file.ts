import { z } from "zod";
import {
  ALL_ALLOWED_TYPES,
  getFileSizeLimit,
  isValidFileType,
  isValidFileSize,
} from "@/lib/supabase/storage";

// File validation schema
export const fileSchema = z.object({
  name: z.string().min(1, "File name is required"),
  size: z.number().positive("File size must be positive"),
  type: z.string().min(1, "File type is required"),
});

// File upload validation
export const fileUploadSchema = z
  .custom<File>()
  .refine((file) => file instanceof File, "Must be a file")
  .refine((file) => file.size > 0, "File cannot be empty")
  .refine(
    (file) => isValidFileType(file.type),
    `File type not allowed. Allowed types: ${ALL_ALLOWED_TYPES.join(", ")}`
  )
  .refine(
    (file) => isValidFileSize(file.size, file.type),
    (file) => ({
      message: `File size exceeds limit of ${getFileSizeLimit(file.type)} bytes`,
    })
  );

// Multiple file upload validation
export const multipleFilesSchema = z
  .array(fileUploadSchema)
  .max(10, "Maximum 10 files allowed");

// Attachment creation schema (for API)
export const createAttachmentSchema = z.object({
  entityType: z.enum(["service", "task", "client", "form"]),
  entityId: z.string().uuid("Invalid entity ID"),
  fileName: z.string().min(1, "File name is required"),
  filePath: z.string().min(1, "File path is required"),
  fileSize: z.number().positive("File size must be positive"),
  mimeType: z.string().min(1, "MIME type is required"),
  metadata: z.record(z.any()).optional(),
});

// File error messages
export const FILE_ERROR_MESSAGES = {
  INVALID_TYPE: "File type not allowed",
  SIZE_EXCEEDED: "File size exceeds the allowed limit",
  UPLOAD_FAILED: "Failed to upload file. Please try again.",
  DELETE_FAILED: "Failed to delete file. Please try again.",
  NOT_FOUND: "File not found",
  PERMISSION_DENIED: "You do not have permission to access this file",
};

// Helper to validate multiple files
export function validateFiles(files: File[]): {
  valid: File[];
  errors: Array<{ file: File; error: string }>;
} {
  const valid: File[] = [];
  const errors: Array<{ file: File; error: string }> = [];

  for (const file of files) {
    try {
      fileUploadSchema.parse(file);
      valid.push(file);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push({
          file,
          error: error.errors[0]?.message || FILE_ERROR_MESSAGES.INVALID_TYPE,
        });
      }
    }
  }

  return { valid, errors };
}
