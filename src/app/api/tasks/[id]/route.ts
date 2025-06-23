import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import { z } from "zod";

const updateTaskSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  status: z.enum(["TO_DO", "IN_PROGRESS", "DONE"]).optional(),
  clientVisible: z.boolean().optional(),
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

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        service: {
          include: {
            client: true,
            template: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if user has access to this task
    if (
      session.user.role === "CLIENT" &&
      task.service.clientId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Get task error:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
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

    // Only certain roles can update tasks
    const allowedRoles = [
      "ADMIN",
      "SERVICE_MANAGER",
      "COPYWRITER",
      "EDITOR",
      "VA",
    ];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    // Fetch the task to check permissions and get service info
    const existingTask = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        service: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Update the task
    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        dueDate: validatedData.dueDate
          ? new Date(validatedData.dueDate)
          : undefined,
      },
      include: {
        service: {
          include: {
            client: true,
            template: true,
          },
        },
      },
    });

    // Check if service status needs to be updated
    const allTasks = await prisma.task.findMany({
      where: { serviceId: updatedTask.serviceId },
    });

    const allDone = allTasks.every((task) => task.status === "DONE");
    const anyInProgress = allTasks.some(
      (task) => task.status === "IN_PROGRESS"
    );

    let newServiceStatus: "TO_DO" | "IN_PROGRESS" | "DONE" = "TO_DO";
    if (allDone) {
      newServiceStatus = "DONE";
    } else if (anyInProgress) {
      newServiceStatus = "IN_PROGRESS";
    }

    // Update service status if it changed
    if (newServiceStatus !== updatedTask.service.status) {
      await prisma.service.update({
        where: { id: updatedTask.serviceId },
        data: { status: newServiceStatus },
      });
    }

    // Log activity
    await logActivity({
      userId: session.user.id,
      entityType: "task",
      entityId: updatedTask.id,
      action: "updated",
      metadata: {
        taskName: updatedTask.name,
        clientName: updatedTask.service.client.name,
        serviceName: updatedTask.service.template.name,
        changes: validatedData,
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Update task error:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
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

    // Only admins and service managers can delete tasks
    if (!["ADMIN", "SERVICE_MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        service: {
          include: {
            client: true,
            template: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id: params.id },
    });

    // Log activity
    await logActivity({
      userId: session.user.id,
      entityType: "task",
      entityId: params.id,
      action: "deleted",
      metadata: {
        taskName: task.name,
        clientName: task.service.client.name,
        serviceName: task.service.template.name,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete task error:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
