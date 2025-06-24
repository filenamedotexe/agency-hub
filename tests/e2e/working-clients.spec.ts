import { test, expect } from "@playwright/test";

test.describe("Working Client Tests", () => {
  test("Create client - staying in same context", async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL("/dashboard", { timeout: 15000 });

    // CRITICAL: Click on navigation link instead of using goto()
    // This preserves the auth context
    await page.click('a[href="/clients"]');

    // Wait for navigation
    await page.waitForURL("/clients");
    await page.waitForLoadState("networkidle");

    // Now click on "Add Client" button
    await page.click("text=Add Client");

    // Wait for form
    await page.waitForURL("/clients/new");
    await page.waitForSelector('input[placeholder="John Doe"]', {
      timeout: 5000,
    });

    // Fill form
    await page.fill('input[placeholder="John Doe"]', "Test Client");
    await page.fill('input[placeholder="Acme Corporation"]', "Test Business");

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect back to clients
    await page.waitForURL("/clients", { timeout: 10000 });
    expect(page.url()).toContain("/clients");
  });
});
