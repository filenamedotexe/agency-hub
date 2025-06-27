"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, FileText, Download } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { OrderTimeline } from "../../components/order-timeline";
import { ContractSignature } from "../../components/contract-signature";

export default function OrderDetailPage({
  params,
}: {
  params: { orderId: string };
}) {
  const router = useRouter();
  const {
    data: order,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["order", params.orderId],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${params.orderId}`);
      if (!response.ok) throw new Error("Failed to fetch order");
      return response.json();
    },
  });

  const handleContractComplete = () => {
    refetch();
    router.push("/services");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Order Details</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-600">Order not found</p>
        <Button className="mt-4" asChild>
          <Link href="/store/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  // Check if contract is required and not signed
  const requiresContract = order.items.some(
    (item: any) => item.serviceTemplate.requiresContract
  );
  const needsContractSignature = requiresContract && !order.contract?.signedAt;

  // Build timeline items
  const timelineItems = order.timeline.map((item: any) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    completedAt: item.completedAt,
    status: item.completedAt
      ? "completed"
      : item.status === order.status
        ? "current"
        : "upcoming",
    icon: getTimelineIcon(item.status),
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Order #{order.orderNumber}</h1>
          <p className="text-gray-600">
            Placed on {format(new Date(order.createdAt), "MMMM d, yyyy")}
          </p>
        </div>
      </div>

      {needsContractSignature ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contract Signature Required</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-gray-600">
                Please sign the service agreement to activate your services.
              </p>
            </CardContent>
          </Card>

          <ContractSignature
            contractContent={order.items[0].serviceTemplate.contractTemplate}
            orderId={order.id}
            onComplete={handleContractComplete}
          />
        </div>
      ) : (
        <>
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Order Summary</CardTitle>
                <div className="flex gap-2">
                  <Badge>{order.status.replace(/_/g, " ")}</Badge>
                  <Badge variant="outline">{order.paymentStatus}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Items */}
                <div className="space-y-3">
                  {order.items.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between border-b py-3 last:border-0"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{item.serviceName}</h4>
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity} × ${item.unitPrice}
                        </p>
                        {item.serviceId && (
                          <Button
                            variant="link"
                            size="sm"
                            className="mt-1 h-auto p-0"
                            asChild
                          >
                            <Link href={`/services/${item.serviceId}`}>
                              View Service →
                            </Link>
                          </Button>
                        )}
                      </div>
                      <p className="font-medium">${item.total}</p>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-2 border-t pt-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${order.subtotal}</span>
                  </div>
                  {order.tax > 0 && (
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>${order.tax}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${order.total}</span>
                  </div>
                </div>

                {/* Payment Info */}
                {order.paymentMethod && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600">
                      Paid with {order.paymentMethod} on{" "}
                      {order.paidAt &&
                        format(new Date(order.paidAt), "MMM d, yyyy")}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline items={timelineItems} />
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {order.invoice && (
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium">
                          Invoice #{order.invoice.number}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.invoice.sentAt
                            ? `Sent ${format(
                                new Date(order.invoice.sentAt),
                                "MMM d, yyyy"
                              )}`
                            : "Not sent yet"}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={order.invoice.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </a>
                    </Button>
                  </div>
                )}

                {order.contract && order.contract.signedAt && (
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium">Service Contract</p>
                        <p className="text-sm text-gray-600">
                          Signed by {order.contract.signedByName} on{" "}
                          {format(
                            new Date(order.contract.signedAt),
                            "MMM d, yyyy"
                          )}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/store/orders/${order.id}/contract`}>
                        View
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function getTimelineIcon(status: string) {
  switch (status) {
    case "PENDING":
    case "PROCESSING":
      return "payment";
    case "AWAITING_CONTRACT":
      return "contract";
    case "COMPLETED":
      return "delivered";
    default:
      return "payment";
  }
}
