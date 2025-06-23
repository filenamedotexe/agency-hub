import { describe, it, expect } from "vitest";
import { signInSchema, signUpSchema } from "../auth";
import { UserRole } from "@prisma/client";

describe("Auth Validation Schemas", () => {
  describe("signInSchema", () => {
    it("should validate correct sign in data", () => {
      const validData = {
        email: "test@example.com",
        password: "password123",
      };

      const result = signInSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const invalidData = {
        email: "not-an-email",
        password: "password123",
      };

      const result = signInSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid email address");
      }
    });

    it("should reject short password", () => {
      const invalidData = {
        email: "test@example.com",
        password: "12345",
      };

      const result = signInSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Password must be at least 6 characters"
        );
      }
    });

    it("should reject missing fields", () => {
      const invalidData = {
        email: "test@example.com",
      };

      const result = signInSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("signUpSchema", () => {
    it("should validate correct sign up data", () => {
      const validData = {
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
        role: UserRole.CLIENT,
        name: "Test User",
        businessName: "Test Business",
      };

      const result = signUpSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should validate sign up without optional fields", () => {
      const validData = {
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
        role: UserRole.COPYWRITER,
      };

      const result = signUpSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject password without uppercase", () => {
      const invalidData = {
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
        role: UserRole.CLIENT,
      };

      const result = signUpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Password must contain at least one uppercase letter"
        );
      }
    });

    it("should reject password without lowercase", () => {
      const invalidData = {
        email: "test@example.com",
        password: "PASSWORD123",
        confirmPassword: "PASSWORD123",
        role: UserRole.CLIENT,
      };

      const result = signUpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Password must contain at least one lowercase letter"
        );
      }
    });

    it("should reject password without number", () => {
      const invalidData = {
        email: "test@example.com",
        password: "PasswordOnly",
        confirmPassword: "PasswordOnly",
        role: UserRole.CLIENT,
      };

      const result = signUpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Password must contain at least one number"
        );
      }
    });

    it("should reject non-matching passwords", () => {
      const invalidData = {
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Different123",
        role: UserRole.CLIENT,
      };

      const result = signUpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Passwords don't match");
      }
    });

    it("should reject invalid role", () => {
      const invalidData = {
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
        role: "INVALID_ROLE",
      };

      const result = signUpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject name that is too short", () => {
      const invalidData = {
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
        role: UserRole.CLIENT,
        name: "A",
      };

      const result = signUpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const nameError = result.error.issues.find((issue) =>
          issue.path.includes("name")
        );
        expect(nameError?.message).toBe("Name must be at least 2 characters");
      }
    });

    it("should accept all valid roles", () => {
      const roles = [
        UserRole.ADMIN,
        UserRole.SERVICE_MANAGER,
        UserRole.COPYWRITER,
        UserRole.EDITOR,
        UserRole.VA,
        UserRole.CLIENT,
      ];

      roles.forEach((role) => {
        const data = {
          email: "test@example.com",
          password: "Password123",
          confirmPassword: "Password123",
          role,
        };

        const result = signUpSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });
});
