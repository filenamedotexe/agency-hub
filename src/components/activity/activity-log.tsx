"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Activity, User, Calendar, FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ActivityLog } from "@/services/activity.service";

interface ActivityLogProps {
  clientId?: string;
  limit?: number;
  className?: string;
}

export function ActivityLogComponent({
  clientId,
  limit = 10,
  className,
}: ActivityLogProps) {
  const { data: activities, isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["activity-logs", { clientId, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (clientId) params.append("clientId", clientId);
      params.append("limit", limit.toString());

      const response = await fetch(`/api/activity-logs?${params}`);
      if (!response.ok) throw new Error("Failed to fetch activity logs");
      return response.json();
    },
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case "created":
        return <FileText className="h-4 w-4" />;
      case "updated":
        return <Activity className="h-4 w-4" />;
      case "deleted":
        return <Calendar className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActionMessage = (activity: ActivityLog) => {
    const { action, entityType, metadata } = activity;

    switch (entityType) {
      case "client":
        switch (action) {
          case "created":
            return `created client "${metadata?.clientName || "Unknown"}"`;
          case "updated":
            return `updated client information`;
          case "deleted":
            return `deleted client "${metadata?.clientName || "Unknown"}"`;
          default:
            return `performed ${action} on client`;
        }
      default:
        return `${action} ${entityType}`;
    }
  };

  if (isLoading) {
    return (
      <EnhancedCard className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Log
          </CardTitle>
          <CardDescription>Recent activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </EnhancedCard>
    );
  }

  return (
    <EnhancedCard className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Log
        </CardTitle>
        <CardDescription>Recent activity</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {activities && activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="group -mx-2 flex cursor-pointer items-start gap-3 rounded-md p-2 transition-all duration-base hover:bg-gray-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted transition-all duration-base group-hover:bg-brand-primary-light group-hover:text-brand-primary">
                    {getActionIcon(activity.action)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user.email}</span>{" "}
                      {getActionMessage(activity)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No activity yet</p>
          )}
        </ScrollArea>
      </CardContent>
    </EnhancedCard>
  );
}
