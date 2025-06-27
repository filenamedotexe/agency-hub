"use client";

import { CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { MotionButton } from "@/components/ui/motion-button";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "./add-to-cart-button";
import Link from "next/link";
import { ArrowRight, FileText, Sparkles, Clock, Shield } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    metadata?: any;
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

  const isPopular = service.metadata?.popular || false;
  const estimatedDelivery = service.metadata?.estimatedDelivery || "2-3 weeks";

  return (
    <TooltipProvider>
      <EnhancedCard
        className="group relative flex h-full flex-col overflow-hidden"
        data-testid="service-card"
      >
        {/* Popular badge */}
        {isPopular && (
          <div className="absolute right-4 top-4 z-10">
            <Badge className="border-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
              <Sparkles className="mr-1 h-3 w-3" />
              Popular
            </Badge>
          </div>
        )}

        <CardHeader className="relative">
          <div className="mb-3 flex items-start justify-between">
            <Badge
              variant="secondary"
              className="border-indigo-200 bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700"
              data-testid="service-type-badge"
            >
              {getTypeLabel(service.type)}
            </Badge>
          </div>

          <h3 className="line-clamp-2 text-xl font-semibold transition-colors group-hover:text-primary">
            {displayTitle}
          </h3>

          <div className="mt-3 space-y-2">
            <p
              className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-2xl font-bold text-transparent"
              data-testid="service-price"
            >
              {formatPrice(service.price)}
            </p>

            {/* Service features */}
            <div className="flex flex-wrap gap-2 text-sm">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{estimatedDelivery}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Estimated delivery time</p>
                </TooltipContent>
              </Tooltip>

              {service.requiresContract && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Shield className="h-3 w-3" />
                      <span>Contract</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Service agreement required</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1">
          <p className="line-clamp-3 leading-relaxed text-gray-600">
            {displayDescription}
          </p>
        </CardContent>

        <CardFooter className="flex gap-2 border-t bg-gray-50/50 pt-6">
          <MotionButton
            variant="outline"
            asChild
            className="flex-1 transition-all hover:bg-primary hover:text-white"
          >
            <Link href={`/store/${service.id}`}>
              Details
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </MotionButton>
          <AddToCartButton
            serviceTemplateId={service.id}
            maxQuantity={service.maxQuantity}
            disabled={!service.price}
          />
        </CardFooter>
      </EnhancedCard>
    </TooltipProvider>
  );
}
