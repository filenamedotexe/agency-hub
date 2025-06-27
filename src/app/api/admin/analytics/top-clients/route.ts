import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get top clients by lifetime value
    const topClients = await prisma.client.findMany({
      where: {
        lifetimeValue: {
          gt: 0,
        },
      },
      orderBy: {
        lifetimeValue: "desc",
      },
      take: 10,
      select: {
        id: true,
        name: true,
        businessName: true,
        lifetimeValue: true,
        totalOrders: true,
        firstOrderDate: true,
        lastOrderDate: true,
      },
    });

    return NextResponse.json(topClients);
  } catch (error) {
    console.error("Error fetching top clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch top clients" },
      { status: 500 }
    );
  }
}
