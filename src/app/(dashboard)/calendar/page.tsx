"use client";

import { useState, useEffect, useMemo } from "react";
import { View } from "react-big-calendar";
import { useAuth } from "@/components/providers/auth-provider";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MotionButton } from "@/components/ui/motion-button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Calendar as CalendarIcon,
  Plus,
  Settings2,
  CheckCircle,
  AlertCircle,
  X,
  Menu,
} from "lucide-react";
import { useCalendarConnection } from "./hooks/use-calendar-connection";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CalendarView } from "./components/calendar-view";
import { CalendarSidebar } from "./components/calendar-sidebar";
import { BookingModal } from "./components/booking-modal";
import { BookingDetails } from "./components/booking-details";
import { AvailabilitySettings } from "./components/availability-settings";
import { useBookings } from "./hooks/use-bookings";
import { BookingWithRelations } from "@/types/booking";
import {
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  addDays,
} from "date-fns";

export default function CalendarPage() {
  const { user } = useAuth();
  const [view, setView] = useState<View>("week");
  const {
    status,
    isLoading,
    connect,
    disconnect,
    isConnecting,
    isDisconnecting,
  } = useCalendarConnection();
  const searchParams = useSearchParams();

  // Calendar state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [selectedBooking, setSelectedBooking] =
    useState<BookingWithRelations | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingBooking, setEditingBooking] =
    useState<BookingWithRelations | null>(null);
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Calculate date range for fetching bookings
  const dateRange = useMemo(() => {
    const start = startOfMonth(calendarDate);
    const end = endOfMonth(calendarDate);
    // Add buffer days for better UX
    return {
      startDate: addDays(start, -7),
      endDate: addDays(end, 7),
    };
  }, [calendarDate]);

  const {
    data: bookings = [],
    isLoading: isLoadingBookings,
    refetch,
  } = useBookings(dateRange);

  // Filter upcoming bookings for sidebar
  const upcomingBookings = useMemo(() => {
    const today = startOfDay(new Date());
    return bookings
      .filter(
        (booking) =>
          new Date(booking.startTime) >= today && booking.status !== "CANCELLED"
      )
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
      .slice(0, 5);
  }, [bookings]);

  // Handle OAuth callback results
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected === "true") {
      toast.success("Google Calendar connected successfully!");
    } else if (error) {
      const errorMessages: Record<string, string> = {
        access_denied: "Calendar access was denied",
        missing_params: "Invalid connection parameters",
        unauthorized: "You must be logged in to connect your calendar",
        auth_failed: "Failed to connect to Google Calendar",
      };
      toast.error(errorMessages[error] || "Failed to connect calendar");
    }
  }, [searchParams]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your bookings and appointments
          </p>
        </div>
        <div className="flex gap-2">
          {/* Mobile sidebar toggle */}
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <MotionButton variant="outline" size="sm" className="md:hidden">
                <Menu className="h-4 w-4" />
              </MotionButton>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <CalendarSidebar
                selectedDate={selectedDate}
                onDateSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setCalendarDate(date);
                    setIsSidebarOpen(false); // Close sidebar on mobile after selection
                  }
                }}
                upcomingBookings={upcomingBookings}
                isLoadingBookings={isLoadingBookings}
              />
            </SheetContent>
          </Sheet>

          <MotionButton
            variant="outline"
            size="sm"
            onClick={() => setIsAvailabilityOpen(true)}
          >
            <Settings2 className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Availability</span>
          </MotionButton>
          <MotionButton
            size="sm"
            onClick={() => {
              const now = new Date();
              const start = new Date(now);
              start.setHours(now.getHours() + 1, 0, 0, 0);
              const end = new Date(start);
              end.setHours(start.getHours() + 1);
              setSelectedSlot({ start, end });
              setIsBookingModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">New Booking</span>
            <span className="sm:hidden">New</span>
          </MotionButton>
        </div>
      </div>

      {/* Calendar Connection Status - Optional */}
      <EnhancedCard className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarIcon className="h-5 w-5" />
            Google Calendar Integration (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
              Checking connection status...
            </div>
          ) : status?.connected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Connected
                    </p>
                    <p className="text-xs text-gray-600">{status.email}</p>
                  </div>
                </div>
                <MotionButton
                  variant="outline"
                  size="sm"
                  onClick={() => disconnect()}
                  disabled={isDisconnecting}
                >
                  {isDisconnecting ? (
                    <>
                      <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                      Disconnecting...
                    </>
                  ) : (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Disconnect
                    </>
                  )}
                </MotionButton>
              </div>
              {status.isExpired && (
                <div className="flex items-center gap-2 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
                  <AlertCircle className="h-4 w-4" />
                  Your calendar connection has expired. Please reconnect.
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Optionally connect Google Calendar for automatic syncing and
                  conflict detection
                </p>
              </div>
              <MotionButton
                variant="outline"
                size="sm"
                onClick={() => connect()}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                    Connecting...
                  </>
                ) : (
                  "Connect Calendar"
                )}
              </MotionButton>
            </div>
          )}
        </CardContent>
      </EnhancedCard>

      {/* Calendar View */}
      <div className="flex flex-col gap-4 md:flex-row">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <CalendarSidebar
            selectedDate={selectedDate}
            onDateSelect={(date) => {
              if (date) {
                setSelectedDate(date);
                setCalendarDate(date);
              }
            }}
            upcomingBookings={upcomingBookings}
            isLoadingBookings={isLoadingBookings}
          />
        </div>

        {/* Main Calendar */}
        <div className="min-w-0 flex-1">
          <EnhancedCard className="min-h-[500px] md:min-h-[700px]">
            <CardContent className="p-3 md:p-6">
              <CalendarView
                bookings={bookings}
                view={view}
                onView={setView}
                date={calendarDate}
                onNavigate={setCalendarDate}
                onSelectSlot={(slotInfo) => {
                  setSelectedSlot({
                    start: slotInfo.start,
                    end: slotInfo.end,
                  });
                  setIsBookingModalOpen(true);
                }}
                onSelectEvent={(event) => {
                  setSelectedBooking(event.resource);
                  setIsDetailsOpen(true);
                }}
              />
            </CardContent>
          </EnhancedCard>
        </div>
      </div>

      {/* Modals */}
      <BookingModal
        isOpen={isBookingModalOpen || !!editingBooking}
        onClose={() => {
          setIsBookingModalOpen(false);
          setEditingBooking(null);
          setSelectedSlot(null);
        }}
        selectedSlot={selectedSlot || undefined}
        booking={editingBooking || undefined}
        onSuccess={() => refetch()}
      />

      <BookingDetails
        booking={selectedBooking}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedBooking(null);
        }}
        onEdit={(booking) => {
          setEditingBooking(booking);
          setSelectedBooking(null);
          setIsDetailsOpen(false);
        }}
      />

      <AvailabilitySettings
        isOpen={isAvailabilityOpen}
        onClose={() => setIsAvailabilityOpen(false)}
        userId={user?.id || ""}
      />
    </div>
  );
}
