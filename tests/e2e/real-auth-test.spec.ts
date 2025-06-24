import { test, expect } from "@playwright/test";

test.describe("Real Authentication Test", () => {
  test("Test role-based access without test bypass", async ({ page }) => {
    // Clear all cookies first
    await page.context().clearCookies();

    // Login as copywriter WITHOUT test bypass
    await page.goto("/login");
    await page.fill('input[type="email"]', "copywriter@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL("/dashboard", { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    console.log("✅ Logged in as copywriter@example.com");

    // DO NOT set test bypass cookies

    // Try to access admin-only settings page
    console.log("\n📍 Attempting to access /settings (admin only)...");
    await page.goto("/settings");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    const settingsUrl = page.url();
    console.log(`  Current URL: ${settingsUrl}`);

    if (settingsUrl.includes("/settings")) {
      console.log("  ❌ Copywriter CAN access /settings (BUG)");
    } else {
      console.log("  ✅ Copywriter was redirected from /settings");
    }

    // Try to access allowed page
    console.log("\n📍 Attempting to access /requests (allowed)...");
    await page.goto("/requests");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    const requestsUrl = page.url();
    console.log(`  Current URL: ${requestsUrl}`);

    if (requestsUrl.includes("/requests")) {
      console.log("  ✅ Copywriter CAN access /requests (correct)");
    } else {
      console.log(
        "  ❌ Copywriter was blocked from /requests (should have access)"
      );
    }
  });
});
