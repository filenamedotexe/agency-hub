import { test, expect } from "@playwright/test";
import { loginAsRole, type UserRole } from "./helpers/role-auth";
import {
  mcpTakeScreenshot,
  mcpVerifyAccessibility,
  mcpMonitorNetworkRequests,
  mcpVerifyToast,
  mcpWaitForElement,
} from "./helpers/mcp-utils";

test.describe("Services & Tasks Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRole(page, "ADMIN");
  });

  test.describe("Service Template Management", () => {
    test("create service template with tasks", async ({ page }) => {
      // Monitor API requests
      const requests = await mcpMonitorNetworkRequests(page, "/api/");

      await page.goto("/services");
      await page.waitForLoadState("networkidle");

      // Take screenshot of services page
      await mcpTakeScreenshot(page, {
        filename: "services-list.png",
      });

      // Click create template button
      await page.click(
        'button:has-text("Create Template"), button:has-text("New Template")'
      );

      // Verify modal accessibility
      await mcpWaitForElement(page, '[role="dialog"]');
      const isAccessible = await mcpVerifyAccessibility(page, {
        checkLabels: true,
      });
      expect(isAccessible).toBe(true);

      // Fill template details
      const timestamp = Date.now();
      const templateData = {
        name: `Test Service Template ${timestamp}`,
        type: "GOOGLE_ADS",
        price: "1500",
        description: "Test service template description",
      };

      await page.fill('input[name="name"]', templateData.name);

      // Select service type
      await page.locator('button[role="combobox"]').click();
      await page.locator('[role="option"]:has-text("Google Ads")').click();

      await page.fill('input[name="price"]', templateData.price);
      await page.fill('textarea[name="description"]', templateData.description);

      // Add tasks
      await page.click('button:has-text("Add Task")');

      // Fill task details
      await page.fill('input[name="tasks.0.name"]', "Initial Campaign Setup");
      await page.fill(
        'textarea[name="tasks.0.description"]',
        "Set up Google Ads account and campaigns"
      );

      // Add checklist items to task
      await page.click('button:has-text("Add Checklist Item")');
      await page.fill(
        'input[name="tasks.0.checklist.0.text"]',
        "Create Google Ads account"
      );

      await page.click('button:has-text("Add Checklist Item")');
      await page.fill(
        'input[name="tasks.0.checklist.1.text"]',
        "Set up billing"
      );

      await page.click('button:has-text("Add Checklist Item")');
      await page.fill(
        'input[name="tasks.0.checklist.2.text"]',
        "Create first campaign"
      );

      // Take screenshot of filled form with checklist
      await mcpTakeScreenshot(page, {
        filename: "service-template-with-checklist.png",
      });

      // Add second task
      await page.click('button:has-text("Add Task")');
      await page.fill('input[name="tasks.1.name"]', "Keyword Research");
      await page.fill(
        'textarea[name="tasks.1.description"]',
        "Research and select target keywords"
      );

      // Save template
      await page.click('button[type="submit"]');

      // Verify success
      await expect(
        page.getByText("Service template created successfully")
      ).toBeVisible();
      await expect(page.getByText(templateData.name)).toBeVisible();
    });

    test("checklist items are never visible to clients note", async ({
      page,
    }) => {
      await page.goto("/services");
      await page.click(
        'button:has-text("Create Template"), button:has-text("New Template")'
      );

      // Add a task
      await page.click('button:has-text("Add Task")');

      // Check for the note about checklist visibility
      await expect(
        page.locator('text="Note: Checklists are never visible to clients"')
      ).toBeVisible();
    });

    test("edit service template", async ({ page }) => {
      await page.goto("/services");
      await page.waitForLoadState("networkidle");

      // Click on first template
      const templateCard = page
        .locator('[data-testid="service-template"], .service-template-card')
        .first();
      await templateCard.click();

      // Click edit
      await page.click('button:has-text("Edit")');

      // Update name
      const updatedName = `Updated Template ${Date.now()}`;
      await page.fill('input[name="name"]', updatedName);

      // Save
      await page.click('button[type="submit"]');

      // Verify
      await expect(
        page.getByText("Service template updated successfully")
      ).toBeVisible();
      await expect(page.getByText(updatedName)).toBeVisible();
    });

    test("delete service template", async ({ page }) => {
      // Create a template to delete
      await page.goto("/services");
      await page.click(
        'button:has-text("Create Template"), button:has-text("New Template")'
      );

      const timestamp = Date.now();
      await page.fill('input[name="name"]', `Delete Test ${timestamp}`);
      await page.locator('button[role="combobox"]').click();
      await page.locator('[role="option"]').first().click();
      await page.click('button[type="submit"]');

      // Find and delete
      await page.getByText(`Delete Test ${timestamp}`).click();
      await page.click('button:has-text("Delete")');
      await page.click('button:has-text("Confirm"), button:has-text("Yes")');

      // Verify
      await expect(
        page.getByText("Service template deleted successfully")
      ).toBeVisible();
      await expect(
        page.getByText(`Delete Test ${timestamp}`)
      ).not.toBeVisible();
    });
  });

  test.describe("Service Assignment", () => {
    test("assign service to client", async ({ page }) => {
      // Navigate to client
      await page.goto("/clients");
      await page.waitForLoadState("networkidle");

      const clientRow = page.locator("tbody tr").first();
      await clientRow.click();
      await page.waitForLoadState("networkidle");

      // Click assign service
      await page.click(
        'button:has-text("Assign Service"), button:has-text("Add Service")'
      );

      // Select service template
      await page.locator('button[role="combobox"]').click();
      await page.locator('[role="option"]').first().click();

      // Set start date
      await page.fill('input[type="date"]', "2025-01-01");

      // Assign
      await page.click('button:has-text("Assign")');

      // Verify
      await expect(
        page.getByText("Service assigned successfully")
      ).toBeVisible();

      // Check service appears in client's services
      const servicesSection = page.locator('section:has-text("Services")');
      await expect(
        servicesSection.locator('.service-card, [data-testid="service-item"]')
      ).toBeVisible();
    });

    test("assigned service includes template tasks with checklists", async ({
      page,
    }) => {
      await page.goto("/clients");
      const clientRow = page.locator("tbody tr").first();
      await clientRow.click();
      await page.waitForLoadState("networkidle");

      // Find a service with tasks
      const service = page
        .locator('[data-testid="service-item"], .service-card')
        .first();

      if (await service.isVisible()) {
        await service.click();

        // Check for tasks
        const tasks = page.locator('[data-testid="task-item"], .task-item');

        if ((await tasks.count()) > 0) {
          const firstTask = tasks.first();
          await firstTask.click();

          // Check for checklist
          const checklistItems = page.locator(
            '[data-testid="checklist-item"], input[type="checkbox"]'
          );

          if ((await checklistItems.count()) > 0) {
            // Verify checklist functionality
            const firstCheckbox = checklistItems.first();
            await firstCheckbox.click();

            // Check if progress updates
            await expect(
              page.locator("text=/Checklist.*\\d+\\/\\d+/")
            ).toBeVisible();
          }
        }
      }
    });
  });

  test.describe("Task Management", () => {
    test("update task status", async ({ page }) => {
      await page.goto("/services");
      await page.waitForLoadState("networkidle");

      // Navigate to a client with services
      await page.goto("/clients");
      const clientRow = page.locator("tbody tr").first();
      await clientRow.click();

      // Find a task
      const task = page
        .locator('[data-testid="task-item"], .task-item')
        .first();

      if (await task.isVisible()) {
        // Change status
        const statusButton = task.locator('button[role="combobox"], select');
        await statusButton.click();
        await page.locator('[role="option"]:has-text("In Progress")').click();

        // Verify update
        await expect(page.getByText("Task updated successfully")).toBeVisible();
      }
    });

    test("complete all checklist items prompts task completion", async ({
      page,
    }) => {
      await page.goto("/clients");
      const clientRow = page.locator("tbody tr").first();
      await clientRow.click();

      // Find a task with checklist
      const task = page
        .locator('[data-testid="task-item"], .task-item')
        .first();

      if (await task.isVisible()) {
        await task.click();

        const checklistItems = page.locator(
          'input[type="checkbox"]:not(:checked)'
        );
        const itemCount = await checklistItems.count();

        if (itemCount > 0) {
          // Check all items
          for (let i = 0; i < itemCount; i++) {
            await checklistItems.nth(i).click();
            await page.waitForTimeout(200);
          }

          // Should show completion prompt
          await expect(
            page.locator(
              'text="All checklist items completed! Should we mark this task as done?"'
            )
          ).toBeVisible();
        }
      }
    });

    test("task client visibility toggle", async ({ page }) => {
      await page.goto("/services");

      // Create or edit a template
      await page.click(
        'button:has-text("Create Template"), button:has-text("New Template")'
      );
      await page.click('button:has-text("Add Task")');

      // Check for client visibility toggle
      const visibilityToggle = page.locator(
        'input[name="tasks.0.clientVisible"], label:has-text("Visible to client")'
      );
      await expect(visibilityToggle).toBeVisible();

      // Toggle it
      await visibilityToggle.click();
    });
  });

  test.describe("Role-Based Access", () => {
    test("SERVICE_MANAGER can manage templates and assignments", async ({
      page,
    }) => {
      await loginAsRole(page, "SERVICE_MANAGER");
      await page.goto("/services");

      // Should see create button
      await expect(
        page.locator(
          'button:has-text("Create Template"), button:has-text("New Template")'
        )
      ).toBeVisible();

      // Can assign services
      await page.goto("/clients");
      const clientRow = page.locator("tbody tr").first();
      if (await clientRow.isVisible()) {
        await clientRow.click();
        await expect(
          page.locator(
            'button:has-text("Assign Service"), button:has-text("Add Service")'
          )
        ).toBeVisible();
      }
    });

    test("COPYWRITER, EDITOR, VA can only view and update assigned tasks", async ({
      page,
    }) => {
      const roles: UserRole[] = ["COPYWRITER", "EDITOR", "VA"];

      for (const role of roles) {
        await loginAsRole(page, role);
        await page.goto("/services");

        // Should NOT see create template button
        await expect(
          page.locator('button:has-text("Create Template")')
        ).not.toBeVisible();

        // Should see assigned tasks
        const myTasks = page
          .locator('text="My Tasks", text="Assigned Tasks"')
          .first();
        if (await myTasks.isVisible()) {
          // Can update task status
          const task = page.locator('[data-testid="assigned-task"]').first();
          if (await task.isVisible()) {
            await expect(task.locator("button, select")).toBeVisible();
          }
        }
      }
    });
  });

  test.describe("Service Status Management", () => {
    test("update service status", async ({ page }) => {
      await page.goto("/clients");
      const clientRow = page.locator("tbody tr").first();
      await clientRow.click();

      const service = page
        .locator('[data-testid="service-item"], .service-card')
        .first();

      if (await service.isVisible()) {
        // Change service status
        const statusSelect = service.locator('button[role="combobox"], select');
        await statusSelect.click();
        await page.locator('[role="option"]:has-text("In Progress")').click();

        // Verify
        await expect(page.getByText("Service status updated")).toBeVisible();
      }
    });

    test("service status affects task availability", async ({ page }) => {
      await page.goto("/clients");
      const clientRow = page.locator("tbody tr").first();
      await clientRow.click();

      const service = page
        .locator('[data-testid="service-item"], .service-card')
        .first();

      if (await service.isVisible()) {
        // Set service to completed
        const statusSelect = service.locator('button[role="combobox"], select');
        await statusSelect.click();
        await page.locator('[role="option"]:has-text("Completed")').click();

        // Tasks should be read-only
        const tasks = page.locator('[data-testid="task-item"]');
        if ((await tasks.count()) > 0) {
          const taskCheckboxes = tasks.locator('input[type="checkbox"]');
          // Checkboxes should be disabled
          await expect(taskCheckboxes.first()).toBeDisabled();
        }
      }
    });
  });
});
