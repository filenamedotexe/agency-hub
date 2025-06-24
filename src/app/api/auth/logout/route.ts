import { NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const supabase = await createClient();

    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
