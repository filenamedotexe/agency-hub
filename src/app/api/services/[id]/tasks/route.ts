import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import { z } from "zod";

const createTaskSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().datetime().nullable().optional(),
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

    const service = await prisma.service.findUnique({
      where: { id: params.id },
      include: {
        tasks: {
          orderBy: { createdAt: "asc" },
        },
        client: true,
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Check if user has access to this service
    if (session.user.role === "CLIENT") {
      if (service.clientId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      // Filter out non-client-visible tasks
      service.tasks = service.tasks.filter((task) => task.clientVisible);
    }

    return NextResponse.json(service.tasks);
  } catch (error) {
    console.error("Get service tasks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only certain roles can create tasks
    const allowedRoles = ["ADMIN", "SERVICE_MANAGER"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createTaskSchema.parse(body);

    // Check if service exists
    const service = await prisma.service.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        template: true,
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Create the task
    const task = await prisma.task.create({
      data: {
        serviceId: params.id,
        name: validatedData.name,
        description: validatedData.description || "",
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        clientVisible: validatedData.clientVisible,
        checklist: validatedData.checklist || [],
        status: "TO_DO",
      },
    });

    // Update service status if needed
    if (service.status === "DONE") {
      await prisma.service.update({
        where: { id: params.id },
        data: { status: "IN_PROGRESS" },
      });
    }

    // Log activity
    await logActivity({
      userId: session.user.id,
      entityType: "task",
      entityId: task.id,
      action: "created",
      metadata: {
        taskName: task.name,
        clientName: service.client.name,
        serviceName: service.template.name,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create task error:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
