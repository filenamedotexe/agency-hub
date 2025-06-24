import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "@/lib/auth";

const updateRequestSchema = z.object({
  description: z.string().min(1, "Description is required").optional(),
  status: z.enum(["TO_DO", "IN_PROGRESS", "DONE"]).optional(),
  clientVisible: z.boolean().optional(),
});

// GET /api/requests/[id] - Get a specific request
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const requestData = await prisma.request.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        comments: {
          where: { isDeleted: false },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!requestData) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // CLIENT role users can only see requests where clientVisible is true
    if (session.user.role === "CLIENT" && !requestData.clientVisible) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    // TODO: Once client association is implemented, also check if request belongs to user's client

    return NextResponse.json(requestData);
  } catch (error) {
    console.error("Error fetching request:", error);
    return NextResponse.json(
      { error: "Failed to fetch request" },
      { status: 500 }
    );
  }
}

// PUT /api/requests/[id] - Update a request
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin and Service Manager can update requests
    if (!["ADMIN", "SERVICE_MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateRequestSchema.parse(body);

    // Get current request to check status change
    const currentRequest = await prisma.request.findUnique({
      where: { id: params.id },
    });

    if (!currentRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Update request
    const updatedRequest = await prisma.request.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        ...(validatedData.status === "DONE" && currentRequest.status !== "DONE"
          ? { completedAt: new Date() }
          : {}),
      },
      include: {
        client: true,
        comments: {
          where: { isDeleted: false },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // Log activity if status changed
    if (
      validatedData.status &&
      validatedData.status !== currentRequest.status
    ) {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          entityType: "request",
          entityId: params.id,
          clientId: updatedRequest.clientId,
          action: "status_changed",
          metadata: {
            from: currentRequest.status,
            to: validatedData.status,
          },
        },
      });
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating request:", error);
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 }
    );
  }
}

// DELETE /api/requests/[id] - Delete a request
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin and Service Manager can delete requests
    if (!["ADMIN", "SERVICE_MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const requestData = await prisma.request.findUnique({
      where: { id: params.id },
    });

    if (!requestData) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    await prisma.request.delete({
      where: { id: params.id },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: "system", // TODO: Get from auth context
        entityType: "request",
        entityId: params.id,
        clientId: requestData.clientId,
        action: "deleted",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting request:", error);
    return NextResponse.json(
      { error: "Failed to delete request" },
      { status: 500 }
    );
  }
}

// POST /api/requests/[id]/comments - Add a comment to a request
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin and Service Manager can add comments
    if (!["ADMIN", "SERVICE_MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { text } = body;

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Comment text is required" },
        { status: 400 }
      );
    }

    const comment = await prisma.requestComment.create({
      data: {
        requestId: params.id,
        text: text.trim(),
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}
