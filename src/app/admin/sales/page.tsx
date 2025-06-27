"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { format, subDays } from "date-fns";
import { Button } from "@/components/ui/button";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function SalesAnalyticsPage() {
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Sales Analytics</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 animate-pulse rounded bg-gray-100" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Analytics</h1>
          <p className="text-gray-600">
            Track revenue, orders, and client metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => refetch()} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.totalOrders || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg order value: ${metrics?.avgOrderValue?.toFixed(2) || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.newCustomers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              This {dateRange === "30" ? "month" : "period"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Refund Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.refundRate?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              ${metrics?.refundAmount?.toFixed(2) || 0} refunded
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
          <TabsTrigger value="services">Top Services</TabsTrigger>
          <TabsTrigger value="clients">Top Clients</TabsTrigger>
          <TabsTrigger value="conversion">Conversion Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={metrics?.revenueChart || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), "MMM d")}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Services by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={metrics?.topServices || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `$${value}`} />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Distribution</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Clients by Lifetime Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topClients?.map((client: any, index: number) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between rounded-lg border p-4"
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
                            format(new Date(client.firstOrderDate), "MMM yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        ${client.lifetimeValue}
                      </p>
                      <p className="text-sm text-gray-600">
                        Avg $
                        {(client.lifetimeValue / client.totalOrders).toFixed(2)}
                        /order
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
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
                      {metrics?.conversionFunnel?.checkoutRate?.toFixed(1) || 0}
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
                      {metrics?.conversionFunnel?.conversionRate?.toFixed(1) ||
                        0}
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
