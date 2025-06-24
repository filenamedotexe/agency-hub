import { test, expect } from "@playwright/test";

test.describe("Debug Middleware", () => {
  test("Check what middleware sees", async ({ page }) => {
    // Login as copywriter
    await page.goto("/login");
    await page.fill('input[type="email"]', "copywriter@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    await page.waitForURL("/dashboard", { timeout: 10000 });

    console.log("\n🔐 Logged in as COPYWRITER with real authentication");

    // Try to access settings
    console.log("\n📍 Attempting to access /settings...");

    // Listen for console logs from the page
    page.on("console", (msg) => {
      if (msg.text().includes("[MIDDLEWARE]")) {
        console.log(`  Browser: ${msg.text()}`);
      }
    });

    // Navigate and wait
    await page.goto("/settings");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const finalUrl = page.url();
    console.log(`\n  Final URL: ${finalUrl}`);

    if (finalUrl.includes("/settings")) {
      console.log("  ❌ COPYWRITER accessed /settings (should be blocked)");

      // Take screenshot to see what's on the page
      await page.screenshot({
        path: "test-results/debug-copywriter-settings.png",
        fullPage: true,
      });
    } else {
      console.log("  ✅ COPYWRITER was redirected from /settings");
    }
  });
});
