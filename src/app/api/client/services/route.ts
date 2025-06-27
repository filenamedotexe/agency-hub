import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only clients can access their own services through this endpoint
    if (session.user.role !== "CLIENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    // Get the client's ID based on their user email
    const client = await prisma.client.findFirst({
      where: {
        metadata: {
          path: ["userId"],
          equals: session.user.id,
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Build where clause
    const where: any = { clientId: client.id };
    if (status === "active") {
      where.status = { in: ["TO_DO", "IN_PROGRESS"] };
    } else if (status) {
      where.status = status;
    }

    const services = await prisma.service.findMany({
      where,
      include: {
        template: true,
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

    // Transform the data to include progress information
    const servicesWithProgress = services.map((service) => {
      const completedTasks = service.tasks.filter(
        (task) => task.status === "DONE"
      ).length;
      const nextTask = service.tasks.find((task) => task.status !== "DONE");

      return {
        id: service.id,
        name: service.template.name,
        status: service.status,
        completedTasks,
        totalTasks: service.tasks.length,
        nextMilestone: nextTask
          ? {
              name: nextTask.name,
              dueDate: nextTask.dueDate,
            }
          : undefined,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
      };
    });

    return NextResponse.json(servicesWithProgress);
  } catch (error) {
    console.error("Error fetching client services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
