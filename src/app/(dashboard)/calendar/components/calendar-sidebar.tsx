"use client";

import { Calendar } from "@/components/ui/calendar";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton } from "@/components/ui/skeleton-loader";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Clock, MapPin, User } from "lucide-react";
import { MotionListItem } from "@/components/ui/motion-elements";
import { BookingWithRelations } from "@/types/booking";
import { format } from "date-fns";

interface CalendarSidebarProps {
  selectedDate: Date;
  onDateSelect: (date: Date | undefined) => void;
  upcomingBookings?: BookingWithRelations[];
  isLoadingBookings?: boolean;
}

export function CalendarSidebar({
  selectedDate,
  onDateSelect,
  upcomingBookings = [],
  isLoadingBookings = false,
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
        <EnhancedCard className="p-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => onDateSelect(date)}
            className="rounded-md border-0"
          />
        </EnhancedCard>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          Upcoming Bookings
        </h3>
        <EnhancedCard className="p-0">
          <ScrollArea className="h-[400px]">
            {isLoadingBookings ? (
              <div className="p-4">
                <ListSkeleton items={3} />
              </div>
            ) : upcomingBookings.length === 0 ? (
              <EmptyState
                icon={<Clock className="h-8 w-8" />}
                title="No upcoming bookings"
                description="Your upcoming bookings will appear here"
                className="py-8"
              />
            ) : (
              <div className="divide-y">
                {upcomingBookings.map((booking, index) => (
                  <MotionListItem
                    key={booking.id}
                    index={index}
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
                  </MotionListItem>
                ))}
              </div>
            )}
          </ScrollArea>
        </EnhancedCard>
      </div>
    </aside>
  );
}
