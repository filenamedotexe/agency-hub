"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ServiceCard } from "./components/service-card";
import { StoreHeader } from "./components/store-header";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter } from "lucide-react";

export default function StorePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("name");

  const {
    data: services,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["store-services"],
    queryFn: async () => {
      const response = await fetch("/api/store/services");
      if (!response.ok) {
        const errorData = await response.text();
        console.error("Store API error:", response.status, errorData);
        throw new Error("Failed to fetch services");
      }
      const data = await response.json();
      console.log("Store services data:", data);
      return data;
    },
  });

  // Filter and sort services
  const filteredServices = services
    ?.filter((service: any) => {
      const matchesSearch =
        service.storeTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.storeDescription
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "all" || service.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a: any, b: any) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "price") return (a.price || 0) - (b.price || 0);
      return a.sortOrder - b.sortOrder;
    });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Store</h1>
          <p className="mt-1 text-gray-600">Loading services...</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[300px]" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Store</h1>
          <p className="mt-1 text-gray-600">
            Browse and purchase services for your business
          </p>
        </div>
        <div className="py-12 text-center">
          <p className="text-red-500">
            Error loading services. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StoreHeader />

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Service Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="GOOGLE_ADS">Google Ads</SelectItem>
            <SelectItem value="FACEBOOK_ADS">Facebook Ads</SelectItem>
            <SelectItem value="WEBSITE_DESIGN">Website Design</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="price">Price</SelectItem>
            <SelectItem value="order">Featured</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Services Grid */}
      {filteredServices?.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-500">No services found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredServices?.map((service: any) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  );
}
