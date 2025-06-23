import { test, expect } from "@playwright/test";

test.describe("Debug Clients Page Authentication", () => {
  test("should redirect to login when accessing clients page without auth", async ({
    page,
  }) => {
    // Go directly to clients page without authentication
    await page.goto("/clients");

    // Should be redirected to login page
    await expect(page).toHaveURL(/\/login/);

    // Should have redirectTo parameter
    const url = new URL(page.url());
    expect(url.searchParams.get("redirectTo")).toBe("/clients");
  });

  test("should access clients page after login", async ({ page }) => {
    // Step 1: Go to login page
    await page.goto("/login");

    // Step 2: Debug - check if login form exists
    const emailInput = page.locator('input[name="email"], input[type="email"]');
    const passwordInput = page.locator(
      'input[name="password"], input[type="password"]'
    );
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    await expect(submitButton).toBeVisible({ timeout: 10000 });

    // Step 3: Fill in credentials
    await emailInput.fill("admin@example.com");
    await passwordInput.fill("password123");

    // Step 4: Submit login form
    await submitButton.click();

    // Step 5: Wait for navigation - could go to dashboard first
    await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 15000,
    });

    // Step 6: Now navigate to clients page
    await page.goto("/clients");

    // Step 7: Should stay on clients page (not redirect to login)
    await expect(page).toHaveURL("/clients", { timeout: 10000 });

    // Step 8: Verify page content
    await expect(page.locator("h1")).toContainText("Clients");
  });

  test("debug authentication state", async ({ page }) => {
    // Enable console logging
    page.on("console", (msg) => {
      console.log("Browser console:", msg.text());
    });

    page.on("response", (response) => {
      if (
        response.url().includes("/auth") ||
        response.url().includes("/login")
      ) {
        console.log(
          `Auth response: ${response.url()} - Status: ${response.status()}`
        );
      }
    });

    // Try to login
    await page.goto("/login");

    // Fill and submit form
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait a bit for auth to process
    await page.waitForTimeout(2000);

    // Check cookies
    const cookies = await page.context().cookies();
    console.log(
      "Cookies after login:",
      cookies.map((c) => c.name)
    );

    // Check localStorage
    const localStorage = await page.evaluate(() => {
      const items: Record<string, any> = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          items[key] = window.localStorage.getItem(key);
        }
      }
      return items;
    });
    console.log("LocalStorage keys:", Object.keys(localStorage));

    // Try to access clients page
    await page.goto("/clients");
    const finalUrl = page.url();
    console.log("Final URL after navigation:", finalUrl);

    // Check if we're authenticated
    if (finalUrl.includes("/login")) {
      expect.fail("Still redirected to login after authentication attempt");
    }
  });
});
