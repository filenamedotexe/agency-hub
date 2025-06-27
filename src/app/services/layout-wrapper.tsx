"use client";

import { ReactNode } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { ClientLayout } from "@/components/layouts/client-layout";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

interface LayoutWrapperProps {
  children: ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const { user } = useAuth();

  if (!user) {
    return <>{children}</>;
  }

  if (user.role === "CLIENT") {
    return <ClientLayout>{children}</ClientLayout>;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
