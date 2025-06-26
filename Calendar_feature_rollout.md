# 📅 Calendar Booking Feature - Detailed Implementation Plan

## 🔴 **What YOU Need to Do First**

### 1. **Google Cloud Console Setup** (30 mins)

```
1. Go to https://console.cloud.google.com
2. Create a new project or select existing
3. Enable Google Calendar API:
   - Navigate to "APIs & Services" → "Enable APIs"
   - Search for "Google Calendar API"
   - Click Enable

4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Configure consent screen first:
     * App name: "Agency Hub Calendar"
     * User support email: your email
     * Authorized domains: your-domain.com, localhost:3001
   - Application type: "Web application"
   - Authorized redirect URIs:
     * http://localhost:3001/api/auth/google/callback
     * https://your-domain.com/api/auth/google/callback
   - Save Client ID and Client Secret

5. Add to .env.local:
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
```

### 2. **Email Service Setup** (15 mins)

Choose one:

**Option A: Resend (Recommended - easier)**

```
1. Sign up at https://resend.com
2. Get API key
3. Add to .env.local:
   RESEND_API_KEY=your-api-key
   EMAIL_FROM=noreply@your-domain.com
```

**Option B: SendGrid**

```
1. Sign up at https://sendgrid.com
2. Create API key with full access
3. Verify sender email
4. Add to .env.local:
   SENDGRID_API_KEY=your-api-key
   EMAIL_FROM=noreply@your-domain.com
```

## 💻 **Development Implementation Plan**

### **Phase 1: Database Schema & Models** (Day 1-2)

#### 1. Update Prisma Schema

```prisma
// Add to schema.prisma

model CalendarConnection {
  id              String   @id @default(uuid())
  userId          String   @unique
  provider        String   // "google"
  accessToken     String   @db.Text
  refreshToken    String   @db.Text
  expiresAt       DateTime
  calendarId      String   // Primary calendar ID
  email           String
  syncEnabled     Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User     @relation(fields: [userId], references: [id])
}

model Booking {
  id              String         @id @default(uuid())
  title           String
  description     String?
  clientId        String
  serviceId       String?
  hostId          String         // Admin/Manager hosting
  startTime       DateTime
  endTime         DateTime
  duration        Int            // minutes
  status          BookingStatus  @default(PENDING)
  location        String?
  meetingUrl      String?
  googleEventId   String?        // For sync
  attendees       Json           // [{email, name, status}]
  reminderSent    Boolean        @default(false)
  cancelReason    String?
  notes           String?
  createdBy       String
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  client          Client         @relation(fields: [clientId], references: [id])
  service         Service?       @relation(fields: [serviceId], references: [id])
  host            User           @relation("BookingHost", fields: [hostId], references: [id])
  creator         User           @relation("BookingCreator", fields: [createdBy], references: [id])

  @@index([hostId, startTime])
  @@index([clientId])
  @@index([status])
  @@index([startTime])
}

model AvailabilityRule {
  id              String    @id @default(uuid())
  userId          String
  name            String    // "Regular Hours", "Holiday Schedule"
  isDefault       Boolean   @default(false)
  timezone        String    @default("America/New_York")
  rules           Json      // Complex availability rules
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  user            User      @relation(fields: [userId], references: [id])

  @@index([userId])
}

model BookingSlot {
  id              String    @id @default(uuid())
  userId          String
  dayOfWeek       Int       // 0-6 (Sunday-Saturday)
  startTime       String    // "09:00"
  endTime         String    // "17:00"
  isActive        Boolean   @default(true)

  user            User      @relation(fields: [userId], references: [id])

  @@unique([userId, dayOfWeek, startTime])
}

enum BookingStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
  NO_SHOW
  RESCHEDULED
}
```

#### 2. Run migrations

```bash
npm run db:generate
npm run db:push
```

### **Phase 2: Google Calendar Integration** (Day 3-5)

#### 1. Install dependencies

```bash
npm install googleapis google-auth-library
npm install @types/google-auth-library --save-dev
```

#### 2. Create Google OAuth flow

```typescript
// src/lib/google-calendar.ts
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

export const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export const getAuthUrl = (userId: string) => {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    state: userId, // Pass user ID for linking
  });
};

export const getCalendarClient = async (
  accessToken: string,
  refreshToken: string
) => {
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return google.calendar({ version: "v3", auth: oauth2Client });
};

export const refreshAccessToken = async (refreshToken: string) => {
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
};
```

#### 3. Create OAuth callback handler

```typescript
// src/app/api/auth/google/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { oauth2Client } from "@/lib/google-calendar";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // userId

  if (!code || !state) {
    return NextResponse.redirect("/calendar?error=missing_params");
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const { access_token, refresh_token, expiry_date } = tokens;

    // Get user info
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    // Store in database
    await prisma.calendarConnection.upsert({
      where: { userId: state },
      update: {
        accessToken: access_token!,
        refreshToken: refresh_token!,
        expiresAt: new Date(expiry_date!),
        email: data.email!,
        syncEnabled: true,
      },
      create: {
        userId: state,
        provider: "google",
        accessToken: access_token!,
        refreshToken: refresh_token!,
        expiresAt: new Date(expiry_date!),
        calendarId: "primary",
        email: data.email!,
        syncEnabled: true,
      },
    });

    return NextResponse.redirect("/calendar?connected=true");
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect("/calendar?error=auth_failed");
  }
}
```

#### 4. Create calendar sync service

```typescript
// src/lib/services/calendar-sync.ts
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { getCalendarClient, refreshAccessToken } from "@/lib/google-calendar";

export class CalendarSyncService {
  async getFreeBusy(userId: string, timeMin: Date, timeMax: Date) {
    const connection = await prisma.calendarConnection.findUnique({
      where: { userId },
    });

    if (!connection) {
      throw new Error("No calendar connection found");
    }

    // Check if token needs refresh
    if (connection.expiresAt < new Date()) {
      const newTokens = await refreshAccessToken(connection.refreshToken);
      await prisma.calendarConnection.update({
        where: { id: connection.id },
        data: {
          accessToken: newTokens.access_token!,
          expiresAt: new Date(newTokens.expiry_date!),
        },
      });
      connection.accessToken = newTokens.access_token!;
    }

    const calendar = await getCalendarClient(
      connection.accessToken,
      connection.refreshToken
    );

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: [{ id: connection.calendarId }],
      },
    });

    return response.data.calendars?.[connection.calendarId]?.busy || [];
  }

  async createEvent(booking: any, userId: string) {
    const connection = await prisma.calendarConnection.findUnique({
      where: { userId },
    });

    if (!connection || !connection.syncEnabled) return;

    const calendar = await getCalendarClient(
      connection.accessToken,
      connection.refreshToken
    );

    const event = {
      summary: booking.title,
      description: booking.description,
      start: {
        dateTime: booking.startTime.toISOString(),
        timeZone: "America/New_York",
      },
      end: {
        dateTime: booking.endTime.toISOString(),
        timeZone: "America/New_York",
      },
      attendees: booking.attendees || [],
      location: booking.location,
      conferenceData: booking.meetingUrl
        ? {
            createRequest: {
              requestId: booking.id,
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          }
        : undefined,
    };

    const response = await calendar.events.insert({
      calendarId: connection.calendarId,
      requestBody: event,
      conferenceDataVersion: booking.meetingUrl ? 1 : 0,
    });

    return response.data.id;
  }

  async updateEvent(booking: any, googleEventId: string, userId: string) {
    // Similar to createEvent but uses calendar.events.update
  }

  async deleteEvent(googleEventId: string, userId: string) {
    // Uses calendar.events.delete
  }
}
```

### **Phase 3: Core Booking API** (Day 6-8)

#### 1. Create booking services

```typescript
// src/lib/services/booking-service.ts
import { prisma } from "@/lib/prisma";
import { CalendarSyncService } from "./calendar-sync";
import { EmailService } from "./email-service";

export class BookingService {
  private calendarSync = new CalendarSyncService();
  private emailService = new EmailService();

  async checkAvailability(
    hostId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    // Check database bookings
    const existingBookings = await prisma.booking.count({
      where: {
        hostId,
        status: { notIn: ["CANCELLED"] },
        OR: [
          {
            startTime: { gte: startTime, lt: endTime },
          },
          {
            endTime: { gt: startTime, lte: endTime },
          },
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gte: endTime } },
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
      return busyTimes.length === 0;
    } catch (error) {
      console.error("Calendar check failed:", error);
      return true; // Allow booking if calendar check fails
    }
  }

  async getAvailableSlots(hostId: string, date: Date, duration: number = 60) {
    // Get user's availability rules
    const slots = await prisma.bookingSlot.findMany({
      where: { userId: hostId, isActive: true, dayOfWeek: date.getDay() },
    });

    // Get existing bookings for the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await prisma.booking.findMany({
      where: {
        hostId,
        startTime: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ["CANCELLED"] },
      },
    });

    // Get Google Calendar busy times
    const busyTimes = await this.calendarSync.getFreeBusy(
      hostId,
      startOfDay,
      endOfDay
    );

    // Calculate available slots
    const availableSlots = [];
    // ... slot calculation logic

    return availableSlots;
  }

  async createBooking(data: any, createdBy: string) {
    // Check availability first
    const isAvailable = await this.checkAvailability(
      data.hostId,
      data.startTime,
      data.endTime
    );

    if (!isAvailable) {
      throw new Error("Time slot not available");
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        ...data,
        createdBy,
        duration: Math.floor(
          (data.endTime.getTime() - data.startTime.getTime()) / 60000
        ),
      },
      include: {
        client: true,
        host: true,
        service: true,
      },
    });

    // Sync to Google Calendar
    try {
      const googleEventId = await this.calendarSync.createEvent(
        booking,
        booking.hostId
      );

      await prisma.booking.update({
        where: { id: booking.id },
        data: { googleEventId },
      });
    } catch (error) {
      console.error("Calendar sync failed:", error);
    }

    // Send confirmation email
    await this.emailService.sendBookingConfirmation(booking);

    return booking;
  }

  async updateBooking(id: string, data: any, updatedBy: string) {
    // Similar logic with update
  }

  async cancelBooking(id: string, reason: string, cancelledBy: string) {
    const booking = await prisma.booking.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelReason: reason,
        updatedAt: new Date(),
      },
      include: {
        client: true,
        host: true,
      },
    });

    // Remove from Google Calendar
    if (booking.googleEventId) {
      await this.calendarSync.deleteEvent(
        booking.googleEventId,
        booking.hostId
      );
    }

    // Send cancellation email
    await this.emailService.sendCancellationNotice(booking);

    return booking;
  }
}
```

#### 2. API Routes

```typescript
// src/app/api/calendar/connect/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { getAuthUrl } from "@/lib/google-calendar";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authUrl = getAuthUrl(session.user.id);
  return NextResponse.json({ authUrl });
}

// src/app/api/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { BookingService } from "@/lib/services/booking-service";

const bookingService = new BookingService();

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const bookings = await prisma.booking.findMany({
    where: {
      hostId: session.user.role === "CLIENT" ? undefined : session.user.id,
      clientId:
        session.user.role === "CLIENT" ? session.user.clientId : undefined,
      startTime: startDate ? { gte: new Date(startDate) } : undefined,
      endTime: endDate ? { lte: new Date(endDate) } : undefined,
    },
    include: {
      client: true,
      service: true,
      host: true,
    },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(bookings);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session || !["ADMIN", "SERVICE_MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();

  try {
    const booking = await bookingService.createBooking(data, session.user.id);
    return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// src/app/api/bookings/availability/route.ts
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { hostId, date, duration } = await req.json();

  const slots = await bookingService.getAvailableSlots(
    hostId,
    new Date(date),
    duration
  );

  return NextResponse.json({ slots });
}
```

### **Phase 4: Calendar UI Components** (Day 9-12)

#### 1. Install UI dependencies

```bash
npm install react-big-calendar date-fns-tz
npm install @types/react-big-calendar --save-dev
```

#### 2. Create calendar page structure

```
/src/app/(dashboard)/calendar/
  ├── page.tsx                 // Main calendar view
  ├── components/
  │   ├── calendar-view.tsx    // Big calendar component
  │   ├── booking-modal.tsx    // Create/edit booking
  │   ├── availability-settings.tsx
  │   ├── calendar-sidebar.tsx // Mini calendar + filters
  │   └── booking-details.tsx  // View booking details
  └── hooks/
      ├── use-bookings.ts
      └── use-availability.ts
```

#### 3. Main Calendar Page

```tsx
// src/app/(dashboard)/calendar/page.tsx
"use client";

import { useState } from 'react';
import { CalendarView } from './components/calendar-view';
import { CalendarSidebar } from './components/calendar-sidebar';
import { BookingModal } from './components/booking-modal';
import { useBookings } from './hooks/use-bookings';

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const { bookings, isLoading } = useBookings({
    startDate: // first day of month
    endDate: // last day of month
  });

  return (
    <div className="flex h-full">
      <CalendarSidebar
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
      />

      <div className="flex-1 p-6">
        <CalendarView
          bookings={bookings}
          onSelectSlot={(slotInfo) => {
            setSelectedSlot(slotInfo);
            setIsBookingModalOpen(true);
          }}
          onSelectEvent={(event) => {
            // Show booking details
          }}
        />
      </div>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        selectedSlot={selectedSlot}
      />
    </div>
  );
}
```

#### 4. Calendar View Component

```tsx
// src/app/(dashboard)/calendar/components/calendar-view.tsx
import { Calendar, momentLocalizer, View } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

export function CalendarView({ bookings, onSelectSlot, onSelectEvent }) {
  const events = bookings.map((booking) => ({
    id: booking.id,
    title: booking.title,
    start: new Date(booking.startTime),
    end: new Date(booking.endTime),
    resource: booking,
  }));

  return (
    <Calendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      style={{ height: "calc(100vh - 200px)" }}
      onSelectSlot={onSelectSlot}
      onSelectEvent={onSelectEvent}
      selectable
      popup
      views={["month", "week", "day", "agenda"]}
      defaultView="week"
      eventPropGetter={(event) => ({
        style: {
          backgroundColor: getStatusColor(event.resource.status),
        },
      })}
    />
  );
}
```

#### 5. Booking Modal

```tsx
// src/app/(dashboard)/calendar/components/booking-modal.tsx
import { useForm } from "react-hook-form";
import { Dialog } from "@/components/ui/dialog";
import { useClients } from "@/hooks/use-clients";
import { useCreateBooking } from "../hooks/use-bookings";

export function BookingModal({ isOpen, onClose, selectedSlot }) {
  const { clients } = useClients();
  const createBooking = useCreateBooking();
  const form = useForm();

  const onSubmit = async (data) => {
    await createBooking.mutateAsync({
      ...data,
      startTime: selectedSlot.start,
      endTime: selectedSlot.end,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields for:
            - Title
            - Client selection
            - Service selection (optional)
            - Description
            - Location
            - Meeting URL toggle
            - Attendees
        */}
      </form>
    </Dialog>
  );
}
```

### **Phase 5: Email Integration** (Day 13-14)

#### 1. Install email package

```bash
# For Resend
npm install resend react-email @react-email/components

# For SendGrid
npm install @sendgrid/mail
```

#### 2. Create email templates

```tsx
// src/lib/email/templates/booking-confirmation.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export function BookingConfirmationEmail({ booking }) {
  return (
    <Html>
      <Head />
      <Preview>Your booking has been confirmed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Booking Confirmed</Heading>

          <Section>
            <Text style={text}>Hi {booking.client.name},</Text>
            <Text style={text}>
              Your booking has been confirmed with the following details:
            </Text>
          </Section>

          <Section style={box}>
            <Text style={text}>
              <strong>Date:</strong> {formatDate(booking.startTime)}
            </Text>
            <Text style={text}>
              <strong>Time:</strong> {formatTime(booking.startTime)} -{" "}
              {formatTime(booking.endTime)}
            </Text>
            <Text style={text}>
              <strong>With:</strong> {booking.host.name}
            </Text>
            {booking.location && (
              <Text style={text}>
                <strong>Location:</strong> {booking.location}
              </Text>
            )}
            {booking.meetingUrl && (
              <Text style={text}>
                <strong>Meeting Link:</strong>{" "}
                <Link href={booking.meetingUrl}>Join Meeting</Link>
              </Text>
            )}
          </Section>

          <Section>
            <Link
              href={`${process.env.NEXT_PUBLIC_APP_URL}/bookings/${booking.id}`}
            >
              View Booking Details
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

#### 3. Create email service

```typescript
// src/lib/services/email-service.ts
import { Resend } from "resend";
import { BookingConfirmationEmail } from "@/lib/email/templates/booking-confirmation";

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
  async sendBookingConfirmation(booking: any) {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: booking.client.email,
      subject: "Booking Confirmed - " + booking.title,
      react: BookingConfirmationEmail({ booking }),
    });

    if (error) {
      console.error("Failed to send confirmation email:", error);
    }

    return data;
  }

  async sendBookingReminder(booking: any) {
    // Send 24 hours before
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: booking.client.email,
      subject: "Reminder: Upcoming Booking Tomorrow",
      react: BookingReminderEmail({ booking }),
    });

    if (error) {
      console.error("Failed to send reminder email:", error);
    }

    // Mark reminder as sent
    await prisma.booking.update({
      where: { id: booking.id },
      data: { reminderSent: true },
    });

    return data;
  }

  async sendCancellationNotice(booking: any) {
    // Similar implementation
  }
}
```

#### 4. Set up reminder cron job

```typescript
// src/app/api/cron/booking-reminders/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EmailService } from "@/lib/services/email-service";

export async function GET(req: Request) {
  // Verify cron secret (for Vercel cron)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const emailService = new EmailService();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const endOfTomorrow = new Date(tomorrow);
  endOfTomorrow.setHours(23, 59, 59, 999);

  // Find bookings for tomorrow that haven't had reminders sent
  const bookings = await prisma.booking.findMany({
    where: {
      startTime: {
        gte: tomorrow,
        lte: endOfTomorrow,
      },
      status: "CONFIRMED",
      reminderSent: false,
    },
    include: {
      client: true,
      host: true,
      service: true,
    },
  });

  // Send reminders
  const results = await Promise.all(
    bookings.map((booking) => emailService.sendBookingReminder(booking))
  );

  return NextResponse.json({
    sent: results.length,
    bookings: bookings.map((b) => b.id),
  });
}
```

### **Phase 6: Additional Features** (Day 15-17)

#### 1. Availability Management UI

```tsx
// src/app/(dashboard)/calendar/components/availability-settings.tsx
export function AvailabilitySettings({ userId }) {
  const { slots, updateSlot } = useAvailabilitySlots(userId);

  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return (
    <div className="space-y-4">
      <h3>Weekly Availability</h3>
      {daysOfWeek.map((day, index) => (
        <div key={day} className="flex items-center space-x-4">
          <span className="w-24">{day}</span>
          <TimePicker
            value={slots[index]?.startTime}
            onChange={(time) => updateSlot(index, "startTime", time)}
          />
          <span>to</span>
          <TimePicker
            value={slots[index]?.endTime}
            onChange={(time) => updateSlot(index, "endTime", time)}
          />
          <Switch
            checked={slots[index]?.isActive}
            onCheckedChange={(active) => updateSlot(index, "isActive", active)}
          />
        </div>
      ))}
    </div>
  );
}
```

#### 2. Client Booking Portal (Optional)

```tsx
// src/app/book/[userId]/page.tsx
export default function PublicBookingPage({ params }) {
  const { userId } = params;
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const { data: user } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetch(`/api/users/${userId}/public`).then((r) => r.json()),
  });

  const { data: slots } = useQuery({
    queryKey: ["slots", userId, selectedDate],
    queryFn: () =>
      fetch(`/api/bookings/slots?userId=${userId}&date=${selectedDate}`).then(
        (r) => r.json()
      ),
    enabled: !!selectedDate,
  });

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1>Book a meeting with {user?.name}</h1>

      <div className="grid grid-cols-2 gap-6">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          disabled={(date) => date < new Date()}
        />

        {selectedDate && (
          <div className="space-y-2">
            <h3>Available times for {format(selectedDate, "MMMM d, yyyy")}</h3>
            {slots?.map((slot) => (
              <button
                key={slot.time}
                onClick={() => setSelectedSlot(slot)}
                className="block w-full rounded border p-2 hover:bg-gray-50"
              >
                {slot.time}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedSlot && (
        <BookingForm userId={userId} date={selectedDate} slot={selectedSlot} />
      )}
    </div>
  );
}
```

### **Phase 7: Testing & Deployment** (Day 18-20)

#### 1. Write tests

```typescript
// tests/calendar/booking-creation.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Booking Creation", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto("/login");
    await page.fill('[name="email"]', "admin@test.com");
    await page.fill('[name="password"]', "password");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
  });

  test("should create a new booking", async ({ page }) => {
    await page.goto("/calendar");

    // Click on a time slot
    await page.click('.rbc-time-slot:has-text("2:00 PM")');

    // Fill booking form
    await page.fill('[name="title"]', "Test Meeting");
    await page.selectOption('[name="clientId"]', { label: "Test Client" });
    await page.fill('[name="description"]', "Test booking description");

    // Submit
    await page.click('button:has-text("Create Booking")');

    // Verify booking appears
    await expect(
      page.locator('.rbc-event:has-text("Test Meeting")')
    ).toBeVisible();
  });

  test("should check availability before booking", async ({ page }) => {
    // Create a booking first
    // ... create booking

    // Try to create overlapping booking
    await page.click('.rbc-time-slot:has-text("2:00 PM")');
    await page.fill('[name="title"]', "Conflicting Meeting");
    await page.click('button:has-text("Create Booking")');

    // Should show error
    await expect(page.locator("text=Time slot not available")).toBeVisible();
  });
});

// tests/calendar/availability-check.spec.ts
test.describe("Availability Checking", () => {
  test("should show busy times from Google Calendar", async ({ page }) => {
    // Mock Google Calendar API response
    await page.route("**/api/calendar/freebusy", (route) => {
      route.fulfill({
        body: JSON.stringify({
          busy: [
            { start: "2024-01-15T14:00:00Z", end: "2024-01-15T15:00:00Z" },
          ],
        }),
      });
    });

    await page.goto("/calendar");

    // Busy time should be blocked
    await expect(page.locator('.rbc-time-slot[data-time="14:00"]')).toHaveClass(
      /blocked/
    );
  });
});
```

#### 2. Environment setup

```env
# Production .env
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google/callback
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
CRON_SECRET=your-cron-secret
```

#### 3. Deploy considerations

```javascript
// vercel.json - for cron jobs
{
  "crons": [
    {
      "path": "/api/cron/booking-reminders",
      "schedule": "0 * * * *" // Every hour
    }
  ]
}
```

**Additional deployment steps:**

1. Update Google OAuth redirect URIs for production
2. Set up domain in email service (Resend/SendGrid)
3. Configure CORS if needed
4. Set up monitoring for API quotas
5. Enable Google Calendar API billing if needed

### 📋 **Feature Checklist**

**Core Features:**

- [ ] Calendar view with bookings
- [ ] Create/edit/cancel bookings
- [ ] Google Calendar sync
- [ ] Availability settings
- [ ] Conflict detection
- [ ] Email confirmations
- [ ] Email reminders (24h before)
- [ ] Role-based access (Admin/Manager only)
- [ ] Menu item with proper permissions

**Nice to Have:**

- [ ] Client self-booking portal
- [ ] Recurring bookings
- [ ] Multiple calendar support
- [ ] SMS reminders
- [ ] Zoom/Google Meet integration
- [ ] Calendar export (iCal)
- [ ] Booking analytics
- [ ] Buffer time between meetings
- [ ] Time zone support
- [ ] Waitlist for cancelled slots

### 🚀 **Quick Start Commands**

After you provide the OAuth credentials:

```bash
# 1. Install all dependencies
npm install googleapis google-auth-library react-big-calendar date-fns-tz resend react-email @react-email/components

# 2. Update schema and migrate
npm run db:generate
npm run db:push

# 3. Update environment variables
# Add all the required vars to .env.local

# 4. Start development
npm run dev

# 5. Run tests
npm run test:e2e
```

### 📝 **Post-Implementation Checklist**

1. **Security Review**

   - [ ] Validate all user inputs
   - [ ] Check authorization on all endpoints
   - [ ] Secure token storage
   - [ ] Rate limiting on public endpoints

2. **Performance Optimization**

   - [ ] Index database queries
   - [ ] Implement caching for availability checks
   - [ ] Lazy load calendar events
   - [ ] Optimize Google Calendar API calls

3. **User Experience**

   - [ ] Loading states for all async operations
   - [ ] Error handling with user-friendly messages
   - [ ] Mobile responsive design
   - [ ] Keyboard navigation support

4. **Monitoring**
   - [ ] Set up error tracking (Sentry)
   - [ ] Monitor Google Calendar API usage
   - [ ] Track email delivery rates
   - [ ] Log booking metrics

This implementation plan provides a structured approach to adding a professional calendar booking feature to your Agency Hub application. The integration with Google Calendar and email notifications will provide a seamless experience similar to Calendly while maintaining your existing app's architecture and security model.
