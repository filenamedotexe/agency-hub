import { createClient } from "@/lib/supabase/client";
import { SignUpData, SignInData, AuthUser } from "@/types/auth";

export class AuthClientService {
  private supabase;

  constructor() {
    this.supabase = createClient();
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
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return {
        error: {
          message: error.message || "Sign out failed",
          code: error.code,
        },
      };
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) return null;

      // Fetch user profile from API
      const response = await fetch("/api/auth/me");
      if (!response.ok) return null;

      const data = await response.json();
      return data.user;
    } catch (error) {
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
