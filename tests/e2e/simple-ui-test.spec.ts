import { test, expect } from "@playwright/test";

test.describe("Simple UI Test - Next.js on Port 3001", () => {
  test("should load the app and interact with UI elements", async ({
    page,
  }) => {
    console.log("Starting test on:", page.url());

    // Navigate to the app
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    console.log("Loaded page:", page.url());

    // Take a screenshot for debugging
    await page.screenshot({
      path: "test-results/homepage.png",
      fullPage: true,
    });

    // Check if we can see any content
    const pageContent = await page.textContent("body");
    console.log("Page content length:", pageContent?.length || 0);

    // Try to navigate to login
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    console.log("On login page:", page.url());

    // Take another screenshot
    await page.screenshot({
      path: "test-results/login-page.png",
      fullPage: true,
    });

    // Check if login form exists
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const submitButton = page.locator("button").filter({ hasText: /sign in/i });

    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    await expect(submitButton).toBeVisible({ timeout: 10000 });

    console.log("Form elements found successfully");

    // Test form interaction
    await emailInput.fill("test@example.com");
    await passwordInput.fill("testpassword");

    // Verify the form was filled
    await expect(emailInput).toHaveValue("test@example.com");
    await expect(passwordInput).toHaveValue("testpassword");

    console.log("Form interaction successful");

    // Test navigation to signup
    const signupLink = page.locator('a[href="/signup"]');
    if (await signupLink.isVisible()) {
      await signupLink.click();
      await page.waitForLoadState("networkidle");

      console.log("Navigated to signup:", page.url());

      // Take signup screenshot
      await page.screenshot({
        path: "test-results/signup-page.png",
        fullPage: true,
      });

      // Check signup form
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(
        page.locator("button").filter({ hasText: /create account/i })
      ).toBeVisible();

      console.log("Signup form found successfully");
    }

    console.log("Test completed successfully");
  });

  test("should handle viewport and responsive design", async ({ page }) => {
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.screenshot({
      path: "test-results/desktop-login.png",
      fullPage: true,
    });

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState("networkidle");

    await page.screenshot({
      path: "test-results/mobile-login.png",
      fullPage: true,
    });

    // Verify form is still usable on mobile
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();

    console.log("Responsive design test completed");
  });
});
