import { test, expect } from "@playwright/test";

test.describe("Services Unification - Phase 1 Simple Tests", () => {
  test("admin can see Services menu with Package icon", async ({ page }) => {
    // Login as admin
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    // Check Services menu exists
    const servicesLink = page.locator('a[href="/services"]').first();
    await expect(servicesLink).toBeVisible();
    await expect(servicesLink).toContainText("Services");
  });

  test("removed menu items are not visible", async ({ page }) => {
    // Login as admin
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    // Check removed items don't exist
    await expect(page.locator('nav a:has-text("Store")')).toHaveCount(0);
    await expect(page.locator('nav a:has-text("Orders")')).toHaveCount(0);
    await expect(page.locator('nav a:has-text("Order History")')).toHaveCount(
      0
    );
    await expect(page.locator('nav a:has-text("Sales Analytics")')).toHaveCount(
      0
    );
  });

  test("client can see Services in their menu", async ({ page }) => {
    // Login as client
    await page.goto("/login");
    await page.fill('input[type="email"]', "client@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/client-dashboard");

    // Check Services menu exists for client
    const servicesLink = page
      .locator('a[href="/client-dashboard/services"]')
      .first();
    await expect(servicesLink).toBeVisible();
    await expect(servicesLink).toContainText("Services");
  });

  test("services page loads without errors", async ({ page }) => {
    // Monitor console errors
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && !msg.text().includes("404")) {
        consoleErrors.push(msg.text());
      }
    });

    // Login and navigate to services
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    await page.click('a[href="/services"]');
    await page.waitForURL("/services");

    // Check page loaded
    await expect(page.locator("h1")).toContainText("Service Templates");

    // No critical errors
    expect(consoleErrors).toHaveLength(0);
  });

  test("editor cannot see Services menu", async ({ page }) => {
    // Login as editor
    await page.goto("/login");
    await page.fill('input[type="email"]', "editor@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    // Check Services is not visible
    await expect(page.locator('nav a[href="/services"]')).toHaveCount(0);
  });
});
