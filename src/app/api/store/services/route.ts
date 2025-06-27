import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Store is available for clients, admins, and service managers
    const allowedRoles = ["CLIENT", "ADMIN", "SERVICE_MANAGER"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "You don't have permission to access the store" },
        { status: 403 }
      );
    }

    // Fetch all purchasable service templates
    const services = await prisma.serviceTemplate.findMany({
      where: {
        isPurchasable: true,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error("Error fetching store services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
