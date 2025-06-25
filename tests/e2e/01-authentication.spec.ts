import { test, expect } from "@playwright/test";
import {
  loginAsRole,
  logout,
  TEST_USERS,
  type UserRole,
} from "./helpers/role-auth";
import {
  mcpTakeScreenshot,
  mcpVerifyAccessibility,
  mcpVerifyToast,
  mcpNavigateWithMonitoring,
  mcpWaitForElement,
} from "./helpers/mcp-utils";

test.describe("Authentication & Authorization", () => {
  test.beforeEach(async ({ page }) => {
    // Clear browser state
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe("Login Flow", () => {
    test("login page renders correctly", async ({ page }) => {
      // Navigate with network monitoring
      const requests = await mcpNavigateWithMonitoring(page, "/login", {
        screenshot: true,
      });

      // Check page elements
      await mcpWaitForElement(page, 'h2:has-text("Sign in to your account")');
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      await expect(page.locator('a[href="/signup"]')).toBeVisible();

      // Verify accessibility
      const isAccessible = await mcpVerifyAccessibility(page, {
        checkLabels: true,
      });
      expect(isAccessible).toBe(true);

      // Take screenshot for visual regression
      await mcpTakeScreenshot(page, {
        filename: "login-page.png",
      });
    });

    test("signup page renders correctly with role selection", async ({
      page,
    }) => {
      await page.goto("/signup");
      await page.waitForLoadState("domcontentloaded");

      // Check page elements
      await expect(
        page.locator('h2:has-text("Create your account")')
      ).toBeVisible();
      await expect(page.locator('input[name="name"]')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[role="combobox"]')).toBeVisible(); // Role select
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    const roles: UserRole[] = [
      "ADMIN",
      "SERVICE_MANAGER",
      "COPYWRITER",
      "EDITOR",
      "VA",
      "CLIENT",
    ];

    for (const role of roles) {
      test(`${role} can login and access appropriate dashboard`, async ({
        page,
      }) => {
        await loginAsRole(page, role);

        // Verify correct redirect
        if (role === "CLIENT") {
          expect(page.url()).toContain("/client-dashboard");
          await expect(
            page.locator('h1:has-text("Client Dashboard")')
          ).toBeVisible();
        } else {
          expect(page.url()).toContain("/dashboard");
          await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
        }

        // Verify user menu shows correct user
        const userMenu = page
          .locator(
            '[data-testid="user-menu"], button:has-text("' +
              TEST_USERS[role].name +
              '")'
          )
          .first();
        await expect(userMenu).toBeVisible();
      });
    }

    test("invalid credentials show error message", async ({ page }) => {
      await page.goto("/login");
      await page.fill('input[type="email"]', "invalid@example.com");
      await page.fill('input[type="password"]', "wrongpassword");
      await page.click('button[type="submit"]');

      // Should show error message using MCP verification
      await mcpVerifyToast(page, "Invalid login credentials", {
        screenshot: true,
      });
    });

    test("logout flow works correctly", async ({ page }) => {
      await loginAsRole(page, "ADMIN");
      await logout(page);

      // Should be redirected to login
      expect(page.url()).toContain("/login");

      // Try to access protected route
      await page.goto("/dashboard");
      expect(page.url()).toContain("/login");
    });
  });

  test.describe("Role-Based Access Control", () => {
    test("ADMIN has access to all routes", async ({ page }) => {
      await loginAsRole(page, "ADMIN");

      const adminRoutes = [
        "/dashboard",
        "/clients",
        "/services",
        "/requests",
        "/forms",
        "/content-tools",
        "/automations",
        "/settings",
      ];

      for (const route of adminRoutes) {
        await page.goto(route);
        await page.waitForLoadState("domcontentloaded");
        expect(page.url()).toContain(route);
      }
    });

    test("SERVICE_MANAGER cannot access settings", async ({ page }) => {
      await loginAsRole(page, "SERVICE_MANAGER");

      await page.goto("/settings");
      await page.waitForLoadState("domcontentloaded");

      // Should be redirected or show access denied
      expect(page.url()).not.toContain("/settings");
    });

    test("COPYWRITER, EDITOR, VA have limited access", async ({ page }) => {
      const limitedRoles: UserRole[] = ["COPYWRITER", "EDITOR", "VA"];

      for (const role of limitedRoles) {
        await loginAsRole(page, role);

        // Can access
        await page.goto("/dashboard");
        expect(page.url()).toContain("/dashboard");

        await page.goto("/services");
        expect(page.url()).toContain("/services");

        // Cannot access
        await page.goto("/settings");
        expect(page.url()).not.toContain("/settings");

        await page.goto("/forms");
        expect(page.url()).not.toContain("/forms");

        await logout(page);
      }
    });

    test("CLIENT can only access client-specific routes", async ({ page }) => {
      await loginAsRole(page, "CLIENT");

      // Can access client dashboard
      await page.goto("/client-dashboard");
      expect(page.url()).toContain("/client-dashboard");

      // Cannot access admin routes
      const restrictedRoutes = [
        "/clients",
        "/services",
        "/settings",
        "/content-tools",
      ];

      for (const route of restrictedRoutes) {
        await page.goto(route);
        expect(page.url()).not.toContain(route);
      }
    });
  });

  test.describe("Navigation Menu Visibility", () => {
    test("ADMIN sees all menu items", async ({ page }) => {
      await loginAsRole(page, "ADMIN");

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
        const menuLink = page.locator(`nav a:has-text("${item}")`).first();
        await expect(menuLink).toBeVisible();
      }
    });

    test("Role-specific menu items are correctly shown/hidden", async ({
      page,
    }) => {
      // Test SERVICE_MANAGER
      await loginAsRole(page, "SERVICE_MANAGER");
      await expect(
        page.locator('nav a:has-text("Settings")')
      ).not.toBeVisible();
      await expect(page.locator('nav a:has-text("Clients")')).toBeVisible();

      await logout(page);

      // Test COPYWRITER
      await loginAsRole(page, "COPYWRITER");
      await expect(
        page.locator('nav a:has-text("Settings")')
      ).not.toBeVisible();
      await expect(page.locator('nav a:has-text("Forms")')).not.toBeVisible();
      await expect(
        page.locator('nav a:has-text("Content Tools")')
      ).toBeVisible();
    });
  });

  test.describe("API Route Authentication", () => {
    test("API routes require authentication", async ({ page }) => {
      // Try to access API route without auth
      const response = await page.request.get("/api/clients");
      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    test("API routes work with valid authentication", async ({ page }) => {
      await loginAsRole(page, "ADMIN");

      // Access API route with auth
      const response = await page.request.get("/api/clients");
      expect(response.status()).toBe(200);
    });
  });
});
