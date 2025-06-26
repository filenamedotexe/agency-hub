"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, parse, addMinutes, setHours, setMinutes } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { X, Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/use-clients";
import { useServices } from "@/hooks/use-services";
import { useAuth } from "@/components/providers/auth-provider";
import { useCreateBooking, useUpdateBooking } from "../hooks/use-bookings";
import { BookingWithRelations, CreateBookingInput } from "@/types/booking";

const bookingSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    clientId: z.string().min(1, "Client is required"),
    serviceId: z.string().optional(),
    location: z.string().optional(),
    date: z.date({
      required_error: "Please select a date",
    }),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    addMeetingUrl: z.boolean().default(false),
    meetingUrl: z.string().optional(),
    attendees: z
      .array(
        z.object({
          email: z.string().email(),
          name: z.string(),
        })
      )
      .default([]),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      // Validate that end time is after start time
      const [startHour, startMinute] = data.startTime.split(":").map(Number);
      const [endHour, endMinute] = data.endTime.split(":").map(Number);
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      return endMinutes > startMinutes;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot?: {
    start: Date;
    end: Date;
  };
  booking?: BookingWithRelations;
  onSuccess?: () => void;
}

export function BookingModal({
  isOpen,
  onClose,
  selectedSlot,
  booking,
  onSuccess,
}: BookingModalProps) {
  const { user } = useAuth();
  const { data: clients = [], isLoading: isLoadingClients } = useClients();
  const createBooking = useCreateBooking();
  const updateBooking = useUpdateBooking();
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [attendeeName, setAttendeeName] = useState("");

  // Common meeting durations in minutes
  const commonDurations = [
    { label: "30 min", value: 30 },
    { label: "1 hour", value: 60 },
    { label: "1.5 hours", value: 90 },
    { label: "2 hours", value: 120 },
  ];

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      title: booking?.title || "",
      description: booking?.description || "",
      clientId: booking?.clientId || "",
      serviceId: booking?.serviceId || "",
      location: booking?.location || "",
      date: booking
        ? new Date(booking.startTime)
        : selectedSlot?.start || new Date(),
      startTime: booking
        ? format(new Date(booking.startTime), "HH:mm")
        : selectedSlot
          ? format(selectedSlot.start, "HH:mm")
          : "09:00",
      endTime: booking
        ? format(new Date(booking.endTime), "HH:mm")
        : selectedSlot
          ? format(selectedSlot.end, "HH:mm")
          : "10:00",
      addMeetingUrl: !!booking?.meetingUrl,
      meetingUrl: booking?.meetingUrl || "",
      attendees: (booking?.attendees && Array.isArray(booking.attendees)
        ? booking.attendees
        : []) as { email: string; name: string }[],
      notes: booking?.notes || "",
    },
  });

  // Watch the selected client to fetch services for that client
  const selectedClientId = form.watch("clientId");

  // Fetch services for the selected client
  const { data: services = [], isLoading: isLoadingServices } = useServices({
    clientId: selectedClientId || undefined,
  });

  const isEditMode = !!booking;
  const isSubmitting = createBooking.isPending || updateBooking.isPending;

  const onSubmit = async (values: BookingFormValues) => {
    // Combine date with time strings to create full datetime objects
    const [startHour, startMinute] = values.startTime.split(":").map(Number);
    const [endHour, endMinute] = values.endTime.split(":").map(Number);

    const startDateTime = new Date(values.date);
    startDateTime.setHours(startHour, startMinute, 0, 0);

    const endDateTime = new Date(values.date);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    const data: CreateBookingInput = {
      title: values.title,
      description: values.description,
      clientId: values.clientId,
      serviceId: values.serviceId === "none" ? undefined : values.serviceId,
      location: values.location,
      hostId: user?.id || "",
      startTime: startDateTime,
      endTime: endDateTime,
      meetingUrl: values.addMeetingUrl ? values.meetingUrl : undefined,
      attendees: values.attendees,
      notes: values.notes,
    };

    try {
      if (isEditMode) {
        await updateBooking.mutateAsync({
          id: booking.id,
          data: {
            title: values.title,
            description: values.description,
            location: values.location,
            meetingUrl: values.addMeetingUrl ? values.meetingUrl : undefined,
            attendees: values.attendees,
            notes: values.notes,
          },
        });
      } else {
        await createBooking.mutateAsync(data);
      }
      onSuccess?.();
      onClose();
      form.reset();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const addAttendee = () => {
    if (attendeeEmail && attendeeName) {
      const currentAttendees = form.getValues("attendees");
      form.setValue("attendees", [
        ...currentAttendees,
        { email: attendeeEmail, name: attendeeName },
      ]);
      setAttendeeEmail("");
      setAttendeeName("");
    }
  };

  const removeAttendee = (index: number) => {
    const currentAttendees = form.getValues("attendees");
    form.setValue(
      "attendees",
      currentAttendees.filter((_, i) => i !== index)
    );
  };

  // Handle duration selection to auto-update end time
  const handleDurationSelect = (durationMinutes: number) => {
    const startTime = form.getValues("startTime");
    if (startTime) {
      const [hour, minute] = startTime.split(":").map(Number);
      const startDate = new Date();
      startDate.setHours(hour, minute, 0, 0);
      const endDate = addMinutes(startDate, durationMinutes);
      const endTime = format(endDate, "HH:mm");
      form.setValue("endTime", endTime);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-[95vw] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold">
            {isEditMode ? "Edit Booking" : "New Booking"}
          </DialogTitle>
          <DialogDescription className="text-base">
            {isEditMode
              ? "Update the booking details below"
              : "Fill in the details for your new booking"}
          </DialogDescription>
        </DialogHeader>

        <Form {...(form as any)}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title Field */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    Meeting Title *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Strategy Planning Session"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date and Time Fields */}
            <div className="space-y-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
              {/* Date Field */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">
                      Date *
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "h-11 w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Start Time Field */}
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">
                      Start Time *
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select start time">
                            <div className="flex items-center">
                              <Clock className="mr-2 h-4 w-4" />
                              {field.value
                                ? format(
                                    parse(field.value, "HH:mm", new Date()),
                                    "h:mm a"
                                  )
                                : "Select time"}
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        {Array.from({ length: 48 }, (_, i) => {
                          const hour = Math.floor(i / 2);
                          const minute = i % 2 === 0 ? "00" : "30";
                          const time = `${hour.toString().padStart(2, "0")}:${minute}`;
                          const displayTime = format(
                            parse(time, "HH:mm", new Date()),
                            "h:mm a"
                          );
                          return (
                            <SelectItem key={time} value={time}>
                              {displayTime}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Time Field */}
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">
                      End Time *
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select end time">
                            <div className="flex items-center">
                              <Clock className="mr-2 h-4 w-4" />
                              {field.value
                                ? format(
                                    parse(field.value, "HH:mm", new Date()),
                                    "h:mm a"
                                  )
                                : "Select time"}
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        {Array.from({ length: 48 }, (_, i) => {
                          const hour = Math.floor(i / 2);
                          const minute = i % 2 === 0 ? "00" : "30";
                          const time = `${hour.toString().padStart(2, "0")}:${minute}`;
                          const displayTime = format(
                            parse(time, "HH:mm", new Date()),
                            "h:mm a"
                          );
                          return (
                            <SelectItem key={time} value={time}>
                              {displayTime}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Quick Duration Selection */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Quick set duration:
              </span>
              {commonDurations.map((duration) => (
                <Button
                  key={duration.value}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDurationSelect(duration.value)}
                  className="h-8 px-3 text-sm"
                >
                  {duration.label}
                </Button>
              ))}
            </div>

            {/* Client and Service Fields - Always stack on mobile, side-by-side on desktop */}
            <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">
                      Client *
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("serviceId", "");
                      }}
                      value={field.value}
                      disabled={isEditMode}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Choose a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingClients ? (
                          <SelectItem value="loading" disabled>
                            Loading clients...
                          </SelectItem>
                        ) : clients && clients.length > 0 ? (
                          clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.businessName || client.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-clients" disabled>
                            No clients available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">
                      Service (Optional)
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!selectedClientId}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue
                            placeholder={
                              !selectedClientId
                                ? "Select a client first"
                                : "Choose a service"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {!selectedClientId ? (
                          <SelectItem value="no-client" disabled>
                            Select a client first
                          </SelectItem>
                        ) : (
                          <>
                            <SelectItem value="none">
                              No specific service
                            </SelectItem>
                            {isLoadingServices ? (
                              <SelectItem value="loading" disabled>
                                Loading services...
                              </SelectItem>
                            ) : services && services.length > 0 ? (
                              services.map((service) => (
                                <SelectItem key={service.id} value={service.id}>
                                  {(service as any).template?.name ||
                                    (service as any).name ||
                                    `Service ${service.id.slice(-4)}`}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-services" disabled>
                                No services available for this client
                              </SelectItem>
                            )}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide details about the meeting..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location Field */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    Location
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Office address, room number, or leave blank"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Meeting URL Section */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="addMeetingUrl"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border bg-gray-50 p-4">
                    <div className="space-y-1">
                      <FormLabel className="text-base font-medium">
                        Video Conference
                      </FormLabel>
                      <FormDescription className="text-sm">
                        Add a Zoom, Google Meet, or other video link
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("addMeetingUrl") && (
                <FormField
                  control={form.control}
                  name="meetingUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="https://zoom.us/j/123456789 or Google Meet link"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Attendees Section */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">
                  Meeting Attendees
                </Label>
                <p className="mt-1 text-sm text-gray-600">
                  Add additional people to invite to this meeting
                </p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    placeholder="attendee@company.com"
                    value={attendeeEmail}
                    onChange={(e) => setAttendeeEmail(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addAttendee())
                    }
                    className="h-11"
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Full Name"
                      value={attendeeName}
                      onChange={(e) => setAttendeeName(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addAttendee())
                      }
                      className="h-11 flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addAttendee}
                      disabled={!attendeeEmail || !attendeeName}
                      className="h-11 px-4"
                    >
                      Add
                    </Button>
                  </div>
                </div>

                {form.watch("attendees").length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Invited Attendees:
                    </Label>
                    <div className="space-y-2">
                      {form.watch("attendees").map((attendee, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg border bg-gray-50 p-3"
                        >
                          <div>
                            <div className="text-sm font-medium">
                              {attendee.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {attendee.email}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttendee(index)}
                            className="text-red-600 hover:bg-red-50 hover:text-red-800"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Internal Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    Internal Notes
                  </FormLabel>
                  <FormDescription>
                    Private notes that won&apos;t be shared with attendees
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder="Add any internal notes or preparation details..."
                      className="min-h-[80px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Buttons */}
            <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-11"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 sm:ml-auto"
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {isEditMode ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>{isEditMode ? "Update Booking" : "Create Booking"}</>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
