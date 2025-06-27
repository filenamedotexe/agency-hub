"use client";

import { ReactNode, Suspense } from "react";
import { CartProvider } from "@/contexts/cart-context";
import { SessionProvider } from "@/components/providers/session-provider";
import { LayoutWrapper } from "./layout-wrapper";
import { Skeleton } from "@/components/ui/skeleton-loader";
import { MotionDiv } from "@/components/ui/motion-elements";

interface ServicesLayoutProps {
  children: ReactNode;
}

export default function ServicesLayout({ children }: ServicesLayoutProps) {
  return (
    <SessionProvider>
      <CartProvider>
        <LayoutWrapper>
          <Suspense
            fallback={
              <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="mb-2 h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-96 w-full" />
              </MotionDiv>
            }
          >
            {children}
          </Suspense>
        </LayoutWrapper>
      </CartProvider>
    </SessionProvider>
  );
}
