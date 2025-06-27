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
import { authLog, authTime, authTimeEnd, authError } from "@/lib/auth-debug";
import {
  getAuthState,
  setAuthState,
  shouldCheckAuth,
  clearAuthState,
} from "@/lib/auth-state";

interface AuthContextType extends AuthSession {
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Initialize from global state to prevent loading on navigation
  const globalState = getAuthState();
  const [session, setSession] = useState<AuthSession>({
    user: globalState.user,
    isLoading: !globalState.isInitialized || shouldCheckAuth(),
    error: null,
  });
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  const authService = useMemo(() => new AuthClientService(), []);

  const checkUser = useCallback(async () => {
    // Prevent multiple simultaneous auth checks
    if (isCheckingAuth) {
      authLog("checkUser already in progress, skipping");
      return;
    }

    setIsCheckingAuth(true);
    authLog("checkUser started");
    authTime("checkUser");

    try {
      const user = await authService.getCurrentUser();
      authTimeEnd("checkUser");
      authLog("User found:", user?.email, user?.role);

      // Save to global state
      setAuthState(user);

      setSession({ user, isLoading: false, error: null });
    } catch (error) {
      authTimeEnd("checkUser");
      authError("Auth check failed", error);

      // Clear global state on auth failure
      clearAuthState();

      setSession({ user: null, isLoading: false, error: null });
    } finally {
      setIsCheckingAuth(false);
    }
  }, [authService, isCheckingAuth]);

  useEffect(() => {
    // Only check if we should check auth (not initialized or expired)
    if (session.isLoading) {
      checkUser();
    }

    // Subscribe to auth state changes
    const subscription = authService.onAuthStateChange((user) => {
      authLog("Auth state changed:", user?.email);

      // Update global state on auth changes
      if (user) {
        setAuthState(user);
      } else {
        clearAuthState();
      }
      setSession((prev) => ({ ...prev, user, isLoading: false }));
    });

    return () => {
      subscription.data.subscription.unsubscribe();
    };
  }, [session.isLoading, checkUser, authService]); // Include necessary dependencies

  // Add loading timeout to prevent infinite loading
  useEffect(() => {
    if (!session.isLoading) return;

    const timeout = setTimeout(() => {
      if (session.isLoading && !isCheckingAuth) {
        authLog(
          "Loading timeout after 10s - using cached state or forcing complete"
        );

        // Try to use cached global state first
        const cachedState = getAuthState();
        if (cachedState.user && cachedState.isInitialized) {
          authLog("Using cached auth state");
          setSession({
            user: cachedState.user,
            isLoading: false,
            error: null,
          });
        } else {
          // If no cache, force complete with no user
          setSession({
            user: null,
            isLoading: false,
            error: null,
          });
        }
        setLoadingTimeout(true);
      }
    }, 3000); // 3 second timeout with optimized auth calls

    return () => clearTimeout(timeout);
  }, [session.isLoading, isCheckingAuth]);

  const signIn = async (email: string, password: string) => {
    setSession((prev) => ({ ...prev, isLoading: true, error: null }));

    const { user, error } = await authService.signIn({ email, password });

    if (error) {
      setSession((prev) => ({ ...prev, isLoading: false, error }));
      return { error };
    }

    // Save to global state on successful login
    setAuthState(user);

    setSession({ user, isLoading: false, error: null });
    return { error: null };
  };

  const signOut = async () => {
    console.log("[AuthProvider] Starting logout...");

    // Clear global auth state immediately
    clearAuthState();

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
