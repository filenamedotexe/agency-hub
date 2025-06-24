import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Request } from "@/types/requests";
import { toast } from "sonner";

interface UseRealtimeRequestsProps {
  onRequestCreated?: (request: Request) => void;
  onRequestUpdated?: (request: Request) => void;
  onRequestDeleted?: (requestId: string) => void;
  onCommentAdded?: (requestId: string) => void;
}

export function useRealtimeRequests({
  onRequestCreated,
  onRequestUpdated,
  onRequestDeleted,
  onCommentAdded,
}: UseRealtimeRequestsProps) {
  useEffect(() => {
    const supabase = createClient();

    // Subscribe to requests table changes
    const requestsChannel = supabase
      .channel("requests-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "requests",
        },
        (payload) => {
          const newRequest = payload.new as Request;
          toast.info("New request created");
          onRequestCreated?.(newRequest);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "requests",
        },
        (payload) => {
          const updatedRequest = payload.new as Request;
          onRequestUpdated?.(updatedRequest);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "requests",
        },
        (payload) => {
          const deletedRequest = payload.old as { id: string };
          onRequestDeleted?.(deletedRequest.id);
        }
      )
      .subscribe();

    // Subscribe to comments table changes
    const commentsChannel = supabase
      .channel("comments-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "request_comments",
        },
        (payload) => {
          const newComment = payload.new as { requestId: string };
          onCommentAdded?.(newComment.requestId);
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [onRequestCreated, onRequestUpdated, onRequestDeleted, onCommentAdded]);
}
