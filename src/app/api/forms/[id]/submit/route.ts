import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Force dynamic rendering
export const dynamic = "force-dynamic";

const submitFormSchema = z.object({
  responseData: z.record(z.any()),
});

// POST /api/forms/[id]/submit - Submit a form response
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { responseData } = submitFormSchema.parse(body);

    // Check if form exists
    const form = await prisma.form.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Create form response
    const response = await prisma.formResponse.create({
      data: {
        formId: params.id,
        clientId: user.id,
        responseData,
      },
    });

    // Execute webhook if configured
    const settings = form.settings as any;
    if (settings?.webhookUrl) {
      // Fire and forget webhook
      executeWebhook(settings.webhookUrl, {
        formId: form.id,
        formName: form.name,
        userId: user.id,
        userEmail: user.email,
        responseData,
        submittedAt: response.submittedAt,
      }).catch(console.error);
    }

    // Return response with redirect URL if configured
    return NextResponse.json({
      success: true,
      responseId: response.id,
      redirectUrl: settings?.redirectUrl,
      message: settings?.successMessage || "Form submitted successfully!",
    });
  } catch (error) {
    console.error("[FORM_SUBMIT]", error);
    return NextResponse.json(
      { error: "Internal server error" },
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
