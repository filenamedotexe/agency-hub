import { test, expect } from "@playwright/test";
import { loginAsRole } from "./helpers/role-auth";
import { mcpTakeScreenshot, mcpVerifyAccessibility } from "./helpers/mcp-utils";

/**
 * Visual Regression Tests using Playwright MCP
 * These tests capture screenshots for visual comparison and ensure UI consistency
 */

test.describe("Visual Regression Testing", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.describe("Key Pages Visual Testing", () => {
    test("dashboard visual snapshot", async ({ page }) => {
      await loginAsRole(page, "ADMIN");
      await page.waitForLoadState("networkidle");

      // Take full page screenshot
      await mcpTakeScreenshot(page, {
        filename: "dashboard-full.png",
      });

      // Take specific component screenshots
      await mcpTakeScreenshot(page, {
        element: "Dashboard stats cards",
        ref: '[data-testid="stats-cards"], .grid:has(.card)',
        filename: "dashboard-stats.png",
      });
    });

    test("client list visual snapshot", async ({ page }) => {
      await loginAsRole(page, "ADMIN");
      await page.goto("/clients");
      await page.waitForLoadState("networkidle");

      await mcpTakeScreenshot(page, {
        filename: "clients-list.png",
      });
    });

    test("form builder visual snapshot", async ({ page }) => {
      await loginAsRole(page, "ADMIN");
      await page.goto("/forms");
      await page.waitForLoadState("networkidle");

      // Open form builder
      await page.click('button:has-text("Create Form")');
      await page.waitForTimeout(1000); // Wait for modal animation

      await mcpTakeScreenshot(page, {
        element: "Form builder modal",
        ref: '[role="dialog"]',
        filename: "form-builder.png",
      });
    });

    test("content tools visual snapshot", async ({ page }) => {
      await loginAsRole(page, "ADMIN");
      await page.goto("/content-tools");
      await page.waitForLoadState("networkidle");

      await mcpTakeScreenshot(page, {
        filename: "content-tools-grid.png",
      });

      // Open a content tool
      await page.click(".grid .card:first-child");
      await page.waitForTimeout(1000);

      await mcpTakeScreenshot(page, {
        filename: "content-tool-detail.png",
      });
    });
  });

  test.describe("Responsive Design Testing", () => {
    const viewports = [
      { name: "mobile", width: 375, height: 667 },
      { name: "tablet", width: 768, height: 1024 },
      { name: "desktop", width: 1920, height: 1080 },
    ];

    for (const viewport of viewports) {
      test(`dashboard renders correctly on ${viewport.name}`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await loginAsRole(page, "ADMIN");
        await page.waitForLoadState("networkidle");

        await mcpTakeScreenshot(page, {
          filename: `dashboard-${viewport.name}.png`,
        });

        // Verify mobile menu if applicable
        if (viewport.name === "mobile") {
          // Check for hamburger menu
          const mobileMenu = page.locator(
            '[data-testid="mobile-menu"], button[aria-label*="menu"]'
          );
          if (await mobileMenu.isVisible()) {
            await mobileMenu.click();
            await page.waitForTimeout(300); // Wait for menu animation

            await mcpTakeScreenshot(page, {
              element: "Mobile navigation menu",
              ref: 'nav, [role="navigation"]',
              filename: "mobile-navigation.png",
            });
          }
        }
      });
    }
  });

  test.describe("Theme and Styling Testing", () => {
    test("light/dark theme visual comparison", async ({ page }) => {
      await loginAsRole(page, "ADMIN");

      // Light theme screenshot
      await mcpTakeScreenshot(page, {
        filename: "theme-light.png",
      });

      // Toggle to dark theme if available
      const themeToggle = page.locator(
        '[data-testid="theme-toggle"], button[aria-label*="theme"]'
      );
      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        await page.waitForTimeout(300); // Wait for theme transition

        await mcpTakeScreenshot(page, {
          filename: "theme-dark.png",
        });
      }
    });

    test("component states visual testing", async ({ page }) => {
      await loginAsRole(page, "ADMIN");
      await page.goto("/clients");

      // Hover state
      const firstRow = page.locator(
        "table tbody tr:first-child, .list-item:first-child"
      );
      if (await firstRow.isVisible()) {
        await firstRow.hover();
        await mcpTakeScreenshot(page, {
          element: "Table row hover state",
          ref: "table tbody tr:first-child, .list-item:first-child",
          filename: "hover-state.png",
        });
      }

      // Focus state
      const firstInput = page.locator('input[type="text"]:visible').first();
      if (await firstInput.isVisible()) {
        await firstInput.focus();
        await mcpTakeScreenshot(page, {
          element: "Input focus state",
          ref: 'input[type="text"]:visible',
          filename: "focus-state.png",
        });
      }
    });
  });

  test.describe("Error States Visual Testing", () => {
    test("form validation error states", async ({ page }) => {
      await loginAsRole(page, "ADMIN");
      await page.goto("/clients");
      await page.click(
        'button:has-text("Add Client"), button:has-text("New Client")'
      );

      // Submit empty form to trigger validation
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500); // Wait for validation messages

      await mcpTakeScreenshot(page, {
        element: "Form with validation errors",
        ref: 'form, [role="dialog"]',
        filename: "form-validation-errors.png",
      });
    });

    test("empty state visual testing", async ({ page }) => {
      await loginAsRole(page, "ADMIN");

      // Navigate to a page that might have empty state
      await page.goto("/requests");
      await page.waitForLoadState("networkidle");

      // Check if empty state is visible
      const emptyState = page.locator(
        '[data-testid="empty-state"], .empty-state, :has-text("No requests")'
      );
      if (await emptyState.isVisible()) {
        await mcpTakeScreenshot(page, {
          element: "Empty state",
          ref: '[data-testid="empty-state"], .empty-state',
          filename: "empty-state.png",
        });
      }
    });
  });

  test.describe("Loading States Visual Testing", () => {
    test("capture loading states", async ({ page }) => {
      // Slow down network to capture loading states
      await page.route("**/*", (route) => {
        setTimeout(() => route.continue(), 100);
      });

      await loginAsRole(page, "ADMIN");

      // Navigate to data-heavy page
      page.goto("/clients"); // Don't await to capture loading

      // Wait a bit to capture loading state
      await page.waitForTimeout(200);

      await mcpTakeScreenshot(page, {
        filename: "loading-state.png",
      });

      // Wait for content to load
      await page.waitForLoadState("networkidle");
    });
  });
});

test.describe("Accessibility Visual Testing", () => {
  test("high contrast mode testing", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await loginAsRole(page, "ADMIN");

    await mcpTakeScreenshot(page, {
      filename: "high-contrast-dashboard.png",
    });

    // Verify accessibility in high contrast
    const isAccessible = await mcpVerifyAccessibility(page);
    expect(isAccessible).toBe(true);
  });

  test("focus indicators visual testing", async ({ page }) => {
    await loginAsRole(page, "ADMIN");

    // Tab through elements to show focus indicators
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
      await page.waitForTimeout(100);
    }

    await mcpTakeScreenshot(page, {
      filename: "focus-indicators.png",
    });
  });
});
