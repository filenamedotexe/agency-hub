import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { z } from "zod";
import { logActivity } from "@/lib/activity-logger";

const updateServiceSchema = z.object({
  status: z.enum(["TO_DO", "IN_PROGRESS", "DONE"]).optional(),
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
        template: true,
        client: true,
        tasks: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Check access for clients
    if (session.user.role === "CLIENT") {
      if (service.clientId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      // Filter out non-client-visible tasks
      service.tasks = service.tasks.filter((task) => task.clientVisible);
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error("Error fetching service:", error);
    return NextResponse.json(
      { error: "Failed to fetch service" },
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
      session.user.role !== "SERVICE_MANAGER" &&
      session.user.role !== "COPYWRITER" &&
      session.user.role !== "EDITOR"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateServiceSchema.parse(body);

    const service = await prisma.service.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        template: true,
        client: true,
        tasks: true,
      },
    });

    await logActivity({
      userId: session.user.id,
      entityType: "service",
      entityId: service.id,
      clientId: service.clientId,
      action: "updated",
      metadata: { changes: validatedData },
    });

    return NextResponse.json(service);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating service:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
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

    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "SERVICE_MANAGER"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const service = await prisma.service.findUnique({
      where: { id: params.id },
      include: { client: true, template: true },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Delete service (tasks will be cascade deleted)
    await prisma.service.delete({
      where: { id: params.id },
    });

    await logActivity({
      userId: session.user.id,
      entityType: "service",
      entityId: params.id,
      clientId: service.clientId,
      action: "deleted",
      metadata: {
        serviceName: service.template.name,
        clientName: service.client.name,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
