import { test, expect } from "@playwright/test";

// Test login flow
test.describe("UI/UX Improvements - Authentication", () => {
  test("should login successfully", async ({ page }) => {
    await page.goto("http://localhost:3001");
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "admin123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("http://localhost:3001/dashboard");
  });
});

// Test responsive breakpoints
test.describe("Responsive Design", () => {
  const viewports = [
    { name: "mobile", width: 375, height: 667 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "desktop", width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    test(`should render correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("http://localhost:3001");
      await page.screenshot({
        path: `screenshots/ui-${viewport.name}-before.png`,
      });
    });
  }
});

// Test navigation
test.describe("Navigation", () => {
  test("mobile menu should work", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("http://localhost:3001/dashboard");
    await page.click('[data-testid="mobile-menu-trigger"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
  });
});
