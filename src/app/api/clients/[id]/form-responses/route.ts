import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";
import { auth } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const {
      data: { user },
    } = await auth();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch form responses for this client
    const formResponses = await prisma.formResponse.findMany({
      where: {
        clientId: params.id,
      },
      include: {
        form: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    // Format the response data
    const formattedResponses = formResponses.map((response) => ({
      id: response.id,
      formId: response.formId,
      formName: response.form.name,
      submittedAt: response.submittedAt,
      responseData: response.responseData,
    }));

    return NextResponse.json(formattedResponses);
  } catch (error) {
    console.error("Error fetching form responses:", error);
    return NextResponse.json(
      { error: "Failed to fetch form responses" },
      { status: 500 }
    );
  }
}
