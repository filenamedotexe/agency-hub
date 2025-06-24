import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { z } from "zod";
import { logActivity } from "@/lib/activity-logger";

// Force dynamic rendering
export const dynamic = "force-dynamic";

const createFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  schema: z.array(
    z.object({
      id: z.string(),
      type: z.enum([
        "text",
        "textarea",
        "number",
        "email",
        "tel",
        "date",
        "select",
        "checkbox",
        "radio",
        "file",
      ]),
      label: z.string(),
      name: z.string(),
      required: z.boolean().default(false),
      placeholder: z.string().optional(),
      options: z
        .array(
          z.object({
            label: z.string(),
            value: z.string(),
          })
        )
        .optional(),
      validation: z
        .object({
          min: z.number().optional(),
          max: z.number().optional(),
          minLength: z.number().optional(),
          maxLength: z.number().optional(),
          pattern: z.string().optional(),
        })
        .optional(),
    })
  ),
  settings: z
    .object({
      webhookUrl: z.string().url().optional(),
      redirectUrl: z.string().url().optional(),
      submitButtonText: z.string().default("Submit"),
      successMessage: z.string().default("Form submitted successfully!"),
    })
    .optional(),
  serviceId: z.string().optional(),
});

// GET /api/forms - List all forms
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const serviceId = searchParams.get("serviceId");

    const forms = await prisma.form.findMany({
      where: serviceId ? { serviceId } : undefined,
      include: {
        _count: {
          select: { responses: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(forms);
  } catch (error) {
    console.error("Error fetching forms:", error);
    return NextResponse.json(
      { error: "Failed to fetch forms" },
      { status: 500 }
    );
  }
}

// POST /api/forms - Create a new form
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createFormSchema.parse(body);

    const form = await prisma.form.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        schema: validatedData.schema,
        settings: validatedData.settings || {},
        serviceId: validatedData.serviceId,
        createdBy: "system", // TODO: Get from auth context
      },
    });

    return NextResponse.json(form, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid form data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating form:", error);
    return NextResponse.json(
      { error: "Failed to create form" },
      { status: 500 }
    );
  }
}
