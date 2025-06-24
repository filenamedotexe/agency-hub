import { test, expect } from "@playwright/test";

test.describe("Basic Functionality Tests", () => {
  test("Can login as admin", async ({ page }) => {
    await page.goto("/login");

    // Check login page elements
    await expect(
      page.locator('h2:has-text("Sign in to your account")')
    ).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();

    // Login
    await page.fill('input[name="email"]', "admin@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]:has-text("Sign in")');

    // Wait for navigation
    await page.waitForURL("/dashboard");

    // Verify we're on dashboard
    await expect(page).toHaveURL("/dashboard");
  });

  test("Can view clients list", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    // Go directly to clients URL
    await page.goto("/clients");

    // Check we're on clients page
    await expect(page).toHaveURL("/clients");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check for search input
    await expect(page.locator('input[placeholder="Search"]')).toBeVisible();

    // Check for at least one client in the table
    const rows = await page.locator("table tbody tr").count();
    expect(rows).toBeGreaterThanOrEqual(1);
  });

  test("Can access signup page", async ({ page }) => {
    await page.goto("/signup");

    // Check signup page elements
    await expect(
      page.locator('h2:has-text("Create your account")')
    ).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();

    // Check role selector exists (custom select component)
    await expect(page.locator('button[role="combobox"]')).toBeVisible();
  });

  test("Protected routes redirect to login", async ({ page }) => {
    // Try to access dashboard without login
    await page.goto("/dashboard");

    // Should redirect to login
    await expect(page).toHaveURL("/login");
  });

  test("Client role redirects to client dashboard", async ({ page }) => {
    await page.goto("/login");

    // Login as client
    await page.fill('input[name="email"]', "client@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Should redirect to client dashboard
    await page.waitForURL("/client-dashboard");

    // Check title
    await expect(page.locator('h1:has-text("Client Dashboard")')).toBeVisible();
  });
});
