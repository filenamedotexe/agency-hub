import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get forms assigned to this client
    const forms = await prisma.form.findMany({
      where: {
        assignedClients: {
          some: {
            id: session.user.id,
          },
        },
        status: "PUBLISHED",
      },
      include: {
        responses: {
          where: {
            userId: session.user.id,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            responses: {
              where: {
                userId: session.user.id,
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
