import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { SessionProvider } from "@/components/providers/session-provider";
import { UserRole } from "@prisma/client";

const allowedRoles = [
  UserRole.ADMIN,
  UserRole.SERVICE_MANAGER,
  UserRole.COPYWRITER,
  UserRole.EDITOR,
  UserRole.VA,
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <SessionProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </SessionProvider>
    </ProtectedRoute>
  );
}
