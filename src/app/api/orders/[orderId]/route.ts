import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { orderId } = params;

    // Get client if user is a client
    let clientId: string | undefined;
    if (session.user.role === "CLIENT") {
      const client = await prisma.client.findFirst({
        where: {
          metadata: {
            path: ["userId"],
            equals: session.user.id,
          },
        },
      });
      clientId = client?.id;
    }

    // Fetch order with all related data
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        OR: [
          // Client can view their own orders
          ...(clientId ? [{ clientId }] : []),
          // Admin can view all orders
          ...(session.user.role === "ADMIN" ? [{ id: orderId }] : []),
        ],
      },
      include: {
        client: true,
        items: {
          include: {
            serviceTemplate: true,
            service: true,
          },
        },
        contract: true,
        invoice: true,
        timeline: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
