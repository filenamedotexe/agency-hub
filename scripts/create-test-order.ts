import { prisma } from "../src/lib/prisma";

async function createTestOrder() {
  try {
    // Find the test client
    const client = await prisma.client.findFirst({
      where: {
        name: "Test User",
        businessName: "Test Company",
      },
    });

    if (!client) {
      console.error("Test client not found");
      return;
    }

    // Find a purchasable service template
    let serviceTemplate = await prisma.serviceTemplate.findFirst({
      where: {
        isPurchasable: true,
      },
    });

    // If no purchasable service exists, create one
    if (!serviceTemplate) {
      serviceTemplate = await prisma.serviceTemplate.create({
        data: {
          name: "Website Development",
          type: "ONE_TIME",
          isPurchasable: true,
          price: 2500,
          currency: "USD",
          storeTitle: "Professional Website Development",
          storeDescription: "Get a custom website built for your business",
          requiresContract: true,
          contractTemplate:
            "This is a service agreement for website development...",
          defaultTasks: [
            {
              name: "Initial consultation",
              description: "Discuss requirements",
              order: 1,
            },
            {
              name: "Design mockups",
              description: "Create design concepts",
              order: 2,
            },
            { name: "Development", description: "Build the website", order: 3 },
            { name: "Testing", description: "Test all features", order: 4 },
            { name: "Launch", description: "Deploy to production", order: 5 },
          ],
        },
      });
      console.log("✅ Created service template:", serviceTemplate.name);
    }

    // Create an order
    const order = await prisma.order.create({
      data: {
        clientId: client.id,
        status: "COMPLETED",
        subtotal: 2500,
        tax: 0,
        total: 2500,
        currency: "USD",
        paymentStatus: "SUCCEEDED",
        paidAt: new Date(),
        completedAt: new Date(),
        stripePaymentIntentId: "pi_test_" + Date.now(),
        paymentMethod: "card",
        items: {
          create: {
            serviceTemplateId: serviceTemplate.id,
            serviceName: serviceTemplate.storeTitle || serviceTemplate.name,
            quantity: 1,
            unitPrice: 2500,
            total: 2500,
          },
        },
        timeline: {
          create: [
            {
              status: "PENDING",
              title: "Order created",
              description: "Your order has been created",
              completedAt: new Date(Date.now() - 3600000 * 3), // 3 hours ago
            },
            {
              status: "PROCESSING",
              title: "Payment received",
              description: "Payment has been successfully processed",
              completedAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
            },
            {
              status: "CONTRACT_SIGNED",
              title: "Contract signed",
              description: "Service agreement signed by Test User",
              completedAt: new Date(Date.now() - 3600000), // 1 hour ago
            },
            {
              status: "COMPLETED",
              title: "Services activated",
              description:
                "All services have been provisioned and are now active",
              completedAt: new Date(),
            },
          ],
        },
      },
      include: {
        items: true,
        timeline: true,
      },
    });

    // Create contract if service requires it
    if (serviceTemplate.requiresContract) {
      await prisma.serviceContract.create({
        data: {
          orderId: order.id,
          templateContent:
            serviceTemplate.contractTemplate || "Standard service agreement...",
          signedAt: new Date(Date.now() - 3600000), // 1 hour ago
          signatureData: { data: "mock-signature-data" },
          signedByName: "Test User",
          signedByEmail: "zwieder22@gmail.com",
          ipAddress: "127.0.0.1",
        },
      });
    }

    // Create invoice
    const invoiceNumber = "INV-2025-" + Date.now().toString().slice(-6);
    const invoice = await prisma.invoice.create({
      data: {
        orderId: order.id,
        number: invoiceNumber,
        pdfUrl: "https://example.com/invoice.pdf", // Placeholder
      },
    });

    // Update client LTV
    await prisma.client.update({
      where: { id: client.id },
      data: {
        lifetimeValue: 2500,
        totalOrders: 1,
        firstOrderDate: new Date(),
        lastOrderDate: new Date(),
      },
    });

    // Create sales metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.salesMetrics.upsert({
      where: { date: today },
      update: {
        revenue: { increment: 2500 },
        orderCount: { increment: 1 },
        avgOrderValue: 2500,
        contractsSigned: { increment: 1 },
      },
      create: {
        date: today,
        revenue: 2500,
        orderCount: 1,
        avgOrderValue: 2500,
        newCustomers: 1,
        refundAmount: 0,
        contractsSigned: 1,
      },
    });

    console.log("✅ Created test order:", {
      orderId: order.id,
      orderNumber: order.orderNumber,
      clientEmail: "zwieder22@gmail.com",
      total: "$" + (order.total / 100).toFixed(2),
      status: order.status,
      invoiceNumber: invoice.number,
    });

    console.log(
      "\n📧 Email notifications that would be sent to zwieder22@gmail.com:"
    );
    console.log("- Order confirmation");
    console.log("- Contract ready for signing");
    console.log("- Contract signed confirmation");
    console.log("- Service provisioned");
    console.log("- Invoice available");
  } catch (error) {
    console.error("Error creating test order:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestOrder();
