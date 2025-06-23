const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testTaskManagement() {
  console.log("Testing Task Management Functionality...\n");

  try {
    // 1. Find a service with tasks
    console.log("1. Finding service with tasks...");
    const service = await prisma.service.findFirst({
      include: {
        tasks: true,
        client: true,
        template: true,
      },
    });

    if (!service) {
      console.log("No services found. Please run seed-services.js first.");
      return;
    }

    console.log(
      `Found service: ${service.template.name} for ${service.client.name}`
    );
    console.log(`Current status: ${service.status}`);
    console.log(`Tasks: ${service.tasks.length}`);

    // 2. Display current tasks
    console.log("\n2. Current tasks:");
    service.tasks.forEach((task) => {
      console.log(`  - ${task.name}`);
      console.log(`    Status: ${task.status}`);
      console.log(`    Client Visible: ${task.clientVisible}`);
    });

    // 3. Update a task status
    console.log("\n3. Updating task statuses...");
    const taskToUpdate = service.tasks.find((t) => t.status === "TO_DO");
    if (taskToUpdate) {
      const updatedTask = await prisma.task.update({
        where: { id: taskToUpdate.id },
        data: { status: "IN_PROGRESS" },
      });
      console.log(`Updated "${updatedTask.name}" to IN_PROGRESS`);
    }

    // 4. Toggle client visibility
    console.log("\n4. Testing client visibility toggle...");
    const taskToToggle = service.tasks[0];
    const toggledTask = await prisma.task.update({
      where: { id: taskToToggle.id },
      data: { clientVisible: !taskToToggle.clientVisible },
    });
    console.log(
      `Toggled "${toggledTask.name}" visibility to ${toggledTask.clientVisible}`
    );

    // 5. Check service status update
    console.log("\n5. Checking service status...");
    const allTasks = await prisma.task.findMany({
      where: { serviceId: service.id },
    });

    const allDone = allTasks.every((task) => task.status === "DONE");
    const anyInProgress = allTasks.some(
      (task) => task.status === "IN_PROGRESS"
    );

    let expectedStatus = "TO_DO";
    if (allDone) {
      expectedStatus = "DONE";
    } else if (anyInProgress) {
      expectedStatus = "IN_PROGRESS";
    }

    console.log(`Expected service status: ${expectedStatus}`);

    // Update service status if needed
    if (service.status !== expectedStatus) {
      await prisma.service.update({
        where: { id: service.id },
        data: { status: expectedStatus },
      });
      console.log(`Updated service status to ${expectedStatus}`);
    }

    // 6. Create a new task
    console.log("\n6. Creating a new task...");
    const newTask = await prisma.task.create({
      data: {
        serviceId: service.id,
        name: "Test Task - Created by Script",
        description: "This task was created by the test script",
        status: "TO_DO",
        clientVisible: true,
      },
    });
    console.log(`Created new task: ${newTask.name}`);

    // 7. Count tasks by status
    console.log("\n7. Task summary:");
    const taskSummary = await prisma.task.groupBy({
      by: ["status"],
      where: { serviceId: service.id },
      _count: true,
    });

    taskSummary.forEach((group) => {
      console.log(`  ${group.status}: ${group._count} tasks`);
    });

    // 8. Test client view (filter non-visible tasks)
    console.log("\n8. Client view (only client-visible tasks):");
    const clientVisibleTasks = await prisma.task.findMany({
      where: {
        serviceId: service.id,
        clientVisible: true,
      },
    });
    console.log(
      `Client can see ${clientVisibleTasks.length} out of ${allTasks.length} tasks`
    );
    clientVisibleTasks.forEach((task) => {
      console.log(`  - ${task.name} (${task.status})`);
    });

    console.log("\n✅ Task management test completed successfully!");
  } catch (error) {
    console.error("❌ Error testing task management:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testTaskManagement();
