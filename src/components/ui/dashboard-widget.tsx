"use client";

import React from "react";
import { EnhancedCard } from "./enhanced-card";
import { cn } from "@/lib/utils";

interface DashboardWidgetProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function DashboardWidget({
  title,
  icon: Icon,
  children,
  action,
  className,
}: DashboardWidgetProps) {
  return (
    <EnhancedCard className={cn("h-full", className)}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-2">
            <Icon className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </EnhancedCard>
  );
}
