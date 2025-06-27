"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Plus, Search, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { MotionButton } from "@/components/ui/motion-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { MotionInput } from "@/components/ui/motion-elements";
import { ResponsiveDataTable } from "@/components/ui/responsive-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import type { ClientListResponse } from "@/services/client.service";
import { formatDistanceToNow } from "date-fns";

export function ClientList() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "businessName" | "createdAt">(
    "createdAt"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data, isLoading, error, refetch } = useQuery<ClientListResponse>({
    queryKey: ["clients", { page, pageSize, search, sortBy, sortOrder }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(search && { search }),
        sortBy,
        sortOrder,
      });
      const response = await fetch(`/api/clients?${params}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch clients");
      const result = await response.json();

      // Handle both old and new API response formats
      if (result.data && result.pagination) {
        return {
          clients: result.data,
          page: result.pagination.page,
          pageSize: result.pagination.pageSize,
          total: result.pagination.total,
          totalPages: result.pagination.totalPages,
        };
      }

      // Fallback for old format
      return result;
    },
  });

  const handleRowClick = (clientId: string) => {
    router.push(`/clients/${clientId}`);
  };

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-800">
          Error loading clients. Please try again.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Header with search and add button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <MotionInput
            placeholder="Search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <MotionButton onClick={() => router.push("/clients/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </MotionButton>
      </div>

      {/* Sorting controls */}
      <div className="flex flex-wrap gap-2">
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Date Added</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="businessName">Business Name</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sortOrder}
          onValueChange={(value: any) => setSortOrder(value)}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Newest First</SelectItem>
            <SelectItem value="asc">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {data?.clients.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="No clients found"
          description={
            search
              ? "No clients match your search criteria"
              : "Start by adding your first client"
          }
          action={
            <MotionButton size="sm" onClick={() => router.push("/clients/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </MotionButton>
          }
        />
      ) : (
        <ResponsiveDataTable
          columns={[
            {
              key: "name",
              label: "Name",
              priority: "high",
              renderCell: (value) => <div className="font-medium">{value}</div>,
            },
            {
              key: "businessName",
              label: "Business",
              priority: "high",
            },
            {
              key: "dudaSiteId",
              label: "Duda Site ID",
              priority: "low",
              renderCell: (value) => value || "-",
            },
            {
              key: "createdAt",
              label: "Added",
              priority: "medium",
              renderCell: (value) => (
                <span className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(value), {
                    addSuffix: true,
                  })}
                </span>
              ),
            },
          ]}
          data={data?.clients || []}
          onRowClick={(client) => handleRowClick(client.id)}
        />
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, data.total)} of {data.total} clients
          </p>
          <div className="flex items-center gap-2">
            <MotionButton
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </MotionButton>
            <div className="flex items-center gap-1 text-sm">
              Page {page} of {data.totalPages}
            </div>
            <MotionButton
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === data.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </MotionButton>
          </div>
        </div>
      )}
    </div>
  );
}
