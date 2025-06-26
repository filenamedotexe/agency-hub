import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BookingWithRelations,
  CreateBookingInput,
  UpdateBookingInput,
} from "@/types/booking";
import type { BookingStatus } from "@prisma/client";

interface UseBookingsOptions {
  startDate?: Date;
  endDate?: Date;
  status?: BookingStatus;
  clientId?: string;
}

export function useBookings(options: UseBookingsOptions = {}) {
  const queryParams = new URLSearchParams();

  if (options.startDate) {
    queryParams.append("startDate", options.startDate.toISOString());
  }
  if (options.endDate) {
    queryParams.append("endDate", options.endDate.toISOString());
  }
  if (options.status) {
    queryParams.append("status", options.status);
  }
  if (options.clientId) {
    queryParams.append("clientId", options.clientId);
  }

  return useQuery<BookingWithRelations[]>({
    queryKey: ["bookings", options],
    queryFn: async () => {
      const response = await fetch(`/api/bookings?${queryParams}`);
      if (!response.ok) {
        // Return empty array on error to prevent infinite loading
        console.error("Failed to fetch bookings:", response.status);
        return [];
      }
      return response.json();
    },
    retry: 1,
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}

export function useBooking(id: string) {
  return useQuery<BookingWithRelations>({
    queryKey: ["bookings", id],
    queryFn: async () => {
      const response = await fetch(`/api/bookings/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch booking");
      }
      return response.json();
    },
    enabled: !!id,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBookingInput) => {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create booking");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Booking created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateBookingInput;
    }) => {
      const response = await fetch(`/api/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update booking");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", variables.id] });
      toast.success("Booking updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const response = await fetch(`/api/bookings/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel booking");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", variables.id] });
      toast.success("Booking cancelled successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
