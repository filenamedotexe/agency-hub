"use client";

import { useQuery } from "@tanstack/react-query";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { MotionBadge } from "@/components/ui/motion-elements";
import { MotionButton } from "@/components/ui/motion-button";
import { MotionInput } from "@/components/ui/motion-elements";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableSkeleton, StatSkeleton } from "@/components/ui/skeleton-loader";
import { ResponsiveDataTable } from "@/components/ui/responsive-table";
import { EmptyState } from "@/components/ui/empty-state";
import { MotionDiv, MotionListItem } from "@/components/ui/motion-elements";
import {
  Package,
  Search,
  Filter,
  RefreshCw,
  FileText,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useState } from "react";

export default function AdminOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const {
    data: orders,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const response = await fetch("/api/orders");
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json();
    },
  });

  const filteredOrders = orders?.filter((order: any) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client.businessName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    const matchesPayment =
      paymentFilter === "all" || order.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const totalRevenue =
    filteredOrders?.reduce(
      (sum: number, order: any) =>
        order.paymentStatus === "SUCCEEDED" ? sum + Number(order.total) : sum,
      0
    ) || 0;

  if (isLoading) {
    return (
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <h1 className="text-3xl font-bold">Order Management</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
        <EnhancedCard>
          <div className="p-6">
            <TableSkeleton rows={5} columns={7} />
          </div>
        </EnhancedCard>
      </MotionDiv>
    );
  }

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Order Management</h1>
        <MotionButton onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </MotionButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MotionListItem index={0}>
          <EnhancedCard>
            <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
              <h3 className="text-sm font-medium">Total Orders</h3>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="p-6 pt-0">
              <div className="text-2xl font-bold">{orders?.length || 0}</div>
            </div>
          </EnhancedCard>
        </MotionListItem>
        <MotionListItem index={1}>
          <EnhancedCard>
            <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
              <h3 className="text-sm font-medium">Revenue</h3>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="p-6 pt-0">
              <div className="text-2xl font-bold">
                ${totalRevenue.toLocaleString()}
              </div>
            </div>
          </EnhancedCard>
        </MotionListItem>
        <MotionListItem index={2}>
          <EnhancedCard>
            <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
              <h3 className="text-sm font-medium">Pending</h3>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="p-6 pt-0">
              <div className="text-2xl font-bold">
                {orders?.filter(
                  (o: any) =>
                    o.status === "PENDING" || o.status === "AWAITING_CONTRACT"
                ).length || 0}
              </div>
            </div>
          </EnhancedCard>
        </MotionListItem>
        <MotionListItem index={3}>
          <EnhancedCard>
            <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
              <h3 className="text-sm font-medium">Refunded</h3>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="p-6 pt-0">
              <div className="text-2xl font-bold">
                {orders?.filter((o: any) => o.status === "REFUNDED").length ||
                  0}
              </div>
            </div>
          </EnhancedCard>
        </MotionListItem>
      </div>

      {/* Filters */}
      <MotionDiv
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col gap-4 md:flex-row"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <MotionInput
            placeholder="Search by order number, client name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="AWAITING_CONTRACT">Awaiting Contract</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Payment status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="SUCCEEDED">Succeeded</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </MotionDiv>

      {/* Orders Table */}
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <EnhancedCard>
          <div className="p-6">
            {filteredOrders && filteredOrders.length > 0 ? (
              <ResponsiveDataTable
                columns={[
                  {
                    key: "order",
                    label: "Order",
                    priority: "high",
                    renderCell: (_, row) => (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          #{row.orderNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {row.items.length} item{row.items.length !== 1 && "s"}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "client",
                    label: "Client",
                    priority: "high",
                    renderCell: (_, row) => (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {row.client.businessName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {row.client.name}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "total",
                    label: "Total",
                    priority: "medium",
                    renderCell: (value) => (
                      <div className="text-sm font-medium text-gray-900">
                        ${value.toLocaleString()}
                      </div>
                    ),
                  },
                  {
                    key: "status",
                    label: "Status",
                    priority: "high",
                    renderCell: (value) => (
                      <MotionBadge
                        className={
                          value === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : value === "REFUNDED" || value === "CANCELLED"
                              ? "bg-red-100 text-red-800"
                              : value === "AWAITING_CONTRACT"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                        }
                      >
                        {value.replace(/_/g, " ")}
                      </MotionBadge>
                    ),
                  },
                  {
                    key: "paymentStatus",
                    label: "Payment",
                    priority: "medium",
                    renderCell: (value) => (
                      <MotionBadge
                        variant="outline"
                        className={
                          value === "SUCCEEDED"
                            ? "border-green-500 text-green-700"
                            : value === "REFUNDED"
                              ? "border-red-500 text-red-700"
                              : "border-gray-500 text-gray-700"
                        }
                      >
                        {value}
                      </MotionBadge>
                    ),
                  },
                  {
                    key: "createdAt",
                    label: "Date",
                    priority: "low",
                    renderCell: (value) => (
                      <span className="text-sm text-gray-500">
                        {format(new Date(value), "MMM d, yyyy")}
                      </span>
                    ),
                  },
                  {
                    key: "actions",
                    label: "Actions",
                    priority: "high",
                    renderCell: (_, row) => (
                      <MotionButton variant="ghost" size="sm" asChild>
                        <Link href={`/admin/orders/${row.id}`}>View</Link>
                      </MotionButton>
                    ),
                  },
                ]}
                data={filteredOrders}
                onRowClick={(row) =>
                  (window.location.href = `/admin/orders/${row.id}`)
                }
              />
            ) : (
              <EmptyState
                icon={<Package className="h-8 w-8" />}
                title="No orders found"
                description={
                  searchTerm ||
                  statusFilter !== "all" ||
                  paymentFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Orders will appear here when customers make purchases"
                }
              />
            )}
          </div>
        </EnhancedCard>
      </MotionDiv>
    </MotionDiv>
  );
}
