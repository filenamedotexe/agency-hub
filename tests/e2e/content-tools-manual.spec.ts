import { test, expect } from "@playwright/test";

test.describe("Content Tools - Manual Testing", () => {
  test("🎯 Manual Login and Content Tools Test", async ({ page }) => {
    console.log("🧪 Starting manual content tools test...");

    // Capture any errors
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
        console.log(`❌ Error: ${msg.text()}`);
      }
    });

    // Step 1: Go to login page
    console.log("🔐 Going to login page...");
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Check if login page loads
    const loginTitle = await page.title();
    console.log(`Login page title: ${loginTitle}`);

    // Step 2: Manual login (we'll use a real email/password)
    console.log("🔐 Filling login form...");

    // Check what login form elements exist
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator(
      'input[type="password"], input[name="password"]'
    );
    const submitButton = page.locator(
      'button[type="submit"], button:has-text("Sign In"), button:has-text("Login")'
    );

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // Use a real admin email (you can change this to your actual admin credentials)
    await emailInput.fill("admin@example.com");
    await passwordInput.fill("password123");

    console.log("🖱️ Clicking login button...");
    await submitButton.click();

    // Wait for redirect
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    console.log(`After login URL: ${currentUrl}`);

    if (currentUrl.includes("/login")) {
      console.log("❌ Still on login page - login may have failed");
      const errorMsg = await page
        .locator('text="Invalid", text="Error", text="Failed"')
        .textContent()
        .catch(() => "No error message found");
      console.log(`Login error: ${errorMsg}`);

      // Try to create the user if login failed
      console.log("🧪 Trying signup instead...");
      await page.goto("/signup");
      await page.waitForLoadState("networkidle");

      const signupEmail = page.locator(
        'input[type="email"], input[name="email"]'
      );
      const signupPassword = page.locator(
        'input[type="password"], input[name="password"]'
      );
      const signupSubmit = page.locator(
        'button[type="submit"], button:has-text("Sign Up"), button:has-text("Create")'
      );

      if (await signupEmail.isVisible()) {
        await signupEmail.fill("admin@example.com");
        await signupPassword.fill("password123");
        await signupSubmit.click();
        await page.waitForTimeout(3000);
      }

      // Try login again
      await page.goto("/login");
      await page.waitForLoadState("networkidle");
      await page.fill(
        'input[type="email"], input[name="email"]',
        "admin@example.com"
      );
      await page.fill(
        'input[type="password"], input[name="password"]',
        "password123"
      );
      await page.click(
        'button[type="submit"], button:has-text("Sign In"), button:has-text("Login")'
      );
      await page.waitForTimeout(3000);
    }

    // Step 3: Navigate to content tools
    console.log("🧪 Navigating to content tools...");
    await page.goto("/content-tools");
    await page.waitForLoadState("domcontentloaded");

    // Wait longer for any loading states
    await page.waitForTimeout(5000);

    // Step 4: Check what we actually see
    const finalUrl = page.url();
    const finalTitle = await page.title();
    console.log(`Final URL: ${finalUrl}`);
    console.log(`Final title: ${finalTitle}`);

    // Take a screenshot
    await page.screenshot({
      path: "content-tools-manual-test.png",
      fullPage: true,
    });
    console.log("📸 Screenshot saved");

    // Check what's on the page
    const headings = await page.locator("h1, h2, h3").allTextContents();
    console.log("Headings found:", headings);

    const allText = await page.locator("body").textContent();
    const preview = allText?.substring(0, 300).replace(/\s+/g, " ").trim();
    console.log("Page text preview:", preview + "...");

    // Look for specific content tools elements
    const contentToolsElements = await page
      .locator(
        'text="Content Tools", text="Blog Writer", text="Generate Content"'
      )
      .count();
    console.log(`Found ${contentToolsElements} content tool related elements`);

    // Look for loading indicators
    const loadingElements = await page
      .locator('text="Loading", text="loading", [data-loading="true"]')
      .count();
    console.log(`Found ${loadingElements} loading indicators`);

    // Check for cards/buttons
    const cards = await page.locator('[class*="card"], .card, button').count();
    console.log(`Found ${cards} cards/buttons on page`);

    // Print any console errors
    if (errors.length > 0) {
      console.log("\n❌ Console Errors:");
      errors.forEach((error) => console.log(`  - ${error}`));
    } else {
      console.log("✅ No console errors found");
    }

    // Final check - if we see content tools working
    if (headings.some((h) => h.includes("Content Tools"))) {
      console.log("✅ SUCCESS: Content Tools page loaded with proper heading!");

      // Try clicking a tool if available
      const blogWriter = page.locator('text="Blog Writer"').first();
      if (await blogWriter.isVisible()) {
        console.log("🖱️ Clicking Blog Writer...");
        await blogWriter.click();
        await page.waitForTimeout(2000);

        const newHeadings = await page.locator("h1, h2, h3").allTextContents();
        console.log("After click headings:", newHeadings);

        await page.screenshot({
          path: "content-tools-after-click.png",
          fullPage: true,
        });
        console.log("📸 After-click screenshot saved");
      }
    } else if (loadingElements > 0) {
      console.log("⏳ Page appears to be stuck loading");
    } else {
      console.log("❌ Content Tools page did not load properly");
    }

    console.log("🏁 Manual test complete");
  });
});
