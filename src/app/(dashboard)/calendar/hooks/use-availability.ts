import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookingSlotInfo } from "@/types/booking";
import { toast } from "sonner";

interface AvailabilityCheckParams {
  hostId: string;
  startTime: Date;
  endTime: Date;
}

interface AvailableSlotsParams {
  hostId: string;
  date: Date;
  duration?: number;
}

export function useCheckAvailability() {
  return useMutation({
    mutationFn: async (params: AvailabilityCheckParams) => {
      const response = await fetch("/api/bookings/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostId: params.hostId,
          startTime: params.startTime.toISOString(),
          endTime: params.endTime.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to check availability");
      }

      return response.json();
    },
  });
}

export function useAvailableSlots(params: AvailableSlotsParams | null) {
  const queryParams = new URLSearchParams();

  if (params) {
    queryParams.append("hostId", params.hostId);
    queryParams.append("date", params.date.toISOString());
    if (params.duration) {
      queryParams.append("duration", params.duration.toString());
    }
  }

  return useQuery<{
    slots: BookingSlotInfo[];
    date: string;
    duration: number;
    hostId: string;
  }>({
    queryKey: ["available-slots", params],
    queryFn: async () => {
      const response = await fetch(`/api/bookings/slots?${queryParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch available slots");
      }
      return response.json();
    },
    enabled: !!params,
  });
}

// Hook for managing user availability settings
export function useAvailability(userId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["availability", userId],
    queryFn: async () => {
      const response = await fetch(`/api/availability?userId=${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch availability");
      }
      return response.json();
    },
    enabled: !!userId,
  });

  const updateAvailability = useMutation({
    mutationFn: async (slots: any) => {
      const response = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          slots: slots,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update availability");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability", userId] });
      queryClient.invalidateQueries({ queryKey: ["available-slots"] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    updateAvailability,
  };
}
