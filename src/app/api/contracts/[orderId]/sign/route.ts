import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, EmailTemplates } from "@/lib/email";
import { z } from "zod";

const signContractSchema = z.object({
  signatureData: z.string(),
  fullName: z.string().min(1),
  email: z.string().email(),
  userAgent: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { orderId } = params;
    const body = await req.json();
    const { signatureData, fullName, email, userAgent } =
      signContractSchema.parse(body);

    // Get client for current user
    const client = await prisma.client.findFirst({
      where: {
        metadata: {
          path: ["userId"],
          equals: session.user.id,
        },
      },
    });

    if (!client) {
      return new NextResponse("Client not found", { status: 404 });
    }

    // Verify the order belongs to the current user
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        clientId: client.id,
      },
      include: {
        contract: true,
        items: {
          include: {
            serviceTemplate: true,
          },
        },
      },
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    if (!order.contract) {
      return new NextResponse("No contract required for this order", {
        status: 400,
      });
    }

    if (order.contract.signedAt) {
      return new NextResponse("Contract already signed", { status: 400 });
    }

    // Get client IP address
    const ipAddress =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Update contract with signature
    await prisma.serviceContract.update({
      where: { id: order.contract.id },
      data: {
        signedAt: new Date(),
        signatureData: {
          data: signatureData,
          timestamp: new Date().toISOString(),
        },
        signedByName: fullName,
        signedByEmail: email,
        ipAddress: ipAddress as string,
        userAgent: userAgent || null,
      },
    });

    // Update order timeline
    await prisma.orderTimeline.create({
      data: {
        orderId: orderId,
        status: "CONTRACT_SIGNED",
        title: "Contract signed",
        description: `Service agreement signed by ${fullName}`,
        completedAt: new Date(),
      },
    });

    // Send contract signed email
    try {
      const contractEmail = EmailTemplates.contractSigned(
        order.id,
        client.name,
        order.items[0].serviceName
      );

      await sendEmail({
        to: client.email,
        ...contractEmail,
      });
    } catch (error) {
      console.error("Failed to send contract signed email:", error);
    }

    // Now provision the services
    await provisionServicesAfterContract(order);

    return NextResponse.json({
      success: true,
      message: "Contract signed successfully",
    });
  } catch (error) {
    console.error("Contract signing error:", error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

async function provisionServicesAfterContract(order: any) {
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
    if (
      item.serviceTemplate.defaultTasks &&
      Array.isArray(item.serviceTemplate.defaultTasks)
    ) {
      const tasks = item.serviceTemplate.defaultTasks as any[];
      await prisma.task.createMany({
        data: tasks.map((task: any) => ({
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

  // Update sales metrics for contract signed
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  await prisma.salesMetrics.update({
    where: { date },
    data: {
      contractsSigned: { increment: 1 },
    },
  });

  // Generate invoice and send emails
  try {
    const invoice = await prisma.invoice.create({
      data: {
        orderId: order.id,
        invoiceNumber: generateInvoiceNumber(),
        total: order.total,
        tax: 0,
        subtotal: order.total,
        issuedAt: new Date(),
        status: "PAID",
      },
    });

    // Get client details
    const client = await prisma.client.findUnique({
      where: { id: order.clientId },
    });

    if (client) {
      // Send invoice email
      const invoiceEmail = EmailTemplates.invoiceGenerated(
        invoice.invoiceNumber,
        client.name,
        order.total
      );

      await sendEmail({
        to: client.email,
        ...invoiceEmail,
      });

      // Send service provisioned email
      const serviceEmail = EmailTemplates.serviceProvisioned(
        order.id,
        client.name,
        order.items.map((item: any) => item.serviceName).join(", ")
      );

      await sendEmail({
        to: client.email,
        ...serviceEmail,
      });
    }
  } catch (error) {
    console.error("Failed to generate invoice or send emails:", error);
  }
}

// Helper function to generate invoice numbers
function generateInvoiceNumber(): string {
  const prefix = process.env.INVOICE_PREFIX || "INV";
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${year}-${timestamp}`;
}
