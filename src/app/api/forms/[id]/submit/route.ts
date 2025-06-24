import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const submitFormSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  data: z.record(z.any()),
});

// POST /api/forms/[id]/submit - Submit a form response
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = submitFormSchema.parse(body);

    // Get the form to validate against schema
    const form = await prisma.form.findUnique({
      where: { id: params.id },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Validate form data against schema
    const formSchema = form.schema as any[];
    const responseData: Record<string, any> = {};

    for (const field of formSchema) {
      const fieldValue = validatedData.data[field.name];

      // Check required fields
      if (field.required && !fieldValue) {
        return NextResponse.json(
          { error: `Field '${field.label}' is required` },
          { status: 400 }
        );
      }

      // Store field data with metadata
      if (
        fieldValue !== undefined &&
        fieldValue !== null &&
        fieldValue !== ""
      ) {
        responseData[field.name] = {
          value: fieldValue,
          type: field.type,
          label: field.label,
        };
      }
    }

    // Create form response
    const formResponse = await prisma.formResponse.create({
      data: {
        formId: params.id,
        clientId: validatedData.clientId,
        responseData,
      },
      include: {
        form: true,
        client: true,
      },
    });

    // Execute webhook if configured
    const settings = form.settings as any;
    if (settings?.webhookUrl) {
      // Fire and forget webhook
      executeWebhook(settings.webhookUrl, {
        formId: form.id,
        formName: form.name,
        clientId: validatedData.clientId,
        responseData,
        submittedAt: formResponse.submittedAt,
      }).catch(console.error);
    }

    // Return response with redirect URL if configured
    return NextResponse.json({
      success: true,
      responseId: formResponse.id,
      redirectUrl: settings?.redirectUrl,
      message: settings?.successMessage || "Form submitted successfully!",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid submission data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error submitting form:", error);
    return NextResponse.json(
      { error: "Failed to submit form" },
      { status: 500 }
    );
  }
}

async function executeWebhook(url: string, data: any) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    // Log webhook execution
    await prisma.webhookExecution.create({
      data: {
        webhookId: "form-webhook", // TODO: Get actual webhook ID
        payload: data,
        response: await response.text(),
        statusCode: response.status,
      },
    });
  } catch (error) {
    console.error("Webhook execution failed:", error);
    // Log failed webhook
    await prisma.webhookExecution.create({
      data: {
        webhookId: "form-webhook",
        payload: data,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}
