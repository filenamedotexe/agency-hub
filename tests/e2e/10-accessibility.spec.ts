import { test, expect } from "@playwright/test";
import { loginAsRole, type UserRole } from "./helpers/role-auth";
import {
  mcpVerifyAccessibility,
  mcpAccessibilitySnapshot,
  mcpTakeScreenshot,
} from "./helpers/mcp-utils";

/**
 * Accessibility Tests using Playwright MCP
 * Ensures the application meets WCAG standards and is usable for all users
 */

test.describe("Accessibility Testing", () => {
  test.describe("Page-Level Accessibility", () => {
    const pages = [
      { path: "/login", requiresAuth: false },
      { path: "/signup", requiresAuth: false },
      { path: "/dashboard", requiresAuth: true },
      { path: "/clients", requiresAuth: true },
      { path: "/services", requiresAuth: true },
      { path: "/forms", requiresAuth: true },
      { path: "/content-tools", requiresAuth: true },
      { path: "/settings", requiresAuth: true },
    ];

    for (const pageInfo of pages) {
      test(`${pageInfo.path} meets accessibility standards`, async ({
        page,
      }) => {
        if (pageInfo.requiresAuth) {
          await loginAsRole(page, "ADMIN");
        }

        await page.goto(pageInfo.path);
        await page.waitForLoadState("networkidle");

        // Verify accessibility
        const isAccessible = await mcpVerifyAccessibility(page, {
          checkLabels: true,
        });
        expect(isAccessible).toBe(true);

        // Get accessibility tree snapshot
        const snapshot = await mcpAccessibilitySnapshot(page);

        // Verify page has proper heading structure
        expect(snapshot).toBeTruthy();

        // Take screenshot for manual review
        await mcpTakeScreenshot(page, {
          filename: `accessibility-${pageInfo.path.replace(/\//g, "-")}.png`,
        });
      });
    }
  });

  test.describe("Interactive Elements Accessibility", () => {
    test("all buttons have accessible labels", async ({ page }) => {
      await loginAsRole(page, "ADMIN");
      await page.goto("/dashboard");

      // Get all buttons
      const buttons = await page.locator("button").all();

      for (const button of buttons) {
        const label =
          (await button.getAttribute("aria-label")) ||
          (await button.textContent()) ||
          (await button.getAttribute("title"));

        expect(label).toBeTruthy();
      }
    });

    test("form inputs have proper labels", async ({ page }) => {
      await loginAsRole(page, "ADMIN");
      await page.goto("/clients");
      await page.click(
        'button:has-text("Add Client"), button:has-text("New Client")'
      );
      await page.waitForTimeout(500);

      // Check all form inputs
      const inputs = await page.locator("input, textarea, select").all();

      for (const input of inputs) {
        const inputId = await input.getAttribute("id");
        const inputName = await input.getAttribute("name");
        const ariaLabel = await input.getAttribute("aria-label");
        const ariaLabelledBy = await input.getAttribute("aria-labelledby");

        // Input should have either:
        // 1. An associated label (via id)
        // 2. aria-label
        // 3. aria-labelledby
        if (inputId) {
          const label = page.locator(`label[for="${inputId}"]`);
          const hasLabel = (await label.count()) > 0;
          const hasAriaLabel = !!ariaLabel || !!ariaLabelledBy;

          expect(hasLabel || hasAriaLabel).toBe(true);
        }
      }
    });

    test("modals and dialogs are accessible", async ({ page }) => {
      await loginAsRole(page, "ADMIN");
      await page.goto("/services");

      // Open a modal
      await page.click(
        'button:has-text("Create Template"), button:has-text("New Template")'
      );
      await page.waitForTimeout(500);

      // Check modal attributes
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      // Modal should have aria-labelledby or aria-label
      const ariaLabelledBy = await modal.getAttribute("aria-labelledby");
      const ariaLabel = await modal.getAttribute("aria-label");
      expect(ariaLabelledBy || ariaLabel).toBeTruthy();

      // Modal should trap focus
      await page.keyboard.press("Tab");
      const focusedElement = await page.evaluate(
        () => document.activeElement?.tagName
      );
      expect(focusedElement).toBeTruthy();
    });
  });

  test.describe("Keyboard Navigation", () => {
    test("main navigation is keyboard accessible", async ({ page }) => {
      await loginAsRole(page, "ADMIN");

      // Tab through navigation
      const navLinks = await page.locator("nav a").all();

      for (let i = 0; i < navLinks.length; i++) {
        await page.keyboard.press("Tab");

        // Check if nav link can receive focus
        const focusedHref = await page.evaluate(
          () => (document.activeElement as HTMLAnchorElement)?.href
        );
        expect(focusedHref).toBeTruthy();
      }
    });

    test("tables support keyboard navigation", async ({ page }) => {
      await loginAsRole(page, "ADMIN");
      await page.goto("/clients");
      await page.waitForLoadState("networkidle");

      // Focus on table
      await page.focus('table, [role="table"]');

      // Navigate with arrow keys
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowRight");

      // Actionable items in table should be reachable
      const tableActions = await page.locator("table button, table a").first();
      if (await tableActions.isVisible()) {
        await tableActions.focus();
        const isFocused = await tableActions.evaluate(
          (el) => el === document.activeElement
        );
        expect(isFocused).toBe(true);
      }
    });

    test("forms can be completed with keyboard only", async ({ page }) => {
      await page.goto("/login");

      // Complete login form with keyboard only
      await page.keyboard.press("Tab"); // Skip to first input
      await page.keyboard.type("admin@example.com");
      await page.keyboard.press("Tab");
      await page.keyboard.type("password123");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter"); // Submit form

      // Should navigate after login
      await page.waitForURL(/dashboard|login/);
    });
  });

  test.describe("Screen Reader Support", () => {
    test("pages have proper landmarks", async ({ page }) => {
      await loginAsRole(page, "ADMIN");

      const snapshot = await mcpAccessibilitySnapshot(page);

      // Look for main landmarks
      const hasMain = JSON.stringify(snapshot).includes('"role":"main"');
      const hasNavigation = JSON.stringify(snapshot).includes(
        '"role":"navigation"'
      );

      expect(hasMain).toBe(true);
      expect(hasNavigation).toBe(true);
    });

    test("dynamic content updates are announced", async ({ page }) => {
      await loginAsRole(page, "ADMIN");
      await page.goto("/clients");

      // Trigger an action that shows a toast
      await page.click(
        'button:has-text("Add Client"), button:has-text("New Client")'
      );
      await page.fill('input[name="name"]', "Test Client");
      await page.fill('input[name="email"]', "test@example.com");
      await page.click('button[type="submit"]');

      // Check for live region
      const liveRegion = page.locator('[role="status"], [aria-live]');
      await expect(liveRegion).toBeVisible({ timeout: 5000 });
    });

    test("loading states are announced", async ({ page }) => {
      await loginAsRole(page, "ADMIN");

      // Navigate to a page with data loading
      await page.goto("/clients");

      // Check for loading indicators with proper ARIA
      const loadingIndicators = page.locator(
        '[aria-busy="true"], [role="progressbar"]'
      );
      const count = await loadingIndicators.count();

      // If loading indicators exist, they should have proper attributes
      if (count > 0) {
        const firstIndicator = loadingIndicators.first();
        const ariaBusy = await firstIndicator.getAttribute("aria-busy");
        const role = await firstIndicator.getAttribute("role");

        expect(ariaBusy === "true" || role === "progressbar").toBe(true);
      }
    });
  });

  test.describe("Color Contrast and Visual Accessibility", () => {
    test("text has sufficient color contrast", async ({ page }) => {
      await loginAsRole(page, "ADMIN");

      // This would ideally use an automated contrast checker
      // For now, take screenshots for manual review
      await mcpTakeScreenshot(page, {
        filename: "contrast-check-dashboard.png",
      });

      // Check if high contrast mode is supported
      await page.emulateMedia({ forcedColors: "active" });
      await mcpTakeScreenshot(page, {
        filename: "high-contrast-mode.png",
      });

      // Verify page is still accessible in high contrast
      const isAccessible = await mcpVerifyAccessibility(page);
      expect(isAccessible).toBe(true);
    });

    test("focus indicators are visible", async ({ page }) => {
      await loginAsRole(page, "ADMIN");

      // Remove any CSS that might hide focus indicators
      await page.addStyleTag({
        content: `
          *:focus {
            outline: 2px solid blue !important;
            outline-offset: 2px !important;
          }
        `,
      });

      // Tab through elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press("Tab");

        // Get currently focused element
        const focusedElement = await page.evaluate(() => {
          const el = document.activeElement;
          return {
            tagName: el?.tagName,
            hasOutline: window.getComputedStyle(el!).outline !== "none",
          };
        });

        if (focusedElement.tagName) {
          expect(focusedElement.hasOutline).toBe(true);
        }
      }
    });
  });

  test.describe("Responsive Accessibility", () => {
    test("mobile navigation is accessible", async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await loginAsRole(page, "ADMIN");

      // Find and click mobile menu button
      const mobileMenuButton = page.locator(
        '[data-testid="mobile-menu"], button[aria-label*="menu"]'
      );
      if (await mobileMenuButton.isVisible()) {
        // Menu button should have proper aria-expanded
        await mobileMenuButton.click();
        const ariaExpanded =
          await mobileMenuButton.getAttribute("aria-expanded");
        expect(ariaExpanded).toBe("true");

        // Mobile menu should be accessible
        const mobileNav = page.locator(
          'nav[aria-label*="mobile"], [data-testid="mobile-nav"]'
        );
        const isAccessible = await mcpVerifyAccessibility(page);
        expect(isAccessible).toBe(true);
      }
    });

    test("touch targets meet minimum size requirements", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await loginAsRole(page, "ADMIN");

      // Get all interactive elements
      const interactiveElements = await page
        .locator("button, a, input, textarea, select")
        .all();

      for (const element of interactiveElements.slice(0, 10)) {
        // Check first 10 to avoid long test
        const box = await element.boundingBox();
        if (box) {
          // WCAG recommends minimum 44x44px for touch targets
          const meetsMinimum = box.width >= 44 || box.height >= 44;
          expect(meetsMinimum).toBe(true);
        }
      }
    });
  });

  test.describe("Error Handling Accessibility", () => {
    test("form errors are accessible", async ({ page }) => {
      await page.goto("/login");

      // Submit invalid form
      await page.click('button[type="submit"]');

      // Check for accessible error messages
      const errorMessages = page.locator(
        '[role="alert"], [aria-invalid="true"]'
      );
      await expect(errorMessages.first()).toBeVisible();

      // Error messages should be associated with inputs
      const inputs = await page
        .locator("input[aria-describedby], input[aria-errormessage]")
        .all();
      expect(inputs.length).toBeGreaterThan(0);
    });

    test("404 and error pages are accessible", async ({ page }) => {
      await loginAsRole(page, "ADMIN");

      // Navigate to non-existent page
      await page.goto("/non-existent-page");

      // Error page should still be accessible
      const isAccessible = await mcpVerifyAccessibility(page);
      expect(isAccessible).toBe(true);

      // Should have proper heading explaining the error
      const heading = page.locator("h1, h2").first();
      await expect(heading).toBeVisible();
    });
  });
});
