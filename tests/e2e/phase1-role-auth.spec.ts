import { test, expect } from "@playwright/test";
import {
  loginAsRole,
  navigateWithRole,
  roleCanAccess,
  verifyRoleUI,
  logout,
  TEST_USERS,
  type UserRole,
} from "./helpers/role-auth";

test.describe("Phase 1: Role-Based Authentication", () => {
  test.beforeEach(async ({ page }) => {
    // Verify server is running
    const response = await fetch("http://localhost:3001");
    if (!response.ok) throw new Error("Server not responding on port 3001");
  });

  test.describe("Authentication Flow for Each Role", () => {
    const roles: UserRole[] = [
      "ADMIN",
      "SERVICE_MANAGER",
      "COPYWRITER",
      "EDITOR",
      "VA",
      "CLIENT",
    ];

    for (const role of roles) {
      test(`${role} can login successfully`, async ({ page }) => {
        console.log(`\n🧪 Testing login for role: ${role}`);

        // Login as the role
        await loginAsRole(page, role);

        // Verify we're on dashboard
        expect(page.url()).toContain("/dashboard");

        // Verify user info is displayed
        const userInfo = TEST_USERS[role];
        await expect(
          page.locator(`text="${userInfo.name}"`).first()
        ).toBeVisible({ timeout: 10000 });

        // Take screenshot for debugging
        await page.screenshot({
          path: `test-results/login-${role.toLowerCase()}.png`,
          fullPage: true,
        });
      });
    }
  });

  test.describe("Role-Based Menu Visibility", () => {
    test("ADMIN sees all menu items", async ({ page }) => {
      await loginAsRole(page, "ADMIN");
      await verifyRoleUI(page, "ADMIN");

      // Verify admin-specific items
      await expect(page.locator('nav >> text="Settings"')).toBeVisible();
      await expect(page.locator('nav >> text="Automations"')).toBeVisible();
    });

    test("SERVICE_MANAGER cannot see Settings", async ({ page }) => {
      await loginAsRole(page, "SERVICE_MANAGER");
      await verifyRoleUI(page, "SERVICE_MANAGER");

      // Verify Settings is NOT visible
      await expect(page.locator('nav >> text="Settings"')).not.toBeVisible();
    });

    test("COPYWRITER sees limited menu", async ({ page }) => {
      await loginAsRole(page, "COPYWRITER");
      await verifyRoleUI(page, "COPYWRITER");

      // Should NOT see Clients, Requests, Forms
      await expect(page.locator('nav >> text="Clients"')).not.toBeVisible();
      await expect(page.locator('nav >> text="Requests"')).not.toBeVisible();
      await expect(page.locator('nav >> text="Forms"')).not.toBeVisible();
    });

    test("CLIENT sees client-specific menu", async ({ page }) => {
      await loginAsRole(page, "CLIENT");
      await verifyRoleUI(page, "CLIENT");

      // Should see My Services instead of Services
      await expect(page.locator('nav >> text="My Services"')).toBeVisible();

      // Should NOT see admin features
      await expect(page.locator('nav >> text="Clients"')).not.toBeVisible();
      await expect(page.locator('nav >> text="Settings"')).not.toBeVisible();
    });
  });

  test.describe("Page Access Control", () => {
    test("ADMIN can access all pages", async ({ page }) => {
      await loginAsRole(page, "ADMIN");

      const adminPages = [
        "/dashboard",
        "/clients",
        "/services",
        "/requests",
        "/forms",
        "/settings",
      ];

      for (const path of adminPages) {
        await navigateWithRole(page, path, true);
        expect(page.url()).toContain(path);
      }
    });

    test("SERVICE_MANAGER cannot access Settings", async ({ page }) => {
      await loginAsRole(page, "SERVICE_MANAGER");

      // Should access most pages
      await navigateWithRole(page, "/clients", true);
      await navigateWithRole(page, "/services", true);

      // Should NOT access settings
      await page.goto("/settings");
      await page.waitForLoadState("domcontentloaded");

      // Should be redirected or show unauthorized
      const url = page.url();
      expect(url).toMatch(/\/(unauthorized|dashboard|login)/);
    });

    test("COPYWRITER has restricted access", async ({ page }) => {
      await loginAsRole(page, "COPYWRITER");

      // Can access
      await navigateWithRole(page, "/services", true);

      // Cannot access
      await page.goto("/clients");
      await page.waitForLoadState("domcontentloaded");

      const url = page.url();
      expect(url).toMatch(/\/(unauthorized|dashboard|login)/);
    });

    test("CLIENT cannot access admin pages", async ({ page }) => {
      await loginAsRole(page, "CLIENT");

      const restrictedPages = ["/clients", "/services", "/settings"];

      for (const path of restrictedPages) {
        await page.goto(path);
        await page.waitForLoadState("domcontentloaded");

        const url = page.url();
        expect(url).toMatch(/\/(unauthorized|dashboard|login|my-services)/);
      }
    });
  });

  test.describe("Logout Functionality", () => {
    test("Users can logout successfully", async ({ page }) => {
      // Login first
      await loginAsRole(page, "ADMIN");
      expect(page.url()).toContain("/dashboard");

      // Logout
      await logout(page);

      // Verify redirected to login
      expect(page.url()).toContain("/login");

      // Verify cannot access protected pages
      await page.goto("/dashboard");
      await page.waitForLoadState("domcontentloaded");
      expect(page.url()).toContain("/login");
    });
  });

  test.describe("Permission Checks", () => {
    test("Verify permission helper functions", async () => {
      // Admin has all permissions
      expect(roleCanAccess("ADMIN", "clients_create")).toBe(true);
      expect(roleCanAccess("ADMIN", "settings_view")).toBe(true);

      // Service Manager limitations
      expect(roleCanAccess("SERVICE_MANAGER", "clients_create")).toBe(true);
      expect(roleCanAccess("SERVICE_MANAGER", "settings_view")).toBe(false);

      // Copywriter limitations
      expect(roleCanAccess("COPYWRITER", "clients_view")).toBe(true);
      expect(roleCanAccess("COPYWRITER", "clients_create")).toBe(false);
      expect(roleCanAccess("COPYWRITER", "tasks_view_assigned")).toBe(true);

      // Client limitations
      expect(roleCanAccess("CLIENT", "client_dashboard")).toBe(true);
      expect(roleCanAccess("CLIENT", "clients_view")).toBe(false);
      expect(roleCanAccess("CLIENT", "forms_respond")).toBe(true);
    });
  });

  test.describe("Session Management", () => {
    test("Session persists across page navigations", async ({ page }) => {
      await loginAsRole(page, "ADMIN");

      // Navigate to multiple pages
      await navigateWithRole(page, "/clients", true);
      await navigateWithRole(page, "/services", true);
      await navigateWithRole(page, "/dashboard", true);

      // User should still be logged in
      await expect(page.locator('text="Admin User"').first()).toBeVisible();
    });

    test("Invalid credentials show error", async ({ page }) => {
      await page.goto("/login");
      await page.waitForLoadState("domcontentloaded");

      // Try invalid login
      await page.fill('input[type="email"]', "invalid@example.com");
      await page.fill('input[type="password"]', "wrongpassword");
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(
        page.locator('text="Invalid email or password"')
      ).toBeVisible({ timeout: 5000 });

      // Should remain on login page
      expect(page.url()).toContain("/login");
    });
  });
});
