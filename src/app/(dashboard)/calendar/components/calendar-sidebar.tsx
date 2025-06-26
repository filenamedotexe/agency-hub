"use client";

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Clock, MapPin, User } from "lucide-react";
import { BookingWithRelations } from "@/types/booking";
import { format } from "date-fns";

interface CalendarSidebarProps {
  selectedDate: Date;
  onDateSelect: (date: Date | undefined) => void;
  upcomingBookings?: BookingWithRelations[];
}

export function CalendarSidebar({
  selectedDate,
  onDateSelect,
  upcomingBookings = [],
}: CalendarSidebarProps) {
  const getStatusBadgeVariant = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      PENDING: "secondary",
      CONFIRMED: "default",
      CANCELLED: "destructive",
      COMPLETED: "outline",
      NO_SHOW: "destructive",
      RESCHEDULED: "secondary",
    };
    return variants[status] || "outline";
  };

  return (
    <aside className="h-full w-80 border-r bg-gray-50/50 p-4">
      <div className="mb-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Calendar</h3>
        <div className="rounded-lg border bg-white">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => onDateSelect(date)}
            className="rounded-md border-0"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          Upcoming Bookings
        </h3>
        <div className="rounded-lg border bg-white">
          <ScrollArea className="h-[400px]">
            {upcomingBookings.length === 0 ? (
              <div className="p-8 text-center">
                <Clock className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-500">No upcoming bookings</p>
              </div>
            ) : (
              <div className="divide-y">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="cursor-pointer p-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="flex-1 truncate text-sm font-medium text-gray-900">
                          {booking.title}
                        </p>
                        <Badge
                          variant={getStatusBadgeVariant(booking.status)}
                          className="shrink-0 text-xs"
                        >
                          {booking.status}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>
                            {format(
                              new Date(booking.startTime),
                              "MMM d, h:mm a"
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <User className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {booking.client.businessName || booking.client.name}
                          </span>
                        </div>
                        {booking.location && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{booking.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </aside>
  );
}
