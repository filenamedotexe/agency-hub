"use client";

import { Calendar, momentLocalizer, View, Event } from "react-big-calendar";
import moment from "moment";
import { BookingWithRelations } from "@/types/booking";
import { useMemo } from "react";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

interface CalendarViewProps {
  bookings: BookingWithRelations[];
  onSelectSlot: (slotInfo: {
    start: Date;
    end: Date;
    slots: Date[];
    action: "select" | "click" | "doubleClick";
  }) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  view?: View;
  onView?: (view: View) => void;
  date?: Date;
  onNavigate?: (date: Date) => void;
}

interface CalendarEvent extends Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: BookingWithRelations;
}

const getStatusColor = (status: string) => {
  const colors = {
    PENDING: "#FFA500",
    CONFIRMED: "#10B981",
    CANCELLED: "#EF4444",
    COMPLETED: "#6B7280",
    NO_SHOW: "#DC2626",
    RESCHEDULED: "#3B82F6",
  };
  return colors[status as keyof typeof colors] || "#6B7280";
};

export function CalendarView({
  bookings,
  onSelectSlot,
  onSelectEvent,
  view = "week",
  onView,
  date,
  onNavigate,
}: CalendarViewProps) {
  const events: CalendarEvent[] = useMemo(
    () =>
      bookings.map((booking) => ({
        id: booking.id,
        title: `${booking.title} - ${booking.client.name}`,
        start: new Date(booking.startTime),
        end: new Date(booking.endTime),
        resource: booking,
      })),
    [bookings]
  );

  return (
    <div className="h-full">
      <style jsx global>{`
        .rbc-calendar {
          font-family: inherit;
          background: white;
        }
        .rbc-header {
          padding: 12px 4px;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
        }
        .rbc-header + .rbc-header {
          border-left: 1px solid #e5e7eb;
        }
        .rbc-today {
          background-color: #eff6ff;
        }
        .rbc-off-range-bg {
          background: #f9fafb;
        }
        .rbc-toolbar {
          margin-bottom: 24px;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 8px;
        }
        .rbc-toolbar button {
          color: #374151;
          border: 1px solid #e5e7eb;
          background: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 500;
          font-size: 14px;
          transition: all 0.2s;
          min-height: 44px; /* Touch-friendly */
        }
        .rbc-toolbar button:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }
        .rbc-toolbar button.rbc-active {
          background: #4f46e5;
          color: white;
          border-color: #4f46e5;
        }
        .rbc-toolbar button.rbc-active:hover {
          background: #4338ca;
          border-color: #4338ca;
        }
        .rbc-toolbar-label {
          font-weight: 600;
          font-size: 18px;
          color: #111827;
          text-align: center;
          flex: 1;
          min-width: 200px;
        }
        .rbc-event {
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 12px;
          font-weight: 500;
          border: none;
          min-height: 20px; /* Better touch target */
        }
        .rbc-event-label {
          display: none;
        }
        .rbc-event-content {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid #f3f4f6;
          min-height: 24px; /* Better touch targets */
        }
        .rbc-day-slot .rbc-events-container {
          margin-right: 10px;
        }
        .rbc-time-content {
          border-top: 2px solid #e5e7eb;
        }
        .rbc-time-view {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        .rbc-time-header {
          border-bottom: 2px solid #e5e7eb;
        }
        .rbc-time-header-content {
          border-left: 1px solid #e5e7eb;
        }
        .rbc-timeslot-group {
          border-bottom: 1px solid #f3f4f6;
          min-height: 48px; /* Better spacing on mobile */
        }
        .rbc-month-view {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        .rbc-month-row {
          border-top: 1px solid #e5e7eb;
          min-height: 80px; /* Better spacing for mobile */
        }
        .rbc-month-row + .rbc-month-row {
          border-top: 1px solid #e5e7eb;
        }
        .rbc-date-cell {
          padding: 4px 8px;
          font-size: 14px;
          min-height: 44px; /* Touch-friendly */
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .rbc-agenda-view {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
        }
        .rbc-agenda-table {
          font-size: 14px;
        }
        .rbc-agenda-table thead {
          font-weight: 600;
          color: #374151;
        }
        .rbc-agenda-table tbody tr {
          cursor: pointer;
          border-bottom: 1px solid #f3f4f6;
          min-height: 56px; /* Touch-friendly */
        }
        .rbc-agenda-table tbody tr:hover {
          background-color: #f9fafb;
        }
        .rbc-agenda-date-cell,
        .rbc-agenda-time-cell {
          white-space: nowrap;
          padding-right: 16px;
          padding: 12px 16px; /* Better spacing */
        }
        .rbc-day-bg.rbc-selected-cell {
          background-color: #dbeafe;
        }
        .rbc-show-more {
          color: #4f46e5;
          font-weight: 500;
          font-size: 12px;
          padding: 4px 8px;
          min-height: 32px; /* Touch-friendly */
        }

        /* Mobile-specific styles */
        @media (max-width: 768px) {
          .rbc-toolbar {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .rbc-toolbar .rbc-btn-group {
            display: flex;
            justify-content: center;
            gap: 4px;
          }
          .rbc-toolbar button {
            padding: 12px 16px;
            font-size: 16px;
          }
          .rbc-toolbar-label {
            font-size: 20px;
            margin: 8px 0;
          }
          .rbc-header {
            padding: 8px 2px;
            font-size: 12px;
          }
          .rbc-event {
            font-size: 11px;
            padding: 1px 4px;
          }
          .rbc-time-view .rbc-time-gutter {
            width: 60px;
          }
          .rbc-time-view .rbc-time-gutter .rbc-label {
            font-size: 10px;
          }
          .rbc-month-view .rbc-date-cell {
            font-size: 12px;
            padding: 2px 4px;
          }
          .rbc-agenda-table {
            font-size: 12px;
          }
          .rbc-agenda-date-cell,
          .rbc-agenda-time-cell {
            padding: 8px 12px;
          }
        }

        /* Touch interactions */
        @media (pointer: coarse) {
          .rbc-event {
            min-height: 32px;
            padding: 6px 8px;
          }
          .rbc-day-slot .rbc-time-slot {
            min-height: 32px;
          }
          .rbc-date-cell {
            min-height: 48px;
          }
        }
      `}</style>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{
          height:
            typeof window !== "undefined" && window.innerWidth < 768
              ? "calc(100vh - 280px)"
              : "calc(100vh - 380px)",
          minHeight:
            typeof window !== "undefined" && window.innerWidth < 768
              ? "400px"
              : "600px",
        }}
        onSelectSlot={onSelectSlot}
        onSelectEvent={onSelectEvent}
        selectable
        popup
        views={["month", "week", "day", "agenda"]}
        view={view}
        onView={onView}
        date={date}
        onNavigate={onNavigate}
        step={30}
        timeslots={2}
        min={new Date(0, 0, 0, 7, 0, 0)}
        max={new Date(0, 0, 0, 20, 0, 0)}
        eventPropGetter={(event) => ({
          style: {
            backgroundColor: getStatusColor(event.resource.status),
            borderColor: getStatusColor(event.resource.status),
            color: "white",
            fontSize:
              typeof window !== "undefined" && window.innerWidth < 768
                ? "11px"
                : "13px",
            fontWeight: "500",
            border: "none",
            outline: "none",
          },
        })}
        dayPropGetter={(date) => {
          const today = new Date();
          const isToday =
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();

          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          if (isToday) {
            return {
              style: {
                backgroundColor: "#EFF6FF",
              },
            };
          }

          if (isWeekend) {
            return {
              style: {
                backgroundColor: "#F9FAFB",
              },
            };
          }

          return {};
        }}
        formats={{
          timeGutterFormat: (date, culture, localizer) =>
            localizer!.format(date, "h A", culture),
          eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
            `${localizer!.format(start, "h:mm A", culture)} - ${localizer!.format(end, "h:mm A", culture)}`,
          agendaTimeFormat: (date, culture, localizer) =>
            localizer!.format(date, "h:mm A", culture),
          agendaTimeRangeFormat: ({ start, end }, culture, localizer) =>
            `${localizer!.format(start, "h:mm A", culture)} - ${localizer!.format(end, "h:mm A", culture)}`,
        }}
        messages={{
          allDay: "All Day",
          previous: "‹",
          next: "›",
          today: "Today",
          month: "Month",
          week: "Week",
          day: "Day",
          agenda: "List",
          date: "Date",
          time: "Time",
          event: "Event",
          noEventsInRange: "No bookings in this range",
          showMore: (total) => `+${total} more`,
        }}
      />
    </div>
  );
}
