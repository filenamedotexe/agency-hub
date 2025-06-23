import { prisma } from "@/lib/prisma";

interface LogActivityParams {
  userId: string;
  entityType: string;
  entityId: string;
  action: string;
  clientId?: string;
  metadata?: any;
}

export async function logActivity(params: LogActivityParams) {
  const { userId, entityType, entityId, action, clientId, metadata } = params;

  return prisma.activityLog.create({
    data: {
      userId,
      entityType,
      entityId,
      action,
      clientId,
      metadata: metadata || {},
    },
  });
}
