import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { z } from "zod";
import { logActivity } from "@/lib/activity-logger";

const createServiceTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(["GOOGLE_ADS", "FACEBOOK_ADS", "WEBSITE_DESIGN"]),
  defaultTasks: z
    .array(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        clientVisible: z.boolean().default(false),
        checklist: z
          .array(
            z.object({
              id: z.string(),
              text: z.string(),
              completed: z.boolean().default(false),
            })
          )
          .optional(),
      })
    )
    .default([]),
  price: z.number().positive().optional(),
  requiredForms: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const where = type ? { type: type as any } : {};

    const templates = await prisma.serviceTemplate.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching service templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch service templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "SERVICE_MANAGER"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createServiceTemplateSchema.parse(body);

    const template = await prisma.serviceTemplate.create({
      data: {
        name: validatedData.name,
        type: validatedData.type,
        defaultTasks: validatedData.defaultTasks,
        price: validatedData.price,
        requiredFormIds: validatedData.requiredForms || [],
      },
    });

    await logActivity({
      userId: session.user.id,
      entityType: "service_template",
      entityId: template.id,
      action: "created",
      metadata: { templateName: template.name, type: template.type },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating service template:", error);
    return NextResponse.json(
      { error: "Failed to create service template" },
      { status: 500 }
    );
  }
}
