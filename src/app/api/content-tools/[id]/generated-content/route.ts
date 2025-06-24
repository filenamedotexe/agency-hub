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

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    // Fetch generated content for this tool
    const generatedContent = await prisma.generatedContent.findMany({
      where: {
        toolId: params.id,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format the response data
    const formattedContent = generatedContent.map((item) => ({
      id: item.id,
      toolId: item.toolId,
      clientId: item.clientId,
      clientName: item.client.businessName || item.client.name,
      content: item.content,
      prompt: item.prompt,
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
