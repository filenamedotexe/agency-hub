"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  FileText,
  Download,
  RefreshCw,
  DollarSign,
  User,
  Mail,
  Phone,
  Building,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { OrderTimeline } from "@/app/(dashboard)/store/components/order-timeline";
import { toast } from "sonner";
import { useState } from "react";

export default function AdminOrderDetailPage({
  params,
}: {
  params: { orderId: string };
}) {
  const router = useRouter();
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

  const {
    data: order,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-order", params.orderId],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${params.orderId}`);
      if (!response.ok) throw new Error("Failed to fetch order");
      return response.json();
    },
  });

  const handleGenerateInvoice = async () => {
    setIsGeneratingInvoice(true);
    try {
      const response = await fetch(
        `/api/admin/orders/${params.orderId}/invoice`,
        {
          method: "POST",
        }
      );

      if (!response.ok) throw new Error("Failed to generate invoice");

      toast.success("Invoice generated successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to generate invoice");
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const handleSendInvoice = async () => {
    try {
      const response = await fetch(
        `/api/admin/orders/${params.orderId}/invoice/send`,
        {
          method: "POST",
        }
      );

      if (!response.ok) throw new Error("Failed to send invoice");

      toast.success("Invoice sent successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to send invoice");
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    try {
      const response = await fetch(
        `/api/admin/orders/${params.orderId}/cancel`,
        {
          method: "POST",
        }
      );

      if (!response.ok) throw new Error("Failed to cancel order");

      toast.success("Order cancelled successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to cancel order");
    }
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
          <Link href="/admin/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

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
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Order #{order.orderNumber}</h1>
            <p className="text-gray-600">
              Created{" "}
              {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
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
                            <Link href={`/admin/services/${item.serviceId}`}>
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
                        format(
                          new Date(order.paidAt),
                          "MMM d, yyyy 'at' h:mm a"
                        )}
                    </p>
                    {order.stripePaymentIntentId && (
                      <p className="mt-1 text-xs text-gray-500">
                        Stripe ID: {order.stripePaymentIntentId}
                      </p>
                    )}
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
                {order.invoice ? (
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
                    <div className="flex gap-2">
                      {!order.invoice.sentAt && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSendInvoice}
                        >
                          Send
                        </Button>
                      )}
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
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <p className="text-sm text-gray-600">
                      No invoice generated yet
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateInvoice}
                      disabled={isGeneratingInvoice}
                    >
                      {isGeneratingInvoice
                        ? "Generating..."
                        : "Generate Invoice"}
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
                      <Link href={`/admin/orders/${order.id}/contract`}>
                        View
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Business</p>
                <p className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-400" />
                  {order.client.businessName}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Contact</p>
                <p>{order.client.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  {order.client.email}
                </p>
              </div>
              {order.client.phone && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Phone</p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {order.client.phone}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Lifetime Value
                </p>
                <p className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />$
                  {order.client.lifetimeValue || 0}
                </p>
              </div>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={`/admin/clients/${order.client.id}`}>
                  View Client Profile
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {order.status !== "CANCELLED" && order.status !== "REFUNDED" && (
                <>
                  {order.paymentStatus === "SUCCEEDED" && (
                    <Button variant="destructive" className="w-full" asChild>
                      <Link href={`/admin/orders/${order.id}/refund`}>
                        Process Refund
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleCancelOrder}
                  >
                    Cancel Order
                  </Button>
                </>
              )}

              {order.notes && (
                <div className="pt-4">
                  <p className="mb-2 text-sm font-medium text-gray-600">
                    Order Notes
                  </p>
                  <p className="rounded bg-gray-50 p-3 text-sm text-gray-700">
                    {order.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
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
