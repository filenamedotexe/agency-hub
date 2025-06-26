import { NextRequest, NextResponse } from "next/server";
import { oauth2Client } from "@/lib/google-calendar";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { google } from "googleapis";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // userId
  const error = searchParams.get("error");

  // Handle user denial
  if (error) {
    return NextResponse.redirect(
      new URL("/calendar?error=access_denied", req.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/calendar?error=missing_params", req.url)
    );
  }

  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    const { access_token, refresh_token, expiry_date } = tokens;

    if (!access_token || !refresh_token) {
      throw new Error("Missing tokens from Google");
    }

    // Get user info
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    if (!data.email) {
      throw new Error("Unable to get user email");
    }

    // Verify the user ID matches the current session
    const session = await getServerSession();
    if (!session || session.user.id !== state) {
      return NextResponse.redirect(
        new URL("/calendar?error=unauthorized", req.url)
      );
    }

    // Store or update calendar connection
    await prisma.calendarConnection.upsert({
      where: { userId: state },
      update: {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: new Date(expiry_date!),
        email: data.email,
        syncEnabled: true,
        updatedAt: new Date(),
      },
      create: {
        userId: state,
        provider: "google",
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: new Date(expiry_date!),
        calendarId: "primary",
        email: data.email,
        syncEnabled: true,
      },
    });

    // Log the connection
    await prisma.activityLog.create({
      data: {
        userId: state,
        entityType: "calendar_connection",
        entityId: state,
        action: "connected",
        metadata: {
          email: data.email,
          provider: "google",
        },
      },
    });

    return NextResponse.redirect(new URL("/calendar?connected=true", req.url));
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/calendar?error=auth_failed", req.url)
    );
  }
}
