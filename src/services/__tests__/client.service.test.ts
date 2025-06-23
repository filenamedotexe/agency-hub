import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} from "../client.service";
import { prisma } from "@/lib/prisma";
import type { ClientFormData } from "@/types/client";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    client: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    activityLog: {
      updateMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("Client Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getClients", () => {
    it("should return paginated clients with default parameters", async () => {
      const mockClients = [
        { id: "1", name: "Client 1", businessName: "Business 1" },
        { id: "2", name: "Client 2", businessName: "Business 2" },
      ];

      vi.mocked(prisma.client.findMany).mockResolvedValue(mockClients as any);
      vi.mocked(prisma.client.count).mockResolvedValue(2);

      const result = await getClients();

      expect(prisma.client.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({
        clients: mockClients,
        total: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      });
    });

    it("should filter clients by search term", async () => {
      const searchTerm = "test";
      vi.mocked(prisma.client.findMany).mockResolvedValue([]);
      vi.mocked(prisma.client.count).mockResolvedValue(0);

      await getClients({ search: searchTerm });

      expect(prisma.client.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { businessName: { contains: searchTerm, mode: "insensitive" } },
            { dudaSiteId: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 10,
      });
    });

    it("should handle pagination correctly", async () => {
      vi.mocked(prisma.client.findMany).mockResolvedValue([]);
      vi.mocked(prisma.client.count).mockResolvedValue(25);

      const result = await getClients({ page: 2, pageSize: 10 });

      expect(prisma.client.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: "desc" },
        skip: 10,
        take: 10,
      });
      expect(result.totalPages).toBe(3);
    });

    it("should sort clients by specified field", async () => {
      vi.mocked(prisma.client.findMany).mockResolvedValue([]);
      vi.mocked(prisma.client.count).mockResolvedValue(0);

      await getClients({ sortBy: "name", sortOrder: "asc" });

      expect(prisma.client.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { name: "asc" },
        skip: 0,
        take: 10,
      });
    });
  });

  describe("getClientById", () => {
    it("should return a client by id", async () => {
      const mockClient = { id: "1", name: "Test Client" };
      vi.mocked(prisma.client.findUnique).mockResolvedValue(mockClient as any);

      const result = await getClientById("1");

      expect(prisma.client.findUnique).toHaveBeenCalledWith({
        where: { id: "1" },
      });
      expect(result).toEqual(mockClient);
    });

    it("should return null if client not found", async () => {
      vi.mocked(prisma.client.findUnique).mockResolvedValue(null);

      const result = await getClientById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("createClient", () => {
    it("should create a client with activity log", async () => {
      const clientData: ClientFormData = {
        name: "New Client",
        businessName: "New Business",
        address: "123 Main St",
        dudaSiteId: "site_123",
        metadata: {},
      };
      const userId = "user-123";
      const createdClient = { id: "client-123", ...clientData };

      vi.mocked(prisma.client.create).mockResolvedValue(createdClient as any);

      const result = await createClient(clientData, userId);

      expect(prisma.client.create).toHaveBeenCalledWith({
        data: {
          ...clientData,
          activityLogs: {
            create: {
              userId,
              entityType: "client",
              entityId: "",
              action: "created",
              metadata: { clientName: clientData.name },
            },
          },
        },
      });

      expect(prisma.activityLog.updateMany).toHaveBeenCalled();
      expect(result).toEqual(createdClient);
    });
  });

  describe("updateClient", () => {
    it("should update a client with activity log", async () => {
      const clientId = "client-123";
      const clientData: ClientFormData = {
        name: "Updated Client",
        businessName: "Updated Business",
        address: "456 New St",
        dudaSiteId: "site_456",
        metadata: {},
      };
      const userId = "user-123";
      const updatedClient = { id: clientId, ...clientData };

      vi.mocked(prisma.client.update).mockResolvedValue(updatedClient as any);

      const result = await updateClient(clientId, clientData, userId);

      expect(prisma.client.update).toHaveBeenCalledWith({
        where: { id: clientId },
        data: {
          ...clientData,
          activityLogs: {
            create: {
              userId,
              entityType: "client",
              entityId: clientId,
              clientId: clientId,
              action: "updated",
              metadata: { changes: clientData },
            },
          },
        },
      });

      expect(result).toEqual(updatedClient);
    });
  });

  describe("deleteClient", () => {
    it("should delete a client and create activity log", async () => {
      const clientId = "client-123";
      const userId = "user-123";
      const mockClient = { name: "Client to Delete" };

      vi.mocked(prisma.client.findUnique).mockResolvedValue(mockClient as any);
      vi.mocked(prisma.client.delete).mockResolvedValue({} as any);

      await deleteClient(clientId, userId);

      expect(prisma.client.findUnique).toHaveBeenCalledWith({
        where: { id: clientId },
        select: { name: true },
      });

      expect(prisma.activityLog.create).toHaveBeenCalledWith({
        data: {
          userId,
          entityType: "client",
          entityId: clientId,
          clientId: clientId,
          action: "deleted",
          metadata: { clientName: mockClient.name },
        },
      });

      expect(prisma.client.delete).toHaveBeenCalledWith({
        where: { id: clientId },
      });
    });

    it("should throw error if client not found", async () => {
      vi.mocked(prisma.client.findUnique).mockResolvedValue(null);

      await expect(deleteClient("non-existent", "user-123")).rejects.toThrow(
        "Client not found"
      );

      expect(prisma.client.delete).not.toHaveBeenCalled();
    });
  });
});
