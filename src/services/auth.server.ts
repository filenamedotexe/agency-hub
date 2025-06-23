import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { AuthUser } from "@/types/auth";
import { cookies } from "next/headers";

export class ServerAuthService {
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      return dbUser;
    } catch (error) {
      return null;
    }
  }

  static async requireAuth(): Promise<AuthUser> {
    const user = await this.getCurrentUser();
    if (!user) {
      throw new Error("Authentication required");
    }
    return user;
  }

  static async requireRole(roles: string[]): Promise<AuthUser> {
    const user = await this.requireAuth();
    if (!roles.includes(user.role)) {
      throw new Error("Insufficient permissions");
    }
    return user;
  }

  static async signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
}
