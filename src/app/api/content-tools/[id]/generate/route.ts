import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { AIService } from "@/lib/ai-service";

const generateContentSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  fieldValues: z.record(z.string()).optional(),
  toolFields: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        label: z.string(),
        type: z.enum(["text", "textarea", "number", "select"]),
        required: z.boolean(),
        clientVisible: z.boolean(),
        placeholder: z.string().optional(),
        defaultValue: z.string().optional(),
        options: z
          .array(
            z.object({
              label: z.string(),
              value: z.string(),
            })
          )
          .optional(),
        order: z.number(),
      })
    )
    .optional(),
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

    // Process field values with dynamic field substitution
    const processedFieldValues: Record<string, string> = {};
    if (validatedData.fieldValues) {
      Object.entries(validatedData.fieldValues).forEach(([key, value]) => {
        // Replace dynamic field variables in the value
        let processedValue = value;
        Object.entries(allVariables).forEach(([varKey, varValue]) => {
          const regex = new RegExp(`{{${varKey}}}`, "g");
          processedValue = processedValue.replace(regex, varValue);
        });
        processedFieldValues[key] = processedValue;
        allVariables[key] = processedValue; // Also add to allVariables for prompt processing
      });
    }

    // Process the prompt with variables
    const processedPrompt = processTemplate(tool.prompt, allVariables);

    // Get API key - try Anthropic first, then OpenAI
    let apiKeyRecord = await prisma.apiKey.findFirst({
      where: { service: "anthropic" },
    });

    let aiService: "anthropic" | "openai" = "anthropic";

    if (!apiKeyRecord) {
      apiKeyRecord = await prisma.apiKey.findFirst({
        where: { service: "openai" },
      });
      aiService = "openai";
    }

    // Generate content using AI
    let generatedContent: string;

    if (apiKeyRecord) {
      try {
        generatedContent = await AIService.generate({
          prompt: processedPrompt,
          service: aiService,
          apiKey: apiKeyRecord.encryptedKey,
        });
      } catch (error) {
        console.error("AI generation failed, falling back to mock:", error);
        generatedContent = await AIService.generateMock(processedPrompt);
      }
    } else {
      // No API keys configured, use mock generation
      generatedContent = await AIService.generateMock(processedPrompt);
    }

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
        // Use the appropriate URL based on environment
        const webhookUrl = webhook.isProduction
          ? webhook.productionUrl || webhook.url
          : webhook.testingUrl || webhook.url;

        // Fire and forget webhook
        executeWebhook(
          { ...webhook, url: webhookUrl },
          {
            toolId: tool.id,
            toolName: tool.name,
            clientId: client.id,
            clientName: client.businessName || client.name,
            content: generatedContent,
            variables: allVariables,
            generatedAt: savedContent.createdAt,
            environment: webhook.isProduction ? "production" : "testing",
          }
        ).catch(console.error);
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
