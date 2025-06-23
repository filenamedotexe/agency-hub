"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ServiceTasks } from "./service-tasks";
import { Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface ServiceDetailDialogProps {
  serviceId: string | null;
  onClose: () => void;
  isReadOnly?: boolean;
}

const statusColors = {
  TO_DO: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE: "bg-green-100 text-green-700",
};

const statusLabels = {
  TO_DO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

export function ServiceDetailDialog({
  serviceId,
  onClose,
  isReadOnly = false,
}: ServiceDetailDialogProps) {
  const { data: service, isLoading } = useQuery({
    queryKey: ["service", serviceId],
    queryFn: async () => {
      const response = await fetch(`/api/services/${serviceId}`);
      if (!response.ok) throw new Error("Failed to fetch service");
      return response.json();
    },
    enabled: !!serviceId,
  });

  if (!serviceId) return null;

  return (
    <Dialog open={!!serviceId} onOpenChange={() => onClose()}>
      <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Service Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : service ? (
          <div className="space-y-6">
            {/* Service Header */}
            <div>
              <div className="mb-2 flex items-start justify-between">
                <h3 className="text-xl font-semibold">
                  {service.template.name}
                </h3>
                <Badge
                  variant="secondary"
                  className={
                    statusColors[service.status as keyof typeof statusColors]
                  }
                >
                  {statusLabels[service.status as keyof typeof statusLabels]}
                </Badge>
              </div>
              <p className="text-gray-600">
                {service.template.type.replace(/_/g, " ")}
              </p>
            </div>

            {/* Service Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-1 text-sm text-gray-500">Client</p>
                <p className="font-medium">{service.client.name}</p>
                <p className="text-sm text-gray-600">
                  {service.client.businessName}
                </p>
              </div>
              <div>
                <p className="mb-1 text-sm text-gray-500">Started</p>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-sm">
                    {format(new Date(service.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                {service.template.price && (
                  <div className="mt-2 flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <p className="text-sm font-medium">
                      ${service.template.price.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tasks Section */}
            <div className="border-t pt-6">
              <ServiceTasks
                serviceId={service.id}
                clientName={service.client.name}
                serviceName={service.template.name}
                isReadOnly={isReadOnly}
              />
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
