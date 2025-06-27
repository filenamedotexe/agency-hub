import { test, expect } from "@playwright/test";

test.describe("Client Store Access - Manual Verification", () => {
  test("verify client can access store pages", async ({ page }) => {
    // Go to login page
    await page.goto("http://localhost:3001/login");

    // Login as the test client user
    await page.fill('input[name="email"]', "client@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for redirect to client dashboard
    await page.waitForURL("**/client-dashboard");

    // Navigate to store page
    await page.goto("http://localhost:3001/store");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check that we're on the store page (not redirected)
    expect(page.url()).toBe("http://localhost:3001/store");

    // Check for store page content - using a more flexible selector
    const storeHeading = await page
      .locator("h1, h2")
      .filter({ hasText: /Store/i })
      .first();
    await expect(storeHeading).toBeVisible();

    // Navigate to order history page
    await page.goto("http://localhost:3001/store/orders");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check that we're on the orders page (not redirected)
    expect(page.url()).toBe("http://localhost:3001/store/orders");

    // Wait for and check for orders page content - the page might still be loading
    await page.waitForSelector("h1:has-text('Order History')", {
      timeout: 10000,
    });
    const ordersHeading = page.locator("h1:has-text('Order History')");
    await expect(ordersHeading).toBeVisible();
  });
});
