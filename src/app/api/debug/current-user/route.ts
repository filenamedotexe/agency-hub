import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Not authenticated", user: null });
    }

    // Also check database user
    const { data: dbUser, error: dbError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      authUser: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      dbUser: dbUser || null,
      dbError: dbError?.message || null,
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
