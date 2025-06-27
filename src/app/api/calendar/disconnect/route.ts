import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and service managers can disconnect calendars
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.SERVICE_MANAGER];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete the calendar connection
    await prisma.calendarConnection.delete({
      where: { userId: session.user.id },
    });

    // Log the disconnection
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        entityType: "calendar_connection",
        entityId: session.user.id,
        action: "disconnected",
        metadata: {
          provider: "google",
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting calendar:", error);

    // If connection doesn't exist, that's okay
    if ((error as any)?.code === "P2025") {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Failed to disconnect calendar" },
      { status: 500 }
    );
  }
}
