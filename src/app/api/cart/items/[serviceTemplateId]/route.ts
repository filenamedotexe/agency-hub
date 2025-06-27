import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { z } from "zod";

// Force dynamic rendering
export const dynamic = "force-dynamic";

const updateQuantitySchema = z.object({
  quantity: z.number().min(1),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { serviceTemplateId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== "CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { quantity } = updateQuantitySchema.parse(body);

    // Get client
    const client = await prisma.client.findFirst({
      where: {
        metadata: {
          path: ["userId"],
          equals: session.user.id,
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Get cart
    const cart = await prisma.cart.findUnique({
      where: { clientId: client.id },
    });

    if (!cart || cart.expiresAt < new Date()) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    // Get cart item
    const cartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_serviceTemplateId: {
          cartId: cart.id,
          serviceTemplateId: params.serviceTemplateId,
        },
      },
      include: {
        serviceTemplate: true,
      },
    });

    if (!cartItem) {
      return NextResponse.json({ error: "Item not in cart" }, { status: 404 });
    }

    // Check max quantity
    if (quantity > cartItem.serviceTemplate.maxQuantity) {
      return NextResponse.json(
        {
          error: `Cannot exceed maximum quantity of ${cartItem.serviceTemplate.maxQuantity}`,
        },
        { status: 400 }
      );
    }

    // Update quantity
    await prisma.cartItem.update({
      where: { id: cartItem.id },
      data: { quantity },
    });

    // Return updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            serviceTemplate: true,
          },
        },
      },
    });

    return NextResponse.json({
      items: updatedCart!.items.map((item) => ({
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating cart item:", error);
    return NextResponse.json(
      { error: "Failed to update cart item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { serviceTemplateId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== "CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get client
    const client = await prisma.client.findFirst({
      where: {
        metadata: {
          path: ["userId"],
          equals: session.user.id,
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Get cart
    const cart = await prisma.cart.findUnique({
      where: { clientId: client.id },
    });

    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    // Delete cart item
    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        serviceTemplateId: params.serviceTemplateId,
      },
    });

    // Return updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            serviceTemplate: true,
          },
        },
      },
    });

    return NextResponse.json({
      items: updatedCart!.items.map((item) => ({
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
    console.error("Error removing from cart:", error);
    return NextResponse.json(
      { error: "Failed to remove from cart" },
      { status: 500 }
    );
  }
}
