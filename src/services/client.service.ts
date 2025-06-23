import { prisma } from "@/lib/prisma";
import type { Client, ClientFormData } from "@/types/client";
import { Prisma } from "@prisma/client";

const DEFAULT_PAGE_SIZE = 10;

export interface ClientListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: "name" | "businessName" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface ClientListResponse {
  clients: Client[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getClients(
  params: ClientListParams = {}
): Promise<ClientListResponse> {
  const {
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    search = "",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  const where: Prisma.ClientWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { businessName: { contains: search, mode: "insensitive" } },
          { dudaSiteId: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.client.count({ where }),
  ]);

  return {
    clients,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getClientById(id: string): Promise<Client | null> {
  return prisma.client.findUnique({
    where: { id },
  });
}

export async function createClient(
  data: ClientFormData,
  userId: string
): Promise<Client> {
  const client = await prisma.client.create({
    data: {
      name: data.name,
      businessName: data.businessName,
      address: data.address,
      dudaSiteId: data.dudaSiteId,
      metadata: data.metadata || undefined,
      activityLogs: {
        create: {
          userId,
          entityType: "client",
          entityId: "", // Will be updated after creation
          action: "created",
          metadata: { clientName: data.name },
        },
      },
    },
  });

  // Update the activity log with the correct entityId
  await prisma.activityLog.updateMany({
    where: {
      userId,
      entityType: "client",
      entityId: "",
      createdAt: {
        gte: new Date(Date.now() - 1000), // Within last second
      },
    },
    data: {
      entityId: client.id,
      clientId: client.id,
    },
  });

  return client;
}

export async function updateClient(
  id: string,
  data: ClientFormData,
  userId: string
): Promise<Client> {
  const client = await prisma.client.update({
    where: { id },
    data: {
      name: data.name,
      businessName: data.businessName,
      address: data.address,
      dudaSiteId: data.dudaSiteId,
      metadata: data.metadata || undefined,
      activityLogs: {
        create: {
          userId,
          entityType: "client",
          entityId: id,
          clientId: id,
          action: "updated",
          metadata: { changes: data },
        },
      },
    },
  });

  return client;
}

export async function deleteClient(id: string, userId: string): Promise<void> {
  const client = await prisma.client.findUnique({
    where: { id },
    select: { name: true },
  });

  if (!client) {
    throw new Error("Client not found");
  }

  // Create deletion activity log
  await prisma.activityLog.create({
    data: {
      userId,
      entityType: "client",
      entityId: id,
      clientId: id,
      action: "deleted",
      metadata: { clientName: client.name },
    },
  });

  // Delete the client (activity logs are preserved)
  await prisma.client.delete({
    where: { id },
  });
}
