"use client";

import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function StoreHeader() {
  const { getTotalItems } = useCart();
  const itemCount = getTotalItems();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Service Store</h1>
        <p className="mt-1 text-gray-600">
          Browse and purchase services for your business
        </p>
      </div>
      <Button asChild className="relative">
        <Link href="/store/cart">
          <ShoppingCart className="mr-2 h-4 w-4" />
          Cart
          {itemCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 flex h-5 w-5 items-center justify-center rounded-full p-0"
            >
              {itemCount}
            </Badge>
          )}
        </Link>
      </Button>
    </div>
  );
}
