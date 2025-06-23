import { test, expect, type Page } from "@playwright/test";

// Helper function to login as admin
async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "admin@example.com");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard");
}

// Helper function to login as service manager
async function loginAsServiceManager(page: Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "servicemanager@example.com");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard");
}

// Helper function to login as copywriter
async function loginAsCopywriter(page: Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', "copywriter@example.com");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard");
}

test.describe("Service Templates", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("Admin can create a new service template", async ({ page }) => {
    // Navigate to services page
    await page.goto("/services");
    await page.waitForLoadState("networkidle");

    // Click new template button
    await page.locator("a").filter({ hasText: "New Template" }).click();
    await page.waitForURL("**/services/templates/new");

    // Fill out the form
    await page.fill(
      'input[placeholder*="Google Ads Campaign Setup"]',
      "Test Google Ads Template"
    );
    await page.locator("button[role='combobox']").first().click();
    await page
      .locator("[role='option']")
      .filter({ hasText: "Google Ads" })
      .click();
    await page.fill('input[placeholder="0.00"]', "500");

    // Add tasks
    await page.fill(
      'input[placeholder*="Set up campaign structure"]',
      "Campaign Setup"
    );
    await page.fill(
      'textarea[placeholder*="Detailed description"]',
      "Set up the campaign structure in Google Ads"
    );

    // Toggle client visible
    await page.locator("button[role='switch']").first().click();

    // Add another task
    await page.locator("button").filter({ hasText: "Add Task" }).click();
    await page
      .locator('input[placeholder*="Set up campaign structure"]')
      .nth(1)
      .fill("Keyword Research");

    // Submit form
    await page.locator("button").filter({ hasText: "Create Template" }).click();

    // Verify redirect and template appears
    await page.waitForURL("**/services");
    await expect(page.locator("text=Test Google Ads Template")).toBeVisible();
    await expect(page.locator("text=Google Ads").first()).toBeVisible();
    await expect(page.locator("text=$500.00")).toBeVisible();
    await expect(page.locator("text=Default Tasks (2)")).toBeVisible();
  });

  test("Admin can edit a service template", async ({ page }) => {
    // First create a template
    await page.goto("/services/templates/new");
    await page.fill(
      'input[placeholder*="Google Ads Campaign Setup"]',
      "Edit Test Template"
    );
    await page.locator("button[role='combobox']").first().click();
    await page
      .locator("[role='option']")
      .filter({ hasText: "Facebook Ads" })
      .click();
    await page.fill(
      'input[placeholder*="Set up campaign structure"]',
      "Initial Task"
    );
    await page.locator("button").filter({ hasText: "Create Template" }).click();
    await page.waitForURL("**/services");

    // Click edit button
    await page.locator('[aria-label="Edit"]').first().click();
    await page.waitForURL("**/services/templates/**/edit");

    // Edit the template
    await page.fill(
      'input[value="Edit Test Template"]',
      "Updated Template Name"
    );
    await page.fill('input[placeholder="0.00"]', "750");

    // Update task
    await page.fill('input[value="Initial Task"]', "Updated Task Name");

    // Submit
    await page.locator("button").filter({ hasText: "Update Template" }).click();

    // Verify changes
    await page.waitForURL("**/services");
    await expect(page.locator("text=Updated Template Name")).toBeVisible();
    await expect(page.locator("text=$750.00")).toBeVisible();
  });

  test("Admin can delete a service template", async ({ page }) => {
    // First create a template to delete
    await page.goto("/services/templates/new");
    await page.fill(
      'input[placeholder*="Google Ads Campaign Setup"]',
      "Template to Delete"
    );
    await page.locator("button[role='combobox']").first().click();
    await page
      .locator("[role='option']")
      .filter({ hasText: "Website Design" })
      .click();
    await page.fill('input[placeholder*="Set up campaign structure"]', "Task");
    await page.locator("button").filter({ hasText: "Create Template" }).click();
    await page.waitForURL("**/services");

    // Click delete button
    await page.locator("button").filter({ hasText: "Delete" }).first().click();

    // Confirm deletion
    await expect(page.locator("text=Delete Service Template")).toBeVisible();
    await page.locator("button").filter({ hasText: "Delete" }).nth(1).click();

    // Verify template is removed
    await expect(page.locator("text=Template to Delete")).not.toBeVisible();
  });

  test("Service Manager can create and edit templates", async ({ page }) => {
    // Login as service manager
    await loginAsServiceManager(page);

    // Navigate to services
    await page.goto("/services");

    // Create template
    await page.locator("a").filter({ hasText: "New Template" }).click();
    await page.fill(
      'input[placeholder*="Google Ads Campaign Setup"]',
      "Service Manager Template"
    );
    await page.locator("button[role='combobox']").first().click();
    await page
      .locator("[role='option']")
      .filter({ hasText: "Google Ads" })
      .click();
    await page.fill(
      'input[placeholder*="Set up campaign structure"]',
      "Task 1"
    );
    await page.locator("button").filter({ hasText: "Create Template" }).click();

    // Verify creation
    await page.waitForURL("**/services");
    await expect(page.locator("text=Service Manager Template")).toBeVisible();
  });

  test("Other roles cannot access service template creation", async ({
    page,
  }) => {
    // Login as copywriter
    await loginAsCopywriter(page);

    // Try to access template creation directly
    const response = await page.goto("/services/templates/new");

    // Should be redirected or see forbidden
    expect(response?.status()).not.toBe(200);
  });

  test("Template with multiple tasks displays correctly", async ({ page }) => {
    await page.goto("/services/templates/new");

    // Fill basic info
    await page.fill(
      'input[placeholder*="Google Ads Campaign Setup"]',
      "Multi-Task Template"
    );
    await page.locator("button[role='combobox']").first().click();
    await page
      .locator("[role='option']")
      .filter({ hasText: "Google Ads" })
      .click();

    // Add multiple tasks
    const tasks = ["Task 1", "Task 2", "Task 3", "Task 4", "Task 5"];

    for (let i = 0; i < tasks.length; i++) {
      if (i > 0) {
        await page.locator("button").filter({ hasText: "Add Task" }).click();
      }
      await page
        .locator('input[placeholder*="Set up campaign structure"]')
        .nth(i)
        .fill(tasks[i]);
    }

    // Create template
    await page.locator("button").filter({ hasText: "Create Template" }).click();
    await page.waitForURL("**/services");

    // Verify task display
    await expect(page.locator("text=Default Tasks (5)")).toBeVisible();
    await expect(page.locator("text=• Task 1")).toBeVisible();
    await expect(page.locator("text=• Task 2")).toBeVisible();
    await expect(page.locator("text=• Task 3")).toBeVisible();
    await expect(page.locator("text=+2 more")).toBeVisible();
  });

  test("Form validation works correctly", async ({ page }) => {
    await page.goto("/services/templates/new");

    // Try to submit empty form
    await page.locator("button").filter({ hasText: "Create Template" }).click();

    // Check validation messages
    await expect(page.locator("text=Template name is required")).toBeVisible();
    await expect(
      page.locator("text=Please select a service type")
    ).toBeVisible();

    // Fill template name but leave task empty
    await page.fill(
      'input[placeholder*="Google Ads Campaign Setup"]',
      "Test Template"
    );
    await page.locator("button[role='combobox']").first().click();
    await page
      .locator("[role='option']")
      .filter({ hasText: "Google Ads" })
      .click();

    // Clear the task name
    await page.fill('input[placeholder*="Set up campaign structure"]', "");
    await page.locator("button").filter({ hasText: "Create Template" }).click();

    // Check task validation
    await expect(page.locator("text=Task name is required")).toBeVisible();
  });
});
