"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton, CardSkeleton } from "@/components/ui/skeleton-loader";
import {
  Search,
  Filter,
  Sparkles,
  ShoppingBag,
  ShoppingCart,
  DollarSign,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MotionButton } from "@/components/ui/motion-button";
import {
  MotionDiv,
  MotionInput,
  MotionBadge,
} from "@/components/ui/motion-elements";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { EmptyState } from "@/components/ui/empty-state";

const typeLabels: Record<string, string> = {
  GOOGLE_ADS: "Google Ads",
  FACEBOOK_ADS: "Facebook Ads",
  WEBSITE_DESIGN: "Website Design",
};

const typeColors: Record<string, string> = {
  GOOGLE_ADS: "bg-blue-100 text-blue-700",
  FACEBOOK_ADS: "bg-indigo-100 text-indigo-700",
  WEBSITE_DESIGN: "bg-purple-100 text-purple-700",
};

export default function BrowseTab() {
  const router = useRouter();
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
        throw new Error("Failed to fetch services");
      }
      return response.json();
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
        <div className="flex flex-col gap-4 md:flex-row">
          <Skeleton className="h-11 flex-1" />
          <Skeleton className="h-11 w-full md:w-[200px]" />
          <Skeleton className="h-11 w-full md:w-[150px]" />
        </div>
        <MotionDiv className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </MotionDiv>
      </MotionDiv>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-8 w-8" />}
        title="Error loading services"
        description="We couldn't load the available services. Please try again later."
      />
    );
  }

  const totalServices = services?.length || 0;
  const resultCount = filteredServices?.length || 0;

  return (
    <MotionDiv
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero Section */}
      <MotionDiv
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-blue-500/10 to-purple-500/10 p-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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
      </MotionDiv>

      {/* Filters and Search */}
      <MotionDiv
        className="rounded-lg border bg-white p-4 shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
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
            <SelectTrigger className="h-11 w-full md:w-[200px]">
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
            <SelectTrigger className="h-11 w-full md:w-[150px]">
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
        <EmptyState
          icon={<ShoppingBag className="h-8 w-8" />}
          title="No services found"
          description="Try adjusting your search or filters"
          action={
            <MotionButton
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("all");
              }}
            >
              Clear filters
            </MotionButton>
          }
        />
      ) : (
        <>
          <MotionDiv
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {filteredServices?.map((service: any, index: number) => (
              <MotionDiv
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <EnhancedCard
                  onClick={() => router.push(`/store/services/${service.id}`)}
                  className="h-full"
                >
                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold">
                        {service.storeTitle || service.name}
                      </h3>
                      <MotionBadge
                        variant="secondary"
                        className={typeColors[service.type]}
                      >
                        {typeLabels[service.type]}
                      </MotionBadge>
                    </div>

                    <p className="mb-4 line-clamp-3 text-sm text-gray-600">
                      {service.storeDescription || service.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-lg font-bold text-gray-900">
                        <DollarSign className="h-5 w-5" />
                        {service.price?.toFixed(2) || "0.00"}
                      </div>
                      <MotionButton size="sm">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Add to Cart
                      </MotionButton>
                    </div>

                    {service.features && service.features.length > 0 && (
                      <div className="mt-4 space-y-1">
                        {service.features
                          .slice(0, 3)
                          .map((feature: string, i: number) => (
                            <div key={i} className="text-xs text-gray-500">
                              • {feature}
                            </div>
                          ))}
                        {service.features.length > 3 && (
                          <div className="text-xs text-gray-400">
                            +{service.features.length - 3} more features
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </EnhancedCard>
              </MotionDiv>
            ))}
          </MotionDiv>

          {/* Call to action */}
          <MotionDiv
            className="mt-12 py-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
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
