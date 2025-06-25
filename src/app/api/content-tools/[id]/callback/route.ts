import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const callbackSchema = z.object({
  generatedContentId: z.string().optional(),
  toolId: z.string(),
  clientId: z.string(),
  content: z.string(),
  processedContent: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// POST /api/content-tools/[id]/callback - Receive processed content back from n8n
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = callbackSchema.parse(body);

    // Verify the tool exists
    const tool = await prisma.contentTool.findUnique({
      where: { id: params.id },
    });

    if (!tool) {
      return NextResponse.json(
        { error: "Content tool not found" },
        { status: 404 }
      );
    }

    // If n8n is updating existing content
    if (validatedData.generatedContentId) {
      const updatedContent = await prisma.generatedContent.update({
        where: { id: validatedData.generatedContentId },
        data: {
          content: validatedData.processedContent || validatedData.content,
          metadata: {
            ...(typeof validatedData.metadata === "object"
              ? validatedData.metadata
              : {}),
            processedByN8n: true,
            processedAt: new Date().toISOString(),
          },
        },
      });

      return NextResponse.json({
        success: true,
        contentId: updatedContent.id,
      });
    }

    // Create new content entry from n8n
    const newContent = await prisma.generatedContent.create({
      data: {
        toolId: validatedData.toolId,
        clientId: validatedData.clientId,
        content: validatedData.content,
        prompt: "Generated via n8n webhook",
        metadata: {
          ...(typeof validatedData.metadata === "object"
            ? validatedData.metadata
            : {}),
          fromN8n: true,
          timestamp: new Date().toISOString(),
        },
        createdBy: "n8n-webhook",
      },
    });

    return NextResponse.json({
      success: true,
      contentId: newContent.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid callback data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error processing callback:", error);
    return NextResponse.json(
      { error: "Failed to process callback" },
      { status: 500 }
    );
  }
}
