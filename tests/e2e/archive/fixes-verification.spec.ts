import { test, expect } from "@playwright/test";

test.describe("Phase 1 & 2 Fixes Verification", () => {
  test("All UI fixes are applied correctly", async ({ page }) => {
    // Test 1: Login page uses h2 for title
    await page.goto("/login");
    const loginTitle = page
      .locator("h2")
      .filter({ hasText: "Sign in to your account" });
    await expect(loginTitle).toBeVisible();

    // Test 2: Signup page has select trigger for role
    await page.goto("/signup");
    const signupTitle = page
      .locator("h2")
      .filter({ hasText: "Create your account" });
    await expect(signupTitle).toBeVisible();
    const selectTrigger = page.locator('button[role="combobox"]');
    await expect(selectTrigger).toBeVisible();

    // Test 3: Login and verify dashboard
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    // Test 4: Mobile navigation has correct aria-label
    await page.setViewportSize({ width: 375, height: 667 });
    const mobileToggle = page.locator('button[aria-label="Toggle navigation"]');
    await expect(mobileToggle).toBeVisible();

    // Test 5: Navigate to clients and check search placeholder
    await page.setViewportSize({ width: 1280, height: 720 });
    // Use the visible link in desktop sidebar
    await page.locator('.lg\\:flex a[href="/clients"]').click();
    await page.waitForURL("/clients");
    const searchInput = page.locator('input[placeholder="Search"]');
    await expect(searchInput).toBeVisible();
  });

  test("Client role sees correct dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "client@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/client-dashboard");

    // Check for correct title
    const clientDashboardTitle = page
      .locator("h1")
      .filter({ hasText: "Client Dashboard" });
    await expect(clientDashboardTitle).toBeVisible();
  });

  test("Create client flow works correctly", async ({ page }) => {
    // Login as admin
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    // Navigate to clients
    await page.locator('.lg\\:flex a[href="/clients"]').click();
    await page.waitForURL("/clients");

    // Click new client
    await page.click('a[href="/clients/new"]');
    await page.waitForURL("/clients/new");

    // Fill form
    const timestamp = Date.now();
    await page.fill('input[name="name"]', `Test Client ${timestamp}`);
    await page.fill('input[name="businessName"]', `Test Business ${timestamp}`);
    await page.fill('textarea[name="address"]', "123 Test Street");
    await page.fill('input[name="dudaSiteId"]', `test_site_${timestamp}`);

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect to clients list
    await page.waitForURL("/clients");

    // Check success toast
    await expect(page.getByText("Client created successfully")).toBeVisible();

    // Check client appears in list
    await expect(page.getByText(`Test Client ${timestamp}`)).toBeVisible();
  });

  test("All navigation links are visible for admin", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    // Check all menu items
    const menuItems = [
      "Dashboard",
      "Clients",
      "Services",
      "Requests",
      "Forms",
      "Content Tools",
      "Automations",
      "Settings",
    ];

    for (const item of menuItems) {
      // Check in desktop sidebar navigation
      const link = page.locator(".lg\\:flex nav a").filter({ hasText: item });
      await expect(link).toBeVisible();
    }
  });
});
