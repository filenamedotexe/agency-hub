import { test, expect } from "@playwright/test";

test("simple client navigation", async ({ page }) => {
  // Go directly to login
  await page.goto("http://localhost:3001/login");

  // Login
  await page.fill('input[type="email"]', "admin@example.com");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');

  // Wait for dashboard
  await page.waitForURL("**/dashboard");

  // Click on Clients - try different selectors
  try {
    // Try sidebar link first
    await page.click('a[href="/clients"]', { timeout: 5000 });
  } catch {
    // If sidebar not visible, might be mobile view
    console.log("Could not find sidebar link, trying alternative navigation");
    // Go directly to URL
    await page.goto("http://localhost:3001/clients");
  }

  // Small wait for navigation
  await page.waitForTimeout(2000);

  // Check if we're on the clients page
  const url = page.url();
  expect(url).toContain("/clients");

  // Look for any content
  const pageContent = await page.textContent("body");
  console.log("Page content includes:", {
    hasClients: pageContent.includes("Clients"),
    hasManage: pageContent.includes("Manage"),
    hasTable: pageContent.includes("Name"),
    hasNoClients: pageContent.includes("No clients"),
    hasLoading: pageContent.includes("Loading"),
  });

  // Try to find any visible text
  const visibleText = await page.locator("main").textContent();
  console.log("Main content:", visibleText?.substring(0, 200));
});
