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

    // Only clients can access the store
    if (session.user.role !== "CLIENT") {
      return NextResponse.json(
        { error: "Store is only available for clients" },
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
