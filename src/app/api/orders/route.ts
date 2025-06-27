import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { z } from "zod";

// Force dynamic rendering
export const dynamic = "force-dynamic";

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        serviceTemplateId: z.string().uuid(),
        quantity: z.number().min(1),
      })
    )
    .min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== "CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items } = createOrderSchema.parse(body);

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
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Fetch service templates with pricing
    const serviceTemplates = await prisma.serviceTemplate.findMany({
      where: {
        id: { in: items.map((item) => item.serviceTemplateId) },
        isPurchasable: true,
      },
    });

    if (serviceTemplates.length !== items.length) {
      return NextResponse.json(
        { error: "Some services are not available for purchase" },
        { status: 400 }
      );
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = items.map((item) => {
      const template = serviceTemplates.find(
        (t) => t.id === item.serviceTemplateId
      )!;
      if (!template.price) {
        throw new Error(
          `Service template ${template.name} does not have a price set`
        );
      }
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

    const tax = 0; // TODO: Implement tax calculation
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
        items: {
          create: orderItems.map((item) => ({
            serviceTemplateId: item.serviceTemplateId,
            serviceName: item.serviceName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        },
        timeline: {
          create: {
            status: "ORDER_CREATED",
            title: "Order Created",
            description: "Order created and awaiting payment",
          },
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
