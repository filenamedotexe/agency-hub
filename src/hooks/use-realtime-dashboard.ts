import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useRealtimeDashboard() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to changes in clients table
    const clientsChannel = supabase
      .channel("dashboard-clients")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clients",
        },
        () => {
          // Invalidate and refetch dashboard stats
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        }
      )
      .subscribe();

    // Subscribe to changes in services table
    const servicesChannel = supabase
      .channel("dashboard-services")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "services",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        }
      )
      .subscribe();

    // Subscribe to changes in requests table
    const requestsChannel = supabase
      .channel("dashboard-requests")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requests",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        }
      )
      .subscribe();

    // Subscribe to activity logs for real-time activity feed
    const activityChannel = supabase
      .channel("dashboard-activity")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_logs",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(clientsChannel);
      supabase.removeChannel(servicesChannel);
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(activityChannel);
    };
  }, [queryClient, supabase]);
}
