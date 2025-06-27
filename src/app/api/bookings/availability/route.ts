import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { BookingService } from "@/lib/services/booking-service";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

const bookingService = new BookingService();

// POST /api/bookings/availability - Check if a time slot is available
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { hostId, startTime, endTime } = body;

    // Validate required fields
    if (!hostId || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields: hostId, startTime, endTime" },
        { status: 400 }
      );
    }

    // Parse dates
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Validate time range
    if (start >= end) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Check availability
    const isAvailable = await bookingService.checkAvailability(
      hostId,
      start,
      end
    );

    return NextResponse.json({
      available: isAvailable,
      hostId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    });
  } catch (error) {
    console.error("Error checking availability:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}
