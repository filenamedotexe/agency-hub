import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateFormSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  schema: z
    .array(
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
    )
    .optional(),
  settings: z
    .object({
      webhookUrl: z.string().url().optional(),
      redirectUrl: z.string().url().optional(),
      submitButtonText: z.string().optional(),
      successMessage: z.string().optional(),
    })
    .optional(),
  serviceId: z.string().nullable().optional(),
});

// GET /api/forms/[id] - Get a specific form
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const form = await prisma.form.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { responses: true },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    return NextResponse.json(form);
  } catch (error) {
    console.error("Error fetching form:", error);
    return NextResponse.json(
      { error: "Failed to fetch form" },
      { status: 500 }
    );
  }
}

// PUT /api/forms/[id] - Update a form
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateFormSchema.parse(body);

    const form = await prisma.form.update({
      where: { id: params.id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.description !== undefined && {
          description: validatedData.description,
        }),
        ...(validatedData.schema && { schema: validatedData.schema }),
        ...(validatedData.settings && { settings: validatedData.settings }),
        ...(validatedData.serviceId !== undefined && {
          serviceId: validatedData.serviceId,
        }),
      },
    });

    return NextResponse.json(form);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid form data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating form:", error);
    return NextResponse.json(
      { error: "Failed to update form" },
      { status: 500 }
    );
  }
}

// DELETE /api/forms/[id] - Delete a form
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if form has responses
    const responseCount = await prisma.formResponse.count({
      where: { formId: params.id },
    });

    if (responseCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete form with existing responses" },
        { status: 400 }
      );
    }

    await prisma.form.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting form:", error);
    return NextResponse.json(
      { error: "Failed to delete form" },
      { status: 500 }
    );
  }
}
