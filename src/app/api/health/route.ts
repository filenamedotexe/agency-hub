import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Check Supabase connection
    const supabase = await createClient();
    const { error: supabaseError } = await supabase
      .from("users")
      .select("count")
      .limit(1)
      .single();

    // Check Prisma/Database connection
    await prisma.$queryRaw`SELECT 1`;

    // Check environment variables
    const envVars = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      databaseUrl: !!process.env.DATABASE_URL,
    };

    const allEnvVarsPresent = Object.values(envVars).every((v) => v === true);

    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        checks: {
          database: "connected",
          supabase: supabaseError ? "error" : "connected",
          environment: allEnvVarsPresent ? "configured" : "missing variables",
          envVars,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        checks: {
          database: "disconnected",
          supabase: "unknown",
          environment: "check failed",
        },
      },
      { status: 503 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
