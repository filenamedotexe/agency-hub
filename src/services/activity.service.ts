import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface ActivityLog {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  clientId: string | null;
  action: string;
  metadata: any;
  createdAt: Date;
  user: {
    id: string;
    email: string;
  };
}

export interface ActivityLogParams {
  clientId?: string;
  entityType?: string;
  entityId?: string;
  limit?: number;
  offset?: number;
}

export async function getActivityLogs(
  params: ActivityLogParams = {}
): Promise<ActivityLog[]> {
  const { clientId, entityType, entityId, limit = 50, offset = 0 } = params;

  const where: Prisma.ActivityLogWhereInput = {};

  if (clientId) {
    where.clientId = clientId;
  }

  if (entityType) {
    where.entityType = entityType;
  }

  if (entityId) {
    where.entityId = entityId;
  }

  return prisma.activityLog.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    skip: offset,
  });
}

export async function getDashboardActivityLogs(
  limit: number = 10
): Promise<ActivityLog[]> {
  return prisma.activityLog.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
      client: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}
