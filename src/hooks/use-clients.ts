import { useQuery } from "@tanstack/react-query";
import { Client } from "@prisma/client";
import { useAuth } from "@/components/providers/auth-provider";

interface ClientsResponse {
  data: Client[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export function useClients() {
  const { user, isLoading: isAuthLoading } = useAuth();

  return useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      const response = await fetch("/api/clients?pageSize=100");
      if (!response.ok) {
        throw new Error("Failed to fetch clients");
      }
      const result: ClientsResponse = await response.json();
      return result.data || [];
    },
    enabled: !!user && !isAuthLoading, // Only run when authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
