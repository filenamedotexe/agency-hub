import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "SERVICE_MANAGER"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: params.id },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Get all service templates
    const templates = await prisma.serviceTemplate.findMany({
      orderBy: { name: "asc" },
    });

    // Get services already assigned to this client
    const existingServices = await prisma.service.findMany({
      where: { clientId: params.id },
      select: { templateId: true },
    });

    const assignedTemplateIds = new Set(
      existingServices.map((s) => s.templateId)
    );

    // Return templates with assignment status
    const availableTemplates = templates.map((template) => ({
      ...template,
      isAssigned: assignedTemplateIds.has(template.id),
    }));

    return NextResponse.json(availableTemplates);
  } catch (error) {
    console.error("Error fetching available services:", error);
    return NextResponse.json(
      { error: "Failed to fetch available services" },
      { status: 500 }
    );
  }
}
