const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedServices() {
  console.log("Seeding service templates...\n");

  try {
    // Create service templates
    const templates = [
      {
        name: "Google Ads Campaign Setup",
        type: "GOOGLE_ADS",
        price: 1500,
        defaultTasks: [
          {
            name: "Campaign Structure Setup",
            description: "Set up campaign structure",
            clientVisible: true,
          },
          {
            name: "Keyword Research",
            description: "Research and select keywords",
            clientVisible: true,
          },
          {
            name: "Ad Copy Creation",
            description: "Write compelling ad copy",
            clientVisible: true,
          },
          {
            name: "Landing Page Review",
            description: "Review and optimize landing pages",
            clientVisible: false,
          },
          {
            name: "Launch Campaign",
            description: "Launch and monitor initial performance",
            clientVisible: true,
          },
        ],
      },
      {
        name: "Facebook Ads Management",
        type: "FACEBOOK_ADS",
        price: 1200,
        defaultTasks: [
          {
            name: "Audience Research",
            description: "Research target audiences",
            clientVisible: true,
          },
          {
            name: "Creative Development",
            description: "Design ad creatives",
            clientVisible: true,
          },
          {
            name: "Campaign Setup",
            description: "Set up campaigns and ad sets",
            clientVisible: false,
          },
          {
            name: "A/B Testing",
            description: "Set up split tests",
            clientVisible: true,
          },
        ],
      },
      {
        name: "Website Redesign",
        type: "WEBSITE_DESIGN",
        price: 5000,
        defaultTasks: [
          {
            name: "Design Mockups",
            description: "Create design mockups",
            clientVisible: true,
          },
          {
            name: "Client Feedback",
            description: "Gather and implement feedback",
            clientVisible: true,
          },
          {
            name: "Development",
            description: "Build the website",
            clientVisible: false,
          },
          {
            name: "Testing",
            description: "Test across devices",
            clientVisible: false,
          },
          {
            name: "Launch",
            description: "Deploy to production",
            clientVisible: true,
          },
        ],
      },
    ];

    for (const template of templates) {
      const created = await prisma.serviceTemplate.create({
        data: template,
      });
      console.log(`Created template: ${created.name}`);
    }

    // Assign a service to the first client
    const firstClient = await prisma.client.findFirst();
    const googleAdsTemplate = await prisma.serviceTemplate.findFirst({
      where: { type: "GOOGLE_ADS" },
    });

    if (firstClient && googleAdsTemplate) {
      const service = await prisma.service.create({
        data: {
          templateId: googleAdsTemplate.id,
          clientId: firstClient.id,
          status: "IN_PROGRESS",
          tasks: {
            create: googleAdsTemplate.defaultTasks.map((task, index) => ({
              name: task.name,
              description: task.description,
              status:
                index === 0 ? "DONE" : index === 1 ? "IN_PROGRESS" : "TO_DO",
              clientVisible: task.clientVisible,
            })),
          },
        },
        include: {
          client: true,
          template: true,
          tasks: true,
        },
      });

      console.log(
        `\nAssigned ${service.template.name} to ${service.client.name}`
      );
      console.log(`Created ${service.tasks.length} tasks`);
    }

    console.log("\n✅ Service templates seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding services:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedServices();
