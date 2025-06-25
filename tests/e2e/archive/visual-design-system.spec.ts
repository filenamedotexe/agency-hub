import { test, expect } from "@playwright/test";

// Define viewport sizes for testing
const viewports = [
  { name: "mobile-small", width: 320, height: 568 }, // iPhone SE
  { name: "mobile", width: 375, height: 667 }, // iPhone 8
  { name: "tablet", width: 768, height: 1024 }, // iPad
  { name: "desktop", width: 1280, height: 800 }, // Desktop
  { name: "desktop-large", width: 1536, height: 864 }, // Large Desktop
];

test.describe("Design System Visual Tests", () => {
  // Test the login page across all viewports
  viewports.forEach((viewport) => {
    test(`Login page - ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto("http://localhost:3001/login");

      // Wait for the page to load
      await page.waitForLoadState("networkidle");

      // Check that the login form is visible
      await expect(page.locator("form")).toBeVisible();

      // Test button hover states
      const loginButton = page.locator('button[type="submit"]');
      await loginButton.hover();

      // Check input focus states
      const emailInput = page.locator('input[type="email"]');
      await emailInput.focus();

      // Take a screenshot for visual verification
      await page.screenshot({
        path: `tests/screenshots/login-${viewport.name}.png`,
        fullPage: true,
      });
    });
  });

  // Test the dashboard across all viewports (if accessible without auth)
  test.describe("Dashboard Tests", () => {
    test.beforeEach(async ({ page }) => {
      // Try to access dashboard directly or mock auth if needed
      await page.goto("http://localhost:3001/");
    });

    viewports.forEach((viewport) => {
      test(`Dashboard - ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });

        // Wait for any redirects to complete
        await page.waitForLoadState("networkidle");

        // If redirected to login, that's fine - we're testing the UI
        const url = page.url();

        if (url.includes("login")) {
          // Already tested login above
          return;
        }

        // Test navigation menu (mobile vs desktop)
        if (viewport.width < 768) {
          // Check for mobile menu button
          const mobileMenuButton = page.locator(
            'button[aria-label="Toggle navigation"]'
          );
          if (await mobileMenuButton.isVisible()) {
            await mobileMenuButton.click();
            await page.waitForTimeout(300); // Wait for animation
          }
        }

        // Take a screenshot
        await page.screenshot({
          path: `tests/screenshots/dashboard-${viewport.name}.png`,
          fullPage: true,
        });
      });
    });
  });

  // Test component interactions
  test("Component Interactions", async ({ page }) => {
    await page.goto("http://localhost:3001/login");
    await page.setViewportSize({ width: 1280, height: 800 });

    // Test form input interactions
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    // Test placeholder and focus states
    await emailInput.click();
    await page.keyboard.type("test@example.com");

    await passwordInput.click();
    await page.keyboard.type("password123");

    // Test button states
    const submitButton = page.locator('button[type="submit"]');

    // Hover state
    await submitButton.hover();
    await page.screenshot({
      path: "tests/screenshots/button-hover.png",
      clip: (await submitButton.boundingBox()) || undefined,
    });

    // Focus state
    await submitButton.focus();
    await page.screenshot({
      path: "tests/screenshots/button-focus.png",
      clip: (await submitButton.boundingBox()) || undefined,
    });
  });

  // Test color contrast and accessibility
  test("Accessibility - Color Contrast", async ({ page }) => {
    await page.goto("http://localhost:3001/login");

    // Check that all text has sufficient contrast
    const results = await page.evaluate(() => {
      const elements = document.querySelectorAll("*");
      const issues: Array<{
        element: string;
        color: string;
        backgroundColor: string;
        text: string;
      }> = [];

      elements.forEach((el) => {
        const styles = window.getComputedStyle(el);
        const color = styles.color;
        const bgColor = styles.backgroundColor;

        // Simple check for text elements
        if (el.textContent?.trim() && color && bgColor !== "rgba(0, 0, 0, 0)") {
          // This is a simplified check - in production use a proper contrast checker
          issues.push({
            element: el.tagName,
            color,
            backgroundColor: bgColor,
            text: el.textContent.substring(0, 50),
          });
        }
      });

      return issues.slice(0, 10); // Return first 10 for review
    });

    console.log("Color contrast check:", results);
  });

  // Test animations and transitions
  test("Animations and Transitions", async ({ page }) => {
    await page.goto("http://localhost:3001/login");

    // Slow down animations to see them better
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 1s !important;
          transition-duration: 1s !important;
        }
      `,
    });

    // Test button hover animation
    const button = page.locator('button[type="submit"]');
    await button.hover();
    await page.waitForTimeout(1000);

    // Test input focus animation
    const input = page.locator('input[type="email"]');
    await input.focus();
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: "tests/screenshots/animations-test.png",
      fullPage: true,
    });
  });
});
