import { google, calendar_v3 } from "googleapis";
import { prisma } from "@/lib/prisma";
import { getCalendarClient, refreshAccessToken } from "@/lib/google-calendar";
import { Booking } from "@prisma/client";

export class CalendarSyncService {
  async getFreeBusy(
    userId: string,
    timeMin: Date,
    timeMax: Date
  ): Promise<calendar_v3.Schema$TimePeriod[]> {
    const connection = await prisma.calendarConnection.findUnique({
      where: { userId },
    });

    if (!connection) {
      throw new Error("No calendar connection found");
    }

    // Check if token needs refresh
    if (connection.expiresAt < new Date()) {
      const newTokens = await refreshAccessToken(connection.refreshToken);

      if (!newTokens.access_token || !newTokens.expiry_date) {
        throw new Error("Failed to refresh access token");
      }

      await prisma.calendarConnection.update({
        where: { id: connection.id },
        data: {
          accessToken: newTokens.access_token,
          expiresAt: new Date(newTokens.expiry_date),
        },
      });

      connection.accessToken = newTokens.access_token;
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

  async createEvent(
    booking: Booking & { client: { name: string; email?: string } },
    userId: string
  ): Promise<string | null> {
    const connection = await prisma.calendarConnection.findUnique({
      where: { userId },
    });

    if (!connection || !connection.syncEnabled) {
      return null;
    }

    try {
      // Refresh token if needed
      if (connection.expiresAt < new Date()) {
        const newTokens = await refreshAccessToken(connection.refreshToken);

        if (!newTokens.access_token || !newTokens.expiry_date) {
          throw new Error("Failed to refresh access token");
        }

        await prisma.calendarConnection.update({
          where: { id: connection.id },
          data: {
            accessToken: newTokens.access_token,
            expiresAt: new Date(newTokens.expiry_date),
          },
        });

        connection.accessToken = newTokens.access_token;
      }

      const calendar = await getCalendarClient(
        connection.accessToken,
        connection.refreshToken
      );

      // Parse attendees from JSON
      const attendees = (booking.attendees as any[]) || [];
      const googleAttendees = attendees.map((a) => ({
        email: a.email,
        displayName: a.name,
      }));

      // Add client as attendee if they have an email
      if (booking.client.email) {
        googleAttendees.push({
          email: booking.client.email,
          displayName: booking.client.name,
        });
      }

      const event: calendar_v3.Schema$Event = {
        summary: booking.title,
        description: booking.description || undefined,
        start: {
          dateTime: booking.startTime.toISOString(),
          timeZone: "America/New_York",
        },
        end: {
          dateTime: booking.endTime.toISOString(),
          timeZone: "America/New_York",
        },
        attendees: googleAttendees.length > 0 ? googleAttendees : undefined,
        location: booking.location || undefined,
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 }, // 24 hours
            { method: "popup", minutes: 60 }, // 1 hour
          ],
        },
      };

      // Add Google Meet if requested
      if (booking.meetingUrl === "google_meet") {
        event.conferenceData = {
          createRequest: {
            requestId: booking.id,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        };
      }

      const response = await calendar.events.insert({
        calendarId: connection.calendarId,
        requestBody: event,
        conferenceDataVersion:
          booking.meetingUrl === "google_meet" ? 1 : undefined,
        sendUpdates: "all", // Send email invites to attendees
      });

      // Update booking with Google Meet URL if created
      if (response.data.hangoutLink) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { meetingUrl: response.data.hangoutLink },
        });
      }

      return response.data.id || null;
    } catch (error) {
      console.error("Failed to create Google Calendar event:", error);
      return null;
    }
  }

  async updateEvent(
    booking: Booking & { client: { name: string; email?: string } },
    googleEventId: string,
    userId: string
  ): Promise<boolean> {
    const connection = await prisma.calendarConnection.findUnique({
      where: { userId },
    });

    if (!connection || !connection.syncEnabled) {
      return false;
    }

    try {
      // Refresh token if needed
      if (connection.expiresAt < new Date()) {
        const newTokens = await refreshAccessToken(connection.refreshToken);

        if (!newTokens.access_token || !newTokens.expiry_date) {
          throw new Error("Failed to refresh access token");
        }

        await prisma.calendarConnection.update({
          where: { id: connection.id },
          data: {
            accessToken: newTokens.access_token,
            expiresAt: new Date(newTokens.expiry_date),
          },
        });

        connection.accessToken = newTokens.access_token;
      }

      const calendar = await getCalendarClient(
        connection.accessToken,
        connection.refreshToken
      );

      // Parse attendees from JSON
      const attendees = (booking.attendees as any[]) || [];
      const googleAttendees = attendees.map((a) => ({
        email: a.email,
        displayName: a.name,
      }));

      // Add client as attendee if they have an email
      if (booking.client.email) {
        googleAttendees.push({
          email: booking.client.email,
          displayName: booking.client.name,
        });
      }

      const event: calendar_v3.Schema$Event = {
        summary: booking.title,
        description: booking.description || undefined,
        start: {
          dateTime: booking.startTime.toISOString(),
          timeZone: "America/New_York",
        },
        end: {
          dateTime: booking.endTime.toISOString(),
          timeZone: "America/New_York",
        },
        attendees: googleAttendees.length > 0 ? googleAttendees : undefined,
        location: booking.location || undefined,
      };

      await calendar.events.update({
        calendarId: connection.calendarId,
        eventId: googleEventId,
        requestBody: event,
        sendUpdates: "all",
      });

      return true;
    } catch (error) {
      console.error("Failed to update Google Calendar event:", error);
      return false;
    }
  }

  async deleteEvent(googleEventId: string, userId: string): Promise<boolean> {
    const connection = await prisma.calendarConnection.findUnique({
      where: { userId },
    });

    if (!connection || !connection.syncEnabled) {
      return false;
    }

    try {
      // Refresh token if needed
      if (connection.expiresAt < new Date()) {
        const newTokens = await refreshAccessToken(connection.refreshToken);

        if (!newTokens.access_token || !newTokens.expiry_date) {
          throw new Error("Failed to refresh access token");
        }

        await prisma.calendarConnection.update({
          where: { id: connection.id },
          data: {
            accessToken: newTokens.access_token,
            expiresAt: new Date(newTokens.expiry_date),
          },
        });

        connection.accessToken = newTokens.access_token;
      }

      const calendar = await getCalendarClient(
        connection.accessToken,
        connection.refreshToken
      );

      await calendar.events.delete({
        calendarId: connection.calendarId,
        eventId: googleEventId,
        sendUpdates: "all",
      });

      return true;
    } catch (error) {
      console.error("Failed to delete Google Calendar event:", error);
      return false;
    }
  }
}
