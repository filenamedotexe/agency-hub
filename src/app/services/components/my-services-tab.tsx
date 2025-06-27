"use client";

import { useQuery } from "@tanstack/react-query";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MotionButton } from "@/components/ui/motion-button";
import { CardSkeleton } from "@/components/ui/skeleton-loader";
import {
  MotionDiv,
  MotionListItem,
  MotionBadge,
} from "@/components/ui/motion-elements";
import { Briefcase, Calendar, CheckCircle, Circle } from "lucide-react";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { EmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

const statusColors: Record<string, string> = {
  TO_DO: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  DONE: "bg-green-100 text-green-800",
};

const typeLabels: Record<string, string> = {
  GOOGLE_ADS: "Google Ads",
  FACEBOOK_ADS: "Facebook Ads",
  WEBSITE_DESIGN: "Website Design",
};

export default function MyServicesTab() {
  const router = useRouter();

  const { data: services, isLoading } = useQuery({
    queryKey: ["client-services"],
    queryFn: async () => {
      const response = await fetch("/api/clients/services");
      if (!response.ok) throw new Error("Failed to fetch services");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">My Active Services</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!services || services.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">My Active Services</h2>
        <EmptyState
          icon={<Briefcase className="h-8 w-8" />}
          title="No active services"
          description="You don't have any active services yet. Browse our services to get started."
          action={
            <MotionButton
              onClick={() => {
                const browseTab = document.querySelector(
                  '[value="browse"]'
                ) as HTMLElement;
                if (browseTab) browseTab.click();
              }}
            >
              Browse Services
            </MotionButton>
          }
        />
      </div>
    );
  }

  const activeServices = services.filter((s: any) => s.status === "ACTIVE");
  const pausedServices = services.filter((s: any) => s.status === "PAUSED");
  const completedServices = services.filter(
    (s: any) => s.status === "COMPLETED"
  );

  return (
    <MotionDiv
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between"
      >
        <h2 className="text-xl font-semibold">My Active Services</h2>
        <div className="flex gap-2 text-sm">
          <Badge variant="outline" className="border-green-200">
            <Circle className="mr-1 h-3 w-3 fill-green-500 text-green-500" />
            {activeServices.length} Active
          </Badge>
          <Badge variant="outline" className="border-yellow-200">
            <Circle className="mr-1 h-3 w-3 fill-yellow-500 text-yellow-500" />
            {pausedServices.length} Paused
          </Badge>
          <Badge variant="outline" className="border-gray-200">
            <Circle className="mr-1 h-3 w-3 fill-gray-500 text-gray-500" />
            {completedServices.length} Completed
          </Badge>
        </div>
      </MotionDiv>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service: any, index: number) => (
          <MotionListItem key={service.id} index={index}>
            <EnhancedCard
              onClick={() => router.push(`/services/${service.id}`)}
              className="h-full"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <MotionBadge className={statusColors[service.status]}>
                    {service.status}
                  </MotionBadge>
                </div>
                <Badge variant="secondary" className="w-fit">
                  {typeLabels[service.type]}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Started</p>
                    <p className="font-medium">
                      {format(new Date(service.startDate), "MMM d, yyyy")}
                    </p>
                  </div>

                  {service.tasks && service.tasks.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm text-gray-600">
                        Tasks (
                        {service.tasks.filter((t: any) => t.completed).length}/
                        {service.tasks.length})
                      </p>
                      <div className="space-y-1">
                        {service.tasks
                          .filter((t: any) => t.clientVisible)
                          .slice(0, 3)
                          .map((task: any) => (
                            <div
                              key={task.id}
                              className="flex items-center gap-2 text-sm"
                            >
                              {task.completed ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Circle className="h-4 w-4 text-gray-400" />
                              )}
                              <span
                                className={
                                  task.completed
                                    ? "text-gray-500 line-through"
                                    : ""
                                }
                              >
                                {task.name}
                              </span>
                            </div>
                          ))}
                        {service.tasks.filter((t: any) => t.clientVisible)
                          .length > 3 && (
                          <p className="pl-6 text-xs text-gray-500">
                            +
                            {service.tasks.filter((t: any) => t.clientVisible)
                              .length - 3}{" "}
                            more tasks
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {service.nextReviewDate && service.status === "ACTIVE" && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      Next review:{" "}
                      {format(new Date(service.nextReviewDate), "MMM d")}
                    </div>
                  )}

                  <MotionButton
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/services/${service.id}`);
                    }}
                  >
                    View Details
                  </MotionButton>
                </div>
              </CardContent>
            </EnhancedCard>
          </MotionListItem>
        ))}
      </div>
    </MotionDiv>
  );
}
