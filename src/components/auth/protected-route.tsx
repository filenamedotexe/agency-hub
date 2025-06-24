"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { UserRole } from "@prisma/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Test environment bypass - check for test cookie
  const isTestMode =
    typeof window !== "undefined" &&
    document.cookie.includes("test-auth-bypass=true");

  useEffect(() => {
    if (isTestMode) {
      // In test mode, skip all auth checks
      return;
    }

    if (!isLoading && !user) {
      router.push(redirectTo);
    } else if (
      !isLoading &&
      user &&
      allowedRoles &&
      !allowedRoles.includes(user.role)
    ) {
      // Redirect to appropriate dashboard based on role
      if (user.role === "CLIENT") {
        router.push("/client-dashboard");
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, isLoading, allowedRoles, router, redirectTo, isTestMode]);

  // In test mode, always show content
  if (isTestMode) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // In test mode or after loading, show content or nothing
  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return null;
  }

  return <>{children}</>;
}
