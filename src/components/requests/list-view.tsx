"use client";

import { Calendar, MessageSquare, Building2, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Request, RequestStatus } from "@/types/requests";
import { formatDistanceToNow } from "date-fns";

interface ListViewProps {
  requests: Request[];
  onUpdateStatus: (requestId: string, status: RequestStatus) => Promise<void>;
  onViewRequest: (request: Request) => void;
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
}: ListViewProps) {
  const handleStatusChange = async (requestId: string, newStatus: string) => {
    await onUpdateStatus(requestId, newStatus as RequestStatus);
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Comments</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id} className="cursor-pointer">
              <TableCell
                className="max-w-md"
                onClick={() => onViewRequest(request)}
              >
                <p className="line-clamp-2">{request.description}</p>
              </TableCell>
              <TableCell onClick={() => onViewRequest(request)}>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">
                    {request.client?.businessName || request.client?.name}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Select
                  value={request.status}
                  onValueChange={(value) =>
                    handleStatusChange(request.id, value)
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TO_DO">
                      <Badge className={`${statusColors.TO_DO} border-0`}>
                        To Do
                      </Badge>
                    </SelectItem>
                    <SelectItem value="IN_PROGRESS">
                      <Badge className={`${statusColors.IN_PROGRESS} border-0`}>
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
              </TableCell>
              <TableCell onClick={() => onViewRequest(request)}>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDistanceToNow(new Date(request.createdAt), {
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
              </TableCell>
              <TableCell onClick={() => onViewRequest(request)}>
                {request.comments && request.comments.length > 0 ? (
                  <Badge variant="outline">
                    <MessageSquare className="mr-1 h-3 w-3" />
                    {request.comments.length}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewRequest(request)}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {requests.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          No requests found
        </div>
      )}
    </div>
  );
}
