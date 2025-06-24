import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const generateContentSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  variables: z.record(z.string()).optional(),
});

// Function to replace template variables with actual values
function processTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let processed = template;

  // Replace all {{variable}} with actual values
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    processed = processed.replace(regex, value);
  });

  return processed;
}

// Mock AI generation (replace with actual AI API call)
async function generateWithAI(
  prompt: string,
  apiKey?: string
): Promise<string> {
  // In production, this would call OpenAI/Anthropic API using the provided API key
  // For now, return a mock response

  await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API delay

  return `This is AI-generated content based on your prompt:\n\n${prompt}\n\n[In production, this would be actual AI-generated content using the configured API key]`;
}

// POST /api/content-tools/[id]/generate - Generate content using a tool
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = generateContentSchema.parse(body);

    // Get the content tool
    const tool = await prisma.contentTool.findUnique({
      where: { id: params.id },
    });

    if (!tool) {
      return NextResponse.json(
        { error: "Content tool not found" },
        { status: 404 }
      );
    }

    // Get client data for dynamic fields
    const client = await prisma.client.findUnique({
      where: { id: validatedData.clientId },
      include: {
        formResponses: {
          include: { form: true },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Combine all available variables
    const allVariables: Record<string, string> = {
      businessName: client.businessName || client.name,
      clientName: client.name,
      ...validatedData.variables,
    };

    // Add dynamic fields from form responses
    client.formResponses.forEach((response) => {
      Object.entries(response.responseData as Record<string, any>).forEach(
        ([key, field]) => {
          if (field && typeof field === "object" && "value" in field) {
            allVariables[key] = String(field.value);
          }
        }
      );
    });

    // Process the prompt with variables
    const processedPrompt = processTemplate(tool.prompt, allVariables);

    // Get API key if available
    const apiKeyRecord = await prisma.apiKey.findFirst({
      where: { service: "openai" }, // or "anthropic" based on settings
    });

    // Generate content using AI
    const generatedContent = await generateWithAI(
      processedPrompt,
      apiKeyRecord?.encryptedKey // In production, decrypt this
    );

    // Save generated content
    const savedContent = await prisma.generatedContent.create({
      data: {
        toolId: tool.id,
        clientId: validatedData.clientId,
        prompt: processedPrompt,
        content: generatedContent,
        metadata: {
          variables: allVariables,
          timestamp: new Date().toISOString(),
        },
        createdBy: "system", // TODO: Get from auth context
      },
      include: {
        tool: true,
        client: true,
      },
    });

    // Execute webhook if configured
    if (tool.webhookId) {
      const webhook = await prisma.webhook.findUnique({
        where: { id: tool.webhookId },
      });

      if (webhook && webhook.isActive) {
        // Fire and forget webhook
        executeWebhook(webhook, {
          toolId: tool.id,
          toolName: tool.name,
          clientId: client.id,
          clientName: client.businessName || client.name,
          content: generatedContent,
          variables: allVariables,
          generatedAt: savedContent.createdAt,
        }).catch(console.error);
      }
    }

    return NextResponse.json(savedContent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}

async function executeWebhook(webhook: any, data: any) {
  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...((webhook.headers as Record<string, string>) || {}),
      },
      body: JSON.stringify(data),
    });

    await prisma.webhookExecution.create({
      data: {
        webhookId: webhook.id,
        payload: data,
        response: await response.text(),
        statusCode: response.status,
      },
    });
  } catch (error) {
    await prisma.webhookExecution.create({
      data: {
        webhookId: webhook.id,
        payload: data,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}
