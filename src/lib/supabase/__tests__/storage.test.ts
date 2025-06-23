import { describe, it, expect } from "vitest";
import {
  isValidFileType,
  isValidFileSize,
  getFileSizeLimit,
  formatFileSize,
  generateFilePath,
  ALL_ALLOWED_TYPES,
  FILE_SIZE_LIMITS,
} from "@/lib/supabase/storage";
import { validateFiles } from "@/lib/validations/file";

describe("File Validation", () => {
  describe("isValidFileType", () => {
    it("should accept valid image types", () => {
      expect(isValidFileType("image/jpeg")).toBe(true);
      expect(isValidFileType("image/png")).toBe(true);
      expect(isValidFileType("image/gif")).toBe(true);
      expect(isValidFileType("image/webp")).toBe(true);
    });

    it("should accept valid document types", () => {
      expect(isValidFileType("application/pdf")).toBe(true);
      expect(isValidFileType("text/plain")).toBe(true);
      expect(isValidFileType("text/csv")).toBe(true);
    });

    it("should accept valid video types", () => {
      expect(isValidFileType("video/mp4")).toBe(true);
      expect(isValidFileType("video/webm")).toBe(true);
    });

    it("should reject invalid file types", () => {
      expect(isValidFileType("application/x-msdownload")).toBe(false);
      expect(isValidFileType("application/x-executable")).toBe(false);
      expect(isValidFileType("text/html")).toBe(false);
    });
  });

  describe("getFileSizeLimit", () => {
    it("should return correct size limits for different file types", () => {
      expect(getFileSizeLimit("image/jpeg")).toBe(FILE_SIZE_LIMITS.IMAGE);
      expect(getFileSizeLimit("application/pdf")).toBe(
        FILE_SIZE_LIMITS.DOCUMENT
      );
      expect(getFileSizeLimit("video/mp4")).toBe(FILE_SIZE_LIMITS.VIDEO);
      expect(getFileSizeLimit("unknown/type")).toBe(FILE_SIZE_LIMITS.DEFAULT);
    });
  });

  describe("isValidFileSize", () => {
    it("should accept files within size limits", () => {
      expect(isValidFileSize(1024 * 1024, "image/jpeg")).toBe(true); // 1MB image
      expect(isValidFileSize(5 * 1024 * 1024, "application/pdf")).toBe(true); // 5MB PDF
      expect(isValidFileSize(30 * 1024 * 1024, "video/mp4")).toBe(true); // 30MB video
    });

    it("should reject files exceeding size limits", () => {
      expect(isValidFileSize(6 * 1024 * 1024, "image/jpeg")).toBe(false); // 6MB image
      expect(isValidFileSize(11 * 1024 * 1024, "application/pdf")).toBe(false); // 11MB PDF
      expect(isValidFileSize(51 * 1024 * 1024, "video/mp4")).toBe(false); // 51MB video
    });
  });

  describe("formatFileSize", () => {
    it("should format file sizes correctly", () => {
      expect(formatFileSize(0)).toBe("0 Bytes");
      expect(formatFileSize(1024)).toBe("1 KB");
      expect(formatFileSize(1024 * 1024)).toBe("1 MB");
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe("1.5 MB");
      expect(formatFileSize(1024 * 1024 * 1024)).toBe("1 GB");
    });
  });

  describe("generateFilePath", () => {
    it("should generate valid file paths", () => {
      const path = generateFilePath("task", "123", "test file.pdf");
      expect(path).toMatch(/^task\/123\/\d+-test_file.pdf$/);
    });

    it("should sanitize file names", () => {
      const path = generateFilePath("service", "456", "test@#$%.pdf");
      expect(path).toMatch(/^service\/456\/\d+-test____.pdf$/);
    });
  });

  describe("validateFiles", () => {
    it("should validate multiple files correctly", () => {
      const validFile = new File(["content"], "valid.pdf", {
        type: "application/pdf",
      });
      const invalidTypeFile = new File(["content"], "invalid.exe", {
        type: "application/x-msdownload",
      });
      const emptyFile = new File([], "empty.pdf", {
        type: "application/pdf",
      });

      const result = validateFiles([validFile, invalidTypeFile, emptyFile]);

      expect(result.valid).toHaveLength(1);
      expect(result.valid[0]).toBe(validFile);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].file).toBe(invalidTypeFile);
      expect(result.errors[1].file).toBe(emptyFile);
    });

    it("should handle empty file array", () => {
      const result = validateFiles([]);
      expect(result.valid).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });
});
