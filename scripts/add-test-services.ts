import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Adding test services...");

  // Get all clients
  const clients = await prisma.client.findMany();
  console.log(`Found ${clients.length} clients`);

  // Create service templates if they don't exist
  let googleAdsTemplate = await prisma.serviceTemplate.findFirst({
    where: { type: "GOOGLE_ADS" },
  });

  if (!googleAdsTemplate) {
    googleAdsTemplate = await prisma.serviceTemplate.create({
      data: {
        name: "Google Ads Campaign Setup",
        type: "GOOGLE_ADS",
        price: 1500,
        defaultTasks: [
          {
            name: "Keyword Research",
            description: "Research and identify target keywords",
          },
          {
            name: "Campaign Structure",
            description: "Set up campaign structure and ad groups",
          },
          { name: "Ad Copy Creation", description: "Write compelling ad copy" },
          {
            name: "Landing Page Review",
            description: "Review and optimize landing pages",
          },
        ],
      },
    });
    console.log("Created Google Ads template");
  }

  // Create services for each client if they don't have any
  for (const client of clients) {
    const existingServices = await prisma.service.findMany({
      where: { clientId: client.id },
    });

    if (existingServices.length === 0) {
      const service = await prisma.service.create({
        data: {
          clientId: client.id,
          templateId: googleAdsTemplate.id,
          status: "IN_PROGRESS",
        },
      });

      // Create tasks for the service
      const tasks = googleAdsTemplate.defaultTasks as any[];
      for (const task of tasks) {
        await prisma.task.create({
          data: {
            serviceId: service.id,
            name: task.name,
            description: task.description,
            status: "TO_DO",
            clientVisible: true,
          },
        });
      }

      console.log(`Created service for client: ${client.name}`);
    } else {
      console.log(
        `Client ${client.name} already has ${existingServices.length} services`
      );
    }
  }

  console.log("Done!");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
