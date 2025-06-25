import { test, expect } from "@playwright/test";

test.describe("Content Tools - Interactive Debug", () => {
  test("🎯 Interactive Content Tools Testing", async ({ page }) => {
    console.log("🧪 Starting interactive content tools test...");

    // Capture all console messages
    page.on("console", (msg) => {
      console.log(`🔍 Browser Console [${msg.type()}]: ${msg.text()}`);
    });

    // Capture errors
    page.on("pageerror", (error) => {
      console.log(`❌ Page Error: ${error.message}`);
    });

    // Capture failed requests
    page.on("response", (response) => {
      if (!response.ok()) {
        console.log(
          `❌ Failed Request: ${response.status()} ${response.url()}`
        );
      }
    });

    console.log("🔐 Going to login...");
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Simple login
    try {
      await page.fill('input[type="email"]', "admin@example.com");
      await page.fill('input[type="password"]', "password123");
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
    } catch (error) {
      console.log("Login failed, might need manual login");
    }

    console.log("🧪 Navigating to content tools...");
    await page.goto("/content-tools");

    // Wait a bit for any initial loading
    await page.waitForTimeout(2000);

    console.log("📸 Taking screenshot...");
    await page.screenshot({
      path: "content-tools-interactive.png",
      fullPage: true,
    });

    // Check what we actually see
    const pageText = await page.locator("body").textContent();
    console.log("📝 Page contains:", pageText?.substring(0, 200) + "...");

    const headings = await page.locator("h1, h2, h3").allTextContents();
    console.log("📋 Headings found:", headings);

    // Check for loading states
    const loadingText = await page.locator('text="Loading"').count();
    console.log(`⏳ Loading indicators: ${loadingText}`);

    // Look for errors
    const errorElements = await page
      .locator('text="Error", text="Failed"')
      .count();
    console.log(`❌ Error messages: ${errorElements}`);

    console.log("🛑 PAUSING FOR MANUAL INSPECTION");
    console.log(
      "👀 You can now manually inspect the browser and interact with the page"
    );
    console.log("📍 Check the browser console, try clicking elements, etc.");
    console.log("⏰ This will pause for 120 seconds...");

    // Pause for 2 minutes to allow manual inspection
    await page.waitForTimeout(120000);

    console.log("🏁 Interactive test complete");
  });
});
