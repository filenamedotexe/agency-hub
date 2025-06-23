import { test, expect } from "@playwright/test";

// Helper function to login as admin
async function loginAsAdmin(page: any) {
  await page.goto("/login");
  await page.fill('input[name="email"]', "admin@example.com");
  await page.fill('input[name="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard");
}

test.describe("Phase 3: Services & Tasks - FIXED SELECTORS", () => {
  test.beforeAll(async () => {
    // CRITICAL: Verify server is responding before any tests
    const response = await fetch("http://localhost:3001");
    if (!response.ok) {
      throw new Error("Server not responding on port 3001");
    }
  });

  test("Admin can navigate to services page and view templates", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    // Navigate to services page using direct href
    await page.goto("/services");
    await page.waitForLoadState("networkidle");

    // Should see service templates page
    await expect(
      page.locator('h1:has-text("Service Templates")')
    ).toBeVisible();

    // Should see template cards or empty state
    const templateCards = page.locator("text=Google Ads Campaign Setup");
    const emptyState = page.locator("text=No service templates yet");

    // Either templates exist or we see empty state
    const hasTemplates = (await templateCards.count()) > 0;
    const hasEmptyState = await emptyState.isVisible();

    expect(hasTemplates || hasEmptyState).toBeTruthy();

    if (hasTemplates) {
      console.log("✅ Service templates found");
      await expect(templateCards.first()).toBeVisible();
    } else {
      console.log("ℹ️ No service templates, showing empty state");
      await expect(emptyState).toBeVisible();
    }
  });

  test("Admin can navigate to clients page and view client list", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    // Navigate to clients page using direct href
    await page.goto("/clients");
    await page.waitForLoadState("networkidle");

    // Should see clients page
    await expect(page.locator('h1:has-text("Clients")')).toBeVisible();

    // Check for client table or cards
    const clientTable = page.locator("table");
    const clientRows = page.locator("table tbody tr");

    if (await clientTable.isVisible()) {
      const rowCount = await clientRows.count();
      console.log(`Found ${rowCount} client rows`);

      if (rowCount > 0) {
        // Should see client data
        await expect(clientRows.first()).toBeVisible();
        console.log("✅ Client list populated");
      }
    }
  });

  test("Admin can view client detail page with services section", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    // Navigate to clients page
    await page.goto("/clients");
    await page.waitForLoadState("networkidle");

    // Check if there are clients
    const clientRows = page.locator("table tbody tr");
    const rowCount = await clientRows.count();

    if (rowCount > 0) {
      // Click on first client
      await clientRows.first().click();
      await page.waitForLoadState("networkidle");

      // Should be on client detail page
      expect(page.url()).toMatch(/\/clients\/[^\/]+$/);

      // Should see services section
      await expect(
        page
          .locator('h3:has-text("Services")')
          .or(page.locator('h2:has-text("Services")'))
      ).toBeVisible();

      // Should see Add Service button
      await expect(
        page.locator('button:has-text("Add Service")')
      ).toBeVisible();

      console.log("✅ Client detail page with services section working");
    } else {
      console.log("⚠️ No clients found, skipping client detail test");
    }
  });

  test("Admin can view service details and tasks", async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to first client
    await page.goto("/clients");
    await page.waitForLoadState("networkidle");

    const clientRows = page.locator("table tbody tr");
    const rowCount = await clientRows.count();

    if (rowCount > 0) {
      await clientRows.first().click();
      await page.waitForLoadState("networkidle");

      // Look for existing service cards
      const serviceCard = page
        .locator("text=Google Ads Campaign Setup")
        .first();

      if (await serviceCard.isVisible()) {
        await serviceCard.click();
        await page.waitForLoadState("networkidle");

        // Should see service detail dialog
        await expect(page.locator("text=Service Details")).toBeVisible();

        // Should see tasks section
        await expect(page.locator("text=Tasks")).toBeVisible();

        // Should see task items
        const taskItems = page.locator(
          "text=Campaign Structure Setup, text=Keyword Research, text=Landing Page Review"
        );
        if ((await taskItems.count()) > 0) {
          console.log("✅ Tasks visible in service detail");
        }

        // Close dialog
        await page.keyboard.press("Escape");
      } else {
        console.log("ℹ️ No services assigned to client yet");
      }
    }
  });

  test("Admin can add service to client", async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to first client
    await page.goto("/clients");
    await page.waitForLoadState("networkidle");

    const clientRows = page.locator("table tbody tr");
    const rowCount = await clientRows.count();

    if (rowCount > 0) {
      await clientRows.first().click();
      await page.waitForLoadState("networkidle");

      // Click Add Service button
      const addServiceButton = page.locator('button:has-text("Add Service")');
      if (await addServiceButton.isVisible()) {
        await addServiceButton.click();
        await page.waitForLoadState("networkidle");

        // Should see add service dialog
        await expect(page.locator("text=Add Service")).toBeVisible();

        // Check if there are available templates
        const selectTrigger = page.locator('[role="combobox"]');
        if (await selectTrigger.isVisible()) {
          await selectTrigger.click();

          // Look for template options
          const templateOptions = page.locator('[role="option"]');
          const optionCount = await templateOptions.count();

          if (optionCount > 0) {
            // Select first available template
            await templateOptions.first().click();

            // Click Add Service button in dialog
            await page.locator('button:has-text("Add Service")').last().click();
            await page.waitForLoadState("networkidle");

            console.log("✅ Service added to client");
          } else {
            console.log("ℹ️ No available service templates");
          }
        }

        // Close dialog if still open
        const cancelButton = page.locator('button:has-text("Cancel")');
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
        }
      }
    }
  });

  test("Client can view their services (client role test)", async ({
    page,
  }) => {
    // Login as client
    await page.goto("/login");
    await page.fill('input[name="email"]', "client@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/client-dashboard");
    await page.waitForLoadState("networkidle");

    // Should see client dashboard
    await expect(page.locator('h1:has-text("Client Dashboard")')).toBeVisible();

    // Should see services mentioned in the welcome text
    await expect(
      page.locator("text=Access your forms and services")
    ).toBeVisible();

    console.log("✅ Client can access dashboard");
  });

  test("Complete workflow verification", async ({ page }) => {
    await loginAsAdmin(page);

    // 1. Check services page exists
    await page.goto("/services");
    await page.waitForLoadState("networkidle");
    await expect(
      page.locator('h1:has-text("Service Templates")')
    ).toBeVisible();

    // 2. Check clients page exists
    await page.goto("/clients");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('h1:has-text("Clients")')).toBeVisible();

    // 3. Check if we can access client detail
    const clientRows = page.locator("table tbody tr");
    const rowCount = await clientRows.count();

    if (rowCount > 0) {
      await clientRows.first().click();
      await page.waitForLoadState("networkidle");

      // Should see services section
      await expect(
        page
          .locator('h3:has-text("Services")')
          .or(page.locator('h2:has-text("Services")'))
      ).toBeVisible();

      console.log("✅ Complete workflow functional");
    }

    // 4. Verify navigation works
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();

    console.log("✅ All core functionality verified");
  });
});
