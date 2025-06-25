"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { ServiceDetailDialog } from "@/components/services/service-detail-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Briefcase,
} from "lucide-react";

interface ServiceTask {
  id: string;
  name: string;
  status: "TO_DO" | "IN_PROGRESS" | "DONE";
  clientVisible: boolean;
}

interface Service {
  id: string;
  status: "TO_DO" | "IN_PROGRESS" | "DONE";
  createdAt: string;
  completedAt?: string;
  template: {
    id: string;
    name: string;
    type: string;
    price?: number;
    description?: string;
  };
  tasks: ServiceTask[];
  _count: {
    tasks: number;
  };
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

export default function ClientServicesPage() {
  const { user } = useAuth();
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null
  );

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["client-services", user?.id],
    queryFn: async () => {
      const response = await fetch("/api/client/services");
      if (!response.ok) throw new Error("Failed to fetch services");
      return response.json();
    },
    enabled: !!user,
  });

  const calculateProgress = (tasks: ServiceTask[]) => {
    const visibleTasks = tasks.filter((task) => task.clientVisible);
    if (visibleTasks.length === 0) return 0;
    const completedTasks = visibleTasks.filter(
      (task) => task.status === "DONE"
    ).length;
    return Math.round((completedTasks / visibleTasks.length) * 100);
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Services</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="mt-2 h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const activeServices = services.filter(
    (service) => service.status !== "DONE"
  );
  const completedServices = services.filter(
    (service) => service.status === "DONE"
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Services</h1>

      {services.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="text-gray-600">No services assigned yet</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Active Services */}
          {activeServices.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold text-gray-800">
                Active Services
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activeServices.map((service) => {
                  const progress = calculateProgress(service.tasks);
                  const visibleTaskCount = service.tasks.filter(
                    (t) => t.clientVisible
                  ).length;

                  return (
                    <Card
                      key={service.id}
                      className="cursor-pointer transition-shadow hover:shadow-md"
                      onClick={() => setSelectedServiceId(service.id)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">
                              {service.template.name}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {service.template.type.replace(/_/g, " ")}
                            </CardDescription>
                          </div>
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
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {visibleTaskCount > 0 && (
                            <div>
                              <div className="mb-1 flex justify-between text-sm">
                                <span className="text-gray-600">Progress</span>
                                <span className="font-medium">{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>
                          )}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              {visibleTaskCount} visible task
                              {visibleTaskCount !== 1 ? "s" : ""}
                            </span>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                          {service.template.price && (
                            <p className="text-sm font-medium">
                              ${service.template.price.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed Services */}
          {completedServices.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-800">
                Completed Services
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {completedServices.map((service) => (
                  <Card
                    key={service.id}
                    className="cursor-pointer opacity-75 transition-shadow hover:shadow-md"
                    onClick={() => setSelectedServiceId(service.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {service.template.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {service.template.type.replace(/_/g, " ")}
                          </CardDescription>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700"
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Completed
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-gray-600">
                        {service.completedAt && (
                          <p>
                            Completed on{" "}
                            {new Date(service.completedAt).toLocaleDateString()}
                          </p>
                        )}
                        {service.template.price && (
                          <p className="font-medium">
                            ${service.template.price.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Service Detail Dialog */}
      <ServiceDetailDialog
        serviceId={selectedServiceId}
        onClose={() => setSelectedServiceId(null)}
        isReadOnly={true}
      />
    </div>
  );
}
