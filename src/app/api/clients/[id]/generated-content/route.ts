import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const {
      data: { user },
    } = await auth();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch generated content for this client
    const generatedContent = await prisma.generatedContent.findMany({
      where: {
        clientId: params.id,
      },
      include: {
        tool: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform data to match the expected format
    const formattedContent = generatedContent.map((item) => ({
      id: item.id,
      toolName: item.tool.name,
      content: item.content,
      metadata: item.metadata as Record<string, any>,
      createdAt: item.createdAt.toISOString(),
    }));

    return NextResponse.json(formattedContent);
  } catch (error) {
    console.error("Error fetching generated content:", error);
    return NextResponse.json(
      { error: "Failed to fetch generated content" },
      { status: 500 }
    );
  }
}
