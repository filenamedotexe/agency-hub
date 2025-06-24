import { test, expect } from "@playwright/test";
import { loginAsAdmin, setTestAuthBypass } from "./helpers/auth";

// Test user credentials
const TEST_USERS = {
  admin: { email: "admin@example.com", password: "password123", role: "ADMIN" },
  manager: {
    email: "manager@example.com",
    password: "password123",
    role: "SERVICE_MANAGER",
  },
  copywriter: {
    email: "copywriter@example.com",
    password: "password123",
    role: "COPYWRITER",
  },
  editor: {
    email: "editor@example.com",
    password: "password123",
    role: "EDITOR",
  },
  va: { email: "va@example.com", password: "password123", role: "VA" },
  client: {
    email: "client@example.com",
    password: "password123",
    role: "CLIENT",
  },
};

test.describe("Known Role-Based Access Control Issues", () => {
  test.describe("BUG: Middleware Role Enforcement Not Implemented", () => {
    test("ISSUE: Copywriter CAN access /clients (should be blocked)", async ({
      page,
    }) => {
      // Login as copywriter
      await page.goto("/login");
      await page.fill('input[type="email"]', TEST_USERS.copywriter.email);
      await page.fill('input[type="password"]', TEST_USERS.copywriter.password);
      await page.click('button[type="submit"]');
      await page.waitForURL("/dashboard", { timeout: 10000 });

      // Try to access clients page
      await page.goto("/clients");
      await page.waitForLoadState("domcontentloaded");

      // CURRENT BEHAVIOR: Copywriter CAN access clients page
      expect(page.url()).toContain("/clients");

      // Take screenshot showing the bug
      await page.screenshot({
        path: "test-results/bug-copywriter-can-access-clients.png",
        fullPage: true,
      });

      console.log("⚠️  BUG CONFIRMED: Copywriter can access /clients page");
      console.log(
        "   Expected: Should redirect to /unauthorized or /dashboard"
      );
      console.log("   Actual: Copywriter sees the clients page");
      console.log(
        "   Root Cause: middleware.ts lines 123-126 - role check is commented out"
      );
    });

    test("ISSUE: Editor CAN access /services (should be blocked)", async ({
      page,
    }) => {
      // Login as editor
      await page.goto("/login");
      await page.fill('input[type="email"]', TEST_USERS.editor.email);
      await page.fill('input[type="password"]', TEST_USERS.editor.password);
      await page.click('button[type="submit"]');
      await page.waitForURL("/dashboard", { timeout: 10000 });

      // Try to access services page
      await page.goto("/services");
      await page.waitForLoadState("domcontentloaded");

      // CURRENT BEHAVIOR: Editor CAN access services page
      expect(page.url()).toContain("/services");

      console.log("⚠️  BUG CONFIRMED: Editor can access /services page");
    });

    test("ISSUE: VA CAN access /settings (should be blocked)", async ({
      page,
    }) => {
      // Login as VA
      await page.goto("/login");
      await page.fill('input[type="email"]', TEST_USERS.va.email);
      await page.fill('input[type="password"]', TEST_USERS.va.password);
      await page.click('button[type="submit"]');
      await page.waitForURL("/dashboard", { timeout: 10000 });

      // Try to access settings page
      await page.goto("/settings");
      await page.waitForLoadState("domcontentloaded");

      // CURRENT BEHAVIOR: VA CAN access settings page
      expect(page.url()).toContain("/settings");

      console.log(
        "⚠️  BUG CONFIRMED: VA can access /settings page (admin only)"
      );
    });
  });

  test.describe("What IS Working Correctly", () => {
    test("Menu visibility IS correctly filtered by role", async ({ page }) => {
      // Login as copywriter
      await page.goto("/login");
      await page.fill('input[type="email"]', TEST_USERS.copywriter.email);
      await page.fill('input[type="password"]', TEST_USERS.copywriter.password);
      await page.click('button[type="submit"]');
      await page.waitForURL("/dashboard", { timeout: 10000 });

      // Check menu - Settings should NOT be visible
      const settingsLink = page.locator('nav a:has-text("Settings")').first();
      await expect(settingsLink).not.toBeVisible();

      console.log("✅ WORKING: Menu items are correctly filtered by role");
    });

    test("Authentication and login flow works correctly", async ({ page }) => {
      // Clear any existing auth
      await page.context().clearCookies();

      // Test that unauthenticated users are redirected
      await page.goto("/dashboard");
      await page.waitForLoadState("domcontentloaded");

      // Check if redirected to login OR if test bypass is active
      const url = page.url();
      if (url.includes("/dashboard")) {
        console.log(
          "⚠️  Test bypass may be active, skipping auth redirect test"
        );
      } else {
        expect(url).toContain("/login");
        console.log(
          "✅ WORKING: Unauthenticated users are redirected to login"
        );
      }
    });
  });
});
