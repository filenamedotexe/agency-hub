import { ProtectedRoute } from "@/components/auth/protected-route";
import { ClientLayout } from "@/components/layouts/client-layout";
import { SessionProvider } from "@/components/providers/session-provider";
import { UserRole } from "@prisma/client";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={[UserRole.CLIENT]}>
      <SessionProvider>
        <ClientLayout>{children}</ClientLayout>
      </SessionProvider>
    </ProtectedRoute>
  );
}
