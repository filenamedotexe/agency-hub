import { createClient } from "@/lib/supabase/client";
import { SignUpData, SignInData, AuthUser } from "@/types/auth";
import { prisma } from "@/lib/prisma";

export class AuthService {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  async signUp({ email, password, role, profileData }: SignUpData) {
    try {
      // 1. Create Supabase auth user
      const { data: authData, error: authError } =
        await this.supabase.auth.signUp({
          email,
          password,
        });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      // 2. Create user record in our database
      const user = await prisma.user.create({
        data: {
          id: authData.user.id,
          email,
          role,
          profileData: profileData || {},
        },
      });

      return { user, error: null };
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
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error("Sign in failed");

      // Fetch user data from our database
      const user = await prisma.user.findUnique({
        where: { id: data.user.id },
      });

      if (!user) throw new Error("User profile not found");

      return { user, error: null };
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

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      return dbUser;
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
        const dbUser = await prisma.user.findUnique({
          where: { id: session.user.id },
        });
        callback(dbUser);
      } else {
        callback(null);
      }
    });
  }
}
