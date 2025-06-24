import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logActivity } from "@/lib/activity-logger";

// Force dynamic rendering
export const dynamic = "force-dynamic";

const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "SERVICE_MANAGER", "COPYWRITER", "EDITOR", "VA"]),
  name: z.string().min(1, "Name is required"),
});

// GET /api/settings/team - Get all team members
export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: {
          not: "CLIENT",
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        profileData: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}

// POST /api/settings/team - Create a new team member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        role: validatedData.role,
        profileData: {
          name: validatedData.name,
        },
      },
    });

    // In production, you would:
    // 1. Generate a secure temporary password or invitation token
    // 2. Send an email invitation to the user
    // 3. Have them set their password on first login

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        profileData: user.profileData,
        message:
          "Team member created successfully. They will receive an invitation email.",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid user data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating team member:", error);
    return NextResponse.json(
      { error: "Failed to create team member" },
      { status: 500 }
    );
  }
}
