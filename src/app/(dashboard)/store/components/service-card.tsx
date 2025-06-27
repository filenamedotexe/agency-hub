"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "./add-to-cart-button";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";

interface ServiceCardProps {
  service: {
    id: string;
    name: string;
    storeTitle?: string;
    storeDescription?: string;
    price?: number;
    currency: string;
    type: string;
    requiresContract: boolean;
    maxQuantity: number;
  };
}

export function ServiceCard({ service }: ServiceCardProps) {
  const displayTitle = service.storeTitle || service.name;
  const displayDescription =
    service.storeDescription || `Professional ${service.name} service`;

  const formatPrice = (price?: number) => {
    if (!price) return "Contact for pricing";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: service.currency || "USD",
    }).format(price);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "GOOGLE_ADS":
        return "Google Ads";
      case "FACEBOOK_ADS":
        return "Facebook Ads";
      case "WEBSITE_DESIGN":
        return "Website Design";
      default:
        return type;
    }
  };

  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-lg">
      <CardHeader>
        <div className="mb-2 flex items-start justify-between">
          <Badge variant="secondary">{getTypeLabel(service.type)}</Badge>
          {service.requiresContract && (
            <div title="Contract required">
              <FileText className="h-4 w-4 text-gray-400" />
            </div>
          )}
        </div>
        <h3 className="text-xl font-semibold">{displayTitle}</h3>
        <p className="mt-2 text-2xl font-bold text-primary">
          {formatPrice(service.price)}
        </p>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="line-clamp-3 text-gray-600">{displayDescription}</p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" asChild className="flex-1">
          <Link href={`/store/${service.id}`}>
            Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <AddToCartButton
          serviceTemplateId={service.id}
          maxQuantity={service.maxQuantity}
          disabled={!service.price}
        />
      </CardFooter>
    </Card>
  );
}
