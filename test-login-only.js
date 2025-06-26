const { chromium } = require("@playwright/test");

async function testLoginOnly() {
  console.log("🔐 Testing login flow in isolation...\n");

  const browser = await chromium.launch({
    headless: false,
    devtools: true,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable detailed console logging
  page.on("console", (msg) => {
    console.log("Browser console:", msg.text());
  });

  page.on("response", (response) => {
    if (response.url().includes("auth")) {
      console.log(
        `Auth response: ${response.url()} - Status: ${response.status()}`
      );
    }
  });

  try {
    // Clear cookies first
    await context.clearCookies();

    console.log("1. Navigating to login page...");
    await page.goto("http://localhost:3001/login");
    await page.waitForLoadState("networkidle");

    console.log("2. Checking page loaded correctly...");
    const title = await page.title();
    console.log("   Page title:", title);

    // Take screenshot before login
    await page.screenshot({ path: "before-login.png" });

    console.log("3. Filling login form...");
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");

    // Take screenshot after filling
    await page.screenshot({ path: "after-fill.png" });

    console.log("4. Clicking submit button...");
    const submitButton = page.locator('button[type="submit"]');
    const buttonText = await submitButton.textContent();
    console.log("   Submit button text:", buttonText);

    await submitButton.click();

    console.log("5. Waiting for navigation...");
    await page.waitForTimeout(3000); // Wait 3 seconds to see what happens

    const finalUrl = page.url();
    console.log("   Final URL:", finalUrl);

    // Take screenshot after submit
    await page.screenshot({ path: "after-submit.png" });

    // Check for errors
    const errors = await page
      .locator('.text-red-500, [role="alert"], .text-destructive')
      .allTextContents();
    if (errors.length > 0) {
      console.log("   ❌ Errors found:", errors);
    }

    // Check if user is logged in
    const userMenuButton = page.locator('button[aria-label="User menu"]');
    if ((await userMenuButton.count()) > 0) {
      console.log("   ✅ User menu found - login successful!");
    } else {
      console.log("   ❌ No user menu - login may have failed");
    }
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await page.waitForTimeout(2000); // Keep browser open for 2 seconds
    await browser.close();
  }
}

testLoginOnly();
