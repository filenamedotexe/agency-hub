import { describe, it, expect } from "vitest";
import { Request, RequestStatus } from "@/types/requests";

// Helper function that mirrors the filtering logic from the requests page
function filterRequests(
  requests: Request[],
  searchQuery: string,
  statusFilter: RequestStatus | "ALL",
  clientFilter: string
): Request[] {
  let filtered = [...requests];

  // Apply search filter
  if (searchQuery) {
    filtered = filtered.filter(
      (request) =>
        request.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.comments?.some((comment) =>
          comment.text.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
  }

  // Apply status filter
  if (statusFilter !== "ALL") {
    filtered = filtered.filter((request) => request.status === statusFilter);
  }

  // Apply client filter
  if (clientFilter !== "ALL") {
    filtered = filtered.filter((request) => request.clientId === clientFilter);
  }

  return filtered;
}

describe("Request Filtering", () => {
  const mockRequests: Request[] = [
    {
      id: "1",
      clientId: "client-1",
      description: "Fix navigation bug",
      status: "TO_DO",
      clientVisible: false,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
      comments: [
        {
          id: "comment-1",
          requestId: "1",
          text: "This is urgent",
          isDeleted: false,
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
        },
      ],
    },
    {
      id: "2",
      clientId: "client-2",
      description: "Add search feature",
      status: "IN_PROGRESS",
      clientVisible: true,
      createdAt: "2024-01-02",
      updatedAt: "2024-01-02",
      comments: [],
    },
    {
      id: "3",
      clientId: "client-1",
      description: "Update footer",
      status: "DONE",
      clientVisible: false,
      createdAt: "2024-01-03",
      updatedAt: "2024-01-03",
      completedAt: "2024-01-04",
      comments: [
        {
          id: "comment-2",
          requestId: "3",
          text: "Search functionality improved",
          isDeleted: false,
          createdAt: "2024-01-03",
          updatedAt: "2024-01-03",
        },
      ],
    },
  ];

  describe("Search functionality", () => {
    it("should filter by description", () => {
      const results = filterRequests(mockRequests, "navigation", "ALL", "ALL");
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("1");
    });

    it("should filter by comment text", () => {
      const results = filterRequests(mockRequests, "urgent", "ALL", "ALL");
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("1");
    });

    it("should find requests with search term in comments", () => {
      const results = filterRequests(mockRequests, "search", "ALL", "ALL");
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.id)).toContain("2");
      expect(results.map((r) => r.id)).toContain("3");
    });

    it("should be case insensitive", () => {
      const results = filterRequests(mockRequests, "NAVIGATION", "ALL", "ALL");
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("1");
    });

    it("should return empty array for non-matching search", () => {
      const results = filterRequests(mockRequests, "nonexistent", "ALL", "ALL");
      expect(results).toHaveLength(0);
    });
  });

  describe("Status filtering", () => {
    it("should filter by TO_DO status", () => {
      const results = filterRequests(mockRequests, "", "TO_DO", "ALL");
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe("TO_DO");
    });

    it("should filter by IN_PROGRESS status", () => {
      const results = filterRequests(mockRequests, "", "IN_PROGRESS", "ALL");
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe("IN_PROGRESS");
    });

    it("should filter by DONE status", () => {
      const results = filterRequests(mockRequests, "", "DONE", "ALL");
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe("DONE");
    });

    it("should return all requests when status is ALL", () => {
      const results = filterRequests(mockRequests, "", "ALL", "ALL");
      expect(results).toHaveLength(3);
    });
  });

  describe("Client filtering", () => {
    it("should filter by specific client", () => {
      const results = filterRequests(mockRequests, "", "ALL", "client-1");
      expect(results).toHaveLength(2);
      expect(results.every((r) => r.clientId === "client-1")).toBe(true);
    });

    it("should return all requests when client is ALL", () => {
      const results = filterRequests(mockRequests, "", "ALL", "ALL");
      expect(results).toHaveLength(3);
    });

    it("should return empty array for non-existent client", () => {
      const results = filterRequests(mockRequests, "", "ALL", "client-999");
      expect(results).toHaveLength(0);
    });
  });

  describe("Combined filters", () => {
    it("should apply search and status filters together", () => {
      const results = filterRequests(
        mockRequests,
        "search",
        "IN_PROGRESS",
        "ALL"
      );
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("2");
    });

    it("should apply search and client filters together", () => {
      const results = filterRequests(mockRequests, "footer", "ALL", "client-1");
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("3");
    });

    it("should apply all three filters together", () => {
      const results = filterRequests(
        mockRequests,
        "search",
        "DONE",
        "client-1"
      );
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("3");
    });

    it("should return empty when combined filters match nothing", () => {
      const results = filterRequests(
        mockRequests,
        "navigation",
        "DONE",
        "client-2"
      );
      expect(results).toHaveLength(0);
    });
  });

  describe("Edge cases", () => {
    it("should handle requests without comments", () => {
      const results = filterRequests(mockRequests, "feature", "ALL", "ALL");
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("2");
    });

    it("should handle empty search query", () => {
      const results = filterRequests(mockRequests, "", "ALL", "ALL");
      expect(results).toHaveLength(3);
    });

    it("should handle deleted comments", () => {
      const requestsWithDeletedComment = [...mockRequests];
      requestsWithDeletedComment[0].comments![0].isDeleted = true;

      // Should still find the request by description
      const results = filterRequests(
        requestsWithDeletedComment,
        "navigation",
        "ALL",
        "ALL"
      );
      expect(results).toHaveLength(1);
    });
  });
});
