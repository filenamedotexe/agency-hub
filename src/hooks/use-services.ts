import { useQuery } from "@tanstack/react-query";
import { Service } from "@prisma/client";

interface UseServicesOptions {
  clientId?: string;
}

export function useServices(options: UseServicesOptions = {}) {
  const { clientId } = options;

  return useQuery<Service[]>({
    queryKey: ["services", clientId],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (clientId) {
        searchParams.append("clientId", clientId);
      }

      const response = await fetch(`/api/services?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }
      return response.json();
    },
    enabled: true, // Always enabled
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
