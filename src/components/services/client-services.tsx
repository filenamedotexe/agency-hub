"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { ServiceDetailDialog } from "./service-detail-dialog";
import { useAuth } from "@/components/providers/auth-provider";

interface Service {
  id: string;
  status: "TO_DO" | "IN_PROGRESS" | "DONE";
  createdAt: string;
  template: {
    id: string;
    name: string;
    type: string;
    price?: number;
  };
  tasks: Array<{
    id: string;
    name: string;
    status: string;
    clientVisible: boolean;
  }>;
  _count: {
    tasks: number;
  };
}

interface ServiceTemplate {
  id: string;
  name: string;
  type: string;
  price?: number;
  isAssigned: boolean;
}

interface ClientServicesProps {
  clientId: string;
}

const statusIcons = {
  TO_DO: <Clock className="h-4 w-4" />,
  IN_PROGRESS: <AlertCircle className="h-4 w-4" />,
  DONE: <CheckCircle className="h-4 w-4" />,
};

const statusLabels = {
  TO_DO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const statusColors = {
  TO_DO: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE: "bg-green-100 text-green-700",
};

export function ClientServices({ clientId }: ClientServicesProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null
  );

  // Fetch services for this client
  const { data: services = [], isLoading: servicesLoading } = useQuery<
    Service[]
  >({
    queryKey: ["services", clientId],
    queryFn: async () => {
      const response = await fetch(`/api/services?clientId=${clientId}`);
      if (!response.ok) throw new Error("Failed to fetch services");
      return response.json();
    },
  });

  // Fetch available service templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery<
    ServiceTemplate[]
  >({
    queryKey: ["available-services", clientId],
    queryFn: async () => {
      const response = await fetch(
        `/api/clients/${clientId}/available-services`
      );
      if (!response.ok) throw new Error("Failed to fetch available services");
      return response.json();
    },
    enabled: showAddDialog,
  });

  // Add service mutation
  const addServiceMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, clientId }),
      });
      if (!response.ok) throw new Error("Failed to add service");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", clientId] });
      queryClient.invalidateQueries({
        queryKey: ["available-services", clientId],
      });
      toast.success("Service added successfully");
      setShowAddDialog(false);
      setSelectedTemplateId("");
    },
    onError: () => {
      toast.error("Failed to add service");
    },
  });

  const handleAddService = () => {
    if (selectedTemplateId) {
      addServiceMutation.mutate(selectedTemplateId);
    }
  };

  if (servicesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
          <CardDescription>Services assigned to this client</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Services</CardTitle>
              <CardDescription>
                Services assigned to this client
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <div className="py-8 text-center">
              <p className="mb-4 text-sm text-muted-foreground">
                No services assigned yet
              </p>
              <Button onClick={() => setShowAddDialog(true)} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add First Service
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <Card
                  key={service.id}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => setSelectedServiceId(service.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <h4 className="font-medium">
                            {service.template.name}
                          </h4>
                          <Badge
                            variant="secondary"
                            className={statusColors[service.status]}
                          >
                            {statusIcons[service.status]}
                            <span className="ml-1">
                              {statusLabels[service.status]}
                            </span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {service._count.tasks} tasks •{" "}
                          {service.template.type.replace(/_/g, " ")}
                        </p>
                        {service.template.price && (
                          <p className="mt-1 text-sm font-medium">
                            ${service.template.price.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Service</DialogTitle>
            <DialogDescription>
              Select a service template to assign to this client
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select
              value={selectedTemplateId}
              onValueChange={setSelectedTemplateId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a service template" />
              </SelectTrigger>
              <SelectContent>
                {templatesLoading ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    Loading templates...
                  </div>
                ) : (
                  templates
                    .filter((template) => !template.isAssigned)
                    .map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex w-full items-center justify-between">
                          <span>{template.name}</span>
                          {template.price && (
                            <span className="ml-2 text-sm text-muted-foreground">
                              ${template.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>

            {templates.filter((t) => !t.isAssigned).length === 0 &&
              !templatesLoading && (
                <p className="mt-2 text-sm text-muted-foreground">
                  All available services are already assigned to this client
                </p>
              )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddService}
              disabled={!selectedTemplateId || addServiceMutation.isPending}
            >
              {addServiceMutation.isPending ? "Adding..." : "Add Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ServiceDetailDialog
        serviceId={selectedServiceId}
        onClose={() => setSelectedServiceId(null)}
        isReadOnly={user?.role === "CLIENT"}
      />
    </>
  );
}
