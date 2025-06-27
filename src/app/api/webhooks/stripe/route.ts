import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripeService } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get("stripe-signature") as string;

  if (!signature) {
    return new NextResponse("No signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripeService.verifyWebhookSignature(body, signature);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  if (!session.client_reference_id) {
    console.error("No client_reference_id in session");
    return;
  }

  const orderId = session.client_reference_id;

  // Update order status and payment info
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "PROCESSING",
      paymentStatus: "SUCCEEDED",
      stripePaymentIntentId: session.payment_intent as string,
      paymentMethod: session.payment_method_types?.[0] || "card",
      paidAt: new Date(),
      timeline: {
        create: {
          status: "PROCESSING",
          title: "Payment received",
          description: "Payment has been successfully processed",
          completedAt: new Date(),
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

  // Check if any services require contract
  const requiresContract = order.items.some(
    (item) => item.serviceTemplate.requiresContract
  );

  if (requiresContract) {
    // Update order status to awaiting contract
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "AWAITING_CONTRACT",
        timeline: {
          create: {
            status: "AWAITING_CONTRACT",
            title: "Awaiting contract signature",
            description: "Service agreement must be signed before activation",
          },
        },
      },
    });

    // Create contract record
    const contractTemplate = order.items.find(
      (item) => item.serviceTemplate.requiresContract
    )?.serviceTemplate.contractTemplate;

    if (contractTemplate) {
      await prisma.serviceContract.create({
        data: {
          orderId: orderId,
          templateContent: contractTemplate,
        },
      });
    }
  } else {
    // No contract required, proceed with service provisioning
    await provisionServices(order);
  }

  // Update client lifetime value
  await updateClientLifetimeValue(order.clientId);

  // Update sales metrics
  await updateSalesMetrics(order);

  // Send confirmation email
  // TODO: Implement email service
  // await emailService.sendOrderConfirmation(order);
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
) {
  // Additional processing if needed
  console.log("Payment intent succeeded:", paymentIntent.id);
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const order = await prisma.order.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id },
  });

  if (order) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "FAILED",
        timeline: {
          create: {
            status: "FAILED",
            title: "Payment failed",
            description:
              paymentIntent.last_payment_error?.message ||
              "Payment processing failed",
            completedAt: new Date(),
          },
        },
      },
    });
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const order = await prisma.order.findFirst({
    where: { stripePaymentIntentId: charge.payment_intent as string },
  });

  if (order) {
    const refundAmount = charge.amount_refunded / 100;
    const isFullRefund = charge.amount === charge.amount_refunded;

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: isFullRefund ? "REFUNDED" : order.status,
        paymentStatus: isFullRefund ? "REFUNDED" : order.paymentStatus,
        timeline: {
          create: {
            status: "REFUNDED",
            title: isFullRefund ? "Order refunded" : "Partial refund issued",
            description: `$${refundAmount} has been refunded`,
            completedAt: new Date(),
          },
        },
      },
    });

    // Update client lifetime value
    await updateClientLifetimeValue(order.clientId);

    // Update sales metrics for refund
    await updateSalesMetricsForRefund(order.id, refundAmount);
  }
}

async function provisionServices(order: any) {
  // Create services for each order item
  for (const item of order.items) {
    const service = await prisma.service.create({
      data: {
        templateId: item.serviceTemplateId,
        clientId: order.clientId,
        status: "TO_DO",
      },
    });

    // Update order item with service reference
    await prisma.orderItem.update({
      where: { id: item.id },
      data: { serviceId: service.id },
    });

    // Create initial tasks if template has them
    if (item.serviceTemplate.defaultTasks?.length > 0) {
      await prisma.task.createMany({
        data: item.serviceTemplate.defaultTasks.map((task: any) => ({
          name: task.name,
          description: task.description,
          status: "TO_DO",
          priority: task.priority || "MEDIUM",
          serviceId: service.id,
          order: task.order,
        })),
      });
    }
  }

  // Update order status to completed
  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      timeline: {
        create: {
          status: "COMPLETED",
          title: "Services activated",
          description: "All services have been provisioned and are now active",
          completedAt: new Date(),
        },
      },
    },
  });

  // Generate invoice
  // TODO: Implement invoice service
  // await invoiceService.generateInvoice(order.id);
}

async function updateClientLifetimeValue(clientId: string) {
  const result = await prisma.order.aggregate({
    where: {
      clientId,
      paymentStatus: "SUCCEEDED",
    },
    _sum: {
      total: true,
    },
    _count: true,
    _min: {
      createdAt: true,
    },
    _max: {
      createdAt: true,
    },
  });

  await prisma.client.update({
    where: { id: clientId },
    data: {
      lifetimeValue: result._sum.total || 0,
      totalOrders: result._count,
      firstOrderDate: result._min.createdAt,
      lastOrderDate: result._max.createdAt,
    },
  });
}

async function updateSalesMetrics(order: any) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  const existingMetric = await prisma.salesMetrics.findUnique({
    where: { date },
  });

  if (existingMetric) {
    await prisma.salesMetrics.update({
      where: { date },
      data: {
        revenue: { increment: order.total },
        orderCount: { increment: 1 },
        avgOrderValue: {
          set:
            (Number(existingMetric.revenue) + Number(order.total)) /
            (existingMetric.orderCount + 1),
        },
      },
    });
  } else {
    await prisma.salesMetrics.create({
      data: {
        date,
        revenue: order.total,
        orderCount: 1,
        avgOrderValue: order.total,
        newCustomers: order.client.totalOrders === 1 ? 1 : 0,
      },
    });
  }
}

async function updateSalesMetricsForRefund(
  orderId: string,
  refundAmount: number
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { createdAt: true },
  });

  if (order) {
    const date = new Date(order.createdAt);
    date.setHours(0, 0, 0, 0);

    await prisma.salesMetrics.update({
      where: { date },
      data: {
        refundAmount: { increment: refundAmount },
      },
    });
  }
}
