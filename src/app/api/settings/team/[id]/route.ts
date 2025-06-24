import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

// PUT /api/settings/team/[id] - Update team member role
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { role } = body;

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
      where: { id: params.id },
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
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has any associated data
    const activityCount = await prisma.activityLog.count({
      where: { userId: params.id },
    });

    if (activityCount > 0) {
      // Soft delete - just change role to indicate inactive
      await prisma.user.update({
        where: { id: params.id },
        data: {
          profileData: {
            ...((await prisma.user.findUnique({ where: { id: params.id } }))
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
        where: { id: params.id },
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
