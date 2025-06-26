"use client";

import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CalendarIcon,
  Clock,
  MapPin,
  Link,
  User,
  FileText,
  Mail,
  Edit,
  Trash2,
} from "lucide-react";
import { BookingWithRelations } from "@/types/booking";
import { useState } from "react";
import { useCancelBooking } from "../hooks/use-bookings";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface BookingDetailsProps {
  booking: BookingWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (booking: BookingWithRelations) => void;
}

export function BookingDetails({
  booking,
  isOpen,
  onClose,
  onEdit,
}: BookingDetailsProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const cancelBooking = useCancelBooking();

  if (!booking) return null;

  const handleCancel = async () => {
    await cancelBooking.mutateAsync({
      id: booking.id,
      reason: cancelReason,
    });
    setShowCancelDialog(false);
    setCancelReason("");
    onClose();
  };

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

  const canEdit =
    booking.status !== "CANCELLED" && booking.status !== "COMPLETED";
  const canCancel =
    booking.status === "PENDING" || booking.status === "CONFIRMED";

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle>{booking.title}</DialogTitle>
                <DialogDescription>
                  Booking ID: {booking.id.slice(0, 8)}
                </DialogDescription>
              </div>
              <Badge variant={getStatusBadgeVariant(booking.status)}>
                {booking.status}
              </Badge>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[500px] pr-4">
            <div className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4 text-gray-500" />
                  <span>
                    {format(new Date(booking.startTime), "EEEE, MMMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>
                    {format(new Date(booking.startTime), "h:mm a")} -{" "}
                    {format(new Date(booking.endTime), "h:mm a")}
                    <span className="ml-1 text-gray-500">
                      ({booking.duration} minutes)
                    </span>
                  </span>
                </div>
                {booking.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{booking.location}</span>
                  </div>
                )}
                {booking.meetingUrl && (
                  <div className="flex items-center gap-2 text-sm">
                    <Link className="h-4 w-4 text-gray-500" />
                    <a
                      href={booking.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Join Meeting
                    </a>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Client Information</h4>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>{booking.client.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{booking.client.businessName}</span>
                  </div>
                </div>
              </div>

              {booking.service && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Service</h4>
                    <p className="text-sm">
                      {(booking.service as any).name ||
                        `Service ID: ${booking.service.id.slice(0, 8)}`}
                    </p>
                  </div>
                </>
              )}

              {booking.description && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Description</h4>
                    <p className="text-sm text-gray-600">
                      {booking.description}
                    </p>
                  </div>
                </>
              )}

              {booking.attendees &&
                Array.isArray(booking.attendees) &&
                booking.attendees.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Attendees</h4>
                      <div className="space-y-1">
                        {(booking.attendees as any[]).map(
                          (attendee: any, index: number) => (
                            <div key={index} className="text-sm">
                              {attendee.name} ({attendee.email})
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </>
                )}

              {booking.notes && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4" />
                      Internal Notes
                    </h4>
                    <p className="text-sm text-gray-600">{booking.notes}</p>
                  </div>
                </>
              )}

              <Separator />

              <div className="space-y-2 text-xs text-gray-500">
                <p>
                  Created by{" "}
                  {(booking.creator as any).name || booking.creator.email} on{" "}
                  {format(new Date(booking.createdAt), "MMM d, yyyy")}
                </p>
                <p>Host: {(booking.host as any).name || booking.host.email}</p>
                {booking.googleEventId && <p>Synced to Google Calendar</p>}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2">
            {canEdit && (
              <Button
                variant="outline"
                onClick={() => {
                  onEdit?.(booking);
                  onClose();
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            {canCancel && (
              <Button
                variant="destructive"
                onClick={() => setShowCancelDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Cancel Booking
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label htmlFor="cancel-reason">
              Cancellation Reason (Optional)
            </Label>
            <Textarea
              id="cancel-reason"
              className="mt-2"
              placeholder="Provide a reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={cancelBooking.isPending}
            >
              {cancelBooking.isPending ? "Cancelling..." : "Cancel Booking"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
