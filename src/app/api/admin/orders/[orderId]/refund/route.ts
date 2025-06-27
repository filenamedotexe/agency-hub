import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { z } from "zod";
import { UserRole, OrderStatus, PaymentStatus } from "@prisma/client";

const refundSchema = z.object({
  type: z.enum(["full", "partial"]),
  amount: z.number().positive().optional(),
  reason: z.string().min(1),
});

export async function POST(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = refundSchema.parse(body);

    // Get the order with payment details
    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
      include: {
        client: true,
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.stripePaymentIntentId) {
      return NextResponse.json(
        { error: "No payment found for this order" },
        { status: 400 }
      );
    }

    if (order.paymentStatus === PaymentStatus.REFUNDED) {
      return NextResponse.json(
        { error: "Order already refunded" },
        { status: 400 }
      );
    }

    // Calculate refund amount
    const refundAmount =
      validatedData.type === "full"
        ? Number(order.total)
        : validatedData.amount!;

    // Validate partial refund amount
    if (
      validatedData.type === "partial" &&
      refundAmount > Number(order.total)
    ) {
      return NextResponse.json(
        { error: "Refund amount exceeds order total" },
        { status: 400 }
      );
    }

    // Process refund through Stripe
    const refund = await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
      amount: Math.round(refundAmount * 100), // Convert to cents
      reason: "requested_by_customer",
      metadata: {
        orderId: order.id,
        adminId: session.user.id,
        refundReason: validatedData.reason,
      },
    });

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: params.orderId },
      data: {
        status:
          validatedData.type === "full"
            ? OrderStatus.REFUNDED
            : OrderStatus.COMPLETED,
        paymentStatus:
          validatedData.type === "full"
            ? PaymentStatus.REFUNDED
            : PaymentStatus.SUCCEEDED,
        metadata: {
          ...((order.metadata as any) || {}),
          refund: {
            id: refund.id,
            amount: refundAmount,
            reason: validatedData.reason,
            processedAt: new Date().toISOString(),
            processedBy: session.user.id,
            type: validatedData.type,
          },
        },
      },
    });

    // Add to order timeline
    await prisma.orderTimeline.create({
      data: {
        orderId: order.id,
        status: validatedData.type === "full" ? "REFUNDED" : "PARTIAL_REFUND",
        title: `${validatedData.type === "full" ? "Full" : "Partial"} refund processed`,
        description: `Refunded $${refundAmount.toFixed(2)}. Reason: ${validatedData.reason}`,
        completedAt: new Date(),
      },
    });

    // Update client lifetime value
    if (validatedData.type === "full") {
      await prisma.client.update({
        where: { id: order.clientId },
        data: {
          lifetimeValue: {
            decrement: refundAmount,
          },
        },
      });
    }

    // Update sales metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.salesMetrics.upsert({
      where: { date: today },
      create: {
        date: today,
        revenue: 0,
        orderCount: 0,
        newCustomers: 0,
        avgOrderValue: 0,
        refundAmount: refundAmount,
        contractsSigned: 0,
      },
      update: {
        refundAmount: {
          increment: refundAmount,
        },
      },
    });

    // TODO: Send refund confirmation email
    // await emailService.sendRefundConfirmation(order, refundAmount, validatedData.reason);

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refundAmount,
        status: refund.status,
        type: validatedData.type,
      },
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to process refund" },
      { status: 500 }
    );
  }
}
