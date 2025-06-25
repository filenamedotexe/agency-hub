import { test, expect, type BrowserContext, type Page } from "@playwright/test";

// CRITICAL: Always verify server responds before any test
test.beforeAll(async () => {
  const response = await fetch("http://localhost:3001");
  if (!response.ok) throw new Error("Server not responding on port 3001");
});

test.describe("Service Assignment - FIXED", () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    // Create a new context that will maintain auth state
    context = await browser.newContext();
    page = await context.newPage();

    // Login once and maintain the session
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Fill and submit login form
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for successful login
    await page.waitForURL("/dashboard", { timeout: 15000 });
    await page.waitForLoadState("networkidle");
  });

  test.afterAll(async () => {
    await context.close();
  });

  test("Can navigate to clients page after login", async () => {
    await page.goto("/clients");
    await page.waitForLoadState("networkidle");

    // Debug: log the page content
    const bodyText = await page.textContent("body");
    console.log("Page body text:", bodyText?.substring(0, 200));

    // Wait for the page to fully render
    await page.waitForSelector("h1", { state: "visible", timeout: 10000 });

    // Check the page title
    const title = await page.textContent("h1");
    expect(title).toContain("Clients");

    // Check for table or empty state
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

    // At least one should be visible
    expect(hasTable || hasEmptyState).toBeTruthy();
    expect(hasAddButton).toBeTruthy();
  });

  test("Can navigate to services page", async () => {
    await page.goto("/services");
    await page.waitForLoadState("networkidle");

    // Wait for the page to render
    await page.waitForSelector("h1", { state: "visible", timeout: 10000 });

    const title = await page.textContent("h1");
    expect(title).toContain("Service");

    // Check if we can see the page content
    const hasContent =
      (await page.locator("text=Service Templates").isVisible()) ||
      (await page.locator("text=No service templates").isVisible());
    expect(hasContent).toBeTruthy();
  });

  test("Can see client detail page with services section", async () => {
    // First ensure we're on clients page
    await page.goto("/clients");
    await page.waitForLoadState("networkidle");

    // Wait for table to load
    await page.waitForSelector("table", { state: "visible", timeout: 10000 });

    // Check if there are any clients
    const clientRows = await page.locator("table tbody tr").count();
    console.log("Number of client rows:", clientRows);

    if (clientRows > 0) {
      // Click on first client
      await page.locator("table tbody tr").first().click();

      // Wait for navigation to client detail page
      await page.waitForURL(/\/clients\/[^\/]+$/, { timeout: 10000 });
      await page.waitForLoadState("networkidle");

      // Check for services section
      await page.waitForSelector("text=Services", {
        state: "visible",
        timeout: 10000,
      });

      // Should see the services section
      const servicesSection = await page.locator("text=Services").isVisible();
      expect(servicesSection).toBeTruthy();

      // Should see add service button
      const addServiceButton = await page
        .locator("button:has-text('Add Service')")
        .isVisible();
      expect(addServiceButton).toBeTruthy();
    } else {
      console.log("No clients found, skipping client detail test");
    }
  });
});
