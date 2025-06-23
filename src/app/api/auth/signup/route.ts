import { NextRequest, NextResponse } from "next/server";
import { authRateLimiter } from "@/lib/rate-limit";
import { signUpSchema } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Get IP address for rate limiting
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    const { success, remaining } = await authRateLimiter.check(ip, 5); // 5 signups per minute

    if (!success) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": remaining.toString(),
          },
        }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = signUpSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { email, password, role, name, businessName } = validation.data;
    const supabase = await createClient();

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "User creation failed" },
        { status: 500 }
      );
    }

    // Create user profile in database
    try {
      const user = await prisma.user.create({
        data: {
          id: authData.user.id,
          email,
          role,
          profileData: {
            name: name || null,
            businessName: businessName || null,
          },
        },
      });

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        message:
          "Account created successfully. Please check your email to verify your account.",
      });
    } catch (dbError) {
      // If database creation fails, try to clean up Supabase user
      console.error("Database user creation failed:", dbError);

      // Note: In production, you might want to implement a cleanup mechanism
      // or use a transaction pattern to ensure consistency

      return NextResponse.json(
        { error: "Failed to create user profile" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
