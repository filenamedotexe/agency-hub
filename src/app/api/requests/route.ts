import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "@/lib/auth";

const createRequestSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["TO_DO", "IN_PROGRESS", "DONE"]).optional(),
  clientVisible: z.boolean().optional(),
});

// GET /api/requests - List all requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");

    // Build where clause based on user role
    const whereClause: any = {
      ...(clientId && { clientId }),
      ...(status && { status: status as any }),
    };

    // CLIENT role users can only see requests where clientVisible is true
    if (session.user.role === "CLIENT") {
      whereClause.clientVisible = true;
      // TODO: Once client association is implemented, also filter by client's ID
      // whereClause.clientId = session.user.clientId;
    }

    const requests = await prisma.request.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            businessName: true,
          },
        },
        comments: {
          where: { isDeleted: false },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}

// POST /api/requests - Create a new request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    console.log(
      "[POST /api/requests] Session:",
      session?.user?.email,
      session?.user?.role
    );

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin and Service Manager can create requests
    if (!["ADMIN", "SERVICE_MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    console.log("[POST /api/requests] Request body:", body);

    const validatedData = createRequestSchema.parse(body);
    console.log("[POST /api/requests] Validated data:", validatedData);

    const newRequest = await prisma.request.create({
      data: {
        clientId: validatedData.clientId,
        description: validatedData.description,
        status: validatedData.status || "TO_DO",
        clientVisible: validatedData.clientVisible ?? false,
      },
      include: {
        client: true,
        comments: true,
      },
    });

    console.log("[POST /api/requests] Created request:", newRequest.id);

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        entityType: "request",
        entityId: newRequest.id,
        clientId: validatedData.clientId,
        action: "created",
        metadata: {
          description: validatedData.description,
        },
      },
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[POST /api/requests] Validation error:", error.errors);
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("[POST /api/requests] Error creating request:", error);
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 }
    );
  }
}
