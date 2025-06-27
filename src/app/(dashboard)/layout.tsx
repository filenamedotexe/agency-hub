import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { SessionProvider } from "@/components/providers/session-provider";
import { CartProvider } from "@/contexts/cart-context";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </CartProvider>
    </SessionProvider>
  );
}
