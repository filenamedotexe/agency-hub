import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { z } from "zod";

const createWebhookSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Invalid webhook URL"),
  productionUrl: z.union([z.string().url(), z.literal("")]).optional(),
  testingUrl: z.union([z.string().url(), z.literal("")]).optional(),
  isProduction: z.boolean().default(true),
  type: z.enum(["FORM", "CONTENT_TOOL", "GENERAL"]),
  entityId: z.string().optional(),
  headers: z.union([z.record(z.string()), z.object({})]).optional(),
  isActive: z.boolean().default(true),
});

// Force dynamic rendering
export const dynamic = "force-dynamic";

// GET /api/webhooks - List all webhooks
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
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
    const session = await getServerSession();
    if (!session) {
      console.log("[WEBHOOK API] No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[WEBHOOK API] Session found:", session.user?.email);

    const body = await request.json();
    console.log("[WEBHOOK API] Request body:", body);

    const validatedData = createWebhookSchema.parse(body);
    console.log("[WEBHOOK API] Validation passed:", validatedData);

    const webhook = await prisma.webhook.create({
      data: {
        name: validatedData.name,
        url: validatedData.url,
        productionUrl: validatedData.productionUrl || null,
        testingUrl: validatedData.testingUrl || null,
        isProduction: validatedData.isProduction,
        type: validatedData.type,
        entityId: validatedData.entityId,
        headers: validatedData.headers || {},
        isActive: validatedData.isActive,
        createdBy: session.user.id,
      },
    });

    console.log("[WEBHOOK API] Webhook created successfully:", webhook.id);
    return NextResponse.json(webhook, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log("[WEBHOOK API] Validation error:", error.errors);
      return NextResponse.json(
        { error: "Invalid webhook data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("[WEBHOOK API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to create webhook" },
      { status: 500 }
    );
  }
}
