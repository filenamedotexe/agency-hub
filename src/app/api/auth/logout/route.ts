import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function POST() {
  console.log("[API] Logout endpoint called");

  try {
    const supabase = await createClient();

    // Sign out from Supabase
    await supabase.auth.signOut();

    console.log("[API] Logout successful");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Logout error:", error);
    // Always return success to ensure client-side logout proceeds
    return NextResponse.json({ success: true });
  }
}
