import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createWebhookSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Invalid webhook URL"),
  type: z.enum(["FORM", "CONTENT_TOOL", "GENERAL"]),
  entityId: z.string().optional(),
  headers: z.record(z.string()).optional(),
  isActive: z.boolean().default(true),
});

// GET /api/webhooks - List all webhooks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const webhooks = await prisma.webhook.findMany({
      where: type ? { type: type as any } : undefined,
      include: {
        _count: {
          select: { executions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(webhooks);
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    return NextResponse.json(
      { error: "Failed to fetch webhooks" },
      { status: 500 }
    );
  }
}

// POST /api/webhooks - Create a new webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createWebhookSchema.parse(body);

    const webhook = await prisma.webhook.create({
      data: {
        name: validatedData.name,
        url: validatedData.url,
        type: validatedData.type,
        entityId: validatedData.entityId,
        headers: validatedData.headers || {},
        isActive: validatedData.isActive,
        createdBy: "system", // TODO: Get from auth context
      },
    });

    return NextResponse.json(webhook, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid webhook data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating webhook:", error);
    return NextResponse.json(
      { error: "Failed to create webhook" },
      { status: 500 }
    );
  }
}
