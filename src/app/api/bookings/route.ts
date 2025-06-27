import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { BookingService } from "@/lib/services/booking-service";
import { UserRole, BookingStatus } from "@prisma/client";
import { CreateBookingInput } from "@/types/booking";

export const dynamic = "force-dynamic";

const bookingService = new BookingService();

// GET /api/bookings - List bookings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status") as BookingStatus | null;
    const clientId = searchParams.get("clientId");

    // Build filters based on user role
    const filters: any = {};

    if (session.user.role === UserRole.CLIENT) {
      // Clients can only see their own bookings
      // TODO: Get client ID from user profile
      return NextResponse.json(
        { error: "Clients cannot access bookings yet" },
        { status: 403 }
      );
    } else if (
      session.user.role === UserRole.ADMIN ||
      session.user.role === UserRole.SERVICE_MANAGER
    ) {
      // Admins and managers can see all bookings
      if (clientId) filters.clientId = clientId;
    } else {
      // Other roles can only see bookings where they are the host
      filters.hostId = session.user.id;
    }

    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (status) filters.status = status;

    const bookings = await bookingService.listBookings(filters);

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

// POST /api/bookings - Create a booking
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and service managers can create bookings
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.SERVICE_MANAGER];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Validate required fields
    const requiredFields = [
      "title",
      "clientId",
      "hostId",
      "startTime",
      "endTime",
    ];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Parse dates
    const data: CreateBookingInput = {
      ...body,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
    };

    // Validate time range
    if (data.startTime >= data.endTime) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Create booking
    const booking = await bookingService.createBooking(data, session.user.id);

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error("Error creating booking:", error);

    if (error.message === "Time slot not available") {
      return NextResponse.json(
        { error: "Time slot not available" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
