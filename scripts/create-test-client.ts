import { prisma } from "../src/lib/prisma";

async function createTestClient() {
  try {
    // First check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: "zwieder22@gmail.com" },
    });

    let user;
    if (existingUser) {
      user = existingUser;
      console.log("User already exists:", user.id);
    } else {
      // Create user in database
      user = await prisma.user.create({
        data: {
          email: "zwieder22@gmail.com",
          role: "CLIENT",
        },
      });
      console.log("Created new user:", user.id);
    }

    // Check if client already exists
    const existingClient = await prisma.client.findFirst({
      where: {
        metadata: {
          path: ["userId"],
          equals: user.id,
        },
      },
    });

    if (existingClient) {
      console.log("✅ Client already exists:", {
        userId: user.id,
        clientId: existingClient.id,
        email: existingClient.email || "zwieder22@gmail.com",
        name: existingClient.name,
      });
      return;
    }

    // Create client record
    const client = await prisma.client.create({
      data: {
        name: "Test User",
        businessName: "Test Company",
        metadata: {
          userId: user.id,
          email: "zwieder22@gmail.com",
        },
      },
    });

    console.log("✅ Created test client:", {
      userId: user.id,
      clientId: client.id,
      email: client.email || "zwieder22@gmail.com",
      name: client.name,
    });

    console.log(
      "\n📧 Email notifications will be sent to: zwieder22@gmail.com"
    );
    console.log("🔑 Use password: Test123! to login");
  } catch (error) {
    console.error("Error creating test client:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestClient();
