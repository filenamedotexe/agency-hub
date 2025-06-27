import { test, expect } from "@playwright/test";
import { loginAsRole, TEST_USERS } from "./helpers/role-auth";

test.describe("Services Unification - Phase 1 Navigation & Routing", () => {
  // Use existing test users from role-auth
  const testUsers = {
    admin: TEST_USERS.ADMIN,
    manager: TEST_USERS.SERVICE_MANAGER,
    client: TEST_USERS.CLIENT,
    editor: TEST_USERS.EDITOR,
  };

  test.describe("Navigation Menu Updates", () => {
    test("should show Services menu item with Package icon for all allowed roles", async ({
      page,
    }) => {
      // Test for each role that should see Services
      for (const [role, user] of Object.entries(testUsers)) {
        if (["admin", "manager", "client"].includes(role)) {
          // Login using role-based auth
          await loginAsRole(page, user.role);

          // Wait for navigation to load
          await page.waitForLoadState("networkidle");

          // For client role, navigation structure is different
          if (role === "client") {
            // Client has different navigation structure
            const clientServicesLink = page
              .locator('nav a[href="/client-dashboard/services"]')
              .first();
            await expect(clientServicesLink).toBeVisible();
            await expect(clientServicesLink).toContainText("Services");
          } else {
            // Admin/Manager navigation
            const viewportSize = page.viewportSize();
            const isDesktop = viewportSize && viewportSize.width >= 1024;

            if (isDesktop) {
              // Desktop: Check sidebar navigation
              const desktopServicesLink = page.locator(
                '.lg\\:fixed nav a[href="/services"]'
              );
              await expect(desktopServicesLink).toBeVisible();
              await expect(desktopServicesLink).toContainText("Services");

              // Check for Package icon
              const packageIcon = desktopServicesLink.locator("svg");
              await expect(packageIcon).toBeVisible();
            } else {
              // Mobile: Open menu first
              await page.click('[data-testid="mobile-menu-trigger"]');
              await page.waitForTimeout(300); // Wait for animation

              const mobileServicesLink = page.locator(
                '[data-testid="mobile-menu"] a[href="/services"]'
              );
              await expect(mobileServicesLink).toBeVisible();
              await expect(mobileServicesLink).toContainText("Services");

              // Close menu
              await page.click('button[aria-label="Close menu"]');
            }
          }

          // Logout for next iteration
          await page.click('button:has-text("Sign out")').first();
          await page.waitForURL("/login");
        }
      }
    });

    test("should NOT show Store, Orders, Order History, or Sales Analytics menu items", async ({
      page,
    }) => {
      // Login as admin (who would have seen all these items before)
      await loginAsRole(page, testUsers.admin.role);

      // Check that removed items are not present
      const removedItems = [
        "Store",
        "Orders",
        "Order History",
        "Sales Analytics",
      ];

      for (const item of removedItems) {
        // Check both desktop and mobile menus
        await expect(page.locator(`nav a:has-text("${item}")`)).toHaveCount(0);
      }
    });

    test("should NOT show Services menu item for Editor role", async ({
      page,
    }) => {
      // Login as editor
      await loginAsRole(page, testUsers.editor.role);

      // Check that Services is not visible
      await expect(page.locator('nav a[href="/services"]')).toHaveCount(0);
    });
  });

  test.describe("Code Error Tests", () => {
    test("should have no console errors when navigating to Services", async ({
      page,
    }) => {
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      // Login and navigate
      await loginAsRole(page, testUsers.admin.role);

      // Navigate to Services - handle both desktop and mobile
      await page.waitForLoadState("networkidle");
      const desktopLink = page.locator('.lg\\:fixed nav a[href="/services"]');
      const isDesktop = await desktopLink.isVisible();

      if (isDesktop) {
        await desktopLink.click();
      } else {
        // Mobile - open menu first
        await page.click('[data-testid="mobile-menu-trigger"]');
        await page.click('[data-testid="mobile-menu"] a[href="/services"]');
      }

      await page.waitForURL("/services");

      // Check for no console errors
      expect(consoleErrors).toHaveLength(0);
    });

    test("should handle API calls without errors", async ({ page }) => {
      // Monitor network requests
      const failedRequests: string[] = [];
      page.on("response", (response) => {
        if (response.status() >= 400) {
          failedRequests.push(`${response.status()} ${response.url()}`);
        }
      });

      // Login and navigate
      await loginAsRole(page, testUsers.admin.role);

      // Navigate to various pages
      const pages = ["/dashboard", "/services", "/settings"];
      for (const pageUrl of pages) {
        if (pageUrl === "/settings" && testUsers.admin.role !== "ADMIN")
          continue;
        await page.goto(pageUrl);
        await page.waitForLoadState("networkidle");
      }

      // No failed requests should occur
      expect(failedRequests).toHaveLength(0);
    });
  });

  test.describe("Visual Error Tests", () => {
    test("should render navigation menu without visual glitches", async ({
      page,
    }) => {
      await loginAsRole(page, testUsers.admin.role);
      await page.waitForLoadState("networkidle");

      // Get viewport size to determine if desktop or mobile
      const viewportSize = page.viewportSize();
      const isDesktop = viewportSize && viewportSize.width >= 1024;

      if (isDesktop) {
        // Check desktop navigation in sidebar
        const desktopNav = page.locator(".lg\\:fixed nav").first();
        await expect(desktopNav).toBeVisible();

        // Verify no overlapping elements in desktop nav
        const navItems = await desktopNav.locator("a").all();
        const positions = await Promise.all(
          navItems.map(async (item) => {
            const box = await item.boundingBox();
            return box;
          })
        );

        // Check that nav items don't overlap
        for (let i = 0; i < positions.length; i++) {
          for (let j = i + 1; j < positions.length; j++) {
            const box1 = positions[i];
            const box2 = positions[j];
            if (box1 && box2) {
              const overlaps = !(
                box1.x + box1.width <= box2.x ||
                box2.x + box2.width <= box1.x ||
                box1.y + box1.height <= box2.y ||
                box2.y + box2.height <= box1.y
              );
              expect(overlaps).toBe(false);
            }
          }
        }
      } else {
        // For mobile, check that menu trigger is visible
        const mobileMenuTrigger = page.locator(
          '[data-testid="mobile-menu-trigger"]'
        );
        await expect(mobileMenuTrigger).toBeVisible();

        // Check bottom navigation
        const bottomNav = page.locator("nav").last();
        await expect(bottomNav).toBeVisible();
      }
    });

    test("should maintain responsive design across breakpoints", async ({
      page,
    }) => {
      await loginAsRole(page, testUsers.admin.role);

      // Test different viewport sizes
      const viewports = [
        { width: 1920, height: 1080, name: "desktop" },
        { width: 768, height: 1024, name: "tablet" },
        { width: 375, height: 667, name: "mobile" },
      ];

      for (const viewport of viewports) {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });
        await page.waitForTimeout(300); // Allow layout to settle

        if (viewport.name === "desktop") {
          // Desktop should show sidebar
          await expect(page.locator(".lg\\:fixed.lg\\:w-64")).toBeVisible();
          await expect(
            page.locator('[data-testid="mobile-menu-trigger"]')
          ).not.toBeVisible();
        } else {
          // Mobile/tablet should show hamburger menu
          await expect(
            page.locator('[data-testid="mobile-menu-trigger"]')
          ).toBeVisible();
          await expect(page.locator(".lg\\:fixed.lg\\:w-64")).not.toBeVisible();
        }

        // Take screenshot for visual verification
        await page.screenshot({
          path: `tests/screenshots/phase1-nav-${viewport.name}.png`,
          fullPage: true,
        });
      }
    });
  });

  test.describe("Routing Tests", () => {
    test("should have Services route accessible", async ({ page }) => {
      await loginAsRole(page, testUsers.admin.role);

      // Navigate to Services
      await page.goto("/services");
      await expect(page).toHaveURL("/services");

      // Page should load without errors
      await expect(page.locator("main")).toBeVisible();
    });

    test("should render services layout", async ({ page }) => {
      await loginAsRole(page, testUsers.admin.role);

      // Navigate to Services
      await page.goto("/services");

      // Services page should be wrapped in the layout
      await expect(page.locator("main")).toBeVisible();
    });
  });

  test.describe("Performance Tests", () => {
    test("should load navigation quickly", async ({ page }) => {
      await loginAsRole(page, testUsers.admin.role);

      // Measure navigation render time
      const startTime = Date.now();

      // Check for the appropriate navigation based on viewport
      const viewportSize = page.viewportSize();
      const isDesktop = viewportSize && viewportSize.width >= 1024;

      if (isDesktop) {
        await page.waitForSelector('.lg\\:fixed nav a[href="/services"]', {
          state: "visible",
          timeout: 5000,
        });
      } else {
        // On mobile, navigation is in the hamburger menu or bottom nav
        await page.waitForSelector('[data-testid="mobile-menu-trigger"]', {
          state: "visible",
          timeout: 5000,
        });
      }

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      // Navigation should render within 2000ms (accounting for auth and page load)
      expect(loadTime).toBeLessThan(2000);
    });
  });

  test.describe("Accessibility Tests", () => {
    test("should have proper ARIA labels and keyboard navigation", async ({
      page,
    }) => {
      await loginAsRole(page, testUsers.admin.role);

      // Check mobile menu trigger
      const mobileMenuTrigger = page.locator(
        '[data-testid="mobile-menu-trigger"]'
      );
      if (await mobileMenuTrigger.isVisible()) {
        await expect(mobileMenuTrigger).toHaveAttribute(
          "aria-label",
          "Toggle navigation"
        );
      }

      // Check navigation landmark - nav element is present
      await expect(page.locator("nav").first()).toBeVisible();

      // Test keyboard navigation
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");

      // Should be able to navigate with keyboard
      const activeElement = await page.evaluate(
        () => document.activeElement?.tagName
      );
      expect(["A", "BUTTON"]).toContain(activeElement);
    });
  });
});
