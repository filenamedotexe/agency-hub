"use client";

import { useQuery } from "@tanstack/react-query";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { MotionBadge } from "@/components/ui/motion-elements";
import { MotionButton } from "@/components/ui/motion-button";
import { CardSkeleton, FormSkeleton } from "@/components/ui/skeleton-loader";
import { MotionDiv, MotionListItem } from "@/components/ui/motion-elements";
import { EmptyState } from "@/components/ui/empty-state";
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
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-4">
          <MotionButton
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </MotionButton>
          <h1 className="text-3xl font-bold">Order Details</h1>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="space-y-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </MotionDiv>
    );
  }

  if (!order) {
    return (
      <MotionDiv
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="py-16 text-center"
      >
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title="Order not found"
          description="The order you're looking for doesn't exist."
        />
        <MotionButton className="mt-4" asChild>
          <Link href="/admin/orders">Back to Orders</Link>
        </MotionButton>
      </MotionDiv>
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
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-6xl space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <MotionButton
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </MotionButton>
          <div>
            <h1 className="text-3xl font-bold">Order #{order.orderNumber}</h1>
            <p className="text-gray-600">
              Created{" "}
              {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>
        <MotionButton onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </MotionButton>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order Summary */}
          <MotionListItem index={0}>
            <EnhancedCard>
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Order Summary</h3>
                  <div className="flex gap-2">
                    <MotionBadge>{order.status.replace(/_/g, " ")}</MotionBadge>
                    <MotionBadge variant="outline">
                      {order.paymentStatus}
                    </MotionBadge>
                  </div>
                </div>
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
                            <MotionButton
                              variant="link"
                              size="sm"
                              className="mt-1 h-auto p-0"
                              asChild
                            >
                              <Link href={`/admin/services/${item.serviceId}`}>
                                View Service →
                              </Link>
                            </MotionButton>
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
              </div>
            </EnhancedCard>
          </MotionListItem>

          {/* Order Timeline */}
          <MotionListItem index={1}>
            <EnhancedCard>
              <div className="p-6">
                <h3 className="mb-4 text-lg font-semibold">Order Timeline</h3>
                <OrderTimeline items={timelineItems} />
              </div>
            </EnhancedCard>
          </MotionListItem>

          {/* Documents */}
          <MotionListItem index={2}>
            <EnhancedCard>
              <div className="p-6">
                <h3 className="mb-4 text-lg font-semibold">Documents</h3>
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
                          <MotionButton
                            variant="outline"
                            size="sm"
                            onClick={handleSendInvoice}
                          >
                            Send
                          </MotionButton>
                        )}
                        <MotionButton variant="outline" size="sm" asChild>
                          <a
                            href={order.invoice.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </a>
                        </MotionButton>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <p className="text-sm text-gray-600">
                        No invoice generated yet
                      </p>
                      <MotionButton
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateInvoice}
                        disabled={isGeneratingInvoice}
                      >
                        {isGeneratingInvoice
                          ? "Generating..."
                          : "Generate Invoice"}
                      </MotionButton>
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
                      <MotionButton variant="outline" size="sm" asChild>
                        <Link href={`/admin/orders/${order.id}/contract`}>
                          View
                        </Link>
                      </MotionButton>
                    </div>
                  )}
                </div>
              </div>
            </EnhancedCard>
          </MotionListItem>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <MotionListItem index={3}>
            <EnhancedCard>
              <div className="p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <User className="h-4 w-4" />
                  Customer Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Business
                    </p>
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
                  <MotionButton
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link href={`/admin/clients/${order.client.id}`}>
                      View Client Profile
                    </Link>
                  </MotionButton>
                </div>
              </div>
            </EnhancedCard>
          </MotionListItem>

          {/* Actions */}
          <MotionListItem index={4}>
            <EnhancedCard>
              <div className="p-6">
                <h3 className="mb-4 text-lg font-semibold">Actions</h3>
                <div className="space-y-2">
                  {order.status !== "CANCELLED" &&
                    order.status !== "REFUNDED" && (
                      <>
                        {order.paymentStatus === "SUCCEEDED" && (
                          <MotionButton
                            variant="destructive"
                            className="w-full"
                            asChild
                          >
                            <Link href={`/admin/orders/${order.id}/refund`}>
                              Process Refund
                            </Link>
                          </MotionButton>
                        )}
                        <MotionButton
                          variant="outline"
                          className="w-full"
                          onClick={handleCancelOrder}
                        >
                          Cancel Order
                        </MotionButton>
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
                </div>
              </div>
            </EnhancedCard>
          </MotionListItem>
        </div>
      </div>
    </MotionDiv>
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
