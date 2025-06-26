import { prisma } from "@/lib/prisma";
import { CalendarSyncService } from "./calendar-sync";
import { BookingStatus } from "@prisma/client";
import {
  CreateBookingInput,
  UpdateBookingInput,
  BookingWithRelations,
  BookingSlotInfo,
} from "@/types/booking";
import {
  startOfDay,
  endOfDay,
  addMinutes,
  format,
  parse,
  isWithinInterval,
  areIntervalsOverlapping,
} from "date-fns";

export class BookingService {
  private calendarSync = new CalendarSyncService();

  async checkAvailability(
    hostId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    // Check database bookings
    const existingBookings = await prisma.booking.count({
      where: {
        hostId,
        status: {
          notIn: [BookingStatus.CANCELLED],
        },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    if (existingBookings > 0) return false;

    // Check Google Calendar
    try {
      const busyTimes = await this.calendarSync.getFreeBusy(
        hostId,
        startTime,
        endTime
      );

      // Check if any busy time overlaps with requested time
      for (const busy of busyTimes) {
        if (busy.start && busy.end) {
          const busyStart = new Date(busy.start);
          const busyEnd = new Date(busy.end);

          if (
            areIntervalsOverlapping(
              { start: startTime, end: endTime },
              { start: busyStart, end: busyEnd }
            )
          ) {
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error("Calendar check failed:", error);
      // If calendar check fails, still allow booking (calendar might not be connected)
      return true;
    }
  }

  async getAvailableSlots(
    hostId: string,
    date: Date,
    duration: number = 60
  ): Promise<BookingSlotInfo[]> {
    const dayOfWeek = date.getDay();
    const startOfSelectedDay = startOfDay(date);
    const endOfSelectedDay = endOfDay(date);

    // Get user's availability rules for this day
    const slots = await prisma.bookingSlot.findMany({
      where: {
        userId: hostId,
        dayOfWeek,
        isActive: true,
      },
    });

    if (slots.length === 0) {
      return [];
    }

    // Get existing bookings for the day
    const bookings = await prisma.booking.findMany({
      where: {
        hostId,
        startTime: {
          gte: startOfSelectedDay,
          lte: endOfSelectedDay,
        },
        status: {
          notIn: [BookingStatus.CANCELLED],
        },
      },
      orderBy: { startTime: "asc" },
    });

    // Get Google Calendar busy times
    let busyTimes: any[] = [];
    try {
      busyTimes = await this.calendarSync.getFreeBusy(
        hostId,
        startOfSelectedDay,
        endOfSelectedDay
      );
    } catch (error) {
      console.error("Failed to get Google Calendar busy times:", error);
    }

    // Generate all possible slots based on availability rules
    const availableSlots: BookingSlotInfo[] = [];

    for (const slot of slots) {
      const slotStart = parse(slot.startTime, "HH:mm", date);
      const slotEnd = parse(slot.endTime, "HH:mm", date);

      let currentTime = slotStart;

      while (currentTime < slotEnd) {
        const slotEndTime = addMinutes(currentTime, duration);

        if (slotEndTime <= slotEnd) {
          // Check if this slot conflicts with any booking
          const hasConflict = bookings.some((booking) =>
            areIntervalsOverlapping(
              { start: currentTime, end: slotEndTime },
              { start: booking.startTime, end: booking.endTime }
            )
          );

          // Check if this slot conflicts with Google Calendar
          const hasCalendarConflict = busyTimes.some((busy) => {
            if (busy.start && busy.end) {
              return areIntervalsOverlapping(
                { start: currentTime, end: slotEndTime },
                { start: new Date(busy.start), end: new Date(busy.end) }
              );
            }
            return false;
          });

          // Only add future slots
          const isInFuture = currentTime > new Date();

          availableSlots.push({
            time: format(currentTime, "h:mm a"),
            date: currentTime,
            available: isInFuture && !hasConflict && !hasCalendarConflict,
          });
        }

        currentTime = addMinutes(currentTime, 30); // 30-minute intervals
      }
    }

    return availableSlots;
  }

  async createBooking(
    data: CreateBookingInput,
    createdBy: string
  ): Promise<BookingWithRelations> {
    // Check availability first
    const isAvailable = await this.checkAvailability(
      data.hostId,
      data.startTime,
      data.endTime
    );

    if (!isAvailable) {
      throw new Error("Time slot not available");
    }

    // Calculate duration in minutes
    const duration = Math.floor(
      (data.endTime.getTime() - data.startTime.getTime()) / 60000
    );

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        ...data,
        createdBy,
        duration,
        attendees: data.attendees || [],
        status: BookingStatus.CONFIRMED,
      },
      include: {
        client: true,
        host: true,
        service: true,
        creator: true,
      },
    });

    // Sync to Google Calendar
    try {
      const googleEventId = await this.calendarSync.createEvent(
        booking,
        booking.hostId
      );

      if (googleEventId) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { googleEventId },
        });
        booking.googleEventId = googleEventId;
      }
    } catch (error) {
      console.error("Calendar sync failed:", error);
      // Don't fail the booking if calendar sync fails
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: createdBy,
        entityType: "booking",
        entityId: booking.id,
        clientId: booking.clientId,
        action: "created",
        metadata: {
          title: booking.title,
          startTime: booking.startTime,
          endTime: booking.endTime,
          hostId: booking.hostId,
        },
      },
    });

    return booking;
  }

  async updateBooking(
    id: string,
    data: UpdateBookingInput,
    updatedBy: string
  ): Promise<BookingWithRelations> {
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!existingBooking) {
      throw new Error("Booking not found");
    }

    // If updating time, check availability
    if (data.startTime && data.endTime) {
      const isAvailable = await this.checkAvailability(
        existingBooking.hostId,
        data.startTime,
        data.endTime
      );

      if (!isAvailable) {
        throw new Error("New time slot not available");
      }

      // Recalculate duration
      data.duration = Math.floor(
        (data.endTime.getTime() - data.startTime.getTime()) / 60000
      );
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        ...data,
        duration: data.duration,
        updatedAt: new Date(),
      },
      include: {
        client: true,
        host: true,
        service: true,
        creator: true,
      },
    });

    // Update Google Calendar event
    if (existingBooking.googleEventId) {
      try {
        await this.calendarSync.updateEvent(
          updatedBooking,
          existingBooking.googleEventId,
          updatedBooking.hostId
        );
      } catch (error) {
        console.error("Failed to update calendar event:", error);
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: updatedBy,
        entityType: "booking",
        entityId: updatedBooking.id,
        clientId: updatedBooking.clientId,
        action: "updated",
        metadata: {
          changes: JSON.stringify(data),
        },
      },
    });

    return updatedBooking;
  }

  async cancelBooking(
    id: string,
    reason: string,
    cancelledBy: string
  ): Promise<BookingWithRelations> {
    const booking = await prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelReason: reason,
        updatedAt: new Date(),
      },
      include: {
        client: true,
        host: true,
        service: true,
        creator: true,
      },
    });

    // Remove from Google Calendar
    if (booking.googleEventId) {
      try {
        await this.calendarSync.deleteEvent(
          booking.googleEventId,
          booking.hostId
        );
      } catch (error) {
        console.error("Failed to delete calendar event:", error);
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: cancelledBy,
        entityType: "booking",
        entityId: booking.id,
        clientId: booking.clientId,
        action: "cancelled",
        metadata: {
          reason,
        },
      },
    });

    return booking;
  }

  async getBooking(id: string): Promise<BookingWithRelations | null> {
    return prisma.booking.findUnique({
      where: { id },
      include: {
        client: true,
        host: true,
        service: true,
        creator: true,
      },
    });
  }

  async listBookings(filters: {
    hostId?: string;
    clientId?: string;
    status?: BookingStatus;
    startDate?: Date;
    endDate?: Date;
  }): Promise<BookingWithRelations[]> {
    return prisma.booking.findMany({
      where: {
        hostId: filters.hostId,
        clientId: filters.clientId,
        status: filters.status,
        startTime: filters.startDate ? { gte: filters.startDate } : undefined,
        endTime: filters.endDate ? { lte: filters.endDate } : undefined,
      },
      include: {
        client: true,
        host: true,
        service: true,
        creator: true,
      },
      orderBy: { startTime: "asc" },
    });
  }
}
