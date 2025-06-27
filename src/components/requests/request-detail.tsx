"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  X,
  MessageSquare,
  Send,
  Calendar,
  Clock,
  Building2,
  Eye,
  EyeOff,
} from "lucide-react";
import { MotionButton } from "@/components/ui/motion-button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Request, RequestStatus } from "@/types/requests";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { Skeleton } from "@/components/ui/skeleton";

interface RequestDetailProps {
  request: Request | null;
  open: boolean;
  onClose: () => void;
  onUpdateStatus: (requestId: string, status: RequestStatus) => Promise<void>;
  onUpdateVisibility?: (
    requestId: string,
    clientVisible: boolean
  ) => Promise<void>;
  onAddComment?: (requestId: string, text: string) => Promise<void>;
  isLoading?: boolean;
}

const statusColors = {
  TO_DO: "bg-slate-100 text-slate-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  DONE: "bg-green-100 text-green-800",
};

export function RequestDetail({
  request,
  open,
  onClose,
  onUpdateStatus,
  onUpdateVisibility,
  onAddComment,
  isLoading = false,
}: RequestDetailProps) {
  const [newComment, setNewComment] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);

  if (!request && !isLoading) return null;

  const handleAddComment = async () => {
    if (!newComment.trim() || !onAddComment || !request) return;

    setIsAddingComment(true);
    try {
      await onAddComment(request.id, newComment);
      setNewComment("");
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!request) return;
    await onUpdateStatus(request.id, newStatus as RequestStatus);
  };

  const handleVisibilityChange = async (checked: boolean) => {
    if (onUpdateVisibility && request) {
      await onUpdateVisibility(request.id, checked);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Request Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 space-y-6 overflow-y-auto py-4">
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : request ? (
          <div className="flex-1 space-y-6 overflow-y-auto py-4">
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                  Description
                </h3>
                <p className="text-sm">{request.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                    Client
                  </h3>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4" />
                    <span>
                      {request.client?.businessName || request.client?.name}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                    Status
                  </h3>
                  <Select
                    value={request.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TO_DO">
                        <Badge className={`${statusColors.TO_DO} border-0`}>
                          To Do
                        </Badge>
                      </SelectItem>
                      <SelectItem value="IN_PROGRESS">
                        <Badge
                          className={`${statusColors.IN_PROGRESS} border-0`}
                        >
                          In Progress
                        </Badge>
                      </SelectItem>
                      <SelectItem value="DONE">
                        <Badge className={`${statusColors.DONE} border-0`}>
                          Done
                        </Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <EnhancedCard className="bg-muted/50">
                <div className="flex items-center justify-between p-3">
                  <Label
                    htmlFor="client-visible"
                    className="flex cursor-pointer items-center gap-2"
                  >
                    {request.clientVisible ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">
                      {request.clientVisible
                        ? "Visible to client"
                        : "Hidden from client"}
                    </span>
                  </Label>
                  <Switch
                    id="client-visible"
                    checked={request.clientVisible}
                    onCheckedChange={handleVisibilityChange}
                    disabled={!onUpdateVisibility}
                  />
                </div>
              </EnhancedCard>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                    Created
                  </h3>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(request.createdAt), "PPP")}</span>
                  </div>
                </div>

                {request.completedAt && (
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                      Completed
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Clock className="h-4 w-4" />
                      <span>
                        {format(new Date(request.completedAt), "PPP")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="h-4 w-4" />
                Comments ({request.comments?.length || 0})
              </h3>

              <div className="mb-4 space-y-3">
                {request.comments && request.comments.length > 0 ? (
                  request.comments.map((comment) => (
                    <EnhancedCard key={comment.id} className="bg-muted/50">
                      <div className="p-3">
                        <p className="text-sm">{comment.text}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {format(new Date(comment.createdAt), "PPp")}
                        </p>
                      </div>
                    </EnhancedCard>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No comments yet
                  </p>
                )}
              </div>

              {onAddComment && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <MotionButton
                    size="sm"
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isAddingComment}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {isAddingComment ? "Adding..." : "Add Comment"}
                  </MotionButton>
                </div>
              )}
            </div>

            {request.dudaData && (
              <>
                <Separator />
                <div>
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                    Duda Data
                  </h3>
                  <EnhancedCard className="bg-muted/50">
                    <pre className="overflow-x-auto p-3 text-xs">
                      {JSON.stringify(request.dudaData, null, 2)}
                    </pre>
                  </EnhancedCard>
                </div>
              </>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
