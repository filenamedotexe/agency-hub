import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// GET /api/forms/[id]/responses - Get form responses
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get("clientId");

    const responses = await prisma.formResponse.findMany({
      where: {
        formId: params.id,
        ...(clientId && { clientId }),
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            businessName: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json(responses);
  } catch (error) {
    console.error("Error fetching form responses:", error);
    return NextResponse.json(
      { error: "Failed to fetch form responses" },
      { status: 500 }
    );
  }
}
