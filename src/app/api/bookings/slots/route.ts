import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { BookingService } from "@/lib/services/booking-service";

export const dynamic = "force-dynamic";

const bookingService = new BookingService();

// GET /api/bookings/slots - Get available time slots for a specific date
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const hostId = searchParams.get("hostId");
    const date = searchParams.get("date");
    const duration = searchParams.get("duration");

    // Validate required fields
    if (!hostId || !date) {
      return NextResponse.json(
        { error: "Missing required fields: hostId, date" },
        { status: 400 }
      );
    }

    // Parse date
    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    // Parse duration (default to 60 minutes)
    const bookingDuration = duration ? parseInt(duration) : 60;
    if (
      isNaN(bookingDuration) ||
      bookingDuration < 15 ||
      bookingDuration > 480
    ) {
      return NextResponse.json(
        { error: "Invalid duration. Must be between 15 and 480 minutes." },
        { status: 400 }
      );
    }

    // Get available slots
    const slots = await bookingService.getAvailableSlots(
      hostId,
      selectedDate,
      bookingDuration
    );

    return NextResponse.json({
      slots,
      date: selectedDate.toISOString(),
      duration: bookingDuration,
      hostId,
    });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch available slots" },
      { status: 500 }
    );
  }
}
