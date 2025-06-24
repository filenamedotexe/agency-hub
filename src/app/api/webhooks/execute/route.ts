import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const executeWebhookSchema = z.object({
  webhookId: z.string().min(1, "Webhook ID is required"),
  payload: z.any(),
});

// POST /api/webhooks/execute - Execute a webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = executeWebhookSchema.parse(body);

    // Get webhook details
    const webhook = await prisma.webhook.findUnique({
      where: { id: validatedData.webhookId },
    });

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    if (!webhook.isActive) {
      return NextResponse.json(
        { error: "Webhook is not active" },
        { status: 400 }
      );
    }

    // Execute webhook
    let response: Response | null = null;
    let error: string | null = null;

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...((webhook.headers as Record<string, string>) || {}),
      };

      response = await fetch(webhook.url, {
        method: "POST",
        headers,
        body: JSON.stringify(validatedData.payload),
      });

      const responseText = await response.text();
      let responseData;

      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { text: responseText };
      }

      // Log execution
      const execution = await prisma.webhookExecution.create({
        data: {
          webhookId: webhook.id,
          payload: validatedData.payload,
          response: responseData,
          statusCode: response.status,
        },
      });

      return NextResponse.json({
        success: true,
        executionId: execution.id,
        statusCode: response.status,
        response: responseData,
      });
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error";

      // Log failed execution
      const execution = await prisma.webhookExecution.create({
        data: {
          webhookId: webhook.id,
          payload: validatedData.payload,
          error,
        },
      });

      return NextResponse.json(
        {
          error: "Webhook execution failed",
          details: error,
          executionId: execution.id,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error executing webhook:", error);
    return NextResponse.json(
      { error: "Failed to execute webhook" },
      { status: 500 }
    );
  }
}
