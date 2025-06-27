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
import { Search, Filter, Sparkles, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MotionButton } from "@/components/ui/motion-button";
import { MotionDiv, MotionInput } from "@/components/ui/motion-elements";
import { cn } from "@/lib/utils";

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
      <MotionDiv
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <MotionDiv
          className="space-y-2 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-4xl font-bold text-transparent">
            Service Store
          </h1>
          <p className="text-gray-600">Loading amazing services for you...</p>
        </MotionDiv>
        <MotionDiv className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[400px] rounded-lg" />
          ))}
        </MotionDiv>
      </MotionDiv>
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

  const totalServices = services?.length || 0;
  const resultCount = filteredServices?.length || 0;

  return (
    <MotionDiv
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <StoreHeader />

      {/* Hero Section */}
      <MotionDiv
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-blue-500/10 to-purple-500/10 p-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="relative z-10">
          <Badge className="mb-4 bg-white/90 text-primary">
            <Sparkles className="mr-1 h-3 w-3" />
            {totalServices} Services Available
          </Badge>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            Transform Your Business Today
          </h2>
          <p className="mx-auto max-w-2xl text-gray-600">
            Browse our curated selection of professional services designed to
            help your business grow
          </p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5" />
      </MotionDiv>

      {/* Filters and Search */}
      <MotionDiv
        className="rounded-lg border bg-white p-4 shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <MotionInput
              placeholder="Search services by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger
              className="h-11 w-full md:w-[200px]"
              data-testid="service-type-filter"
            >
              <Filter className="mr-2 h-4 w-4" />
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
            <SelectTrigger
              className="h-11 w-full md:w-[150px]"
              data-testid="sort-filter"
            >
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="price">Price: Low to High</SelectItem>
              <SelectItem value="order">Featured First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        {searchTerm || typeFilter !== "all" ? (
          <div className="mt-4 text-sm text-gray-600">
            Showing {resultCount} of {totalServices} services
          </div>
        ) : null}
      </MotionDiv>

      {/* Services Grid */}
      {filteredServices?.length === 0 ? (
        <MotionDiv
          className="py-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            No services found
          </h3>
          <p className="mb-6 text-gray-500">
            Try adjusting your search or filters
          </p>
          <MotionButton
            variant="outline"
            onClick={() => {
              setSearchTerm("");
              setTypeFilter("all");
            }}
          >
            Clear filters
          </MotionButton>
        </MotionDiv>
      ) : (
        <>
          <MotionDiv
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {filteredServices?.map((service: any) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </MotionDiv>

          {/* Call to action */}
          <MotionDiv
            className="mt-12 py-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <p className="mb-4 text-gray-600">
              Need something specific? We&apos;re here to help!
            </p>
            <MotionButton variant="outline">Contact Sales Team</MotionButton>
          </MotionDiv>
        </>
      )}
    </MotionDiv>
  );
}
