import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/supabase/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Fetch user profile
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        profileData: dbUser.profileData,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
