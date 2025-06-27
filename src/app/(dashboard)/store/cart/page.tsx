"use client";

import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  ArrowLeft,
  Shield,
  Truck,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <ShoppingCart className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h3 className="mb-2 text-lg font-semibold">Your cart is empty</h3>
            <p className="mb-6 text-gray-500">
              Add some services to get started!
            </p>
            <Button asChild size="lg">
              <Link href="/store">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Continue Shopping
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const hasContractItems = items.some(
    (item) => (item.serviceTemplate as any).requiresContract
  );

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/store">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Store
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        <p className="mt-1 text-gray-600">{items.length} items in your cart</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="space-y-4 lg:col-span-2">
          {items.map((item) => (
            <Card key={item.serviceTemplateId} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row">
                  {/* Service Info */}
                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-semibold">
                      {item.serviceTemplate.storeTitle ||
                        item.serviceTemplate.name}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        ${item.serviceTemplate.price.toLocaleString()} each
                      </Badge>
                      {(item.serviceTemplate as any).requiresContract && (
                        <Badge variant="outline">
                          <Shield className="mr-1 h-3 w-3" />
                          Contract required
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center rounded-lg border">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          updateQuantity(
                            item.serviceTemplateId,
                            item.quantity - 1
                          )
                        }
                        disabled={item.quantity <= 1}
                        className="h-8 w-8 p-0"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span
                        className="px-4 py-1 text-sm font-medium"
                        data-testid="quantity-display"
                      >
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          updateQuantity(
                            item.serviceTemplateId,
                            item.quantity + 1
                          )
                        }
                        disabled={
                          item.quantity >= item.serviceTemplate.maxQuantity
                        }
                        className="h-8 w-8 p-0"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <p
                        className="text-lg font-semibold"
                        data-testid="item-price"
                      >
                        $
                        {(
                          item.serviceTemplate.price * item.quantity
                        ).toLocaleString()}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.serviceTemplateId)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      aria-label="Remove from cart"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subtotal */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    ${subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">Calculated at checkout</span>
                </div>
              </div>

              <Separator />

              {/* Total */}
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary" data-testid="cart-total">
                  ${subtotal.toLocaleString()}
                </span>
              </div>

              {/* Benefits */}
              <div className="space-y-2 pt-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CreditCard className="h-4 w-4 text-green-600" />
                  <span>Secure payment with Stripe</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Truck className="h-4 w-4 text-blue-600" />
                  <span>Fast service delivery</span>
                </div>
                {hasContractItems && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Shield className="h-4 w-4 text-purple-600" />
                    <span>Service agreement protection</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-4">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Proceed to Checkout
                    </>
                  )}
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/store">Continue Shopping</Link>
                </Button>
              </div>

              {/* Security Notice */}
              <Alert className="mt-4">
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Your payment information is secure and encrypted.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
