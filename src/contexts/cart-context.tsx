"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";

interface CartItem {
  serviceTemplateId: string;
  quantity: number;
  serviceTemplate: {
    id: string;
    name: string;
    price: number;
    storeTitle?: string;
    maxQuantity: number;
  };
}

interface CartContextType {
  items: CartItem[];
  addToCart: (serviceTemplateId: string, quantity?: number) => Promise<void>;
  removeFromCart: (serviceTemplateId: string) => void;
  updateQuantity: (serviceTemplateId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from localStorage or API
  useEffect(() => {
    if (user?.role === "CLIENT") {
      loadCart();
    }
  }, [user]);

  const loadCart = async () => {
    // Try localStorage first for immediate load
    const localCart = localStorage.getItem("cart");
    if (localCart) {
      setItems(JSON.parse(localCart));
    }

    // Then sync with API
    try {
      const response = await fetch("/api/cart");
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
        localStorage.setItem("cart", JSON.stringify(data.items || []));
      }
    } catch (error) {
      console.error("Failed to load cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (serviceTemplateId: string, quantity = 1) => {
    try {
      const response = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceTemplateId, quantity }),
      });

      if (!response.ok) throw new Error("Failed to add to cart");

      const updatedCart = await response.json();
      setItems(updatedCart.items);
      localStorage.setItem("cart", JSON.stringify(updatedCart.items));
      toast.success("Added to cart");
    } catch (error) {
      toast.error("Failed to add to cart");
    }
  };

  const removeFromCart = async (serviceTemplateId: string) => {
    try {
      const response = await fetch(`/api/cart/items/${serviceTemplateId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to remove from cart");

      const updatedCart = await response.json();
      setItems(updatedCart.items);
      localStorage.setItem("cart", JSON.stringify(updatedCart.items));
    } catch (error) {
      toast.error("Failed to remove from cart");
    }
  };

  const updateQuantity = async (
    serviceTemplateId: string,
    quantity: number
  ) => {
    if (quantity < 1) {
      removeFromCart(serviceTemplateId);
      return;
    }

    try {
      const response = await fetch(`/api/cart/items/${serviceTemplateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) throw new Error("Failed to update quantity");

      const updatedCart = await response.json();
      setItems(updatedCart.items);
      localStorage.setItem("cart", JSON.stringify(updatedCart.items));
    } catch (error) {
      toast.error("Failed to update quantity");
    }
  };

  const clearCart = async () => {
    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to clear cart");

      setItems([]);
      localStorage.removeItem("cart");
    } catch (error) {
      toast.error("Failed to clear cart");
    }
  };

  const getTotalItems = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce(
      (sum, item) => sum + item.serviceTemplate.price * item.quantity,
      0
    );
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
