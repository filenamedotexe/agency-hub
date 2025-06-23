import { test, expect, type Page } from "@playwright/test";

// CRITICAL: Always verify server responds before any test
test.beforeAll(async () => {
  const response = await fetch("http://localhost:3001");
  if (!response.ok) throw new Error("Server not responding on port 3001");
});

// Helper function to login as admin
async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  // Wait for the login form to be ready
  await page.waitForSelector('input[type="email"]', { state: "visible" });
  await page.waitForSelector('input[type="password"]', { state: "visible" });

  // Fill the form
  await page.fill('input[type="email"]', "admin@example.com");
  await page.fill('input[type="password"]', "password123");

  // Submit the form
  const submitButton = page.locator('button[type="submit"]');
  await expect(submitButton).toBeEnabled();
  await submitButton.click();

  // Wait for navigation with more time
  await page.waitForURL("/dashboard", { timeout: 15000 });

  // Wait for dashboard to fully load
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000); // Extra wait for auth state to settle
}

test.describe("Service Assignment - WITH SERVER VERIFICATION", () => {
  test.beforeEach(async ({ page }) => {
    // Verify server is actually responding
    const response = await fetch("http://localhost:3001/login");
    if (!response.ok) throw new Error("Login page not responding");

    await loginAsAdmin(page);
    await page.waitForLoadState("networkidle");
  });

  test("Can navigate to services and see templates", async ({ page }) => {
    await page.goto("/services");
    await page.waitForLoadState("networkidle");

    // Wait for page to load
    await expect(page.locator("h1")).toContainText("Service");

    // Check if we can see the page content
    const hasContent =
      (await page.locator("text=Service Templates").isVisible()) ||
      (await page.locator("text=No service templates").isVisible());
    expect(hasContent).toBeTruthy();
  });

  test("Can navigate to clients page", async ({ page }) => {
    await page.goto("/clients");
    await page.waitForLoadState("networkidle");

    // Wait for the page title
    await expect(page.locator("h1")).toContainText("Clients");

    // Wait for either table or empty state
    const hasTable = await page
      .locator("table")
      .isVisible()
      .catch(() => false);
    const hasEmptyState = await page
      .locator("text=No clients found")
      .isVisible()
      .catch(() => false);
    const hasAddButton = await page
      .locator("button:has-text('Add Client')")
      .isVisible()
      .catch(() => false);

    console.log("Has table:", hasTable);
    console.log("Has empty state:", hasEmptyState);
    console.log("Has add button:", hasAddButton);

    expect(hasTable || hasEmptyState).toBeTruthy();
  });

  test("Complete service assignment flow", async ({ page }) => {
    // Step 1: Ensure we have a service template
    await page.goto("/services");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toContainText("Service");

    // Check if templates exist
    const noTemplates = await page
      .locator("text=No service templates yet")
      .isVisible()
      .catch(() => false);

    if (noTemplates) {
      // Create a template
      await page.locator("a:has-text('Create Template')").click();
      await page.waitForURL("**/services/templates/new");

      // Fill form
      await page.fill(
        'input[placeholder*="Google Ads Campaign Setup"]',
        "Test Service"
      );
      await page.locator("button[role='combobox']").click();
      await page.locator("[role='option']:has-text('Google Ads')").click();
      await page.fill(
        'input[placeholder*="Set up campaign structure"]',
        "Task 1"
      );

      // Submit
      await page.locator("button:has-text('Create Template')").click();
      await page.waitForURL("/services");
      await expect(page.locator("text=Test Service")).toBeVisible();
    }

    // Step 2: Go to clients
    await page.goto("/clients");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toContainText("Clients");

    // Wait for content to load
    await page.waitForTimeout(1000);

    // Check if we have clients
    let hasClients = false;
    try {
      hasClients = (await page.locator("table tbody tr").count()) > 0;
    } catch {
      hasClients = false;
    }

    if (!hasClients) {
      // Create client
      const addButton = page.locator("button:has-text('Add Client')");
      await expect(addButton).toBeVisible({ timeout: 5000 });
      await addButton.click();

      await page.waitForURL("**/clients/new");
      await page.fill('input[name="name"]', "Test Client");
      await page.fill('input[name="businessName"]', "Test Biz");
      await page.click('button:has-text("Create Client")');

      await page.waitForURL("/clients");
      await page.waitForTimeout(1000);
    }

    // Step 3: Click on client
    await page.locator("table tbody tr").first().click();
    await page.waitForURL(/\/clients\/[^\/]+$/);

    // Step 4: Add service
    await expect(page.locator("text=Services").first()).toBeVisible();

    const addServiceBtn = page
      .locator("button:has-text('Add Service')")
      .first();
    await expect(addServiceBtn).toBeVisible();
    await addServiceBtn.click();

    // Wait for dialog
    await expect(page.locator("text=Select a service template")).toBeVisible();

    // Select service
    await page.locator("[role='combobox']").click();
    await page.waitForTimeout(500);

    const hasOptions = (await page.locator("[role='option']").count()) > 0;
    if (hasOptions) {
      await page.locator("[role='option']").first().click();
      await page.locator("button:has-text('Add Service')").last().click();

      // Verify service added
      await expect(page.locator("h4")).toBeVisible({ timeout: 5000 });
    }
  });
});
