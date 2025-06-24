"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Circle,
  Clock,
  Eye,
  EyeOff,
  Calendar,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
  Paperclip,
  CheckSquare,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AttachmentManager } from "@/components/features/attachment-manager";

interface Task {
  id: string;
  name: string;
  description: string | null;
  status: "TO_DO" | "IN_PROGRESS" | "DONE";
  dueDate: string | null;
  clientVisible: boolean;
  checklist?: Array<{
    id: string;
    text: string;
    completed: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface ServiceTasksProps {
  serviceId: string;
  clientName: string;
  serviceName: string;
  isReadOnly?: boolean;
}

const statusConfig = {
  TO_DO: {
    icon: Circle,
    label: "To Do",
    color: "text-gray-500",
    bgColor: "bg-gray-100",
  },
  IN_PROGRESS: {
    icon: Clock,
    label: "In Progress",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  DONE: {
    icon: CheckCircle2,
    label: "Done",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
};

export function ServiceTasks({
  serviceId,
  clientName,
  serviceName,
  isReadOnly = false,
}: ServiceTasksProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [attachmentCounts, setAttachmentCounts] = useState<
    Record<string, number>
  >({});
  const [newTask, setNewTask] = useState({
    name: "",
    description: "",
    dueDate: "",
    clientVisible: false,
  });
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["service-tasks", serviceId],
    queryFn: async () => {
      const response = await fetch(`/api/services/${serviceId}/tasks`);
      if (!response.ok) throw new Error("Failed to fetch tasks");
      return response.json();
    },
  });

  // Fetch attachment counts for all tasks
  useQuery({
    queryKey: ["task-attachment-counts", serviceId],
    queryFn: async () => {
      if (tasks.length === 0) return {};

      const counts: Record<string, number> = {};
      for (const task of tasks) {
        const response = await fetch(
          `/api/attachments?entityType=task&entityId=${task.id}`
        );
        if (response.ok) {
          const attachments = await response.json();
          counts[task.id] = attachments.length;
        }
      }
      setAttachmentCounts(counts);
      return counts;
    },
    enabled: tasks.length > 0,
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: any }) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-tasks", serviceId] });
      queryClient.invalidateQueries({ queryKey: ["client-services"] });
      toast.success("Task updated successfully");
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/services/${serviceId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-tasks", serviceId] });
      queryClient.invalidateQueries({ queryKey: ["client-services"] });
      setIsAddingTask(false);
      setNewTask({
        name: "",
        description: "",
        dueDate: "",
        clientVisible: false,
      });
      toast.success("Task created successfully");
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-tasks", serviceId] });
      queryClient.invalidateQueries({ queryKey: ["client-services"] });
      toast.success("Task deleted successfully");
    },
  });

  const handleStatusChange = async (
    taskId: string,
    newStatus: Task["status"]
  ) => {
    await updateTaskMutation.mutateAsync({
      taskId,
      data: { status: newStatus },
    });
  };

  const handleVisibilityToggle = async (
    taskId: string,
    clientVisible: boolean
  ) => {
    await updateTaskMutation.mutateAsync({ taskId, data: { clientVisible } });
  };

  const handleChecklistUpdate = async (
    taskId: string,
    checklist: Array<{ id: string; text: string; completed: boolean }>
  ) => {
    // Check if all checklist items are completed
    const allCompleted =
      checklist.length > 0 && checklist.every((item) => item.completed);

    // Update the checklist
    await updateTaskMutation.mutateAsync({ taskId, data: { checklist } });

    // If all items are completed and task is not already done, show toast
    if (allCompleted) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== "DONE") {
        toast.success(
          "All checklist items completed! Should we mark this task as done?",
          {
            action: {
              label: "Mark Done",
              onClick: () => handleStatusChange(taskId, "DONE"),
            },
            duration: 10000, // Show for 10 seconds
          }
        );
      }
    }
  };

  const handleCreateTask = async () => {
    await createTaskMutation.mutateAsync({
      ...newTask,
      dueDate: newTask.dueDate || null,
    });
  };

  const completedTasks = tasks.filter((task) => task.status === "DONE").length;
  const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  if (isLoading) {
    return <div className="p-4">Loading tasks...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          Tasks ({completedTasks}/{tasks.length})
        </button>
        {!isReadOnly && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddingTask(true)}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Task
          </Button>
        )}
      </div>

      {isExpanded && (
        <>
          {/* Progress bar */}
          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-green-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Task list */}
          <div className="space-y-2">
            {tasks.map((task) => {
              const status = statusConfig[task.status];
              const StatusIcon = status.icon;

              return (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3 transition-all",
                    task.status === "DONE" && "opacity-60"
                  )}
                >
                  {!isReadOnly ? (
                    <button
                      onClick={() => {
                        const nextStatus =
                          task.status === "TO_DO"
                            ? "IN_PROGRESS"
                            : task.status === "IN_PROGRESS"
                              ? "DONE"
                              : "TO_DO";
                        handleStatusChange(task.id, nextStatus);
                      }}
                      className={cn(
                        "mt-0.5 transition-colors",
                        status.color,
                        "hover:opacity-80"
                      )}
                    >
                      <StatusIcon className="h-5 w-5" />
                    </button>
                  ) : (
                    <StatusIcon
                      className={cn("mt-0.5 h-5 w-5", status.color)}
                    />
                  )}

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4
                          className={cn(
                            "font-medium",
                            task.status === "DONE" && "line-through"
                          )}
                        >
                          {task.name}
                        </h4>
                        {task.description && (
                          <p className="mt-1 text-sm text-gray-600">
                            {task.description}
                          </p>
                        )}

                        {/* Checklist (not visible to clients) */}
                        {task.checklist &&
                          task.checklist.length > 0 &&
                          !isReadOnly && (
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <CheckSquare className="h-4 w-4" />
                                <span className="font-medium">
                                  Checklist (
                                  {
                                    task.checklist.filter(
                                      (item) => item.completed
                                    ).length
                                  }
                                  /{task.checklist.length})
                                </span>
                              </div>
                              <div className="space-y-1 pl-6">
                                {task.checklist.map((item, index) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center gap-2"
                                  >
                                    <button
                                      onClick={() => {
                                        const updatedChecklist = [
                                          ...task.checklist!,
                                        ];
                                        updatedChecklist[index] = {
                                          ...item,
                                          completed: !item.completed,
                                        };
                                        handleChecklistUpdate(
                                          task.id,
                                          updatedChecklist
                                        );
                                      }}
                                      className="text-gray-500 hover:text-gray-700"
                                    >
                                      {item.completed ? (
                                        <CheckSquare className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <Square className="h-4 w-4" />
                                      )}
                                    </button>
                                    <span
                                      className={cn(
                                        "text-sm",
                                        item.completed &&
                                          "text-gray-500 line-through"
                                      )}
                                    >
                                      {item.text}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        <div className="mt-2 flex items-center gap-4">
                          {task.dueDate && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(task.dueDate), "MMM d, yyyy")}
                            </div>
                          )}
                          <Badge variant="secondary" className={status.bgColor}>
                            {status.label}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setExpandedTaskId(
                              expandedTaskId === task.id ? null : task.id
                            )
                          }
                          className="text-gray-500 hover:text-gray-700"
                          title="Manage attachments"
                        >
                          <Paperclip className="h-4 w-4" />
                          {attachmentCounts[task.id] > 0 && (
                            <span className="ml-1 text-xs">
                              ({attachmentCounts[task.id]})
                            </span>
                          )}
                        </button>
                        {!isReadOnly && (
                          <>
                            <button
                              onClick={() =>
                                handleVisibilityToggle(
                                  task.id,
                                  !task.clientVisible
                                )
                              }
                              className="text-gray-500 hover:text-gray-700"
                              title={
                                task.clientVisible
                                  ? "Visible to client"
                                  : "Hidden from client"
                              }
                            >
                              {task.clientVisible ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => deleteTaskMutation.mutate(task.id)}
                              className="text-red-500 hover:text-red-700"
                              title="Delete task"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Attachment Manager */}
                    {expandedTaskId === task.id && (
                      <div className="mt-4 border-t pt-4">
                        <AttachmentManager
                          entityType="task"
                          entityId={task.id}
                          canDelete={!isReadOnly}
                          canUpload={!isReadOnly}
                          multiple={true}
                          maxFiles={5}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add Task Dialog */}
      <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="task-name">Task Name</Label>
              <Input
                id="task-name"
                value={newTask.name}
                onChange={(e) =>
                  setNewTask({ ...newTask, name: e.target.value })
                }
                placeholder="Enter task name"
              />
            </div>
            <div>
              <Label htmlFor="task-description">Description (optional)</Label>
              <Textarea
                id="task-description"
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
                placeholder="Enter task description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="task-due-date">Due Date (optional)</Label>
              <Input
                id="task-due-date"
                type="date"
                value={newTask.dueDate}
                onChange={(e) =>
                  setNewTask({ ...newTask, dueDate: e.target.value })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="client-visible"
                checked={newTask.clientVisible}
                onCheckedChange={(checked) =>
                  setNewTask({ ...newTask, clientVisible: checked })
                }
              />
              <Label htmlFor="client-visible">Visible to client</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingTask(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={!newTask.name || createTaskMutation.isPending}
            >
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
