import { test, expect } from "@playwright/test";
import { loginAndWaitForAuth, navigateToProtectedPage } from "./helpers/auth";

test.describe("Forms - Final Debug", () => {
  test("Debug forms page rendering", async ({ page }) => {
    // Enable console logging
    page.on("console", (msg) => {
      console.log(`[${msg.type()}] ${msg.text()}`);
    });

    // Login with helper
    await loginAndWaitForAuth(page);

    // Navigate to forms
    console.log("Navigating to forms...");
    await navigateToProtectedPage(page, "/forms");

    // Check page state after navigation
    const pageState = await page.evaluate(() => {
      // Check for auth context
      const authElements = document.querySelectorAll(
        "[data-auth], [data-user]"
      );

      // Check for forms page elements
      const h1Elements = Array.from(document.querySelectorAll("h1")).map(
        (h) => h.textContent
      );
      const buttons = Array.from(document.querySelectorAll("button")).map(
        (b) => b.textContent
      );
      const loadingElements = Array.from(
        document.querySelectorAll(".animate-spin, [data-loading]")
      );

      // Check body classes
      const bodyClasses = document.body.className;

      return {
        url: window.location.href,
        title: document.title,
        h1Elements,
        buttonCount: buttons.length,
        buttonTexts: buttons.slice(0, 10),
        hasLoadingElements: loadingElements.length > 0,
        bodyClasses,
        bodyText: document.body.innerText.substring(0, 500),
        mainExists: !!document.querySelector("main"),
        navExists: !!document.querySelector("nav"),
      };
    });

    console.log("Page state:", JSON.stringify(pageState, null, 2));

    // Try to wait explicitly for the forms page content
    try {
      // Wait for either the create button or the "no forms" message
      await Promise.race([
        page.waitForSelector("button:has-text('Create Form')", {
          timeout: 10000,
        }),
        page.waitForSelector("text='No forms yet'", { timeout: 10000 }),
        page.waitForSelector("h1:has-text('Forms')", { timeout: 10000 }),
      ]);
      console.log("✅ Forms page content appeared!");
    } catch (e) {
      console.log("❌ Forms page content did not appear within 10 seconds");

      // Take a screenshot
      await page.screenshot({ path: "forms-final-debug.png", fullPage: true });

      // Check if we're stuck in auth loading
      const authLoading = await page.locator("text='Loading...'").count();
      console.log("Auth loading elements:", authLoading);

      // Try to force a re-render
      await page.evaluate(() => {
        // Dispatch storage event
        window.dispatchEvent(new Event("storage"));
        // Dispatch popstate event
        window.dispatchEvent(new Event("popstate"));
      });

      await page.waitForTimeout(2000);

      // Check again
      const afterRerender = await page.evaluate(() => ({
        bodyText: document.body.innerText.substring(0, 200),
        h1Count: document.querySelectorAll("h1").length,
      }));

      console.log("After re-render attempt:", afterRerender);
    }
  });
});
