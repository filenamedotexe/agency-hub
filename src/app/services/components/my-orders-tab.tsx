"use client";

import { useQuery } from "@tanstack/react-query";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MotionButton } from "@/components/ui/motion-button";
import { Skeleton, CardSkeleton } from "@/components/ui/skeleton-loader";
import { MotionDiv, MotionListItem } from "@/components/ui/motion-elements";
import { Package, ChevronRight, FileText, Clock } from "lucide-react";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { format } from "date-fns";

const getStatusColor = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "bg-green-100 text-green-800";
    case "PROCESSING":
      return "bg-blue-100 text-blue-800";
    case "AWAITING_CONTRACT":
      return "bg-yellow-100 text-yellow-800";
    case "CANCELLED":
    case "REFUNDED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case "SUCCEEDED":
      return "bg-green-100 text-green-800";
    case "PROCESSING":
      return "bg-blue-100 text-blue-800";
    case "FAILED":
    case "CANCELLED":
    case "REFUNDED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function MyOrdersTab() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["client-orders"],
    queryFn: async () => {
      const response = await fetch("/api/orders");
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">My Order History</h2>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">My Order History</h2>
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="No orders yet"
          description="Start browsing our services to make your first purchase"
          action={
            <MotionButton
              onClick={() => {
                const browseTab = document.querySelector(
                  '[value="browse"]'
                ) as HTMLElement;
                if (browseTab) browseTab.click();
              }}
            >
              Browse Services
            </MotionButton>
          }
        />
      </div>
    );
  }

  return (
    <MotionDiv
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-xl font-semibold">My Order History</h2>
      </MotionDiv>

      <div className="space-y-4">
        {orders.map((order: any, index: number) => (
          <MotionListItem key={order.id} index={index} className="block">
            <EnhancedCard>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Order #{order.orderNumber}
                    </CardTitle>
                    <p className="mt-1 text-sm text-gray-600">
                      {format(
                        new Date(order.createdAt),
                        "MMM d, yyyy 'at' h:mm a"
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.replace(/_/g, " ")}
                    </Badge>
                    <Badge
                      className={getPaymentStatusColor(order.paymentStatus)}
                    >
                      {order.paymentStatus}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-2">
                    {order.items.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-2"
                      >
                        <div>
                          <p className="font-medium">{item.serviceName}</p>
                          <p className="text-sm text-gray-600">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium">
                          ${item.total.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Order Total */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>${order.total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex gap-2">
                      {order.invoice && (
                        <MotionButton variant="outline" size="sm" asChild>
                          <a
                            href={order.invoice.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Invoice
                          </a>
                        </MotionButton>
                      )}
                      {order.contract && order.contract.signedAt && (
                        <MotionButton variant="outline" size="sm" asChild>
                          <Link href={`/store/orders/${order.id}/contract`}>
                            <FileText className="mr-2 h-4 w-4" />
                            Contract
                          </Link>
                        </MotionButton>
                      )}
                    </div>
                    <MotionButton variant="ghost" size="sm" asChild>
                      <Link href={`/store/orders/${order.id}`}>
                        View Details
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Link>
                    </MotionButton>
                  </div>

                  {/* Contract Required Notice */}
                  {order.status === "AWAITING_CONTRACT" && (
                    <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <p className="text-sm text-yellow-800">
                          Contract signature required to activate services
                        </p>
                      </div>
                      <MotionButton size="sm" className="mt-2" asChild>
                        <Link href={`/store/orders/${order.id}`}>
                          Sign Contract
                        </Link>
                      </MotionButton>
                    </div>
                  )}
                </div>
              </CardContent>
            </EnhancedCard>
          </MotionListItem>
        ))}
      </div>
    </MotionDiv>
  );
}
