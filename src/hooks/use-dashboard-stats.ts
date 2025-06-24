import { useQuery } from "@tanstack/react-query";

export interface DashboardStats {
  overview: {
    totalClients: number;
    totalServices: number;
    activeServices: number;
    completedServices: number;
    totalRequests: number;
    pendingRequests: number;
    inProgressRequests: number;
  };
  trends: {
    newClientsThisWeek: number;
    completedServicesThisWeek: number;
    completedRequestsThisWeek: number;
  };
  servicesByStatus: Array<{
    status: string;
    count: number;
  }>;
  requestsByStatus: Array<{
    status: string;
    count: number;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    user: {
      email: string;
      role: string;
    };
    client: {
      name: string;
      businessName: string;
    } | null;
    metadata: any;
    createdAt: string;
  }>;
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds for near real-time updates
  });
}
