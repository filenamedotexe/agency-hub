import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== "CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get client ID
    const client = await prisma.client.findFirst({
      where: {
        metadata: {
          path: ["userId"],
          equals: session.user.id,
        },
      },
    });

    if (!client) {
      return NextResponse.json({ items: [] });
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { clientId: client.id },
      include: {
        items: {
          include: {
            serviceTemplate: true,
          },
        },
      },
    });

    // If cart doesn't exist or is expired, create new one
    if (!cart || cart.expiresAt < new Date()) {
      // Delete expired cart if exists
      if (cart) {
        await prisma.cart.delete({
          where: { id: cart.id },
        });
      }

      cart = await prisma.cart.create({
        data: {
          clientId: client.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
        include: {
          items: {
            include: {
              serviceTemplate: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      id: cart.id,
      items: cart.items.map((item) => ({
        serviceTemplateId: item.serviceTemplateId,
        quantity: item.quantity,
        serviceTemplate: {
          id: item.serviceTemplate.id,
          name: item.serviceTemplate.name,
          price: item.serviceTemplate.price,
          storeTitle: item.serviceTemplate.storeTitle,
          maxQuantity: item.serviceTemplate.maxQuantity,
        },
      })),
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== "CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await prisma.client.findFirst({
      where: {
        metadata: {
          path: ["userId"],
          equals: session.user.id,
        },
      },
    });

    if (!client) {
      return NextResponse.json({ success: true });
    }

    // Delete cart and all items (cascade)
    await prisma.cart.deleteMany({
      where: { clientId: client.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing cart:", error);
    return NextResponse.json(
      { error: "Failed to clear cart" },
      { status: 500 }
    );
  }
}
