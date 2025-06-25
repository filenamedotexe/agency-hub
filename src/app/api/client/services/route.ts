import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get services assigned to this client
    const services = await prisma.service.findMany({
      where: {
        clientId: session.user.id,
      },
      include: {
        template: true,
        tasks: {
          where: {
            clientVisible: true, // Only include tasks that are visible to clients
          },
          orderBy: {
            order: "asc",
          },
        },
        _count: {
          select: {
            tasks: {
              where: {
                clientVisible: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error("[CLIENT_SERVICES_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
