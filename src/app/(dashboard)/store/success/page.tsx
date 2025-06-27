"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, FileText } from "lucide-react";
import { ContractSignature } from "@/components/store/contract-signature";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) throw new Error("Failed to fetch order");
      const data = await response.json();
      setOrder(data);
    } catch (error) {
      console.error("Failed to fetch order:", error);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleContractComplete = () => {
    router.push("/services");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-600">Order not found</p>
      </div>
    );
  }

  // Check if any services require contract
  const requiresContract = order.items.some(
    (item: any) => item.serviceTemplate.requiresContract
  );

  if (requiresContract && !order.contract?.signedAt) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <div className="mb-8 text-center">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h1 className="mb-2 text-3xl font-bold">Payment Successful!</h1>
          <p className="text-gray-600">
            Please sign the service agreement to activate your services
          </p>
        </div>

        <ContractSignature
          contractContent={order.items[0].serviceTemplate.contractTemplate}
          orderId={order.id}
          onComplete={handleContractComplete}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
      <h1 className="mb-2 text-3xl font-bold">Order Complete!</h1>
      <p className="mb-8 text-gray-600">
        Your order #{order.orderNumber} has been confirmed and your services are
        being set up.
      </p>

      <div className="space-y-4">
        <Button asChild>
          <Link href="/services">View Your Services</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/store/orders">View Order History</Link>
        </Button>
      </div>
    </div>
  );
}
