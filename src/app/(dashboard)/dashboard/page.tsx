"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { useRealtimeDashboard } from "@/hooks/use-realtime-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Briefcase,
  MessageSquare,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle2,
  CircleDot,
  AlertCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
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
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

const COLORS = {
  TO_DO: "#f59e0b",
  IN_PROGRESS: "#3b82f6",
  DONE: "#10b981",
};

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  trend,
  href,
}: {
  title: string;
  value: number | string;
  icon: any;
  color: string;
  trend?: { value: number; label: string };
  href?: string;
}) {
  const cardContent = (
    <Card className="group cursor-pointer transition-all duration-base hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <Icon className={cn("h-4 w-4", color)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="mt-1 text-xs text-gray-600">
            <span
              className={trend.value > 0 ? "text-green-600" : "text-gray-500"}
            >
              {trend.value > 0 ? "+" : ""}
              {trend.value}
            </span>{" "}
            {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

function ActivityItem({ activity }: { activity: any }) {
  const getActivityIcon = () => {
    switch (activity.entityType) {
      case "client":
        return <Users className="h-4 w-4" />;
      case "service":
        return <Briefcase className="h-4 w-4" />;
      case "request":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex items-start space-x-3 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
        {getActivityIcon()}
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm">
          <span className="font-medium">{activity.user.email}</span>{" "}
          <span className="text-gray-600">{activity.action}</span>
          {activity.client && (
            <span className="font-medium"> {activity.client.name}</span>
          )}
        </p>
        <p className="text-xs text-gray-500">
          {formatDistanceToNow(new Date(activity.createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();

  // Enable real-time updates
  useRealtimeDashboard();

  if (isLoading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const serviceChartData =
    stats?.servicesByStatus.map((item) => ({
      name: item.status.replace("_", " "),
      value: item.count,
    })) || [];

  const requestChartData =
    stats?.requestsByStatus.map((item) => ({
      name: item.status.replace("_", " "),
      value: item.count,
    })) || [];

  const weeklyData = [
    {
      name: "New Clients",
      value: stats?.trends.newClientsThisWeek || 0,
    },
    {
      name: "Completed Services",
      value: stats?.trends.completedServicesThisWeek || 0,
    },
    {
      name: "Completed Requests",
      value: stats?.trends.completedRequestsThisWeek || 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.email}</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Clients"
          value={stats?.overview.totalClients || 0}
          icon={Users}
          color="text-indigo-600"
          trend={{
            value: stats?.trends.newClientsThisWeek || 0,
            label: "this week",
          }}
          href="/clients"
        />
        <StatCard
          title="Active Services"
          value={stats?.overview.activeServices || 0}
          icon={CircleDot}
          color="text-blue-600"
          href="/services"
        />
        <StatCard
          title="Pending Requests"
          value={stats?.overview.pendingRequests || 0}
          icon={AlertCircle}
          color="text-yellow-600"
          href="/requests"
        />
        <StatCard
          title="Completed This Week"
          value={
            (stats?.trends.completedServicesThisWeek || 0) +
            (stats?.trends.completedRequestsThisWeek || 0)
          }
          icon={CheckCircle2}
          color="text-green-600"
        />
      </div>

      {/* Charts Row - Mobile optimized with horizontal scroll */}
      <div className="-mx-4 grid grid-cols-1 gap-6 overflow-x-auto px-4 lg:mx-0 lg:grid-cols-3 lg:overflow-x-visible lg:px-0">
        {/* Services by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Services by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {serviceChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          COLORS[
                            entry.name.replace(" ", "_") as keyof typeof COLORS
                          ]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Requests by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Requests by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={requestChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {requestChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          COLORS[
                            entry.name.replace(" ", "_") as keyof typeof COLORS
                          ]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">This Week&apos;s Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {stats?.recentActivity.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                No recent activity to display
              </p>
            ) : (
              stats?.recentActivity.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
