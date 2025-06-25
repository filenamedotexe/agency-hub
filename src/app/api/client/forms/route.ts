import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all forms - clients can see all published forms
    const forms = await prisma.form.findMany({
      include: {
        responses: {
          where: {
            clientId: user.id,
          },
          orderBy: {
            submittedAt: "desc",
          },
        },
        _count: {
          select: {
            responses: {
              where: {
                clientId: user.id,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the data to include isActive flag
    const transformedForms = forms.map((form) => ({
      ...form,
      isActive: form.responses.length === 0, // Form is active if client hasn't responded yet
    }));

    return NextResponse.json(transformedForms);
  } catch (error) {
    console.error("[CLIENT_FORMS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
