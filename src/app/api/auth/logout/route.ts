import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { invalidateCache } from "@/lib/middleware-cache";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function POST() {
  console.log("[API] Logout endpoint called");

  try {
    const supabase = await createClient();

    // Get the current user before signing out
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Sign out from Supabase
    await supabase.auth.signOut();

    // Invalidate cache for this user
    if (user?.id) {
      invalidateCache(user.id);
    }

    console.log("[API] Logout successful, cache invalidated");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Logout error:", error);
    // Always return success to ensure client-side logout proceeds
    return NextResponse.json({ success: true });
  }
}
