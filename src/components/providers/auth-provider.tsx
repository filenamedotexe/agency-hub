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

  const [session, setSession] = useState<AuthSession>({
    user: null,
    isLoading: true,
    error: null,
  });

  const authService = useMemo(() => new AuthClientService(), []);

  const checkUser = useCallback(async () => {
    console.log("[AuthProvider] Checking user...");
    try {
      const user = await authService.getCurrentUser();
      console.log("[AuthProvider] User found:", user?.email);
      setSession({ user, isLoading: false, error: null });
    } catch (error) {
      console.error("[AuthProvider] Auth check failed:", error);
      setSession({ user: null, isLoading: false, error: null });
    }
  }, [authService]);

  useEffect(() => {
    // Check initial auth state
    checkUser();

    // Subscribe to auth state changes
    const subscription = authService.onAuthStateChange((user) => {
      setSession((prev) => ({ ...prev, user, isLoading: false }));
    });

    return () => {
      subscription.data.subscription.unsubscribe();
    };
  }, [checkUser, authService]);

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
    console.log("[AuthProvider] Starting logout...");

    // Clear session immediately to prevent UI issues
    setSession({ user: null, isLoading: false, error: null });

    // Call the auth service to sign out in the background
    // Don't wait for it to complete to avoid blocking the UI
    authService.signOut().catch((error) => {
      console.error("[AuthProvider] Background logout error:", error);
    });

    // Immediately redirect to login
    router.push("/login");

    console.log("[AuthProvider] Logout completed, redirected to login");
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
