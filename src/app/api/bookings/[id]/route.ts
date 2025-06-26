import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { BookingService } from "@/lib/services/booking-service";
import { UserRole } from "@prisma/client";
import { UpdateBookingInput } from "@/types/booking";

const bookingService = new BookingService();

// GET /api/bookings/[id] - Get a single booking
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const booking = await bookingService.getBooking(params.id);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check access permissions
    const adminRoles: UserRole[] = [UserRole.ADMIN, UserRole.SERVICE_MANAGER];
    const canAccess =
      adminRoles.includes(session.user.role) ||
      booking.hostId === session.user.id ||
      booking.createdBy === session.user.id;

    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

// PUT /api/bookings/[id] - Update a booking
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user can update bookings
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.SERVICE_MANAGER];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Parse dates if provided
    const data: UpdateBookingInput = {
      ...body,
      startTime: body.startTime ? new Date(body.startTime) : undefined,
      endTime: body.endTime ? new Date(body.endTime) : undefined,
    };

    // Validate time range if both times are provided
    if (data.startTime && data.endTime && data.startTime >= data.endTime) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    const booking = await bookingService.updateBooking(
      params.id,
      data,
      session.user.id
    );

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("Error updating booking:", error);

    if (error.message === "Booking not found") {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (error.message === "New time slot not available") {
      return NextResponse.json(
        { error: "New time slot not available" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}

// DELETE /api/bookings/[id] - Cancel a booking
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user can cancel bookings
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.SERVICE_MANAGER];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { reason = "Cancelled by user" } = await req.json().catch(() => ({}));

    const booking = await bookingService.cancelBooking(
      params.id,
      reason,
      session.user.id
    );

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json(
      { error: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}
