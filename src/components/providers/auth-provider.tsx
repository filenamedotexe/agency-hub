"use client";

import { createContext, useContext, useEffect, useState } from "react";
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

  const authService = new AuthClientService();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUser = async () => {
    try {
      const user = await authService.getCurrentUser();
      setSession({ user, isLoading: false, error: null });
    } catch (error) {
      setSession({ user: null, isLoading: false, error: null });
    }
  };

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
    setSession((prev) => ({ ...prev, isLoading: true }));

    await authService.signOut();
    setSession({ user: null, isLoading: false, error: null });
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
