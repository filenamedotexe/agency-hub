import { describe, it, expect } from "vitest";
import { clientSchema, type ClientFormData } from "../client";

describe("Client Schema Validation", () => {
  it("should validate a valid client", () => {
    const validClient: ClientFormData = {
      name: "John Doe",
      businessName: "Acme Corporation",
      address: "123 Main St",
      dudaSiteId: "site_123",
      metadata: { custom: "data" },
    };

    const result = clientSchema.safeParse(validClient);
    expect(result.success).toBe(true);
  });

  it("should require name", () => {
    const invalidClient = {
      businessName: "Acme Corporation",
    };

    const result = clientSchema.safeParse(invalidClient);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["name"]);
      expect(result.error.issues[0].message).toBe("Required");
    }
  });

  it("should not allow empty name", () => {
    const invalidClient = {
      name: "",
      businessName: "Acme Corporation",
    };

    const result = clientSchema.safeParse(invalidClient);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["name"]);
      expect(result.error.issues[0].message).toBe("Name is required");
    }
  });

  it("should require business name", () => {
    const invalidClient = {
      name: "John Doe",
    };

    const result = clientSchema.safeParse(invalidClient);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["businessName"]);
      expect(result.error.issues[0].message).toBe("Required");
    }
  });

  it("should not allow empty business name", () => {
    const invalidClient = {
      name: "John Doe",
      businessName: "",
    };

    const result = clientSchema.safeParse(invalidClient);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["businessName"]);
      expect(result.error.issues[0].message).toBe("Business name is required");
    }
  });

  it("should allow optional fields to be null or undefined", () => {
    const minimalClient: ClientFormData = {
      name: "John Doe",
      businessName: "Acme Corporation",
      address: null,
      dudaSiteId: null,
      metadata: null,
    };

    const result = clientSchema.safeParse(minimalClient);
    expect(result.success).toBe(true);
  });

  it("should enforce maximum length on name", () => {
    const invalidClient = {
      name: "a".repeat(101),
      businessName: "Acme Corporation",
    };

    const result = clientSchema.safeParse(invalidClient);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["name"]);
      expect(result.error.issues[0].message).toContain("100");
    }
  });

  it("should enforce maximum length on business name", () => {
    const invalidClient = {
      name: "John Doe",
      businessName: "a".repeat(101),
    };

    const result = clientSchema.safeParse(invalidClient);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["businessName"]);
      expect(result.error.issues[0].message).toContain("100");
    }
  });

  it("should allow empty string for optional fields", () => {
    const clientWithEmptyOptionals: ClientFormData = {
      name: "John Doe",
      businessName: "Acme Corporation",
      address: "",
      dudaSiteId: "",
      metadata: {},
    };

    const result = clientSchema.safeParse(clientWithEmptyOptionals);
    expect(result.success).toBe(true);
  });
});
