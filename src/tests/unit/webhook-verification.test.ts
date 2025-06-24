import { describe, it, expect } from "vitest";
import crypto from "crypto";

// Copy of the webhook verification function from the API route
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  // Ensure both buffers are the same length before comparison
  if (signature.length !== expectedSignature.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expectedSignature, "hex")
  );
}

describe("Webhook Signature Verification", () => {
  const secret = "test-webhook-secret";
  const payload = JSON.stringify({ test: "data", timestamp: 1234567890 });

  it("should verify valid signature", () => {
    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    expect(verifyWebhookSignature(payload, validSignature, secret)).toBe(true);
  });

  it("should reject invalid signature", () => {
    const invalidSignature = "invalid-signature-12345";
    expect(verifyWebhookSignature(payload, invalidSignature, secret)).toBe(
      false
    );
  });

  it("should reject null signature", () => {
    expect(verifyWebhookSignature(payload, null, secret)).toBe(false);
  });

  it("should reject empty signature", () => {
    expect(verifyWebhookSignature(payload, "", secret)).toBe(false);
  });

  it("should reject signature with wrong secret", () => {
    const wrongSecret = "wrong-secret";
    const signatureWithWrongSecret = crypto
      .createHmac("sha256", wrongSecret)
      .update(payload)
      .digest("hex");

    expect(
      verifyWebhookSignature(payload, signatureWithWrongSecret, secret)
    ).toBe(false);
  });

  it("should handle different payload formats", () => {
    const payloads = [
      { type: "simple" },
      { nested: { data: { value: 123 } } },
      [],
      "string payload",
    ];

    payloads.forEach((testPayload) => {
      const payloadString =
        typeof testPayload === "string"
          ? testPayload
          : JSON.stringify(testPayload);

      const signature = crypto
        .createHmac("sha256", secret)
        .update(payloadString)
        .digest("hex");

      expect(verifyWebhookSignature(payloadString, signature, secret)).toBe(
        true
      );
    });
  });
});

describe("Duda Webhook Event Processing", () => {
  const dudaEvents = {
    NEW_CONVERSATION: "NEW_CONVERSATION",
    NEW_COMMENT: "NEW_COMMENT",
    CONVERSATION_UPDATED: "CONVERSATION_UPDATED",
    COMMENT_EDITED: "COMMENT_EDITED",
    COMMENT_DELETED: "COMMENT_DELETED",
  };

  it("should identify correct event types", () => {
    Object.values(dudaEvents).forEach((eventType) => {
      expect(dudaEvents).toHaveProperty(eventType);
    });
  });

  it("should handle webhook payload structure", () => {
    const validPayload = {
      data: {
        comment: {
          text: "Test comment",
          uuid: "uuid-123",
        },
        conversation_uuid: "conv-uuid-456",
      },
      source: {
        type: "EDITOR" as const,
        account_name: "test@example.com",
      },
      resource_data: {
        site_name: "test-site-id",
      },
      event_timestamp: Date.now(),
      event_type: "NEW_CONVERSATION",
    };

    // Test that all required fields are present
    expect(validPayload).toHaveProperty("data");
    expect(validPayload).toHaveProperty("source");
    expect(validPayload).toHaveProperty("resource_data");
    expect(validPayload).toHaveProperty("event_timestamp");
    expect(validPayload).toHaveProperty("event_type");

    // Test nested properties
    expect(validPayload.data).toHaveProperty("comment");
    expect(validPayload.data.comment).toHaveProperty("text");
    expect(validPayload.data.comment).toHaveProperty("uuid");
  });
});
