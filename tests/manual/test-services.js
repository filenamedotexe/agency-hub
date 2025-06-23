const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testServiceFunctionality() {
  console.log("Testing Service Functionality...\n");

  try {
    // 1. Check if service templates exist
    console.log("1. Checking service templates...");
    const templates = await prisma.serviceTemplate.findMany();
    console.log(`Found ${templates.length} service templates`);
    templates.forEach((t) => console.log(`  - ${t.name} (${t.type})`));

    // 2. Check if clients exist
    console.log("\n2. Checking clients...");
    const clients = await prisma.client.findMany();
    console.log(`Found ${clients.length} clients`);
    clients.forEach((c) => console.log(`  - ${c.name} (${c.businessName})`));

    // 3. Check services assigned to clients
    console.log("\n3. Checking services assigned to clients...");
    const services = await prisma.service.findMany({
      include: {
        client: true,
        template: true,
        tasks: true,
      },
    });
    console.log(`Found ${services.length} services`);
    services.forEach((s) => {
      console.log(`  - ${s.template.name} for ${s.client.name}`);
      console.log(`    Status: ${s.status}`);
      console.log(`    Tasks: ${s.tasks.length}`);
      s.tasks.forEach((t) => console.log(`      - ${t.name} (${t.status})`));
    });

    // 4. Create a test service if no services exist
    if (services.length === 0 && templates.length > 0 && clients.length > 0) {
      console.log("\n4. Creating a test service...");
      const template = templates[0];
      const client = clients[0];

      const newService = await prisma.service.create({
        data: {
          templateId: template.id,
          clientId: client.id,
          status: "TO_DO",
          customTasks: template.defaultTasks || [],
          tasks: {
            create:
              template.defaultTasks?.map((task, index) => ({
                name: task.name || `Task ${index + 1}`,
                description: task.description || "",
                status: "TO_DO",
                dueDate: task.dueDate ? new Date(task.dueDate) : null,
                clientVisible: task.clientVisible || false,
                order: index,
              })) || [],
          },
        },
        include: {
          tasks: true,
          client: true,
          template: true,
        },
      });

      console.log(
        `Created service: ${newService.template.name} for ${newService.client.name}`
      );
      console.log(`With ${newService.tasks.length} tasks`);
    }

    console.log("\n✅ Service functionality test completed successfully!");
  } catch (error) {
    console.error("❌ Error testing service functionality:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testServiceFunctionality();
