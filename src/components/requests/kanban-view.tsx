"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Request, RequestStatus } from "@/types/requests";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { EmptyState } from "@/components/ui/empty-state";
import { LayoutGrid } from "lucide-react";

interface KanbanViewProps {
  requests: Request[];
  onUpdateStatus: (requestId: string, status: RequestStatus) => Promise<void>;
  onViewRequest: (request: Request) => void;
  isLoading?: boolean;
}

const columns: { id: RequestStatus; title: string }[] = [
  { id: "TO_DO", title: "To Do" },
  { id: "IN_PROGRESS", title: "In Progress" },
  { id: "DONE", title: "Done" },
];

export function KanbanView({
  requests,
  onUpdateStatus,
  onViewRequest,
  isLoading = false,
}: KanbanViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over ? (over.id as string) : null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      setOverId(null);
      return;
    }

    const activeRequest = requests.find((r) => r.id === active.id);

    // Check if we're dropping on a column
    const validStatuses = ["TO_DO", "IN_PROGRESS", "DONE"];
    const overId = over.id as string;

    if (activeRequest && validStatuses.includes(overId)) {
      const newStatus = overId as RequestStatus;
      if (activeRequest.status !== newStatus) {
        console.log(
          `Moving request ${activeRequest.id} from ${activeRequest.status} to ${newStatus}`
        );
        try {
          await onUpdateStatus(activeRequest.id, newStatus);
        } catch (error) {
          console.error("Error updating request status:", error);
        }
      }
    }

    setActiveId(null);
    setOverId(null);
  };

  const activeRequest = activeId
    ? requests.find((r) => r.id === activeId)
    : null;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            requests={[]}
            onViewRequest={onViewRequest}
            isLoading
          />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={<LayoutGrid className="h-8 w-8" />}
        title="No requests yet"
        description="Requests will appear here when they are created."
      />
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            requests={requests.filter((r) => r.status === column.id)}
            onViewRequest={onViewRequest}
          />
        ))}
      </div>

      <DragOverlay>
        {activeRequest ? (
          <KanbanCard request={activeRequest} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
