import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripeService } from "@/lib/stripe";
import { z } from "zod";

const checkoutSchema = z.object({
  items: z.array(
    z.object({
      serviceTemplateId: z.string(),
      quantity: z.number().min(1),
    })
  ),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify user is a client
    if (session.user.role !== "CLIENT") {
      return new NextResponse("Only clients can make purchases", {
        status: 403,
      });
    }

    // Get client record
    const client = await prisma.client.findFirst({
      where: {
        metadata: {
          path: ["userId"],
          equals: session.user.id,
        },
      },
    });

    if (!client) {
      return new NextResponse("Client record not found", { status: 404 });
    }

    const body = await req.json();
    const { items, notes } = checkoutSchema.parse(body);

    // Fetch service templates with pricing
    const serviceTemplates = await prisma.serviceTemplate.findMany({
      where: {
        id: { in: items.map((item) => item.serviceTemplateId) },
        isPurchasable: true,
      },
    });

    if (serviceTemplates.length !== items.length) {
      return new NextResponse("Invalid service templates", { status: 400 });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = items.map((item) => {
      const template = serviceTemplates.find(
        (t) => t.id === item.serviceTemplateId
      )!;
      const total = Number(template.price) * item.quantity;
      subtotal += total;

      return {
        serviceTemplateId: item.serviceTemplateId,
        serviceName: template.storeTitle || template.name,
        quantity: item.quantity,
        unitPrice: Number(template.price),
        total,
      };
    });

    const tax = 0; // TODO: Implement tax calculation based on location
    const total = subtotal + tax;

    // Create order
    const order = await prisma.order.create({
      data: {
        clientId: client.id,
        status: "PENDING",
        subtotal,
        tax,
        total,
        currency: "USD",
        notes,
        items: {
          create: orderItems,
        },
        timeline: {
          create: {
            status: "PENDING",
            title: "Order created",
            description: "Order has been created and is awaiting payment",
          },
        },
      },
      include: {
        client: true,
        items: {
          include: {
            serviceTemplate: true,
          },
        },
      },
    });

    // Create Stripe checkout session
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/store/success?orderId=${order.id}`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/store/cart`;

    const checkoutSession = await stripeService.createCheckoutSession(
      order,
      successUrl,
      cancelUrl
    );

    // Update order with Stripe session ID
    await prisma.order.update({
      where: { id: order.id },
      data: {
        stripeSessionId: checkoutSession.id,
      },
    });

    // Clear the cart
    await prisma.cart.deleteMany({
      where: { clientId: client.id },
    });

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      orderId: order.id,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
