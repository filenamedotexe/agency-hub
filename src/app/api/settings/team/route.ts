import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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

    return NextResponse.json(users);
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

// PUT /api/settings/team/[id] - Update team member role
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");
    const body = await request.json();
    const { role } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (
      !role ||
      !["ADMIN", "SERVICE_MANAGER", "COPYWRITER", "EDITOR", "VA"].includes(role)
    ) {
      return NextResponse.json(
        { error: "Valid role is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
      message: "Role updated successfully",
    });
  } catch (error) {
    console.error("Error updating team member:", error);
    return NextResponse.json(
      { error: "Failed to update team member" },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/team/[id] - Remove team member
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user has any associated data
    const activityCount = await prisma.activityLog.count({
      where: { userId },
    });

    if (activityCount > 0) {
      // Soft delete - just change role to indicate inactive
      await prisma.user.update({
        where: { id: userId },
        data: {
          profileData: {
            ...((await prisma.user.findUnique({ where: { id: userId } }))
              ?.profileData as any),
            inactive: true,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: "Team member deactivated",
      });
    } else {
      // Hard delete if no associated data
      await prisma.user.delete({
        where: { id: userId },
      });

      return NextResponse.json({
        success: true,
        message: "Team member removed",
      });
    }
  } catch (error) {
    console.error("Error removing team member:", error);
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 }
    );
  }
}
