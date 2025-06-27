import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { z } from "zod";

// Force dynamic rendering
export const dynamic = "force-dynamic";

const addItemSchema = z.object({
  serviceTemplateId: z.string().uuid(),
  quantity: z.number().min(1).default(1),
});

export async function GET(request: NextRequest) {
  console.log("[CART API] GET /api/cart/items called");
  return NextResponse.json({ message: "Cart items endpoint is working" });
}

export async function POST(request: NextRequest) {
  console.log("[CART API] POST /api/cart/items called");

  try {
    const session = await getServerSession();
    console.log(
      "[CART API] Session:",
      session?.user?.email,
      session?.user?.role
    );

    if (!session || session.user.role !== "CLIENT") {
      console.log("[CART API] Unauthorized - no session or not CLIENT");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("[CART API] Request body:", body);

    const { serviceTemplateId, quantity } = addItemSchema.parse(body);
    console.log("[CART API] Parsed data:", { serviceTemplateId, quantity });

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
      console.log("[CART API] Client not found for user:", session.user.id);
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    console.log("[CART API] Found client:", client.id);

    // Verify service template exists and is purchasable
    const serviceTemplate = await prisma.serviceTemplate.findUnique({
      where: { id: serviceTemplateId },
    });

    if (!serviceTemplate || !serviceTemplate.isPurchasable) {
      return NextResponse.json(
        { error: "Service not available for purchase" },
        { status: 400 }
      );
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { clientId: client.id },
    });

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
      });
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_serviceTemplateId: {
          cartId: cart.id,
          serviceTemplateId,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > serviceTemplate.maxQuantity) {
        return NextResponse.json(
          {
            error: `Cannot add more than ${serviceTemplate.maxQuantity} of this service`,
          },
          { status: 400 }
        );
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Add new item
      if (quantity > serviceTemplate.maxQuantity) {
        return NextResponse.json(
          {
            error: `Cannot add more than ${serviceTemplate.maxQuantity} of this service`,
          },
          { status: 400 }
        );
      }

      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          serviceTemplateId,
          quantity,
        },
      });
    }

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

    console.log(
      "[CART API] Updated cart with items:",
      updatedCart!.items.length
    );

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
      console.log("[CART API] Validation error:", error.errors);
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("[CART API] Error adding to cart:", error);
    console.error(
      "[CART API] Error stack:",
      error instanceof Error ? error.stack : "No stack"
    );
    return NextResponse.json(
      { error: "Failed to add to cart" },
      { status: 500 }
    );
  }
}
