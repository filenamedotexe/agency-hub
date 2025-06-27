"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, DollarSign } from "lucide-react";
import Link from "next/link";

export default function SimpleStorePage() {
  const { data: services, isLoading } = useQuery({
    queryKey: ["store-services"],
    queryFn: async () => {
      const response = await fetch("/api/store/services");
      if (!response.ok) throw new Error("Failed to fetch services");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Store</h1>
          <p className="mt-1 text-gray-600">
            Browse and purchase services for your business
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[300px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Store</h1>
          <p className="mt-1 text-gray-600">
            Browse and purchase services for your business
          </p>
        </div>
        <Button asChild>
          <Link href="/store/cart">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Cart
          </Link>
        </Button>
      </div>

      {!services || services.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-500">
            No services available for purchase at the moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service: any) => (
            <Card key={service.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{service.storeTitle || service.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {service.storeDescription || service.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex items-baseline gap-2">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <span className="text-3xl font-bold">{service.price}</span>
                  <span className="text-gray-500">USD</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Add to Cart</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
