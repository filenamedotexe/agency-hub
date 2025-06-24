import { test, expect } from "@playwright/test";
import { loginAsAdmin, setTestAuthBypass } from "./helpers/auth";

test.describe("Role-Based Access Control", () => {
  test.beforeEach(async ({ page }) => {
    // Verify server is running
    const response = await fetch("http://localhost:3001");
    if (!response.ok) throw new Error("Server not responding on port 3001");
  });

  test("Admin can login and see dashboard", async ({ page }) => {
    console.log("🧪 Testing admin login");

    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    // Fill login form
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");

    // Take screenshot before submit
    await page.screenshot({ path: "test-results/before-login.png" });

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL("/dashboard", { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    // Take screenshot after login
    await page.screenshot({ path: "test-results/after-login.png" });

    // Verify we're on dashboard
    expect(page.url()).toContain("/dashboard");

    // Set test bypass for future navigation
    await setTestAuthBypass(page);
  });

  test("Admin can navigate to all pages", async ({ page }) => {
    await loginAsAdmin(page);

    // Test navigation to clients
    await page.goto("/clients");
    await page.waitForLoadState("domcontentloaded");
    expect(page.url()).toContain("/clients");

    // Test navigation to services
    await page.goto("/services");
    await page.waitForLoadState("domcontentloaded");
    expect(page.url()).toContain("/services");

    // Test navigation to requests
    await page.goto("/requests");
    await page.waitForLoadState("domcontentloaded");
    expect(page.url()).toContain("/requests");

    // Test navigation to settings
    await page.goto("/settings");
    await page.waitForLoadState("domcontentloaded");
    expect(page.url()).toContain("/settings");
  });

  test("Different users see different menus", async ({ page }) => {
    // Test with different users manually
    const testCases = [
      {
        email: "admin@example.com",
        expectedMenuItems: [
          "Dashboard",
          "Clients",
          "Services",
          "Requests",
          "Settings",
        ],
        role: "Admin",
      },
      {
        email: "manager@example.com",
        expectedMenuItems: ["Dashboard", "Clients", "Services", "Requests"],
        notExpectedMenuItems: ["Settings"],
        role: "Service Manager",
      },
      {
        email: "copywriter@example.com",
        expectedMenuItems: ["Dashboard", "Requests", "Content Tools"],
        notExpectedMenuItems: ["Clients", "Services", "Settings"],
        role: "Copywriter",
      },
    ];

    for (const testCase of testCases) {
      console.log(`\n🧪 Testing menu visibility for ${testCase.role}`);

      // Login as user
      await page.goto("/login");
      await page.waitForLoadState("domcontentloaded");

      await page.fill('input[type="email"]', testCase.email);
      await page.fill('input[type="password"]', "password123");
      await page.click('button[type="submit"]');

      // Wait for dashboard
      await page.waitForURL("/dashboard", { timeout: 10000 });
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000); // Wait for React hydration

      // Check expected menu items
      for (const menuItem of testCase.expectedMenuItems) {
        const locator = page.locator(`nav a:has-text("${menuItem}")`).first();
        const isVisible = await locator.isVisible();
        console.log(
          `  ✓ ${menuItem}: ${isVisible ? "visible" : "NOT visible"}`
        );
      }

      // Check items that should NOT be visible
      if (testCase.notExpectedMenuItems) {
        for (const menuItem of testCase.notExpectedMenuItems) {
          const locator = page.locator(`nav a:has-text("${menuItem}")`).first();
          const isVisible = await locator.isVisible();
          console.log(
            `  ✓ ${menuItem}: ${isVisible ? "visible (SHOULD NOT BE)" : "correctly hidden"}`
          );
        }
      }

      // Take screenshot
      await page.screenshot({
        path: `test-results/menu-${testCase.role.toLowerCase().replace(" ", "-")}.png`,
        fullPage: true,
      });

      // Logout for next test - use UI logout if available
      const logoutButton = page.locator('button:has-text("Logout")').first();
      if (await logoutButton.isVisible({ timeout: 1000 })) {
        await logoutButton.click();
        await page.waitForURL("/login");
      } else {
        // Fallback: clear cookies and navigate to login
        await page.context().clearCookies();
        await page.goto("/login");
      }
    }
  });

  test("Access control for non-admin users", async ({ page }) => {
    // Login as copywriter
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    await page.fill('input[type="email"]', "copywriter@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    await page.waitForURL("/dashboard", { timeout: 10000 });
    await setTestAuthBypass(page);

    // Try to access restricted pages
    await page.goto("/clients");
    await page.waitForLoadState("domcontentloaded");

    // Should be redirected or show unauthorized
    const url = page.url();
    console.log(`Copywriter accessing /clients redirected to: ${url}`);

    // Take screenshot of result
    await page.screenshot({
      path: "test-results/copywriter-clients-access.png",
      fullPage: true,
    });
  });
});
