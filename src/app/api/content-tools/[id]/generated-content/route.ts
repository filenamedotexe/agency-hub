import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

// Force dynamic rendering
export const dynamic = "force-dynamic";

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
