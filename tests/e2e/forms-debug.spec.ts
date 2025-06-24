import { test, expect } from "@playwright/test";
import { loginAsRole } from "./helpers/role-auth";

test.describe("Forms - Debug", () => {
  test("Debug admin forms access", async ({ page }) => {
    // Enable console logging
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log("Browser console error:", msg.text());
      }
    });

    page.on("pageerror", (error) => {
      console.log("Page error:", error.message);
    });

    // Login as admin
    await loginAsRole(page, "ADMIN");
    console.log("✅ Logged in as ADMIN");

    // Try to navigate to forms
    await page.goto("/forms");
    console.log("✅ Navigated to /forms");

    // Wait for any redirects
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Check current URL
    const currentUrl = page.url();
    console.log("Current URL:", currentUrl);

    // Check if we're on the forms page
    if (currentUrl.includes("/forms")) {
      console.log("✅ Successfully on forms page");

      // Wait for React to load
      await page.waitForSelector("h1", { timeout: 10000 });

      // Check page content
      const h1Text = await page.locator("h1").textContent();
      console.log("H1 text:", h1Text);

      const bodyText = await page.locator("body").innerText();
      console.log("Page content preview:", bodyText?.substring(0, 200));

      // Try different selectors for the create button
      const selectors = [
        "button:has-text('Create Form')",
        "button >> text=Create Form",
        "[data-testid='create-form-button']",
        "button:has(svg)",
        "a[href='/forms/new']",
      ];

      for (const selector of selectors) {
        const element = page.locator(selector);
        const count = await element.count();
        console.log(`Selector "${selector}" found ${count} elements`);

        if (count > 0) {
          const isVisible = await element.first().isVisible();
          console.log(`  - First element visible: ${isVisible}`);
        }
      }

      // Check for any error messages
      const errorSelectors = [
        "text=error",
        "text=Error",
        "text=denied",
        "text=unauthorized",
        ".error",
        "[role='alert']",
      ];

      for (const selector of errorSelectors) {
        const errorElement = page.locator(selector);
        if ((await errorElement.count()) > 0) {
          console.log(
            `Found error element with selector "${selector}":`,
            await errorElement.first().textContent()
          );
        }
      }

      // Take a screenshot for debugging
      await page.screenshot({ path: "debug-forms-page.png", fullPage: true });
      console.log("Screenshot saved as debug-forms-page.png");
    } else {
      console.log("❌ Redirected away from forms page");
      console.log("Redirected to:", currentUrl);
    }
  });

  test("Check middleware logs", async ({ page }) => {
    // Enable request interception to see middleware logs
    page.on("response", async (response) => {
      if (
        response.url().includes("/forms") &&
        response.status() >= 300 &&
        response.status() < 400
      ) {
        console.log("Redirect detected:", {
          from: response.url(),
          to: response.headers()["location"],
          status: response.status(),
        });
      }
    });

    await loginAsRole(page, "ADMIN");

    // Try to access forms with full logging
    const response = await page.goto("/forms", { waitUntil: "networkidle" });

    if (response) {
      console.log("Response status:", response.status());
      console.log("Response URL:", response.url());
    }
  });
});
