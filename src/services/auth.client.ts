import { getSupabaseClient } from "@/lib/supabase/client-singleton";
import { SignUpData, SignInData, AuthUser } from "@/types/auth";
import {
  authLog,
  authTime,
  authTimeEnd,
  authError,
  authWarn,
} from "@/lib/auth-debug";

export class AuthClientService {
  private supabase;
  private userCache: { user: AuthUser | null; expiry: number } | null = null;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  constructor() {
    this.supabase = getSupabaseClient();
  }

  async signUp({ email, password, role, profileData }: SignUpData) {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role, profileData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Sign up failed");
      }

      return { user: data.user, error: null };
    } catch (error: any) {
      return {
        user: null,
        error: {
          message: error.message || "Sign up failed",
          code: error.code,
        },
      };
    }
  }

  async signIn({ email, password }: SignInData) {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Sign in failed");
      }

      return { user: data.user, error: null };
    } catch (error: any) {
      return {
        user: null,
        error: {
          message: error.message || "Sign in failed",
          code: error.code,
        },
      };
    }
  }

  async signOut() {
    try {
      console.log("[AuthClient] Starting logout process...");

      // Clear user cache immediately
      this.userCache = null;

      // Call server logout endpoint first
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Then sign out from Supabase client
      await this.supabase.auth.signOut();

      console.log("[AuthClient] Logout completed successfully");
      return { error: null };
    } catch (error: any) {
      console.error("[AuthClient] Logout error:", error);
      // Even if there's an error, we should still try to clear the session
      // The auth provider will handle the redirect
      return { error: null }; // Don't return error to prevent blocking logout
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    authLog("getCurrentUser called");

    // Check cache first
    if (this.userCache && Date.now() < this.userCache.expiry) {
      authLog("Returning cached user:", this.userCache.user?.email);
      return this.userCache.user;
    }

    authTime("getCurrentUser");
    try {
      authTime("supabase.auth.getUser");
      const {
        data: { user },
      } = await this.supabase.auth.getUser();
      authTimeEnd("supabase.auth.getUser");

      if (!user) {
        authLog("No user from supabase.auth.getUser");
        // Cache null result briefly to prevent rapid re-calls
        this.userCache = { user: null, expiry: Date.now() + 5000 };
        authTimeEnd("getCurrentUser");
        return null;
      }

      authLog("Supabase user found:", user.email);

      // Fetch user profile from API with timeout
      try {
        authTime("fetch /api/auth/me");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch("/api/auth/me", {
          signal: controller.signal,
          headers: {
            "Cache-Control": "no-cache",
          },
        });
        clearTimeout(timeoutId);
        authTimeEnd("fetch /api/auth/me");

        if (!response.ok) {
          authWarn("Auth API returned non-OK status:", response.status);
          authTimeEnd("getCurrentUser");
          return null;
        }

        const data = await response.json();
        authLog("User profile fetched:", data.user?.email, data.user?.role);

        // Cache the successful result
        this.userCache = {
          user: data.user,
          expiry: Date.now() + this.CACHE_DURATION,
        };

        authTimeEnd("getCurrentUser");
        return data.user;
      } catch (fetchError) {
        authError("Auth API call failed", fetchError);
        authTimeEnd("getCurrentUser");
        return null;
      }
    } catch (error) {
      authError("getCurrentUser failed", error);
      authTimeEnd("getCurrentUser");
      return null;
    }
  }

  async refreshSession() {
    try {
      const { data, error } = await this.supabase.auth.refreshSession();
      if (error) throw error;
      return { session: data.session, error: null };
    } catch (error: any) {
      return {
        session: null,
        error: {
          message: error.message || "Session refresh failed",
          code: error.code,
        },
      };
    }
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return this.supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await this.getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    });
  }
}
