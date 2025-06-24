import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Logout Functionality", () => {
  test.beforeAll(async () => {
    // CRITICAL: Always verify server responds before any test
    const response = await fetch("http://localhost:3001");
    if (!response.ok) throw new Error("Server not responding on port 3001");
  });

  test("logout redirects to login page without infinite spinner", async ({
    page,
  }) => {
    // Step 1: Login as admin
    await loginAsAdmin(page);

    // Step 2: Verify we're on the dashboard
    expect(page.url()).toContain("/dashboard");

    // Step 3: Open user menu
    const userMenuButton = page.locator('button[aria-label="User menu"]');
    await userMenuButton.click();

    // Step 4: Click sign out
    const signOutButton = page.locator('button:has-text("Sign out")');
    await signOutButton.click();

    // Step 5: Wait for navigation to login page
    await page.waitForURL("/login", { timeout: 5000 });

    // Step 6: Verify we're on login page
    expect(page.url()).toContain("/login");

    // Step 7: Verify no infinite spinner - check that login form is visible
    const emailInput = await page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 3000 });

    // Step 8: Verify no loading spinner is present
    const loadingSpinner = page.locator(".animate-spin");
    const spinnerCount = await loadingSpinner.count();
    expect(spinnerCount).toBe(0);

    console.log(
      "✅ Logout successful - redirected to login without infinite spinner"
    );
  });
});
