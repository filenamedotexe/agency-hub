import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";

// Duda webhook event types we handle
const DUDA_EVENTS = {
  NEW_CONVERSATION: "NEW_CONVERSATION",
  NEW_COMMENT: "NEW_COMMENT",
  CONVERSATION_UPDATED: "CONVERSATION_UPDATED",
  COMMENT_EDITED: "COMMENT_EDITED",
  COMMENT_DELETED: "COMMENT_DELETED",
};

const dudaWebhookSchema = z.object({
  data: z.object({
    comment: z
      .object({
        text: z.string(),
        uuid: z.string(),
      })
      .optional(),
    conversation_uuid: z.string().optional(),
    conversation_context: z
      .object({
        page_uuid: z.string(),
        device: z.enum(["DESKTOP", "TABLET", "MOBILE"]),
        conversation_number: z.number(),
      })
      .optional(),
  }),
  source: z.object({
    type: z.enum(["EDITOR", "API"]),
    account_name: z.string(),
  }),
  resource_data: z.object({
    site_name: z.string(), // Maps to duda_site_id
  }),
  event_timestamp: z.number(),
  event_type: z.string(),
});

// Verify webhook signature
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

  // Ensure both strings are the same length before comparison
  if (signature.length !== expectedSignature.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expectedSignature, "hex")
  );
}

// POST /api/webhooks/duda - Handle Duda webhook events
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.DUDA_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature =
        request.headers.get("x-duda-signature") ||
        request.headers.get("x-webhook-signature");

      if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        console.error("Invalid webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }
    const validatedData = dudaWebhookSchema.parse(body);

    // Find client by Duda site ID
    const client = await prisma.client.findUnique({
      where: { dudaSiteId: validatedData.resource_data.site_name },
    });

    if (!client) {
      console.error(
        "Client not found for Duda site:",
        validatedData.resource_data.site_name
      );
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    switch (validatedData.event_type) {
      case DUDA_EVENTS.NEW_CONVERSATION:
        // Create new request
        if (validatedData.data.comment) {
          const request = await prisma.request.create({
            data: {
              clientId: client.id,
              description: validatedData.data.comment.text,
              dudaData: body,
              comments: {
                create: {
                  text: validatedData.data.comment.text,
                  dudaUuid: validatedData.data.comment.uuid,
                },
              },
            },
          });

          // Log activity
          await prisma.activityLog.create({
            data: {
              userId: "system",
              entityType: "request",
              entityId: request.id,
              clientId: client.id,
              action: "created",
              metadata: {
                source: "duda_webhook",
                event_type: validatedData.event_type,
              },
            },
          });

          return NextResponse.json({ success: true, requestId: request.id });
        }
        break;

      case DUDA_EVENTS.NEW_COMMENT:
        // Add comment to existing request
        if (
          validatedData.data.conversation_uuid &&
          validatedData.data.comment
        ) {
          // Find request by conversation UUID in dudaData
          const existingRequest = await prisma.request.findFirst({
            where: {
              clientId: client.id,
              dudaData: {
                path: ["data", "conversation_uuid"],
                equals: validatedData.data.conversation_uuid,
              },
            },
          });

          if (existingRequest) {
            await prisma.requestComment.create({
              data: {
                requestId: existingRequest.id,
                text: validatedData.data.comment.text,
                dudaUuid: validatedData.data.comment.uuid,
              },
            });

            return NextResponse.json({ success: true });
          }
        }
        break;

      case DUDA_EVENTS.CONVERSATION_UPDATED:
        // Update request status based on conversation state
        if (validatedData.data.conversation_uuid) {
          const existingRequest = await prisma.request.findFirst({
            where: {
              clientId: client.id,
              dudaData: {
                path: ["data", "conversation_uuid"],
                equals: validatedData.data.conversation_uuid,
              },
            },
          });

          if (existingRequest) {
            // Update request metadata
            await prisma.request.update({
              where: { id: existingRequest.id },
              data: {
                dudaData: body,
              },
            });

            return NextResponse.json({ success: true });
          }
        }
        break;

      case DUDA_EVENTS.COMMENT_EDITED:
        // Update existing comment
        if (validatedData.data.comment) {
          await prisma.requestComment.updateMany({
            where: { dudaUuid: validatedData.data.comment.uuid },
            data: { text: validatedData.data.comment.text },
          });

          return NextResponse.json({ success: true });
        }
        break;

      case DUDA_EVENTS.COMMENT_DELETED:
        // Mark comment as deleted
        if (validatedData.data.comment) {
          await prisma.requestComment.updateMany({
            where: { dudaUuid: validatedData.data.comment.uuid },
            data: { isDeleted: true },
          });

          return NextResponse.json({ success: true });
        }
        break;

      default:
        console.log("Unhandled Duda event type:", validatedData.event_type);
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Invalid Duda webhook data:", error.errors);
      return NextResponse.json(
        { error: "Invalid webhook data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error processing Duda webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
