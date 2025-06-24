import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Requests and Logout functionality", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should create a new request successfully", async ({ page }) => {
    // Navigate to requests page
    await page.goto("http://localhost:3001/requests");
    await page.waitForLoadState("networkidle");

    // Click on New Request button
    await page.click('button:has-text("New Request")');

    // Wait for dialog
    await page.waitForSelector('text="Create New Request"');

    // Select a client (if available)
    const clientSelect = page.locator('button[role="combobox"]').first();
    await clientSelect.click();

    // Try to select first client if available
    const clientOption = page.locator('[role="option"]').first();
    if (await clientOption.isVisible()) {
      await clientOption.click();
    }

    // Fill in description
    await page.fill(
      'textarea[id="description"]',
      "Test request from Playwright"
    );

    // Submit the form
    await page.click('button:has-text("Create Request")');

    // Check for success toast
    await expect(
      page.locator('text="Request created successfully"')
    ).toBeVisible({ timeout: 5000 });

    // Verify the request appears in the list
    await expect(
      page.locator('text="Test request from Playwright"')
    ).toBeVisible({ timeout: 5000 });
  });

  test("should logout successfully", async ({ page }) => {
    // Navigate to dashboard
    await page.goto("http://localhost:3001/dashboard");
    await page.waitForLoadState("networkidle");

    // Click on user menu
    await page.click('button[aria-label="User menu"]');

    // Click on Sign out
    await page.click('button:has-text("Sign out")');

    // Should be redirected to login page
    await page.waitForURL("**/login", { timeout: 5000 });

    // Verify we're on the login page
    expect(page.url()).toContain("/login");

    // Try to access dashboard directly - should redirect to login
    await page.goto("http://localhost:3001/dashboard");
    await page.waitForURL("**/login", { timeout: 5000 });
  });
});
