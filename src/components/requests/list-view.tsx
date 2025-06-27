"use client";

import {
  Calendar,
  MessageSquare,
  Building2,
  Clock,
  FileX2,
} from "lucide-react";
import { ResponsiveDataTable } from "@/components/ui/responsive-table";
import { Badge } from "@/components/ui/badge";
import { MotionBadge } from "@/components/ui/motion-elements";
import { MotionButton } from "@/components/ui/motion-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Request, RequestStatus } from "@/types/requests";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { EnhancedCard } from "@/components/ui/enhanced-card";

interface ListViewProps {
  requests: Request[];
  onUpdateStatus: (requestId: string, status: RequestStatus) => Promise<void>;
  onViewRequest: (request: Request) => void;
  isLoading?: boolean;
}

const statusColors = {
  TO_DO: "bg-slate-100 text-slate-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  DONE: "bg-green-100 text-green-800",
};

const statusLabels = {
  TO_DO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

export function ListView({
  requests,
  onUpdateStatus,
  onViewRequest,
  isLoading = false,
}: ListViewProps) {
  const handleStatusChange = async (requestId: string, newStatus: string) => {
    await onUpdateStatus(requestId, newStatus as RequestStatus);
  };

  if (isLoading) {
    return (
      <EnhancedCard>
        <div className="space-y-3 p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </EnhancedCard>
    );
  }

  if (requests.length === 0) {
    return (
      <EnhancedCard>
        <EmptyState
          icon={<FileX2 className="h-8 w-8" />}
          title="No requests found"
          description="Requests will appear here when they are created."
        />
      </EnhancedCard>
    );
  }

  return (
    <EnhancedCard className="overflow-hidden">
      <ResponsiveDataTable
        columns={[
          {
            key: "description",
            label: "Description",
            priority: "high",
            renderCell: (value) => <p className="line-clamp-2">{value}</p>,
          },
          {
            key: "client",
            label: "Client",
            priority: "high",
            renderCell: (_, request) => (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">
                  {request.client?.businessName || request.client?.name}
                </span>
              </div>
            ),
          },
          {
            key: "status",
            label: "Status",
            priority: "high",
            renderCell: (value, request) => (
              <Select
                value={value}
                onValueChange={(newValue) => {
                  handleStatusChange(request.id, newValue);
                }}
              >
                <SelectTrigger
                  className="w-32"
                  onClick={(e) => e.stopPropagation()}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TO_DO">
                    <MotionBadge className={`${statusColors.TO_DO} border-0`}>
                      To Do
                    </MotionBadge>
                  </SelectItem>
                  <SelectItem value="IN_PROGRESS">
                    <MotionBadge
                      className={`${statusColors.IN_PROGRESS} border-0`}
                    >
                      In Progress
                    </MotionBadge>
                  </SelectItem>
                  <SelectItem value="DONE">
                    <MotionBadge className={`${statusColors.DONE} border-0`}>
                      Done
                    </MotionBadge>
                  </SelectItem>
                </SelectContent>
              </Select>
            ),
          },
          {
            key: "createdAt",
            label: "Created",
            priority: "medium",
            renderCell: (value, request) => (
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDistanceToNow(new Date(value), {
                    addSuffix: true,
                  })}
                </div>
                {request.completedAt && request.status === "DONE" && (
                  <div className="mt-1 flex items-center gap-2 text-xs text-green-600">
                    <Clock className="h-3 w-3" />
                    Completed{" "}
                    {formatDistanceToNow(new Date(request.completedAt), {
                      addSuffix: true,
                    })}
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "comments",
            label: "Comments",
            priority: "low",
            renderCell: (value) =>
              value && value.length > 0 ? (
                <MotionBadge variant="outline">
                  <MessageSquare className="mr-1 h-3 w-3" />
                  {value.length}
                </MotionBadge>
              ) : (
                <span className="text-muted-foreground">-</span>
              ),
          },
          {
            key: "actions",
            label: "Actions",
            priority: "high",
            renderCell: (_, request) => (
              <MotionButton
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewRequest(request);
                }}
              >
                View
              </MotionButton>
            ),
          },
        ]}
        data={requests}
        onRowClick={onViewRequest}
      />
    </EnhancedCard>
  );
}
