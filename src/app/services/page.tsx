"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Package,
  ShoppingBag,
  ShoppingCart,
  BarChart3,
  FileText,
  Briefcase,
} from "lucide-react";
import { MotionDiv } from "@/components/ui/motion-elements";
import { Skeleton } from "@/components/ui/skeleton-loader";

// Tab Components (to be created)
import CatalogTab from "./components/catalog-tab";
import OrdersTab from "./components/orders-tab";
import AnalyticsTab from "./components/analytics-tab";
import BrowseTab from "./components/browse-tab";
import MyOrdersTab from "./components/my-orders-tab";
import MyServicesTab from "./components/my-services-tab";

// Define tab configurations
const tabs = {
  catalog: {
    label: "Catalog",
    icon: Package,
    component: CatalogTab,
    allowedRoles: ["ADMIN", "SERVICE_MANAGER"],
  },
  orders: {
    label: "Orders",
    icon: ShoppingCart,
    component: OrdersTab,
    allowedRoles: ["ADMIN", "SERVICE_MANAGER"],
  },
  analytics: {
    label: "Analytics",
    icon: BarChart3,
    component: AnalyticsTab,
    allowedRoles: ["ADMIN", "SERVICE_MANAGER"],
  },
  browse: {
    label: "Browse",
    icon: ShoppingBag,
    component: BrowseTab,
    allowedRoles: ["CLIENT"],
  },
  "my-orders": {
    label: "My Orders",
    icon: FileText,
    component: MyOrdersTab,
    allowedRoles: ["CLIENT"],
  },
  "my-services": {
    label: "My Services",
    icon: Briefcase,
    component: MyServicesTab,
    allowedRoles: ["CLIENT"],
  },
};

export default function ServicesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Get available tabs based on user role
  const availableTabs = Object.entries(tabs).filter(
    ([_, tab]) => user?.role && tab.allowedRoles.includes(user.role)
  );

  useEffect(() => {
    if (!user) return;

    // Get tab from URL or set default based on role
    const urlTab = searchParams.get("tab");
    const defaultTab = user.role === "CLIENT" ? "browse" : "catalog";
    const initialTab = urlTab || defaultTab;

    // Verify user has access to the requested tab
    const hasAccess = availableTabs.some(([key]) => key === initialTab);
    if (hasAccess) {
      setActiveTab(initialTab);
    } else {
      // Redirect to default tab for their role
      setActiveTab(defaultTab);
      router.replace(`/services?tab=${defaultTab}`);
    }

    setLoading(false);
  }, [user, searchParams, router, availableTabs]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/services?tab=${value}`);
  };

  if (loading || !user) {
    return (
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="mb-2 h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </MotionDiv>
    );
  }

  return (
    <MotionDiv
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-4 md:space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
            Services
          </h1>
          <p className="mt-1 text-xs text-gray-600 md:text-sm">
            {user.role === "CLIENT"
              ? "Browse services, view your orders and active services"
              : "Manage service catalog, orders, and analytics"}
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-6"
      >
        {/* Mobile: Horizontal scrollable tabs */}
        <div className="-mx-4 px-4 md:hidden">
          <div className="scrollbar-hide overflow-x-auto">
            <TabsList className="inline-flex h-auto w-auto min-w-full bg-gray-100/50 p-1">
              {availableTabs.map(([key, tab]) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-3 py-2 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
        </div>

        {/* Desktop: Grid layout */}
        <div className="hidden md:block">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            {availableTabs.map(([key, tab]) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {availableTabs.map(([key, tab]) => {
          const TabComponent = tab.component;
          return (
            <TabsContent key={key} value={key} className="mt-4 md:mt-6">
              <TabComponent />
            </TabsContent>
          );
        })}
      </Tabs>
    </MotionDiv>
  );
}
