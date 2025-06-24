"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { AuthClientService } from "@/services/auth.client";
import { AuthUser, AuthSession } from "@/types/auth";

interface AuthContextType extends AuthSession {
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Check if we're in test mode
  const isTestMode =
    typeof window !== "undefined" &&
    document.cookie.includes("test-auth-bypass=true");

  const [session, setSession] = useState<AuthSession>({
    user: null,
    isLoading: !isTestMode, // If in test mode, don't show loading
    error: null,
  });

  const authService = useMemo(() => new AuthClientService(), []);

  const checkUser = useCallback(async () => {
    // Skip auth check in test mode
    if (isTestMode) {
      setSession({
        user: {
          id: "test-user",
          email: "admin@example.com",
          role: "ADMIN" as any,
        },
        isLoading: false,
        error: null,
      });
      return;
    }

    console.log("[AuthProvider] Checking user...");
    try {
      const user = await authService.getCurrentUser();
      console.log("[AuthProvider] User found:", user?.email);
      setSession({ user, isLoading: false, error: null });
    } catch (error) {
      console.error("[AuthProvider] Auth check failed:", error);
      setSession({ user: null, isLoading: false, error: null });
    }
  }, [isTestMode, authService]);

  useEffect(() => {
    // Check initial auth state
    checkUser();

    // Skip subscription in test mode
    if (isTestMode) return;

    // Subscribe to auth state changes
    const subscription = authService.onAuthStateChange((user) => {
      setSession((prev) => ({ ...prev, user, isLoading: false }));
    });

    return () => {
      subscription.data.subscription.unsubscribe();
    };
  }, [checkUser, isTestMode, authService]);

  const signIn = async (email: string, password: string) => {
    setSession((prev) => ({ ...prev, isLoading: true, error: null }));

    const { user, error } = await authService.signIn({ email, password });

    if (error) {
      setSession((prev) => ({ ...prev, isLoading: false, error }));
      return { error };
    }

    setSession({ user, isLoading: false, error: null });
    return { error: null };
  };

  const signOut = async () => {
    // Don't set loading during logout to prevent infinite spinner
    await authService.signOut();

    // Clear the session without setting loading
    setSession({ user: null, isLoading: false, error: null });

    // Navigate to login page
    router.push("/login");
  };

  const refreshUser = async () => {
    await checkUser();
  };

  const value: AuthContextType = {
    ...session,
    signIn,
    signOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useRequireAuth(redirectTo = "/login") {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(redirectTo);
    }
  }, [user, isLoading, router, redirectTo]);

  return { user, isLoading };
}

export function useRequireRole(
  allowedRoles: string[],
  redirectTo = "/dashboard"
) {
  const { user, isLoading } = useRequireAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !allowedRoles.includes(user.role)) {
      router.push(redirectTo);
    }
  }, [user, isLoading, allowedRoles, router, redirectTo]);

  return { user, isLoading };
}
