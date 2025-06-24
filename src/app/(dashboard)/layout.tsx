import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { SessionProvider } from "@/components/providers/session-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </SessionProvider>
  );
}
