import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

// GET /api/content-tools/[id] - Get a specific content tool
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tool = await prisma.contentTool.findUnique({
      where: { id: params.id },
      include: {
        generatedContent: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            client: {
              select: {
                id: true,
                name: true,
                businessName: true,
              },
            },
          },
        },
      },
    });

    if (!tool) {
      return NextResponse.json(
        { error: "Content tool not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(tool);
  } catch (error) {
    console.error("Error fetching content tool:", error);
    return NextResponse.json(
      { error: "Failed to fetch content tool" },
      { status: 500 }
    );
  }
}

// PUT /api/content-tools/[id] - Update a content tool
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { prompt, webhookId, fields } = body;

    const tool = await prisma.contentTool.update({
      where: { id: params.id },
      data: {
        ...(prompt && { prompt }),
        ...(webhookId !== undefined && { webhookId }),
        ...(fields !== undefined && { fields }),
      },
    });

    return NextResponse.json(tool);
  } catch (error) {
    console.error("Error updating content tool:", error);
    return NextResponse.json(
      { error: "Failed to update content tool" },
      { status: 500 }
    );
  }
}
