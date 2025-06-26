import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { getAuthUrl } from "@/lib/google-calendar";
import { UserRole } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and service managers can connect calendars
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.SERVICE_MANAGER];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const authUrl = getAuthUrl(session.user.id);
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Error generating auth URL:", error);
    return NextResponse.json(
      { error: "Failed to generate authentication URL" },
      { status: 500 }
    );
  }
}
