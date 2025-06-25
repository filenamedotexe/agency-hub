import { NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const supabase = await createClient();

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Supabase logout error:", error);
      // Still return success as we want to clear client session
    }

    // Clear any additional server-side session data if needed
    const cookieStore = await cookies();

    // Remove any auth-related cookies
    cookieStore.getAll().forEach((cookie) => {
      if (cookie.name.includes("auth") || cookie.name.includes("supabase")) {
        cookieStore.delete(cookie.name);
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    // Return success even on error to ensure client logout proceeds
    return NextResponse.json({ success: true });
  }
}
