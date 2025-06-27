import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/availability - Get user's availability settings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("userId") || session.user.id;

    // Check if user can view this availability
    if (userId !== session.user.id) {
      const allowedRoles: UserRole[] = [
        UserRole.ADMIN,
        UserRole.SERVICE_MANAGER,
      ];
      if (!allowedRoles.includes(session.user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const slots = await prisma.bookingSlot.findMany({
      where: { userId },
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json(slots);
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}

// POST /api/availability - Update user's availability settings
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and service managers can set availability
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.SERVICE_MANAGER];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { userId = session.user.id, slots } = body;

    // Validate slots
    if (!Array.isArray(slots)) {
      return NextResponse.json(
        { error: "Slots must be an array" },
        { status: 400 }
      );
    }

    // Validate each slot
    for (const slot of slots) {
      if (
        typeof slot.dayOfWeek !== "number" ||
        slot.dayOfWeek < 0 ||
        slot.dayOfWeek > 6 ||
        !slot.startTime ||
        !slot.endTime ||
        typeof slot.isActive !== "boolean"
      ) {
        return NextResponse.json(
          { error: "Invalid slot data" },
          { status: 400 }
        );
      }
    }

    // Delete existing slots and create new ones in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete existing slots
      await tx.bookingSlot.deleteMany({
        where: { userId },
      });

      // Create new slots
      for (const slot of slots) {
        await tx.bookingSlot.create({
          data: {
            userId,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isActive: slot.isActive,
          },
        });
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        entityType: "availability",
        entityId: userId,
        action: "updated",
        metadata: {
          slots: slots.length,
        },
      },
    });

    // Return updated slots
    const updatedSlots = await prisma.bookingSlot.findMany({
      where: { userId },
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json(updatedSlots);
  } catch (error) {
    console.error("Error updating availability:", error);
    return NextResponse.json(
      { error: "Failed to update availability" },
      { status: 500 }
    );
  }
}
