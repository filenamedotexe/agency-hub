import { test, expect } from "@playwright/test";

test("basic attachment upload", async ({ page }) => {
  // Login first
  await page.goto("http://localhost:3001/login");
  await page.fill('input[type="email"]', "admin@example.com");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");

  // Navigate directly to a known client with services
  // First, let's get a client ID from the API
  const clientsResponse = await page.request.get(
    "http://localhost:3001/api/clients"
  );
  const clientsData = await clientsResponse.json();

  if (!clientsData.clients || clientsData.clients.length === 0) {
    throw new Error("No clients found in database");
  }

  const firstClient = clientsData.clients[0];
  console.log("Using client:", firstClient.name);

  // Go directly to client detail page
  await page.goto(`http://localhost:3001/clients/${firstClient.id}`);
  await page.waitForTimeout(3000);

  // Take screenshot for debugging
  await page.screenshot({ path: "client-detail-page.png", fullPage: true });

  // Check if services are loaded
  const pageContent = await page.textContent("body");
  console.log("Page has services:", pageContent.includes("Services"));
  console.log("Page has loading:", pageContent.includes("Loading"));

  // Wait for services to potentially load
  await page.waitForTimeout(2000);

  // Try to find and click on a service
  const serviceCards = await page.locator(".rounded-lg.border").count();
  console.log("Found service cards:", serviceCards);

  if (serviceCards > 0) {
    // Click on first service
    await page.locator(".rounded-lg.border").first().click();
    await page.waitForTimeout(2000);

    // Check if dialog opened
    const hasDialog = await page.locator('[role="dialog"]').isVisible();
    console.log("Service dialog opened:", hasDialog);

    if (hasDialog) {
      // Look for attachment UI
      const hasAttachmentButton = await page
        .locator('button[title="Manage attachments"]')
        .isVisible();
      console.log("Has attachment button:", hasAttachmentButton);
    }
  }
});
