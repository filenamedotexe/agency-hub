"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { DashboardWidget } from "@/components/ui/dashboard-widget";
import { QuickActions, type QuickAction } from "@/components/ui/quick-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Briefcase,
  ShoppingCart,
  Calendar,
  ClipboardList,
  Package,
} from "lucide-react";

export default function ClientDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Quick actions for clients
  const quickActions: QuickAction[] = [
    {
      id: "browse-store",
      label: "Browse Store",
      icon: ShoppingCart,
      onClick: () => router.push("/store"),
      variant: "primary",
    },
    {
      id: "view-services",
      label: "My Services",
      icon: Briefcase,
      onClick: () => router.push("/client-dashboard/services"),
    },
    {
      id: "submit-form",
      label: "Submit Form",
      icon: FileText,
      onClick: () => router.push("/client-dashboard/forms"),
      variant: "success",
    },
    {
      id: "order-history",
      label: "Order History",
      icon: Package,
      onClick: () => router.push("/store/orders"),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Client Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.email}</p>
      </div>

      {/* Welcome Card */}
      <EnhancedCard className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Welcome!</h2>
        <p className="text-gray-600">
          Access your forms and services from the navigation menu, or use the
          quick actions below.
        </p>
      </EnhancedCard>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <QuickActions actions={quickActions} />
      </div>

      {/* Dashboard Widgets */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardWidget title="Pending Forms" icon={ClipboardList}>
          <div className="py-4 text-center">
            <p className="mb-2 text-3xl font-bold text-indigo-600">0</p>
            <EmptyState
              icon={<FileText className="h-8 w-8" />}
              title="No pending forms"
              description="You're all caught up! Check back later for new forms."
            />
          </div>
        </DashboardWidget>

        <DashboardWidget title="Active Services" icon={Briefcase}>
          <div className="py-4 text-center">
            <p className="mb-2 text-3xl font-bold text-green-600">0</p>
            <EmptyState
              icon={<Briefcase className="h-8 w-8" />}
              title="No active services"
              description="Browse our store to purchase services and get started."
              action={
                <Button onClick={() => router.push("/store")}>
                  Browse Store
                </Button>
              }
            />
          </div>
        </DashboardWidget>
      </div>
    </div>
  );
}
