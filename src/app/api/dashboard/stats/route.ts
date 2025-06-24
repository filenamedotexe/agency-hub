import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// Cache the response for 10 seconds to improve performance
export const revalidate = 10;

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user role
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Execute all queries in parallel for better performance
    const [
      totalClients,
      servicesByStatus,
      requestsByStatus,
      recentActivity,
      newClientsThisWeek,
      completedServicesThisWeek,
      completedRequestsThisWeek,
    ] = await Promise.all([
      // Get total clients
      prisma.client.count(),

      // Get services by status
      prisma.service.groupBy({
        by: ["status"],
        _count: {
          status: true,
        },
      }),

      // Get requests by status
      prisma.request.groupBy({
        by: ["status"],
        _count: {
          status: true,
        },
      }),

      // Get recent activity (last 10 items)
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              email: true,
              role: true,
            },
          },
          client: {
            select: {
              name: true,
              businessName: true,
            },
          },
        },
      }),

      // Get weekly trends
      (() => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return prisma.client.count({
          where: {
            createdAt: {
              gte: weekAgo,
            },
          },
        });
      })(),

      (() => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return prisma.service.count({
          where: {
            status: "DONE",
            updatedAt: {
              gte: weekAgo,
            },
          },
        });
      })(),

      (() => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return prisma.request.count({
          where: {
            status: "DONE",
            completedAt: {
              gte: weekAgo,
            },
          },
        });
      })(),
    ]);

    // Calculate service metrics
    const totalServices = servicesByStatus.reduce(
      (sum, item) => sum + item._count.status,
      0
    );
    const activeServices =
      servicesByStatus.find((s) => s.status === "IN_PROGRESS")?._count.status ||
      0;
    const completedServices =
      servicesByStatus.find((s) => s.status === "DONE")?._count.status || 0;

    // Calculate request metrics
    const totalRequests = requestsByStatus.reduce(
      (sum, item) => sum + item._count.status,
      0
    );
    const pendingRequests =
      requestsByStatus.find((r) => r.status === "TO_DO")?._count.status || 0;
    const inProgressRequests =
      requestsByStatus.find((r) => r.status === "IN_PROGRESS")?._count.status ||
      0;

    return NextResponse.json({
      overview: {
        totalClients,
        totalServices,
        activeServices,
        completedServices,
        totalRequests,
        pendingRequests,
        inProgressRequests,
      },
      trends: {
        newClientsThisWeek,
        completedServicesThisWeek,
        completedRequestsThisWeek,
      },
      servicesByStatus: servicesByStatus.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
      requestsByStatus: requestsByStatus.map((r) => ({
        status: r.status,
        count: r._count.status,
      })),
      recentActivity: recentActivity.map((activity) => ({
        id: activity.id,
        action: activity.action,
        entityType: activity.entityType,
        entityId: activity.entityId,
        user: {
          email: activity.user.email,
          role: activity.user.role,
        },
        client: activity.client
          ? {
              name: activity.client.name,
              businessName: activity.client.businessName,
            }
          : null,
        metadata: activity.metadata,
        createdAt: activity.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
