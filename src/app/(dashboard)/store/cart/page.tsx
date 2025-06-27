"use client";

import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Minus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const router = useRouter();
  const { items, removeFromCart, updateQuantity, getTotalPrice, clearCart } =
    useCart();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) return;

    setIsProcessing(true);
    try {
      // Create checkout session directly
      const checkoutResponse = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            serviceTemplateId: item.serviceTemplateId,
            quantity: item.quantity,
          })),
        }),
      });

      if (!checkoutResponse.ok) {
        const error = await checkoutResponse.text();
        console.error("Checkout failed:", error);
        throw new Error("Failed to create checkout session");
      }

      const { checkoutUrl } = await checkoutResponse.json();

      // Redirect to Stripe checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to proceed to checkout. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="mb-4 text-gray-500">Your cart is empty</p>
            <Button asChild>
              <Link href="/store">Continue Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold">Shopping Cart</h1>

      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.serviceTemplateId}>
            <CardContent className="flex items-center justify-between py-6">
              <div className="flex-1">
                <h3 className="font-semibold">
                  {item.serviceTemplate.storeTitle || item.serviceTemplate.name}
                </h3>
                <p className="text-gray-500">
                  ${item.serviceTemplate.price.toLocaleString()} each
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    updateQuantity(item.serviceTemplateId, item.quantity - 1)
                  }
                  disabled={item.quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    updateQuantity(item.serviceTemplateId, item.quantity + 1)
                  }
                  disabled={item.quantity >= item.serviceTemplate.maxQuantity}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFromCart(item.serviceTemplateId)}
                  className="ml-4"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="ml-6 text-right">
                <p className="font-semibold">
                  $
                  {(
                    item.serviceTemplate.price * item.quantity
                  ).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>${getTotalPrice().toLocaleString()}</span>
          </div>
          <div className="mt-6 space-y-2">
            <Button
              className="w-full"
              size="lg"
              onClick={handleCheckout}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Proceed to Checkout"}
            </Button>
            <Button variant="outline" className="w-full" onClick={clearCart}>
              Clear Cart
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
