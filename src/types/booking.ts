import { Booking, BookingStatus, Client, Service, User } from "@prisma/client";
import { UserWithName, ServiceWithName } from "./extended";

export interface BookingWithRelations extends Booking {
  client: Client;
  service?: ServiceWithName | null;
  host: UserWithName;
  creator: UserWithName;
}

export interface CreateBookingInput {
  title: string;
  description?: string;
  clientId: string;
  serviceId?: string;
  hostId: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  meetingUrl?: string;
  attendees?: Array<{
    email: string;
    name: string;
  }>;
  notes?: string;
}

export interface UpdateBookingInput {
  title?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  location?: string;
  meetingUrl?: string;
  attendees?: Array<{
    email: string;
    name: string;
  }>;
  notes?: string;
  status?: BookingStatus;
}

export interface AvailabilitySlot {
  start: Date;
  end: Date;
  available: boolean;
}

export interface BookingSlotInfo {
  time: string;
  date: Date;
  available: boolean;
}
