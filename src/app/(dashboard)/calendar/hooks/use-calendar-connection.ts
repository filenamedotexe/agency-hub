import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface CalendarStatus {
  connected: boolean;
  email?: string;
  syncEnabled?: boolean;
  provider?: string;
  connectedAt?: string;
  isExpired?: boolean;
}

export function useCalendarConnection() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Check calendar connection status
  const { data: status, isLoading } = useQuery<CalendarStatus>({
    queryKey: ["calendar-status"],
    queryFn: async () => {
      const response = await fetch("/api/calendar/status");
      if (!response.ok) {
        // Return disconnected status on error
        console.error("Failed to check calendar status:", response.status);
        return { connected: false };
      }
      return response.json();
    },
    retry: 1,
    staleTime: 30000,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Connect calendar mutation
  const connectMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/calendar/connect");
      if (!response.ok) {
        throw new Error("Failed to start calendar connection");
      }
      const data = await response.json();
      return data.authUrl;
    },
    onSuccess: (authUrl) => {
      // Redirect to Google OAuth
      window.location.href = authUrl;
    },
    onError: () => {
      toast.error("Failed to connect calendar");
    },
  });

  // Disconnect calendar mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/calendar/disconnect", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to disconnect calendar");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-status"] });
      toast.success("Calendar disconnected successfully");
    },
    onError: () => {
      toast.error("Failed to disconnect calendar");
    },
  });

  return {
    status,
    isLoading,
    connect: connectMutation.mutate,
    disconnect: disconnectMutation.mutate,
    isConnecting: connectMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
  };
}
