"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  ArrowUp,
  ArrowDown,
  DollarSign,
  Users,
  Package,
  TrendingUp,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  AlertCircle,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { MotionButton } from "@/components/ui/motion-button";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { MotionDiv, MotionListItem } from "@/components/ui/motion-elements";
import { StatSkeleton, CardSkeleton } from "@/components/ui/skeleton-loader";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function SalesAnalyticsPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState("30");

  const {
    data: metrics,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["sales-metrics", dateRange],
    queryFn: async () => {
      const response = await fetch(
        `/api/admin/analytics/sales?days=${dateRange}`
      );
      if (!response.ok) throw new Error("Failed to fetch metrics");
      return response.json();
    },
  });

  const { data: topClients } = useQuery({
    queryKey: ["top-clients-ltv"],
    queryFn: async () => {
      const response = await fetch("/api/admin/analytics/top-clients");
      if (!response.ok) throw new Error("Failed to fetch top clients");
      return response.json();
    },
  });

  // Only allow admin and manager roles
  if (user && !["ADMIN", "MANAGER"].includes(user.role)) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-8 w-8" />}
        title="Access Denied"
        description="You don't have permission to view sales analytics"
      />
    );
  }

  if (isLoading) {
    return (
      <MotionDiv className="space-y-6">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-3xl font-bold text-transparent">
            Sales Analytics
          </h1>
          <p className="text-muted-foreground">
            Track revenue, orders, and client metrics
          </p>
        </MotionDiv>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
        <CardSkeleton />
      </MotionDiv>
    );
  }

  return (
    <MotionDiv
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="space-y-2">
          <h1 className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-3xl font-bold text-transparent">
            Sales Analytics
          </h1>
          <p className="text-muted-foreground">
            Track revenue, orders, and client metrics
          </p>
        </div>
        <MotionDiv
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-4"
        >
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px] border-2 shadow-sm transition-colors hover:border-primary/50">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <MotionButton
            onClick={() => refetch()}
            variant="outline"
            size="icon"
            className="shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md"
          >
            <RefreshCw className="h-4 w-4" />
          </MotionButton>
        </MotionDiv>
      </MotionDiv>

      {/* KPI Cards */}
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <MotionListItem index={0}>
          <EnhancedCard className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium">Total Revenue</h3>
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                ${metrics?.totalRevenue?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics?.revenueChange > 0 ? (
                  <span className="flex items-center text-green-600">
                    <ArrowUp className="h-3 w-3" />
                    {metrics.revenueChange}% from last period
                  </span>
                ) : metrics?.revenueChange < 0 ? (
                  <span className="flex items-center text-red-600">
                    <ArrowDown className="h-3 w-3" />
                    {Math.abs(metrics?.revenueChange || 0)}% from last period
                  </span>
                ) : (
                  <span className="text-gray-600">
                    No change from last period
                  </span>
                )}
              </p>
            </div>
          </EnhancedCard>
        </MotionListItem>

        <MotionListItem index={1}>
          <EnhancedCard className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium">Total Orders</h3>
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {metrics?.totalOrders || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Avg order value: ${metrics?.avgOrderValue?.toFixed(2) || 0}
              </p>
            </div>
          </EnhancedCard>
        </MotionListItem>

        <MotionListItem index={2}>
          <EnhancedCard className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium">New Customers</h3>
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {metrics?.newCustomers || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                This {dateRange === "30" ? "month" : "period"}
              </p>
            </div>
          </EnhancedCard>
        </MotionListItem>

        <MotionListItem index={3}>
          <EnhancedCard className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium">Refund Rate</h3>
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {metrics?.refundRate?.toFixed(1) || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                ${metrics?.refundAmount?.toFixed(2) || 0} refunded
              </p>
            </div>
          </EnhancedCard>
        </MotionListItem>
      </MotionDiv>

      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 rounded-lg bg-muted/50 p-1">
            <TabsTrigger
              value="revenue"
              className="transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Revenue Trends
            </TabsTrigger>
            <TabsTrigger
              value="services"
              className="transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Top Services
            </TabsTrigger>
            <TabsTrigger
              value="clients"
              className="transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Top Clients
            </TabsTrigger>
            <TabsTrigger
              value="conversion"
              className="transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Conversion Metrics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4">
            <EnhancedCard className="shadow-lg">
              <div className="p-6">
                <h3 className="mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Revenue Over Time
                </h3>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={metrics?.revenueChart || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) =>
                        format(new Date(value), "MMM d")
                      }
                    />
                    <YAxis />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      formatter={(value: any) => `$${value}`}
                      labelFormatter={(label) =>
                        format(new Date(label), "MMM d, yyyy")
                      }
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="Revenue"
                    />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      yAxisId="right"
                      name="Orders"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </EnhancedCard>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <EnhancedCard className="shadow-lg">
              <div className="p-6">
                <h3 className="mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Top Services by Revenue
                </h3>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={metrics?.topServices || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => `$${value}`} />
                    <Bar dataKey="revenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </EnhancedCard>

            <EnhancedCard className="shadow-lg">
              <div className="p-6">
                <h3 className="mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-600" />
                  Service Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics?.serviceDistribution || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {metrics?.serviceDistribution?.map(
                        (entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </EnhancedCard>
          </TabsContent>

          <TabsContent value="clients" className="space-y-4">
            <EnhancedCard className="shadow-lg">
              <div className="p-6">
                <h3 className="mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Top Clients by Lifetime Value
                </h3>
                <div className="space-y-4">
                  {topClients?.map((client: any, index: number) => (
                    <MotionDiv
                      key={client.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between rounded-lg border p-4 transition-all duration-200 hover:bg-muted/50 hover:shadow-md"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl font-bold text-gray-400">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{client.businessName}</p>
                          <p className="text-sm text-gray-600">
                            {client.totalOrders} orders • First order{" "}
                            {client.firstOrderDate &&
                              format(
                                new Date(client.firstOrderDate),
                                "MMM yyyy"
                              )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          ${client.lifetimeValue}
                        </p>
                        <p className="text-sm text-gray-600">
                          Avg $
                          {(client.lifetimeValue / client.totalOrders).toFixed(
                            2
                          )}
                          /order
                        </p>
                      </div>
                    </MotionDiv>
                  ))}
                </div>
              </div>
            </EnhancedCard>
          </TabsContent>

          <TabsContent value="conversion" className="space-y-4">
            <EnhancedCard className="shadow-lg">
              <div className="p-6">
                <h3 className="mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  Conversion Funnel
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Store Visits</span>
                      <span className="text-sm text-gray-600">
                        {metrics?.conversionFunnel?.storeVisits || 0}
                      </span>
                    </div>
                    <div
                      className="h-4 rounded bg-blue-500"
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Add to Cart</span>
                      <span className="text-sm text-gray-600">
                        {metrics?.conversionFunnel?.addToCart || 0} (
                        {metrics?.conversionFunnel?.cartRate?.toFixed(1) || 0}%)
                      </span>
                    </div>
                    <div
                      className="h-4 rounded bg-green-500"
                      style={{
                        width: `${metrics?.conversionFunnel?.cartRate || 0}%`,
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Checkout Started
                      </span>
                      <span className="text-sm text-gray-600">
                        {metrics?.conversionFunnel?.checkoutStarted || 0} (
                        {metrics?.conversionFunnel?.checkoutRate?.toFixed(1) ||
                          0}
                        %)
                      </span>
                    </div>
                    <div
                      className="h-4 rounded bg-yellow-500"
                      style={{
                        width: `${metrics?.conversionFunnel?.checkoutRate || 0}%`,
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Orders Completed
                      </span>
                      <span className="text-sm text-gray-600">
                        {metrics?.conversionFunnel?.ordersCompleted || 0} (
                        {metrics?.conversionFunnel?.conversionRate?.toFixed(
                          1
                        ) || 0}
                        %)
                      </span>
                    </div>
                    <div
                      className="h-4 rounded bg-purple-500"
                      style={{
                        width: `${metrics?.conversionFunnel?.conversionRate || 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </EnhancedCard>
          </TabsContent>
        </Tabs>
      </MotionDiv>
    </MotionDiv>
  );
}
