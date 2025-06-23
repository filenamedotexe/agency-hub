import { test, expect } from "@playwright/test";

test.describe("Auth Debug", () => {
  test("Can access login page", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle" });

    // Check if we're on login page
    await expect(page).toHaveURL("/login");

    // Check for form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("Can login with valid credentials", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle" });

    // Fill login form
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation - use a more flexible approach
    await page.waitForFunction(() => window.location.pathname !== "/login", {
      timeout: 10000,
    });

    // Should redirect to dashboard
    await expect(page).toHaveURL("/dashboard");
  });

  test("Can access dashboard after login", async ({ page }) => {
    // First login
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForFunction(
      () => window.location.pathname === "/dashboard",
      { timeout: 10000 }
    );

    // Now navigate to clients
    await page.goto("/clients");
    await page.waitForLoadState("networkidle");

    // Check if page loaded
    const title = await page.textContent("h1");
    console.log("Page title:", title);

    // Take screenshot for debugging
    await page.screenshot({ path: "clients-page-debug.png", fullPage: true });

    // Should see clients page
    await expect(page.locator("h1")).toContainText("Clients");
  });
});
