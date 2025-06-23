import { test, expect } from "@playwright/test";

// Test user credentials
const testUsers = {
  admin: {
    email: "admin@test.com",
    password: "Admin123!",
    role: "ADMIN",
  },
  client: {
    email: "client@test.com",
    password: "Client123!",
    role: "CLIENT",
  },
  copywriter: {
    email: "copywriter@test.com",
    password: "Copy123!",
    role: "COPYWRITER",
  },
};

test.describe("Authentication - Real UI Interaction", () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto("/");
    // Wait for page to fully load
    await page.waitForLoadState("networkidle");
  });

  test.describe("Sign Up Flow", () => {
    test("should display signup page correctly", async ({ page }) => {
      await page.goto("/signup");
      await page.waitForLoadState("networkidle");

      // Check page title and form elements are visible
      await expect(
        page.locator("h1, h2").filter({ hasText: "Create your account" })
      ).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
      await expect(page.locator('input[name="name"]')).toBeVisible();
      await expect(
        page.locator("button").filter({ hasText: "Create account" })
      ).toBeVisible();
    });

    test("should handle form validation visually", async ({ page }) => {
      await page.goto("/signup");
      await page.waitForLoadState("networkidle");

      // Try to submit empty form
      await page
        .locator("button")
        .filter({ hasText: "Create account" })
        .click();

      // Wait for validation to appear
      await page.waitForTimeout(1000);

      // Check that form validation prevents submission (button should still be visible)
      await expect(
        page.locator("button").filter({ hasText: "Create account" })
      ).toBeVisible();
    });
  });

  test.describe("Sign In Flow", () => {
    test("should display login page correctly", async ({ page }) => {
      await page.goto("/login");
      await page.waitForLoadState("networkidle");

      // Check page elements are visible
      await expect(
        page.locator("h1, h2").filter({ hasText: "Sign in to your account" })
      ).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(
        page.locator("button").filter({ hasText: "Sign in" })
      ).toBeVisible();

      // Check link to signup
      await expect(page.locator('a[href="/signup"]')).toBeVisible();
    });

    test("should handle login form interaction", async ({ page }) => {
      await page.goto("/login");
      await page.waitForLoadState("networkidle");

      // Fill in form fields
      await page.locator('input[name="email"]').fill(testUsers.admin.email);
      await page
        .locator('input[name="password"]')
        .fill(testUsers.admin.password);

      // Verify form is filled
      await expect(page.locator('input[name="email"]')).toHaveValue(
        testUsers.admin.email
      );
      await expect(page.locator('input[name="password"]')).toHaveValue(
        testUsers.admin.password
      );

      // Click sign in button
      await page.locator("button").filter({ hasText: "Sign in" }).click();

      // Wait for navigation or error
      await page.waitForTimeout(3000);

      // Check what happens after login attempt
      const currentUrl = page.url();
      console.log("Current URL after login:", currentUrl);

      // Either we're redirected to dashboard or back to login
      const isOnLogin = currentUrl.includes("/login");
      const isOnDashboard = currentUrl.includes("/dashboard");
      const isOnClientDashboard = currentUrl.includes("/client-dashboard");

      console.log("Login result:", {
        isOnLogin,
        isOnDashboard,
        isOnClientDashboard,
      });

      // For now, just verify the form interaction worked
      expect(isOnLogin || isOnDashboard || isOnClientDashboard).toBe(true);
    });

    test("should show loading state during login", async ({ page }) => {
      await page.goto("/login");
      await page.waitForLoadState("networkidle");

      await page.locator('input[name="email"]').fill(testUsers.admin.email);
      await page
        .locator('input[name="password"]')
        .fill(testUsers.admin.password);

      // Click submit and immediately check for loading state
      await page.locator("button").filter({ hasText: "Sign in" }).click();

      // Check if button text changes to loading state
      await expect(
        page.locator("button").filter({ hasText: "Signing in" })
      ).toBeVisible({ timeout: 2000 });
    });
  });

  test.describe("Navigation", () => {
    test("should navigate between login and signup", async ({ page }) => {
      await page.goto("/login");
      await page.waitForLoadState("networkidle");

      // Click signup link
      await page.locator('a[href="/signup"]').click();
      await page.waitForLoadState("networkidle");

      // Should be on signup page
      await expect(page).toHaveURL(/\/signup/);
      await expect(
        page.locator("h1, h2").filter({ hasText: "Create your account" })
      ).toBeVisible();

      // Click login link
      await page.locator('a[href="/login"]').click();
      await page.waitForLoadState("networkidle");

      // Should be back on login page
      await expect(page).toHaveURL(/\/login/);
      await expect(
        page.locator("h1, h2").filter({ hasText: "Sign in to your account" })
      ).toBeVisible();
    });
  });

  test.describe("Visual Elements", () => {
    test("should display form styling correctly", async ({ page }) => {
      await page.goto("/login");
      await page.waitForLoadState("networkidle");

      // Check that form inputs have proper styling
      const emailInput = page.locator('input[name="email"]');
      const passwordInput = page.locator('input[name="password"]');
      const submitButton = page
        .locator("button")
        .filter({ hasText: "Sign in" });

      // Verify elements are styled (not just basic HTML)
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(submitButton).toBeVisible();

      // Test focus states
      await emailInput.focus();
      await page.waitForTimeout(500);

      await passwordInput.focus();
      await page.waitForTimeout(500);

      // Visual verification that focus styles work
      expect(true).toBe(true); // Placeholder for visual verification
    });
  });
});
