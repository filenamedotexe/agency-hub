import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { z } from "zod";
import { logActivity } from "@/lib/activity-logger";

const updateServiceTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  type: z.enum(["GOOGLE_ADS", "FACEBOOK_ADS", "WEBSITE_DESIGN"]).optional(),
  defaultTasks: z
    .array(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        clientVisible: z.boolean().default(false),
      })
    )
    .optional(),
  price: z.number().positive().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const template = await prisma.serviceTemplate.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { services: true },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Service template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error fetching service template:", error);
    return NextResponse.json(
      { error: "Failed to fetch service template" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const validatedData = updateServiceTemplateSchema.parse(body);

    const template = await prisma.serviceTemplate.update({
      where: { id: params.id },
      data: validatedData,
    });

    await logActivity({
      userId: session.user.id,
      entityType: "service_template",
      entityId: template.id,
      action: "updated",
      metadata: { changes: validatedData },
    });

    return NextResponse.json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating service template:", error);
    return NextResponse.json(
      { error: "Failed to update service template" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if template is in use
    const servicesCount = await prisma.service.count({
      where: { templateId: params.id },
    });

    if (servicesCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete template that is in use by services" },
        { status: 400 }
      );
    }

    const template = await prisma.serviceTemplate.delete({
      where: { id: params.id },
    });

    await logActivity({
      userId: session.user.id,
      entityType: "service_template",
      entityId: template.id,
      action: "deleted",
      metadata: { templateName: template.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting service template:", error);
    return NextResponse.json(
      { error: "Failed to delete service template" },
      { status: 500 }
    );
  }
}
