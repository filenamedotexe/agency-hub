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

    // Get services for this client
    const services = await prisma.service.findMany({
      where: {
        clientId: user.id,
      },
      include: {
        template: {
          select: {
            name: true,
            type: true,
            price: true,
          },
        },
        tasks: {
          where: {
            clientVisible: true,
          },
          orderBy: {
            createdAt: "desc",
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
