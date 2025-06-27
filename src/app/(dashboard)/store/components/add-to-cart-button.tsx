"use client";

import { useState } from "react";
import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { MotionButton } from "@/components/ui/motion-button";
import { ShoppingCart, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  serviceTemplateId: string;
  maxQuantity?: number;
  quantity?: number;
  disabled?: boolean;
  className?: string;
}

export function AddToCartButton({
  serviceTemplateId,
  maxQuantity = 1,
  quantity = 1,
  disabled = false,
  className,
}: AddToCartButtonProps) {
  const { addToCart, items } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // Check if item is already in cart
  const itemInCart = items.find(
    (item) => item.serviceTemplateId === serviceTemplateId
  );
  const currentQuantity = itemInCart?.quantity || 0;
  const canAddMore = currentQuantity + quantity <= maxQuantity;

  const handleAddToCart = async () => {
    if (!canAddMore || disabled) return;

    setIsAdding(true);
    try {
      await addToCart(serviceTemplateId, quantity);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    } finally {
      setIsAdding(false);
    }
  };

  if (justAdded) {
    return (
      <MotionButton
        variant="default"
        className={cn("flex-1", className)}
        disabled
      >
        <Check className="mr-2 h-4 w-4" />
        Added!
      </MotionButton>
    );
  }

  return (
    <MotionButton
      variant="default"
      onClick={handleAddToCart}
      disabled={disabled || isAdding || !canAddMore}
      className={cn("flex-1", className)}
    >
      <ShoppingCart className="mr-2 h-4 w-4" />
      {isAdding
        ? "Adding..."
        : itemInCart
          ? `Add More (${currentQuantity})`
          : "Add to Cart"}
    </MotionButton>
  );
}
