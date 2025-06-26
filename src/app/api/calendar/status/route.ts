import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and service managers can check calendar status
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.SERVICE_MANAGER];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Wrap in try-catch to handle missing table
    let connection;
    try {
      connection = await prisma.calendarConnection.findUnique({
        where: { userId: session.user.id },
        select: {
          id: true,
          email: true,
          syncEnabled: true,
          provider: true,
          createdAt: true,
          expiresAt: true,
        },
      });
    } catch (error) {
      // If table doesn't exist, just return not connected
      console.log("CalendarConnection table might not exist yet:", error);
      return NextResponse.json({ connected: false });
    }

    if (!connection) {
      return NextResponse.json({ connected: false });
    }

    // Check if token is still valid
    const isExpired = connection.expiresAt < new Date();

    return NextResponse.json({
      connected: true,
      email: connection.email,
      syncEnabled: connection.syncEnabled,
      provider: connection.provider,
      connectedAt: connection.createdAt,
      isExpired,
    });
  } catch (error) {
    console.error("Error checking calendar status:", error);
    return NextResponse.json(
      { error: "Failed to check calendar status" },
      { status: 500 }
    );
  }
}
