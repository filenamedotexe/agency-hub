import { NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: userData, error } = await supabase
    .from("users")
    .select("id, email, role")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    authUser: {
      id: user.id,
      email: user.email,
    },
    dbUser: userData,
  });
}
