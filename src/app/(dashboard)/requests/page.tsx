"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  LayoutGrid,
  List,
  Eye,
  EyeOff,
  Search,
  Filter,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { MotionButton } from "@/components/ui/motion-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Request, RequestStatus } from "@/types/requests";
import { KanbanView } from "@/components/requests/kanban-view";
import { ListView } from "@/components/requests/list-view";
import { RequestDetail } from "@/components/requests/request-detail";
import { useRealtimeRequests } from "@/hooks/use-realtime-requests";

type ViewMode = "kanban" | "list";

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "ALL">(
    "ALL"
  );
  const [clientFilter, setClientFilter] = useState<string>("ALL");

  // New request form state
  const [clients, setClients] = useState<any[]>([]);
  const [newRequestData, setNewRequestData] = useState({
    clientId: "",
    description: "",
    clientVisible: false,
  });

  useEffect(() => {
    fetchRequests();
    fetchClients();
  }, []);

  // Set up realtime subscriptions
  useRealtimeRequests({
    onRequestCreated: (newRequest) => {
      // Add the new request to the list
      setRequests((prev) => [newRequest, ...prev]);
    },
    onRequestUpdated: (updatedRequest) => {
      // Update the request in the list
      setRequests((prev) =>
        prev.map((req) => (req.id === updatedRequest.id ? updatedRequest : req))
      );
      // Update selected request if it's the one being modified
      if (selectedRequest?.id === updatedRequest.id) {
        setSelectedRequest(updatedRequest);
      }
    },
    onRequestDeleted: (requestId) => {
      // Remove the request from the list
      setRequests((prev) => prev.filter((req) => req.id !== requestId));
      // Close detail modal if the deleted request was selected
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(null);
      }
    },
    onCommentAdded: async (requestId) => {
      // Refresh the specific request to get the new comment
      const requestResponse = await fetch(`/api/requests/${requestId}`);
      if (requestResponse.ok) {
        const updatedRequest = await requestResponse.json();
        setRequests((prev) =>
          prev.map((req) => (req.id === requestId ? updatedRequest : req))
        );
        if (selectedRequest?.id === requestId) {
          setSelectedRequest(updatedRequest);
        }
      }
    },
  });

  // Apply filters whenever requests or filters change
  useEffect(() => {
    let filtered = [...requests];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (request) =>
          request.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          request.comments?.some((comment) =>
            comment.text.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Apply status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((request) => request.status === statusFilter);
    }

    // Apply client filter
    if (clientFilter !== "ALL") {
      filtered = filtered.filter(
        (request) => request.clientId === clientFilter
      );
    }

    setFilteredRequests(filtered);
  }, [requests, searchQuery, statusFilter, clientFilter]);

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/requests");
      if (!response.ok) throw new Error("Failed to fetch requests");
      const data = await response.json();
      setRequests(data);
      setFilteredRequests(data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients?pageSize=100");
      if (!response.ok) throw new Error("Failed to fetch clients");
      const data = await response.json();
      // Handle paginated response
      setClients(data.clients || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setClients([]);
    }
  };

  const handleCreateRequest = async () => {
    if (!newRequestData.clientId || !newRequestData.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      console.log("Creating request with data:", newRequestData);

      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRequestData),
      });

      const responseData = await response.json();
      console.log("Create request response:", response.status, responseData);

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to create request");
      }

      toast.success("Request created successfully");
      await fetchRequests();
      setShowNewRequest(false);
      setNewRequestData({
        clientId: "",
        description: "",
        clientVisible: false,
      });
    } catch (error) {
      console.error("Error creating request:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create request"
      );
    }
  };

  const handleUpdateStatus = async (
    requestId: string,
    status: RequestStatus
  ) => {
    try {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error("Failed to update request");

      toast.success("Request status updated");
      await fetchRequests();

      // Update selected request if it's the one being modified
      if (selectedRequest?.id === requestId) {
        const updatedRequest = await response.json();
        setSelectedRequest(updatedRequest);
      }
    } catch (error) {
      console.error("Error updating request:", error);
      toast.error("Failed to update request status");
    }
  };

  const handleAddComment = async (requestId: string, text: string) => {
    try {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error("Failed to add comment");

      toast.success("Comment added successfully");
      await fetchRequests();

      // Refresh selected request
      if (selectedRequest?.id === requestId) {
        const requestResponse = await fetch(`/api/requests/${requestId}`);
        if (requestResponse.ok) {
          const updatedRequest = await requestResponse.json();
          setSelectedRequest(updatedRequest);
        }
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    }
  };

  const handleUpdateVisibility = async (
    requestId: string,
    clientVisible: boolean
  ) => {
    try {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientVisible }),
      });

      if (!response.ok) throw new Error("Failed to update visibility");

      toast.success(
        clientVisible
          ? "Request is now visible to client"
          : "Request is now hidden from client"
      );
      await fetchRequests();

      // Update selected request if it's the one being modified
      if (selectedRequest?.id === requestId) {
        const updatedRequest = await response.json();
        setSelectedRequest(updatedRequest);
      }
    } catch (error) {
      console.error("Error updating visibility:", error);
      toast.error("Failed to update visibility");
    }
  };

  // Don't show global loading spinner, let components handle it

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Requests</h1>
          <p className="text-muted-foreground">
            Manage client requests and track their progress
          </p>
        </div>
        <MotionButton onClick={() => setShowNewRequest(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Request
        </MotionButton>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Search requests and comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as RequestStatus | "ALL")
          }
        >
          <SelectTrigger className="w-[200px]" aria-label="Filter by status">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="TO_DO">To Do</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="DONE">Done</SelectItem>
          </SelectContent>
        </Select>
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-[200px]" aria-label="Filter by client">
            <SelectValue placeholder="Filter by client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Clients</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.businessName || client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* View Toggle and Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredRequests.length} of {requests.length} requests
        </p>
        <Tabs
          value={viewMode}
          onValueChange={(value) => setViewMode(value as ViewMode)}
        >
          <TabsList>
            <TabsTrigger value="kanban">
              <LayoutGrid className="mr-2 h-4 w-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="mr-2 h-4 w-4" />
              List
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewMode === "kanban" ? (
        <KanbanView
          requests={filteredRequests}
          onUpdateStatus={handleUpdateStatus}
          onViewRequest={setSelectedRequest}
          isLoading={loading}
        />
      ) : (
        <ListView
          requests={filteredRequests}
          onUpdateStatus={handleUpdateStatus}
          onViewRequest={setSelectedRequest}
          isLoading={loading}
        />
      )}

      <Dialog open={showNewRequest} onOpenChange={setShowNewRequest}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Request</DialogTitle>
            <DialogDescription>
              Create a new request for a client
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="client">Client</Label>
              <Select
                value={newRequestData.clientId}
                onValueChange={(value) =>
                  setNewRequestData({ ...newRequestData, clientId: value })
                }
              >
                <SelectTrigger id="client">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients && clients.length > 0 ? (
                    clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.businessName || client.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">
                      No clients available
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the request..."
                value={newRequestData.description}
                onChange={(e) =>
                  setNewRequestData({
                    ...newRequestData,
                    description: e.target.value,
                  })
                }
                rows={4}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <Label
                htmlFor="new-client-visible"
                className="flex cursor-pointer items-center gap-2"
              >
                {newRequestData.clientVisible ? (
                  <Eye className="h-4 w-4 text-green-600" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">
                  {newRequestData.clientVisible
                    ? "Visible to client"
                    : "Hidden from client"}
                </span>
              </Label>
              <Switch
                id="new-client-visible"
                checked={newRequestData.clientVisible}
                onCheckedChange={(checked) =>
                  setNewRequestData({
                    ...newRequestData,
                    clientVisible: checked,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <MotionButton
              variant="outline"
              onClick={() => setShowNewRequest(false)}
            >
              Cancel
            </MotionButton>
            <MotionButton onClick={handleCreateRequest}>
              Create Request
            </MotionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RequestDetail
        request={selectedRequest}
        open={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onUpdateStatus={handleUpdateStatus}
        onUpdateVisibility={handleUpdateVisibility}
        onAddComment={handleAddComment}
        isLoading={loading && !!selectedRequest}
      />
    </div>
  );
}
