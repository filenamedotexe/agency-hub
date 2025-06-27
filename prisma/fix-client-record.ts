import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createClientRecord() {
  try {
    // Check if client record already exists
    const existingClient = await prisma.client.findFirst({
      where: {
        metadata: {
          path: ["userId"],
          equals: "4bb8d8ab-ca17-4836-ac4f-d437d8c4d6ae",
        },
      },
    });

    if (existingClient) {
      console.log("Client record already exists:", existingClient.id);
      return;
    }

    // Create client record
    const client = await prisma.client.create({
      data: {
        name: "Test Client",
        businessName: "Test Business",
        metadata: {
          userId: "4bb8d8ab-ca17-4836-ac4f-d437d8c4d6ae",
        },
      },
    });

    console.log("Created client record:", client.id);
  } catch (error) {
    console.error("Error creating client record:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createClientRecord();
