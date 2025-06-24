import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { z } from "zod";
import { logActivity } from "@/lib/activity-logger";

// Force dynamic rendering
export const dynamic = "force-dynamic";

const createServiceSchema = z.object({
  templateId: z.string().uuid(),
  clientId: z.string().uuid(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");

    const where: any = {};
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;

    // If user is a client, only show their services
    if (session.user.role === "CLIENT") {
      // TODO: Add client association logic
      return NextResponse.json([]);
    }

    const services = await prisma.service.findMany({
      where,
      include: {
        template: true,
        client: true,
        tasks: {
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
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
    const validatedData = createServiceSchema.parse(body);

    // Fetch the template to get default tasks
    const template = await prisma.serviceTemplate.findUnique({
      where: { id: validatedData.templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Create the service with tasks in a transaction
    const service = await prisma.$transaction(async (tx) => {
      // Create the service
      const newService = await tx.service.create({
        data: {
          templateId: validatedData.templateId,
          clientId: validatedData.clientId,
          status: "TO_DO",
        },
        include: {
          template: true,
          client: true,
        },
      });

      // Create tasks from template
      if (template.defaultTasks && template.defaultTasks.length > 0) {
        await tx.task.createMany({
          data: template.defaultTasks.map((task: any) => ({
            serviceId: newService.id,
            name: task.name,
            description: task.description || null,
            clientVisible: task.clientVisible || false,
            checklist: task.checklist || [],
            status: "TO_DO",
          })),
        });
      }

      // Fetch the service with tasks
      return tx.service.findUnique({
        where: { id: newService.id },
        include: {
          template: true,
          client: true,
          tasks: true,
        },
      });
    });

    // Log activity
    await logActivity({
      userId: session.user.id,
      entityType: "service",
      entityId: service!.id,
      clientId: service!.clientId,
      action: "created",
      metadata: {
        templateName: service!.template.name,
        clientName: service!.client.name,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}
