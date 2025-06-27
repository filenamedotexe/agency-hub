"use client";

import { useQuery } from "@tanstack/react-query";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { Progress } from "@/components/ui/progress";
import { MotionButton } from "@/components/ui/motion-button";
import { ArrowRight, Package, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";

interface ServiceWithProgress {
  id: string;
  name: string;
  status: string;
  completedTasks: number;
  totalTasks: number;
  nextMilestone?: {
    name: string;
    dueDate?: string;
  };
}

export function MyServicesWidget() {
  const { data: services, isLoading } = useQuery({
    queryKey: ["my-active-services"],
    queryFn: async () => {
      const response = await fetch("/api/client/services?status=active");
      if (!response.ok) throw new Error("Failed to fetch services");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <EnhancedCard>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        </CardContent>
      </EnhancedCard>
    );
  }

  if (!services?.length) {
    return (
      <EnhancedCard>
        <CardContent className="p-6 text-center">
          <Package className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <p className="mb-4 text-gray-600">No active services yet</p>
          <MotionButton asChild>
            <Link href="/store">Browse Services</Link>
          </MotionButton>
        </CardContent>
      </EnhancedCard>
    );
  }

  return (
    <EnhancedCard>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>My Active Services</span>
          <MotionButton variant="ghost" size="sm" asChild>
            <Link href="/services">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </MotionButton>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {services.slice(0, 3).map((service: ServiceWithProgress) => (
            <div key={service.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{service.name}</p>
                  <p className="text-sm text-gray-600">
                    {service.completedTasks}/{service.totalTasks} tasks
                    completed
                  </p>
                </div>
                <MotionButton variant="outline" size="sm" asChild>
                  <Link href={`/services/${service.id}`}>View</Link>
                </MotionButton>
              </div>
              <Progress
                value={(service.completedTasks / service.totalTasks) * 100}
                className="h-2"
              />
              {service.nextMilestone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Next: {service.nextMilestone.name}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </EnhancedCard>
  );
}
