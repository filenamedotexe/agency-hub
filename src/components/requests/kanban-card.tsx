"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, MessageSquare, Building2 } from "lucide-react";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MotionBadge } from "@/components/ui/motion-elements";
import { Request } from "@/types/requests";
import { formatDistanceToNow } from "date-fns";

interface KanbanCardProps {
  request: Request;
  onView?: () => void;
  isDragging?: boolean;
}

export function KanbanCard({ request, onView, isDragging }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isCurrentlyDragging,
  } = useDraggable({
    id: request.id,
    data: {
      type: "request",
      request,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  if (isDragging) {
    return (
      <EnhancedCard className="cursor-grabbing opacity-50">
        <CardContent className="p-4">
          <p className="text-sm">{request.description}</p>
        </CardContent>
      </EnhancedCard>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none"
    >
      <EnhancedCard
        className={`cursor-grab transition-shadow hover:shadow-md ${isCurrentlyDragging ? "opacity-50" : ""}`}
        onClick={() => {
          if (!isCurrentlyDragging && onView) {
            onView();
          }
        }}
        data-testid="request-card"
      >
        <CardContent className="space-y-3 p-4">
          <p className="line-clamp-2 text-sm">{request.description}</p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" />
            <span className="truncate">
              {request.client?.businessName || request.client?.name}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {formatDistanceToNow(new Date(request.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>

            {request.comments && request.comments.length > 0 && (
              <MotionBadge variant="outline" className="px-1.5 py-0 text-xs">
                <MessageSquare className="mr-1 h-3 w-3" />
                {request.comments.length}
              </MotionBadge>
            )}
          </div>

          {request.completedAt && request.status === "DONE" && (
            <div className="text-xs text-green-600">
              Completed{" "}
              {formatDistanceToNow(new Date(request.completedAt), {
                addSuffix: true,
              })}
            </div>
          )}
        </CardContent>
      </EnhancedCard>
    </div>
  );
}
