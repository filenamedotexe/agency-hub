"use client";

import { useDroppable } from "@dnd-kit/core";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Request, RequestStatus } from "@/types/requests";
import { KanbanCard } from "./kanban-card";
import { Skeleton } from "@/components/ui/skeleton";

interface KanbanColumnProps {
  id: RequestStatus;
  title: string;
  requests: Request[];
  onViewRequest: (request: Request) => void;
  isLoading?: boolean;
}

export function KanbanColumn({
  id,
  title,
  requests,
  onViewRequest,
  isLoading = false,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: "column",
      status: id,
    },
  });

  const getColumnColor = () => {
    switch (id) {
      case "TO_DO":
        return "border-slate-200 bg-slate-50";
      case "IN_PROGRESS":
        return "border-blue-200 bg-blue-50";
      case "DONE":
        return "border-green-200 bg-green-50";
      default:
        return "";
    }
  };

  return (
    <div
      ref={setNodeRef}
      className="flex h-full flex-col"
      role="region"
      aria-label={title}
    >
      <EnhancedCard
        className={`flex-1 ${getColumnColor()} ${isOver ? "ring-2 ring-blue-500" : ""}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">{title}</CardTitle>
            {!isLoading && <Badge variant="secondary">{requests.length}</Badge>}
          </div>
        </CardHeader>
        <CardContent className="min-h-[200px] space-y-3">
          {isLoading ? (
            <>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </>
          ) : (
            <>
              {requests.map((request) => (
                <KanbanCard
                  key={request.id}
                  request={request}
                  onView={() => onViewRequest(request)}
                />
              ))}

              {requests.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No requests
                </div>
              )}
            </>
          )}
        </CardContent>
      </EnhancedCard>
    </div>
  );
}
